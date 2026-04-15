-- Weekly plans: one row per user per app-defined planning week.
-- Stores durable planner history separately from ephemeral dashboard session state.
create table if not exists public.weekly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  plan jsonb not null default '{}'::jsonb,
  custom_meals jsonb not null default '[]'::jsonb,
  budget_override_pence integer,
  total_spent_pence integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weekly_plans_user_week unique (user_id, week_start)
);

alter table public.weekly_plans enable row level security;

drop policy if exists "Users can select own weekly plans" on public.weekly_plans;
create policy "Users can select own weekly plans"
  on public.weekly_plans for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own weekly plans" on public.weekly_plans;
create policy "Users can insert own weekly plans"
  on public.weekly_plans for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own weekly plans" on public.weekly_plans;
create policy "Users can update own weekly plans"
  on public.weekly_plans for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists weekly_plans_user_id_week_start_idx
  on public.weekly_plans (user_id, week_start desc);
