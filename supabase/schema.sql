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
  credit_required boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.commissions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  link text not null,
  cost_range text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.commission_requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  link text not null,
  cost_range text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.footer_handles (
  id uuid primary key default gen_random_uuid(),
  handle text not null,
  link text not null,
  profile_image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.competition_submissions (
  id uuid primary key default gen_random_uuid(),
  competition_number integer not null,
  handle text not null,
  submission_link text not null,
  file_url text not null,
  thumbnail_url text not null,
  drive_folder_url text,
  creativity_score integer,
  effort_score integer,
  execution_score integer,
  reviewed boolean not null default false,
  created_at timestamptz not null default now(),
  constraint competition_submissions_scores_check check (
    (creativity_score is null or creativity_score between 1 and 10)
    and (effort_score is null or effort_score between 1 and 10)
    and (execution_score is null or execution_score between 1 and 10)
  )
);

alter table public.commissions
  add column if not exists title text,
  add column if not exists link text,
  add column if not exists cost_range text,
  add column if not exists created_at timestamptz not null default now();

alter table public.commissions
  alter column created_at set default now();

alter table public.commission_requests
  add column if not exists title text,
  add column if not exists link text,
  add column if not exists cost_range text,
  add column if not exists created_at timestamptz not null default now();

alter table public.commission_requests
  alter column created_at set default now();

alter table public.footer_handles
  add column if not exists handle text,
  add column if not exists link text,
  add column if not exists profile_image_url text,
  add column if not exists created_at timestamptz not null default now();

alter table public.footer_handles
  alter column created_at set default now();

alter table public.competition_submissions
  add column if not exists competition_number integer,
  add column if not exists handle text,
  add column if not exists submission_link text,
  add column if not exists file_url text,
  add column if not exists thumbnail_url text,
  add column if not exists drive_folder_url text,
  add column if not exists creativity_score integer,
  add column if not exists effort_score integer,
  add column if not exists execution_score integer,
  add column if not exists reviewed boolean not null default false,
  add column if not exists created_at timestamptz not null default now();

alter table public.competition_submissions
  alter column reviewed set default false,
  alter column created_at set default now();

alter table public.media_clips
  add column if not exists approved boolean not null default false;

alter table public.media_clips
  add column if not exists uploaded_by text;

alter table public.media_clips
  add column if not exists upload_group_id text;

alter table public.media_clips
  add column if not exists drive_folder_url text;

alter table public.media_clips
  add column if not exists credit_required boolean not null default false;

alter table public.media_clips
  alter column approved set default false;

alter table public.media_clips
  alter column credit_required set default false;

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

create index if not exists commissions_created_at_idx
  on public.commissions (created_at desc);

create index if not exists commission_requests_created_at_idx
  on public.commission_requests (created_at desc);

create index if not exists footer_handles_created_at_idx
  on public.footer_handles (created_at desc);

create index if not exists competition_submissions_competition_number_idx
  on public.competition_submissions (competition_number);

create index if not exists competition_submissions_created_at_idx
  on public.competition_submissions (created_at desc);

create unique index if not exists competition_submissions_one_per_handle_idx
  on public.competition_submissions (competition_number, lower(handle));

alter table public.media_clips enable row level security;
alter table public.commissions enable row level security;
alter table public.commission_requests enable row level security;
alter table public.footer_handles enable row level security;
alter table public.competition_submissions enable row level security;

drop policy if exists "Public can read media clips" on public.media_clips;
create policy "Public can read media clips"
  on public.media_clips
  for select
  using (approved = true);

drop policy if exists "Prototype admin can read pending media clips" on public.media_clips;
drop policy if exists "Public can submit pending media clips" on public.media_clips;
drop policy if exists "Prototype admin can update media clips" on public.media_clips;
drop policy if exists "Prototype admin can delete media clips" on public.media_clips;

drop policy if exists "Public can read commissions" on public.commissions;
create policy "Public can read commissions"
  on public.commissions
  for select
  using (true);

drop policy if exists "Public can submit commission requests" on public.commission_requests;
create policy "Public can submit commission requests"
  on public.commission_requests
  for insert
  with check (true);

drop policy if exists "Public cannot read commission requests" on public.commission_requests;

drop policy if exists "Public can read footer handles" on public.footer_handles;
create policy "Public can read footer handles"
  on public.footer_handles
  for select
  using (true);

drop policy if exists "Public cannot read competition submissions" on public.competition_submissions;

-- Media uploads and admin moderation are performed by server-only routes using
-- SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS. Do not expose the service-role
-- key to client-side code or NEXT_PUBLIC_ variables.
