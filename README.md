# Loavish

Loavish is a Next.js meal-planning and grocery-budgeting app focused on:

- authenticated onboarding with Supabase Auth
- weekly meal planning and shopping-list generation
- pantry and dashboard-state persistence
- pricing and ingestion admin tooling
- Logismos decision tracking and rewards scaffolding

The current safest beta surface is the core authenticated app: onboarding, dashboard, planner, shopping, pantry, insights, and settings. Rewards and admin product-review tooling are now behind launch flags and default to off.

## Stack

- Next.js App Router
- Supabase Auth plus Postgres-backed app tables
- Prisma client for the pricing and ingestion data model
- Zustand for client state
- PostHog for product analytics
- Resend for waitlist and price-alert email
- Optional Upstash Redis REST cache
- Optional Apify-backed retailer ingestion

## Requirements

- Node.js 20+
- npm 10+ or pnpm 9+
- a Supabase project
- a Postgres connection string reachable by Prisma

## Quick Start

1. Install dependencies.

```bash
npm install
```

2. Copy the environment template and fill in the required values.

```bash
cp .env.example .env.local
```

3. Create the base Supabase profile table if your project does not already have it.

Run `supabase/snippets/db_foundation.sql` in your Supabase SQL editor.

4. Apply the app SQL migrations in order.

- `supabase/migrations/20260311000000_logismos.sql`
- `supabase/migrations/20260314000000_dashboard_state.sql`
- `supabase/migrations/20260406120000_dashboard_state_expansion.sql`

5. Generate the Prisma client.

```bash
npm run prisma:generate
```

6. Start the app.

```bash
npm run dev
```

7. Open `http://localhost:3000`.

## Environment

### Required for local app boot

- `NEXT_PUBLIC_APP_URL`
  Used in email links and asset URLs. For local dev: `http://localhost:3000`.
- `NEXT_PUBLIC_SUPABASE_URL`
  Required by server and browser Supabase clients.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  Required by server and browser Supabase clients.
- One database URL:
  Set `DATABASE_URL`, `POSTGRES_URL_NON_POOLING`, or `POSTGRES_PRISMA_URL`.

### Recommended for a real beta environment

- `ADMIN_EMAILS`
  Comma-separated emails allowed through server-side admin guards.
- `NEXT_PUBLIC_ADMIN_EMAILS`
  Same list, used so the client nav can show the admin link correctly.
- `NEXT_PUBLIC_POSTHOG_KEY`
  Enables PostHog analytics in the browser.
- `NEXT_PUBLIC_POSTHOG_HOST`
  Defaults to `https://app.posthog.com`.
- `RESEND_API_KEY`
  Required if `/api/waitlist` or price-alert email sending is enabled.
- `RESEND_FROM_EMAIL`
  Sender address for Resend mail.

### Optional ops and launch controls

- `NEXT_PUBLIC_COMING_SOON`
  When `true`, middleware redirects app routes to the marketing page.
- `NEXT_PUBLIC_ENABLE_REWARDS`
  Defaults to `true`. Set to `false` to hide the rewards route and nav item.
- `NEXT_PUBLIC_ENABLE_ADMIN_PRODUCT_REVIEW`
  When `true`, exposes the admin product review and unmatched-product tooling.
- `SENTRY_DSN`
  Enables server-side Sentry exception capture.
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
  Optional Redis REST cache. Without these, the app falls back to in-memory cache.
- `REDIS_REST_URL` / `REDIS_REST_TOKEN`
  Alternate names supported by the cache helper.
- `APIFY_TOKEN`
  Enables live retailer ingestion. Without it, `/admin/runs` falls back to local HTML fixtures.
- `SUPABASE_SERVICE_ROLE_KEY`
  Required only if you want snapshots stored in Supabase Storage.
- `SNAPSHOT_BUCKET`
  Supabase Storage bucket name for ingestion snapshots.
- `SNAPSHOT_DIR`
  Filesystem snapshot directory override. Defaults to `.snapshots` or a temp directory.
- `POSTGRES_SHADOW_DATABASE_URL`
  Optional explicit Prisma shadow database URL.
