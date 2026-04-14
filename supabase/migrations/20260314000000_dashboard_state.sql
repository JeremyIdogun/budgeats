create table if not exists public.user_dashboard_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan jsonb not null default '{}'::jsonb,
  checked_item_keys text[] not null default '{}',
  custom_meals jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_dashboard_state
  add column if not exists custom_meals jsonb not null default '[]'::jsonb,
  add column if not exists pantry_items jsonb not null default '{}'::jsonb,
  add column if not exists budget_nudge_dismissed_for_week text,
  add column if not exists budget_override_pence integer,
  add column if not exists budget_override_week_start_date text;

alter table public.user_dashboard_state enable row level security;

drop policy if exists "Users can view own dashboard state" on public.user_dashboard_state;
create policy "Users can view own dashboard state"
  on public.user_dashboard_state for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own dashboard state" on public.user_dashboard_state;
create policy "Users can insert own dashboard state"
  on public.user_dashboard_state for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own dashboard state" on public.user_dashboard_state;
create policy "Users can update own dashboard state"
  on public.user_dashboard_state for update
  using (auth.uid() = user_id);
