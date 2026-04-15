-- ============================================================================
-- Migration: <short_name>
-- Date:     YYYY-MM-DD
-- Author:   <you>
-- Ticket:   <link if any>
-- ============================================================================
--
-- Purpose
--   <one paragraph on what this migration changes and why>
--
-- Forward-safety checklist (tick all before merging)
--   [ ] Additive only OR explicit drop with downtime note
--   [ ] New NOT NULL columns have DEFAULT or explicit backfill below
--   [ ] Indexes created CONCURRENTLY (outside transaction) for large tables
--   [ ] RLS policies added/updated for any new table
--   [ ] Tested against a production-sized copy where row counts matter
--
-- Rollback
--   Reverse DDL below under "ROLLBACK". Treat as read-only reference —
--   reverting in production should be a fresh forward migration, not a destructive revert.
--
-- Production verification
--   1. <query or endpoint that should return the new shape>
--   2. <dashboard / log to watch>
--   3. <rollback trigger if verification fails>
-- ============================================================================

begin;

-- >>> FORWARD MIGRATION >>>

-- example: add typed column
-- alter table public.<table>
--   add column <column> <type> <constraint>;

-- example: backfill
-- update public.<table>
--   set <column> = <expr>
--   where <predicate>;

-- example: RLS policy
-- alter table public.<table> enable row level security;
-- create policy "<name>" on public.<table>
--   for select using (auth.uid() = user_id);

-- <<< FORWARD MIGRATION <<<

commit;

-- ============================================================================
-- ROLLBACK (manual reference only — do NOT run without review)
-- ============================================================================
-- begin;
--   alter table public.<table> drop column <column>;
-- commit;
