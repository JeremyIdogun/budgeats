# Data Ownership Inventory

Each row lists a piece of product state, where it lives, and who the authoritative source of truth is.

Status legend:
- **authoritative** — canonical persistence layer
- **cache** — derived / mirror of the authoritative source
- **ephemeral** — session-only; loss is acceptable
- **drift-risk** — exists in two places without a clear sync owner

---

## User & onboarding

| State | Authoritative | Mirrored in | Status | Notes |
|---|---|---|---|---|
| `user_profiles` (auth, budget, household, dietary, retailers) | Supabase `user_profiles` | Zustand `useBudgeAtsStore.user` | authoritative / cache | Hydrated on dashboard entry via [useHydratedProfile](../src/components/dashboard/useHydratedProfile.ts). Writes go through [api/onboarding](../src/app/api/onboarding/). |
| Onboarding draft (pre-submit) | Zustand `useOnboardingStore` | — | ephemeral | In-memory only; cleared via `reset()` after submit. Data loss on reload is expected. |

## Planner

| State | Authoritative | Mirrored in | Status | Notes |
|---|---|---|---|---|
| `weekly_plans` (plan grid, custom meals, budget override, totals) | Supabase `weekly_plans` | Zustand `currentWeekPlan` + localStorage | authoritative / cache | Sync wrapper: [planner-persistence.ts](../src/lib/planner-persistence.ts). |
| `PlannedMeal` shape (`{ mealId, retailerId, portions }`) | Canonical type in [src/models/plan.ts](../src/models/plan.ts) | Stored as JSON in `weekly_plans.plan` | drift-risk | Consider promoting to a typed join table (`planned_meals`) if plan edits grow. |

## Logismos decisions

| State | Authoritative | Mirrored in | Status | Notes |
|---|---|---|---|---|
| `decisions` (recommendation log) | Supabase `decisions` | Zustand `useDecisionStore` (`loavish-decisions`) | authoritative / cache | Local store is optimistic; server writes via [api/logismos/accept](../src/app/api/logismos/accept/) and [api/logismos/dismiss](../src/app/api/logismos/dismiss/). |
| `loavishPoints`, `logismosScore`, `streakDays` | Zustand (persist) | — | drift-risk | No server-side ledger yet; cannot reconstruct after cache clear. **Backlog:** move to `points_ledger` + derive score server-side. |

## Pantry

| State | Authoritative | Mirrored in | Status | Notes |
|---|---|---|---|---|
| `pantryItems: Record<string, boolean>` | Zustand (persist) | — | drift-risk | Not persisted server-side. Acceptable for MVP; backlog a `pantry_state` table before multi-device support. |

## Shopping

| State | Authoritative | Mirrored in | Status | Notes |
|---|---|---|---|---|
| Shopping list (derived from planner) | Derived | — | ephemeral | Pure derivation from `weekly_plans` + meals; no persistence needed. |

## Pricing

| State | Authoritative | Mirrored in | Status | Notes |
|---|---|---|---|---|
| `retailer_prices`, `retailer_products`, `product_matches`, `canonical_*` | Postgres (via Prisma) | — | authoritative | Ingestion writes; UI reads via [api/v1/pricing](../src/app/api/v1/pricing/). |
| Meal cost snapshot | `meal_cost_snapshots` | — | authoritative | Written at recommendation time. |

## Session / UI

| State | Authoritative | Mirrored in | Status | Notes |
|---|---|---|---|---|
| Supabase session | Supabase `auth.users` + cookies | — | authoritative | Refreshed via middleware. |
| `budgetNudgeDismissedForWeek` | Zustand (persist) | — | ephemeral | Per-device dismissal; acceptable. |
| `energyLevel` | Zustand (persist) | — | ephemeral | Expires on new session conceptually; current persistence is a product choice worth revisiting. |

---

## Drift backlog (ranked)

1. **Points & score server-side** — `points_ledger` table + derivation; today a localStorage clear erases lifetime points.
2. **Pantry state server-side** — prerequisite for multi-device.
3. **Planner `plan` JSON → typed table** — only if edit patterns need indexing.
4. **Onboarding draft server-side** — only if we see drop-off mid-flow.

## Rules of thumb

- If the field must survive a device switch → server authoritative.
- If the field is per-session (dismissals, UI toggles) → Zustand only, marked ephemeral.
- Every persisted-store field must appear in this doc with a status.
- When promoting ephemeral → authoritative, write a migration using [_TEMPLATE.sql](../supabase/migrations/_TEMPLATE.sql) and update this table in the same PR.
