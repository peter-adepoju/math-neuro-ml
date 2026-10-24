-- MAMBA course website: accounts, progress, quiz answers and marks.
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

-- ---------------------------------------------------------------- tables
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  email       text,
  role        text not null default 'learner' check (role in ('learner', 'tutor', 'instructor')),
  created_at  timestamptz not null default now()
);

create table if not exists public.progress (
  user_id      uuid not null references auth.users (id) on delete cascade,
  lesson_slug  text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_slug)
);

create table if not exists public.quiz_answers (
  user_id        uuid not null references auth.users (id) on delete cascade,
  question_id    text not null,                 -- e.g. 'lesson01-q3'
  lesson_slug    text not null,
  first_correct  boolean not null,              -- was the first attempt right? (the score that counts)
  last_correct   boolean not null,
  attempts       integer not null default 1,
  first_at       timestamptz not null default now(),
  last_at        timestamptz not null default now(),
  primary key (user_id, question_id)
);

create table if not exists public.marks (
  id          bigint generated always as identity primary key,
  learner_id  uuid not null references public.profiles (id) on delete cascade,
  item        text not null,                    -- e.g. 'Lesson 1 exercises', 'Project'
  score       numeric not null,
  max_score   numeric not null default 100,
  comment     text,
  entered_by  uuid references public.profiles (id),
  entered_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------- helpers
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'learner');
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select public.my_role() in ('tutor', 'instructor');
$$;

-- A profile is created automatically when someone signs up.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Learners may edit their own name but never their own role.
create or replace function public.protect_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and public.my_role() <> 'instructor' then
    raise exception 'Only the instructor can change roles';
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role before update on public.profiles
  for each row execute function public.protect_role();

-- The first attempt at a question is the score that counts: it cannot be overwritten.
create or replace function public.keep_first_attempt() returns trigger
language plpgsql as $$
begin
  new.first_correct := old.first_correct;
  new.first_at      := old.first_at;
  new.attempts      := old.attempts + 1;
  new.last_at       := now();
  return new;
end;
$$;
drop trigger if exists quiz_keep_first on public.quiz_answers;
create trigger quiz_keep_first before update on public.quiz_answers
  for each row execute function public.keep_first_attempt();

-- ---------------------------------------------------------------- row-level security
alter table public.profiles     enable row level security;
alter table public.progress     enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.marks        enable row level security;

drop policy if exists "own profile or staff" on public.profiles;
create policy "own profile or staff" on public.profiles for select using (id = auth.uid() or public.is_staff());
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles for update using (id = auth.uid() or public.my_role() = 'instructor');

drop policy if exists "own progress or staff" on public.progress;
create policy "own progress or staff" on public.progress for select using (user_id = auth.uid() or public.is_staff());
drop policy if exists "add own progress" on public.progress;
create policy "add own progress" on public.progress for insert with check (user_id = auth.uid());
drop policy if exists "remove own progress" on public.progress;
create policy "remove own progress" on public.progress for delete using (user_id = auth.uid());

drop policy if exists "own answers or staff" on public.quiz_answers;
create policy "own answers or staff" on public.quiz_answers for select using (user_id = auth.uid() or public.is_staff());
drop policy if exists "add own answers" on public.quiz_answers;
create policy "add own answers" on public.quiz_answers for insert with check (user_id = auth.uid());
drop policy if exists "update own answers" on public.quiz_answers;
create policy "update own answers" on public.quiz_answers for update using (user_id = auth.uid());

drop policy if exists "own marks or staff" on public.marks;
create policy "own marks or staff" on public.marks for select using (learner_id = auth.uid() or public.is_staff());
drop policy if exists "staff add marks" on public.marks;
create policy "staff add marks" on public.marks for insert with check (public.is_staff());
drop policy if exists "staff edit marks" on public.marks;
create policy "staff edit marks" on public.marks for update using (public.is_staff());
drop policy if exists "staff delete marks" on public.marks;
create policy "staff delete marks" on public.marks for delete using (public.is_staff());

-- ---------------------------------------------------------------- after you have signed up on the website
-- Make yourself the instructor (replace the email), then run just this line:
-- update public.profiles set role = 'instructor' where email = 'you@example.com';
