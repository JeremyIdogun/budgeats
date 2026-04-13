-- Foundation: user_profiles table
-- Previously lived as a manual snippet in supabase/snippets/db_foundation.sql.
-- Promoted to a migration so fresh environments get it automatically.
create table if not exists public.user_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  household_size integer not null default 1,
  weekly_budget_pence integer not null default 7500,
  budget_period text not null default 'weekly' check (budget_period in ('weekly', 'monthly')),
  dietary_preferences text[] not null default '{}',
  preferred_retailer_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Row level security — users can only see their own profile
alter table public.user_profiles enable row level security;

drop policy if exists "Users can view own profile" on public.user_profiles;
create policy "Users can view own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.user_profiles;
create policy "Users can insert own profile"
  on public.user_profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.user_profiles;
create policy "Users can update own profile"
  on public.user_profiles for update
  using (auth.uid() = id);
