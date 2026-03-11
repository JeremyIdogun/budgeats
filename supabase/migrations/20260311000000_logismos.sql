-- decisions table (Phase I schema; Phase I data stored in localStorage)
create table if not exists public.decisions (
  decision_id   uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  timestamp     timestamptz not null default now(),
  recommendation_type  text not null check (recommendation_type in ('cook', 'eat_out')),
  recommendation_accepted boolean not null,
  meal_id       text,
  estimated_cost_pence integer not null,
  actual_cost_pence    integer,
  context_signals      jsonb not null default '{}',
  points_awarded       integer not null default 0
);

alter table public.decisions enable row level security;

create policy "Users can read own decisions"
  on public.decisions for select
  using (auth.uid() = user_id);

create policy "Users can insert own decisions"
  on public.decisions for insert
  with check (auth.uid() = user_id);

-- Add logismos fields to user_profiles table (if it exists)
alter table public.user_profiles
  add column if not exists calendar_sync_enabled boolean default false,
  add column if not exists energy_check_in_enabled boolean default true,
  add column if not exists logismos_enabled boolean default true,
  add column if not exists loavish_points_balance integer default 0,
  add column if not exists logismos_score integer,
  add column if not exists streak_days integer default 0;
