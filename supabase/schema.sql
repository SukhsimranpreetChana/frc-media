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
  upload_group_id text,
  drive_folder_url text,
  created_at timestamptz not null default now()
);

alter table public.media_clips
  add column if not exists approved boolean not null default false;

alter table public.media_clips
  add column if not exists uploaded_by text;

alter table public.media_clips
  add column if not exists upload_group_id text;

alter table public.media_clips
  add column if not exists drive_folder_url text;

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

create index if not exists media_clips_upload_group_id_idx
  on public.media_clips (upload_group_id);

alter table public.media_clips enable row level security;

drop policy if exists "Public can read media clips" on public.media_clips;
create policy "Public can read media clips"
  on public.media_clips
  for select
  using (approved = true);

drop policy if exists "Prototype admin can read pending media clips" on public.media_clips;
drop policy if exists "Public can submit pending media clips" on public.media_clips;
drop policy if exists "Prototype admin can update media clips" on public.media_clips;
drop policy if exists "Prototype admin can delete media clips" on public.media_clips;

-- Media uploads and admin moderation are performed by server-only routes using
-- SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS. Do not expose the service-role
-- key to client-side code or NEXT_PUBLIC_ variables.
