-- Legacy cleanup: dashboard pricing is now derived from app seed data and model logic.
-- These tables are no longer used by the app.

drop table if exists public.ingredient_aliases;
drop table if exists public.retailer_items;
