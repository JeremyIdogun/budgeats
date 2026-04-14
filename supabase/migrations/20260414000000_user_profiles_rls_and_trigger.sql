-- Ensure user_profiles RLS is explicit and that every auth user gets a profile row.

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

alter table public.user_profiles enable row level security;

drop policy if exists "Users can view own profile" on public.user_profiles;
create policy "Users can view own profile"
  on public.user_profiles
  for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.user_profiles;
create policy "Users can insert own profile"
  on public.user_profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.user_profiles;
create policy "Users can update own profile"
  on public.user_profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.handle_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.user_profiles (id, email)
  values (
    new.id,
    coalesce(
      new.email,
      new.raw_user_meta_data ->> 'email',
      new.raw_app_meta_data ->> 'email',
      new.id::text || '@placeholder.invalid'
    )
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
  after insert on auth.users
  for each row
  execute function public.handle_auth_user_profile();

insert into public.user_profiles (id, email)
select
  users.id,
  coalesce(
    users.email,
    users.raw_user_meta_data ->> 'email',
    users.raw_app_meta_data ->> 'email',
    users.id::text || '@placeholder.invalid'
  )
from auth.users as users
where not exists (
  select 1
  from public.user_profiles as profiles
  where profiles.id = users.id
)
on conflict (id) do nothing;
