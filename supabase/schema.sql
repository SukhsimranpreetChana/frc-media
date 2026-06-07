create extension if not exists "pgcrypto";

create table if not exists public.media_clips (
  id uuid primary key default gen_random_uuid(),
  team_number text not null,
  year integer not null,
  video_url text not null,
  thumbnail_url text not null,
  approved boolean not null default false,
  title text,
  uploaded_by text,
  created_at timestamptz not null default now()
);

alter table public.media_clips
  add column if not exists approved boolean not null default false;

alter table public.media_clips
  add column if not exists uploaded_by text;

alter table public.media_clips
  alter column approved set default false;

alter table public.media_clips
  drop column if exists event,
  drop column if exists tags,
  drop column if exists media_type,
  drop column if exists icedrive_folder_url;

create index if not exists media_clips_team_number_idx
  on public.media_clips (team_number);

create index if not exists media_clips_year_idx
  on public.media_clips (year);

create index if not exists media_clips_approved_idx
  on public.media_clips (approved);

alter table public.media_clips enable row level security;

drop policy if exists "Public can read media clips" on public.media_clips;
create policy "Public can read media clips"
  on public.media_clips
  for select
  using (approved = true);

drop policy if exists "Prototype admin can read pending media clips" on public.media_clips;
create policy "Prototype admin can read pending media clips"
  on public.media_clips
  for select
  using (true);

drop policy if exists "Public can submit pending media clips" on public.media_clips;
create policy "Public can submit pending media clips"
  on public.media_clips
  for insert
  with check (approved = false);

drop policy if exists "Prototype admin can update media clips" on public.media_clips;
create policy "Prototype admin can update media clips"
  on public.media_clips
  for update
  using (true)
  with check (true);

drop policy if exists "Prototype admin can delete media clips" on public.media_clips;
create policy "Prototype admin can delete media clips"
  on public.media_clips
  for delete
  using (true);

-- Prototype note:
-- Public users submit metadata with approved=false. The password-gated admin
-- review UI can approve/delete because of the prototype update/delete policies.
-- Replace these policies with real Supabase auth or service-role routes before
-- using this in production.
