-- MAMBA notebook: each learner's notebook pages, kept in their account so it follows them to every device.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
create table if not exists public.notebook_pages (
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id          text not null,
  title       text not null default '',
  html        text not null default '',
  lesson_slug text,
  sort        double precision not null default 0,
  deleted     boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (user_id, id),
  constraint notebook_html_size check (octet_length(html) <= 20000000)
);
alter table public.notebook_pages enable row level security;
drop policy if exists "notebook: read own" on public.notebook_pages;
drop policy if exists "notebook: add own" on public.notebook_pages;
drop policy if exists "notebook: change own" on public.notebook_pages;
drop policy if exists "notebook: remove own" on public.notebook_pages;
create policy "notebook: read own" on public.notebook_pages for select to authenticated using ((select auth.uid()) = user_id);
create policy "notebook: add own" on public.notebook_pages for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "notebook: change own" on public.notebook_pages for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "notebook: remove own" on public.notebook_pages for delete to authenticated using ((select auth.uid()) = user_id);
revoke all on public.notebook_pages from anon;
grant select, insert, update, delete on public.notebook_pages to authenticated;
