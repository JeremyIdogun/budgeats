-- Create user profiles table
create table public.user_profiles (
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

create policy "Users can view own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.user_profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.user_profiles for update
  using (auth.uid() = id);