- `POSTGRES_APP_SCHEMA`
  Prisma schema name. Defaults to `loavish`.

## Database Notes

There are two database layers in this repo:

- Supabase SQL tables for user-facing app state such as `user_profiles`, `decisions`, and `user_dashboard_state`
- Prisma models in `packages/db/prisma/schema.prisma` for retailer, pricing, ingestion, and snapshot-related entities

For the current app:

- you must create `public.user_profiles`
- you must apply the SQL files in `supabase/migrations`
- you should run `npm run prisma:generate`

The repo does not yet include a polished end-to-end bootstrap script that provisions both the Supabase SQL layer and the Prisma schema automatically, so keep the SQL migrations and Prisma generation as separate steps for now.

## Local Verification

Use this as the current high-signal local check:

```bash
npm run lint
npm run build
npm run smoke -- http://localhost:3000
```

Recommended manual smoke test:

1. Sign up or log in through Supabase auth.
2. Complete onboarding and confirm you land on `/dashboard`.
3. Add meals in `/planner`.
4. Open `/shopping` and verify the list generates.
5. Check off a few shopping items, refresh, and confirm they persist.
6. Toggle pantry items in `/pantry`, refresh, and confirm they persist.
7. Log out and log back in as the same user to confirm planner and pantry state survive.
8. Try an admin route as a non-admin and confirm it is blocked.
9. If `ADMIN_EMAILS` is configured, log in as an admin and confirm `/admin/runs` loads.
10. Open `/api/health` and confirm launch readiness is not `blocked`.

Package test scripts exist in several workspace packages, but they are still being normalized into one reliable repo-wide verification path. For now, prefer `lint`, `build`, and the smoke flow above as the launch-readiness gate.

## Admin and Worker Flow

The admin ingestion entrypoint is `src/app/api/admin/runs/route.ts`.

How it behaves:

- with `APIFY_TOKEN`, it uses the Apify-backed retailer connectors
- without `APIFY_TOKEN`, it falls back to local fixture HTML for Tesco, Asda, and Sainsbury's
- with `SUPABASE_SERVICE_ROLE_KEY` and `SNAPSHOT_BUCKET`, snapshots can persist to Supabase Storage
- without snapshot storage config, snapshots fall back to filesystem or in-memory storage

This means you can exercise the admin run flow locally without live retailer credentials, but production-like ingestion needs real Apify and snapshot configuration.

## Useful Commands

```bash
npm run dev
npm run lint
npm run build
npm run smoke -- http://localhost:3000
npm run prisma:generate
```

## Launch Protections

- Public pricing and preview endpoints now have request rate limits.
- `/api/health` exposes a no-store launch health summary for smoke checks and deploy validation.
- If Redis is not configured, cache and rate limiting still work, but they degrade to in-memory mode.
- `/admin/retailers` now acts as the pricing and ingestion readiness view for launch decisions.

## Rollback Runbook

Use these levers in order if a release is unhealthy:

1. Set `NEXT_PUBLIC_COMING_SOON=true` to gate the app behind the marketing page while keeping system routes available.
2. Rewards is on by default; set `NEXT_PUBLIC_ENABLE_REWARDS=false` to hide it quickly if the surface is misbehaving. Keep `NEXT_PUBLIC_ENABLE_ADMIN_PRODUCT_REVIEW=false` unless that surface is explicitly ready.
3. Disable live retailer ingestion by removing `APIFY_TOKEN` if connector failures are causing instability.
4. Check `/api/health` and `/admin/retailers` after every deploy before reopening traffic.
5. If a bad deploy is already live, roll back to the last known good deployment, then rerun `npm run smoke -- <base-url>` against the restored build.

## Current Caveats

- Waitlist and transactional email now fail gracefully when `RESEND_API_KEY` is missing, but those flows still need real Resend configuration to be usable.
- Launch health will report degraded readiness when Redis is absent because rate limiting and cache fall back to in-memory storage.
- Rewards and admin product-review tooling are intentionally default-off behind launch flags.
