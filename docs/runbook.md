# Loavish Incident Runbook

First-response playbook for production issues. Keep this short — if a step needs paragraphs, link out.

## 0. Triage (first 2 minutes)

1. Page severity:
   - **SEV-1** — signup/login broken, dashboard unreachable, data loss risk.
   - **SEV-2** — feature broken but core flow works (e.g., pricing stale).
   - **SEV-3** — cosmetic or partial-user impact.
2. Check `/api/health` — `overall: "blocked"` narrows scope immediately.
3. Announce in the incident channel with: timestamp, user-facing symptom, current hypothesis, owner.

## 1. Health signal reference

`GET /api/health` returns an `overall` status plus per-check rows. Status codes:

| Check | Failure means | First action |
|---|---|---|
| `auth` | Supabase env missing or unreachable | Verify `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` in deploy env; check Supabase status page. |
| `database` | Prisma can't reach Postgres | Verify `DATABASE_URL`; check Postgres provider status; look for connection-limit errors in logs. |
| `cache` | Redis round-trip failed | Non-critical if in memory mode. If Upstash configured, check `UPSTASH_REDIS_REST_URL`. |
| `email` | Resend not configured | Signup still works; password reset does not. Confirm `RESEND_API_KEY`. |
| `pricing` | Pricing pipeline blocked | Check latest ingestion run; stale data is better than broken data — consider toggling `NEXT_PUBLIC_ENABLE_PRICING_LIVE` to `false`. |

## 2. Common incidents

### 2.1 Signup / login broken
- Check `auth` health row.
- Verify Supabase project dashboard — email provider rate limits?
- Recently-changed redirect URLs? Confirm against Supabase allowlist.
- Rollback last deploy (see §4) if the change correlates.

### 2.2 Dashboard 500 loop
- Look at structured logs for `event: "api.*"`.
- Most common cause: a new column used by the UI isn't backfilled. Run the verification query from the relevant migration.
- If it's data-shape: feature-flag the affected area off.

### 2.3 Weekly plan writes silently failing
- Check [api/weekly-plans](../src/app/api/weekly-plans/) logs for `db_error`.
- Most common cause: RLS policy mismatch (e.g., user session expired).
- Verify RLS policy on `weekly_plans` — see [docs/security-review.md](./security-review.md).

### 2.4 Pricing data stale
- Check the most recent `IngestionRun` row.
- If ingestion is failing, the site still serves the last good snapshot.
- Re-trigger ingestion via the admin panel.

## 3. Smoke checks

Run after every production deploy. `pnpm smoke` invokes [scripts/smoke-check.mjs](../scripts/smoke-check.mjs). Manual verification checklist:

- [ ] `/api/health` returns `overall: "ready"` (2xx).
- [ ] `/login` renders; signup link visible.
- [ ] Authenticated user can load `/dashboard` without a console error.
- [ ] `/planner` loads current-week plan.
- [ ] `/shopping` renders a list derived from the planner.
- [ ] `/decisions` loads (even if empty).
- [ ] `/api/decisions?limit=1` returns `{ data: [...] }`.
- [ ] `/api/weekly-plans?limit=1` returns `{ data: [...] }`.
- [ ] Admin-only routes reject non-admin users (403).
- [ ] No new structured logs with `level: "error"` in the first 5 minutes.

## 4. Rollback

### 4.1 Vercel
1. Vercel dashboard → Deployments → previous green deploy → "Promote to Production".
2. Verify `/api/health` on the promoted URL.
3. Announce rollback in the incident channel; link to the reverted commit.

### 4.2 Database migration
- **Do not run the rollback SQL from a migration file in production without review.** Roll-forward instead:
  1. Author a new migration that reverses the change additively (e.g., set a column nullable again, drop a constraint).
  2. Review with a second engineer.
  3. Apply via `pnpm prisma:migrate deploy` against production.
- If the migration destroyed data: restore from Supabase point-in-time recovery.

### 4.3 Supabase RLS
- Supabase dashboard → SQL editor → paste the previous policy definition → run.
- Follow with a forward migration to encode the change in git.

## 5. Contacts & external links

> Fill these in before launch and keep this section living.

- On-call rotation: `<link>`
- Incident channel: `<link>`
- Vercel project: `<link>`
- Supabase project: `<link>`
- Postgres provider: `<link>`
- Status pages to watch: Vercel, Supabase, Postgres provider, Resend.

## 6. Post-incident

Within 48 hours of SEV-1 or SEV-2:
- Write a postmortem: timeline, impact, root cause, contributing factors, what went well, what didn't, action items with owners + dates.
- Land any code fix from an action item behind a test that would have caught the original issue.
