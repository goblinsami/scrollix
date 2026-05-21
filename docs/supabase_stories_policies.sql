-- Scrollix stories RLS policies (private editor + public embeds)
-- Run this in Supabase SQL Editor.

alter table public.stories enable row level security;

drop policy if exists "stories_select_own" on public.stories;
drop policy if exists "stories_insert_own" on public.stories;
drop policy if exists "stories_update_own" on public.stories;
drop policy if exists "stories_delete_own" on public.stories;
drop policy if exists "stories_public_select_published" on public.stories;

create policy "stories_select_own"
on public.stories
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "stories_insert_own"
on public.stories
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "stories_update_own"
on public.stories
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "stories_delete_own"
on public.stories
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "stories_public_select_published"
on public.stories
for select
to anon
using (published = true);

grant select, insert, update, delete on table public.stories to authenticated;
grant select on table public.stories to anon;
