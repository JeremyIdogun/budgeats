alter table public.user_dashboard_state
  add column if not exists pantry_items jsonb not null default '{}'::jsonb,
  add column if not exists budget_nudge_dismissed_for_week text,
  add column if not exists budget_override_pence integer,
  add column if not exists budget_override_week_start_date text;
