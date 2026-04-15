# Security Review

Review cadence: on every migration touching auth/RLS, before every production deploy, and quarterly.

## 1. API auth coverage

Run `pnpm audit:auth` locally or in PR verification. Once the current unprotected-route backlog is resolved, add it to CI as a required gate.

### Current findings (snapshot — 2026-04-15)

The audit surfaced 7 routes without any server-side auth guard. Decide per route:

| Route | Current | Recommended action |
|---|---|---|
| [api/logismos/recommendation](../src/app/api/logismos/recommendation/route.ts) | unprotected | **Gate with `user` auth** — writes are user-scoped. |
| [api/meals/[id]/costs](../src/app/api/meals/[id]/costs/) | unprotected | Decide: public meal catalog OR user-auth. |
| [api/meals/[id]/shopping-list](../src/app/api/meals/[id]/shopping-list/) | unprotected | **Gate with `user` auth** — derives user's basket. |
| [api/retailers](../src/app/api/retailers/route.ts) | unprotected | Likely public catalog → add to `PUBLIC_ALLOWLIST` with a reason. |
| [api/v1/pricing/basket](../src/app/api/v1/pricing/basket/route.ts) | unprotected | Decide: public pricing OR user-auth. Add rate-limit if public. |
| [api/v1/pricing/ingredient](../src/app/api/v1/pricing/ingredient/route.ts) | unprotected | Same as above. |
| [api/v1/pricing/meal](../src/app/api/v1/pricing/meal/route.ts) | unprotected | Same as above. |

Until those route decisions land, treat this audit as a manual release gate rather than a CI-enforced one.

## 2. RLS matrix

Scope: every table under `public.*`. Missing entries block production deploy.

| Table | RLS enabled | SELECT policy | INSERT policy | UPDATE policy | DELETE policy | Source |
|---|---|---|---|---|---|---|
| `user_profiles` | ✅ | own (`auth.uid() = user_id`) | own | own | — (intentional; deletion via cascade from `auth.users`) | [20260414…_user_profiles_rls_and_trigger.sql](../supabase/migrations/20260414000000_user_profiles_rls_and_trigger.sql) |
| `decisions` | ✅ | own | own | — | — | [20260311…_logismos.sql](../supabase/migrations/20260311000000_logismos.sql) |
| `user_dashboard_state` | ✅ | own | own | own | — | [20260314…_dashboard_state.sql](../supabase/migrations/20260314000000_dashboard_state.sql) |
| `weekly_plans` | ✅ | own | own | own | — | [20260415…_weekly_plans.sql](../supabase/migrations/20260415000000_weekly_plans.sql) |
| `retailers`, `retailer_products`, `retailer_prices` | ⚠️ TBD | — | — | — | — | Managed via Prisma; service-role only — confirm no anon/auth access. |
| `canonical_ingredients`, `canonical_products`, `product_matches` | ⚠️ TBD | — | — | — | — | Service-role only. |
| `meal_cost_snapshots`, `points_ledger` | ⚠️ TBD | — | — | — | — | Confirm read paths; if exposed to users, add own-record SELECT. |

### RLS backlog
1. Audit every Prisma-only table — ensure they're not reachable via Supabase anon/auth keys.
2. Add DELETE policy or explicit `revoke delete` where intentional.
3. Write a policy-level integration test suite (anonymous, authenticated, admin) as part of the broader integration-test backlog.

## 3. Session & redirect safety

- [middleware.ts](../src/middleware.ts) refreshes Supabase session on every request.
- `login?next=<path>`: verify `next` is a relative path (starts with `/`, not `//` or `http`). **Action:** add a `sanitizeNext()` helper and unit test before launch.
- Password reset + signup emails: verify redirect URLs match configured Supabase allowlist — prevents open-redirect.

## 4. Secrets & env vars

- `ADMIN_EMAILS` — comma-separated admin allowlist (server-only).
- `NEXT_PUBLIC_ADMIN_EMAILS` — **avoid**; public env vars ship to the browser. Prefer server-only.
- `SENTRY_DSN` — optional; observability falls back to structured logs when unset.
- `SUPABASE_SERVICE_ROLE_KEY` — server-only, never prefix `NEXT_PUBLIC_`.

## 5. Privacy & consent

Tracked separately — requires product + legal sign-off. This doc is the engineering artifact.

## Change policy

- Any new table: add RLS row above in the same PR as the migration.
- Any new API route: either use `handle({ auth })` or add to `PUBLIC_ALLOWLIST` with a one-line reason.
- Any new `NEXT_PUBLIC_*` env var: confirm it's safe to ship to the browser.
