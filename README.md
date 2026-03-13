# budgEAts

budgEAts is a Next.js 16 app for budget-aware meal planning, shopping support, and behavior-guided food decisions.

## Current product modes

The codebase supports two runtime modes, controlled by `NEXT_PUBLIC_COMING_SOON`:

- **Coming-soon mode (`true`)**: users only see the landing/waitlist experience.
- **App mode (`false`)**: users can access authentication and the in-app routes (dashboard, planner, shopping, insights, settings, rewards, and decisions).

Route blocking in coming-soon mode is enforced by `src/middleware.ts`.

## Tech stack

- **Framework**: Next.js (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4 + global CSS
- **State management**: Zustand (`src/store`, `src/stores`)
- **Backend/data**: Supabase auth + tables, SQL migrations in `supabase/`

## Application map

### Public and auth routes

- `/` — either `ComingSoonPage` or the full marketing landing page depending on env flag.
- `/signup`, `/login` — Supabase auth flows.
- `/auth/callback` — auth callback handler.
- `/api/waitlist` — waitlist submission endpoint used by the coming-soon page.

### In-app routes

- `/onboarding` — profile and preference capture.
- `/dashboard` — central planning and shopping context.
- `/planner` — meal planning views/logic.
- `/shopping` — shopping list and retailer-aware list UX.
- `/insights` — budget/meal insights.
- `/settings` — account and profile settings.
- `/rewards` and `/decisions` — Logismos/Loavish decision & points flow.

## Notable code areas

- `src/components/` — UI by domain (dashboard, shopping, onboarding, nav, settings, insights, logismos, coming-soon).
- `src/lib/` — pure/business logic (budget math, planner helpers, shopping transforms, dashboard data hydration, Logismos recommendation logic, Supabase clients).
- `src/models/` and `src/types/` — shared domain types.
- `src/data/*.json` — local seed/reference datasets for meals, ingredients, and prices.
- `supabase/migrations/` + `supabase/snippets/` — schema foundations and feature SQL.

## Local development

```bash
npm install
npm run dev
```

Run checks:

```bash
npm run lint
```

## Environment variables (typical)

- `NEXT_PUBLIC_COMING_SOON` — toggles landing-only mode vs full app mode.
- Supabase project keys/URLs required by `src/lib/supabase/client.ts` and `src/lib/supabase/server.ts`.

