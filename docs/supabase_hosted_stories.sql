-- Hosted Scrollix runtime model (Framer + Web Components)
-- Date: 2026-05-20

create extension if not exists pgcrypto;

create table if not exists public.stories (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  type text not null default '3d-stack-cards',
  config jsonb not null default jsonb_build_object('cards', '[]'::jsonb, 'settings', '{}'::jsonb),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.stories
  add column if not exists type text not null default '3d-stack-cards',
  add column if not exists config jsonb not null default jsonb_build_object('cards', '[]'::jsonb, 'settings', '{}'::jsonb),
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_stories_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_stories_updated_at on public.stories;
create trigger trg_set_stories_updated_at
before update on public.stories
for each row
execute function public.set_stories_updated_at();

create index if not exists idx_stories_type on public.stories(type);
create index if not exists idx_stories_updated_at on public.stories(updated_at desc);

alter table public.stories enable row level security;

-- NOTE:
-- These permissive policies are intended for early hosted runtime prototypes.
-- Replace with stronger ownership/publish policies before production hardening.
drop policy if exists "stories_select_anon" on public.stories;
create policy "stories_select_anon"
on public.stories
for select
to anon, authenticated
using (true);

drop policy if exists "stories_insert_anon" on public.stories;
create policy "stories_insert_anon"
on public.stories
for insert
to anon, authenticated
with check (true);

drop policy if exists "stories_update_anon" on public.stories;
create policy "stories_update_anon"
on public.stories
for update
to anon, authenticated
using (true)
with check (true);
