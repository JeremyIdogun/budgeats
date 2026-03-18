# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

For product vision, brand rules, and the *why* behind decisions, see `PRODUCT.md`.

## Commands

```bash
# Development
pnpm dev                  # Start Next.js dev server
pnpm build                # prisma generate && next build
pnpm start                # Start production server
pnpm lint                 # Run ESLint

# Database
pnpm prisma:generate      # Generate Prisma client
pnpm prisma:migrate       # Run migrations (dev)
pnpm prisma:push          # Push schema without migration file

# Tests — run from individual packages (no root test script)
cd packages/logismos && pnpm test
cd packages/pricing-engine && pnpm test
cd packages/matching-engine && pnpm test
cd packages/shared && pnpm test
# All packages use: vitest run
```

## Architecture

**Monorepo** (pnpm workspaces). Main Next.js app lives at the repo root (`src/`). Shared domain logic lives in `packages/`.

### Packages

| Package | Status | Purpose |
|---------|--------|---------|
| `@loavish/logismos` | Complete | Core decision engine — pure `runLogismos()` function. Weighted scoring (35% cost, 20% waste, 20% time, 15% energy, 5% routine, 5% satisfaction). Returns `cook` or `eat_out` recommendation with explanation and alternatives. |
| `@loavish/matching-engine` | Complete | Ingredient-to-product matching. `scoreCandidate()` and `rankCandidates()`. Routes to `auto` (≥0.9), `review` (0.65–0.89), or `unmatched` (<0.65). |
| `@loavish/pricing-engine` | Mostly complete | Meal cost derivation with waste penalties (exponential decay). Handles promo/loyalty pricing. Includes `logismos-bridge/` for feeding costs into the engine. |
| `@loavish/retailer-connectors` | Partial | Adapter pattern with Tesco, Asda, Sainsbury's connectors. Uses Playwright for scraping. Core interface: `bootstrapContext()`, `searchProducts()`, `normalizeRawProduct()`. |
| `@loavish/db` | Complete | Prisma schema + PostgreSQL client. All domain models defined. |
| `@loavish/shared` | — | Units, constants, cross-cutting utilities |
| `@loavish/ui` | — | Shared UI component library |

### Main App (`src/`)

- `app/` — Next.js App Router. Key routes: `/dashboard`, `/planner`, `/shopping`, `/insights`, `/rewards`, `/decisions`, `/onboarding`, `/admin/*`
- `app/api/` — API routes. Key endpoints: `/api/logismos/recommendation`, `/api/logismos/accept`, `/api/logismos/dismiss`, `/api/v1/pricing/*`, `/api/v1/products/*`, `/api/admin/*`
- `stores/` — Three Zustand stores: `useBudgeAtsStore` (main app state, persisted to localStorage), `useOnboardingStore` (budget/household setup), `useDecisionStore` (decision log)
- `lib/` — Supabase client utilities (SSR-aware)

### Database

Prisma config is at `prisma.config.ts` (non-default location). Two connection strings required:
- `DATABASE_URL` — primary app schema
- `SHADOW_DATABASE_URL` — shadow DB for `prisma migrate dev`

Key model groups: `Retailer`/`IngestionRun`/`RetailerContext` → `RetailerProduct`/`RetailerPrice` → `CanonicalIngredient`/`CanonicalProduct`/`ProductMatch` → `MealCostSnapshot`/`DecisionLog`/`PointsLedger`

### Data Flow

```
RetailerConnectors (scrape/API)
  → RetailerProduct + RetailerPrice (DB)
  → MatchingEngine (ingredient → product)
  → PricingEngine (meal cost with waste penalty)
  → Logismos (recommendation: cook vs eat-out)
  → Dashboard / Planner / Shopping UI
  → DecisionLog + PointsLedger
```

### Key Technical Decisions

- **Auth:** Supabase SSR (`@supabase/ssr`) — Supabase client is context-aware (server vs. client components)
- **Money:** All prices stored and computed in **pence** (integer minor units)
- **React Compiler:** Enabled in `next.config.ts` — avoid manual `useMemo`/`useCallback` unless profiling shows need
- **Tailwind CSS v4** — uses `@tailwindcss/postcss`, not the v3 plugin format
- **TypeScript strict mode** — path aliases configured in `tsconfig.json`

### Current Implementation State

The domain logic layer (Logismos, matching, pricing, schema) is production-ready. The UI and API layers are scaffolded with varying depth — some routes are complete, others are stubs. Retailer connectors exist for 3 retailers but full scraping coverage is partial. Zustand stores persist to localStorage; backend sync is not fully wired everywhere.

When adding features, check whether the relevant domain package already implements the logic before adding it to an API route handler or component.
