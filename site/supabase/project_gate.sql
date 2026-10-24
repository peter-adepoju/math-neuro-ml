-- MAMBA course website: the course project page, released by tutors.
-- Run once in Supabase (SQL Editor -> New query -> paste -> Run), after schema.sql. Safe to run again.
--
-- The project text lives in the table protected_pages, not in the public GitHub repository. A signed-in person can read it
-- only if they are a tutor or the instructor, if a tutor has given them access, or if the project has been opened to all.

-- ---------------------------------------------------------------- tables
create table if not exists public.protected_pages (
  slug        text primary key,                 -- 'project'
  title       text not null,
  body        text not null,                    -- Markdown; {{ colab: https://colab.research.google.com/drive/ID Open in Colab }} makes a button
  updated_at  timestamptz not null default now()
);

create table if not exists public.project_access (
  user_id     uuid primary key references public.profiles (id) on delete cascade,
  granted_by  uuid references public.profiles (id) on delete set null,
  granted_at  timestamptz not null default now()
);

create table if not exists public.course_settings (
  key         text primary key,                 -- 'project_open': true once the project is released to every learner
  value       jsonb not null,
  updated_by  uuid references public.profiles (id) on delete set null,
  updated_at  timestamptz not null default now()
);
insert into public.course_settings (key, value) values ('project_open', 'false') on conflict (key) do nothing;

-- ---------------------------------------------------------------- who may read the project
create or replace function public.can_see_project() returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
        public.is_staff()
     or exists (select 1 from public.project_access where user_id = auth.uid())
     or coalesce((select value = 'true'::jsonb from public.course_settings where key = 'project_open'), false));
$$;

-- ---------------------------------------------------------------- access rules
alter table public.protected_pages enable row level security;
alter table public.project_access  enable row level security;
alter table public.course_settings enable row level security;

revoke all on public.protected_pages, public.project_access, public.course_settings from anon, authenticated;
grant select on public.protected_pages to authenticated;                 -- edit the text in the Supabase Table Editor
grant select, insert, delete on public.project_access to authenticated;
grant select, insert, update on public.course_settings to authenticated;

drop policy if exists "read project if released" on public.protected_pages;
create policy "read project if released" on public.protected_pages for select using (slug = 'project' and public.can_see_project());

drop policy if exists "own access or staff" on public.project_access;
create policy "own access or staff" on public.project_access for select using (user_id = auth.uid() or public.is_staff());
drop policy if exists "staff grant access" on public.project_access;
create policy "staff grant access" on public.project_access for insert with check (public.is_staff());
drop policy if exists "staff withdraw access" on public.project_access;
create policy "staff withdraw access" on public.project_access for delete using (public.is_staff());

drop policy if exists "signed-in read settings" on public.course_settings;
create policy "signed-in read settings" on public.course_settings for select using (auth.uid() is not null);
drop policy if exists "staff add settings" on public.course_settings;
create policy "staff add settings" on public.course_settings for insert with check (public.is_staff());
drop policy if exists "staff change settings" on public.course_settings;
create policy "staff change settings" on public.course_settings for update using (public.is_staff());
