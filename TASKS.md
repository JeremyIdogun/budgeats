# budgEAts — Codex Task Specs
### Follows: Functional Spec v0.2 | Format: AGENTS.md handoff format

Work through these in order. Each task is one branch, one PR.

---

## TASK-008 · Fix signup — handle email confirmation + post-confirmation routing

**Context**
New users cannot complete sign-up on the live Vercel deployment. The root cause is that the signup handler redirects to `/onboarding` before checking whether a session was actually created. When Supabase email confirmation is enabled, `signUp` succeeds without error but returns `session: null`. The user is sent to `/onboarding`, completes all 4 steps, then hits an auth wall when `handleRetailersComplete` calls `getUser()` and gets null — bouncing them to `/login`.

A second problem: after clicking the confirmation link in their email, the `/auth/callback` route redirects to `/dashboard` by default, but new users have no profile yet. They should go to `/onboarding` instead.

**Current behavior**

`src/app/signup/page.tsx`:
```typescript
const { error: signUpError } = await supabase.auth.signUp({ email, password });
if (signUpError) { setError(signUpError.message); return; }
router.replace("/onboarding"); // ← runs even when session is null
```

`src/app/auth/callback/route.ts`:
```typescript
const nextPath = sanitizeNextPath(requestUrl.searchParams.get("next"));
// ↑ defaults to "/dashboard" — doesn't check if user has a profile
```

**⚠️ Supabase config required (not a code change — do before deploying this fix)**
In the Supabase dashboard for the production project:
- **Auth → URL Configuration → Site URL**: must be the Vercel production domain (e.g. `https://budgeats.vercel.app`)
- **Auth → URL Configuration → Redirect URLs**: must include `https://[production-domain]/auth/callback`

Without this, confirmation emails point to the wrong domain and the callback never runs.

**Decision**

**Fix 1 — Signup page:** Check `data.session` after `signUp()`. If null (email confirmation required), render a confirmation state instead of redirecting.

Confirmation state UI (replaces form content, same card):
```
✉️
"Check your inbox"
"We've sent a confirmation link to {email}. Click it to activate
 your account and you'll be taken straight to setup."

[← Use a different email]   (no "go to login" — they haven't confirmed yet)
```
"Use a different email" resets `confirmationSent = false` and pre-fills the email input.

**Fix 2 — Auth callback:** After `exchangeCodeForSession`, query `user_profiles` for the new user. If no row exists, redirect to `/onboarding`. If a row exists, redirect to the `next` param (defaulting to `/dashboard`).

```typescript
// After successful exchangeCodeForSession:
const { data: { user } } = await supabase.auth.getUser();
if (user) {
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    // New user — needs onboarding
    response = NextResponse.redirect(new URL("/onboarding", requestUrl.origin));
  }
  // else: existing user — use nextPath (already set above)
}
```

**Files to edit**
- `src/app/signup/page.tsx` — add `confirmationSent: boolean` state, update `handleSignUp` to check `data.session`, add confirmation UI
- `src/app/auth/callback/route.ts` — after successful code exchange, check `user_profiles` and route new users to `/onboarding`

**Definition of done**
- [ ] Signing up with a new email shows the confirmation state instead of redirecting
- [ ] Confirmation state shows the email address the link was sent to
- [ ] "Use a different email" returns to the form with email pre-filled
- [ ] After clicking the confirmation link, new users (no profile) land on `/onboarding`
- [ ] After clicking the confirmation link, returning users (existing profile) land on `/dashboard`
- [ ] OAuth signup (`?next=/onboarding` already in the URL) still works — new OAuth users land on `/onboarding`
- [ ] Supabase Site URL and Redirect URL config note is actioned before deploying
- [ ] No TypeScript errors, no lint errors

---

## TASK-009 · Redesign app navigation

**Context**
Two UX problems with the current `AppNav`:
1. No labeled route back to `/dashboard` — users navigating to `/planner` or `/shopping` have no obvious way back. The logo links to `/dashboard` but this is not discoverable.
2. Active state uses `bg-navy text-white` filled pill, making the nav look like a row of action buttons rather than a navigation bar. Product navs should feel lighter — underline or indicator, not filled buttons.

**Current behavior**
`src/components/navigation/AppNav.tsx`:
- Nav links: Meal Planner, Shopping List, Insights, Settings (no Dashboard)
- Active state: `bg-navy text-white rounded-lg px-3 py-2`
- `NavBudgetPill`: card-style box, `min-w-56 rounded-xl border bg-white px-4 py-3`

**Decision**

**1. Add Dashboard as first nav link**
```typescript
const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },  // ← add
  { href: "/planner", label: "Meal Planner" },
  { href: "/shopping", label: "Shopping List" },
  { href: "/insights", label: "Insights" },
  { href: "/settings", label: "Settings" },
];
```

**2. Replace filled-pill active state with underline indicator**

Wrap the `<nav>` links in a `border-b border-cream-dark` container. Change link classes to:
```
base:     "relative pb-3 text-sm font-semibold transition-colors whitespace-nowrap"
inactive: "text-navy-muted hover:text-navy"
active:   "text-navy after:absolute after:bottom-0 after:left-0 after:right-0
           after:h-0.5 after:rounded-full after:bg-teal"
```
The teal underline sits on the bottom border line, giving a clean tab-bar feel.

**3. Slim the NavBudgetPill to a compact inline chip**

Replace the full card with a single-line chip that fits in the nav bar:
```
[████ 43% · £32 left]
```
New classes:
```
"flex items-center gap-2 rounded-full border border-cream-dark bg-white px-3 py-1.5 text-xs"
```
Content: a small coloured dot (`h-2 w-2 rounded-full` using `ringColor`) + `{pct}% · {formatPence(remaining)} left`. Remove the label row and progress bar — the dot colour carries the status signal.

**4. Mobile behaviour**
Nav links should scroll horizontally on mobile (`overflow-x-auto`, `flex-nowrap`, hide scrollbar). Budget chip moves below the logo row on small screens.

**Files to edit**
- `src/components/navigation/AppNav.tsx` — add Dashboard link, underline active state, border-b nav container, mobile scroll
- `src/components/navigation/NavBudgetPill.tsx` — compact chip, coloured dot indicator, remove card styling

**Definition of done**
- [ ] "Dashboard" is the first nav link and navigates to `/dashboard`
- [ ] Active route shows teal underline, not filled navy pill
- [ ] All 5 links show correct active state based on `usePathname()`
- [ ] NavBudgetPill renders as a compact chip alongside the nav links
- [ ] Budget chip colour thresholds unchanged (teal/amber/coral/red)
- [ ] On mobile, nav links scroll horizontally without wrapping
- [ ] No TypeScript errors, no lint errors

---

## TASK-001 · Wire onboarding completion to store

**Context**
Onboarding is the entry point for all first-time users. After step 4 completes, the app must write a `UserProfile` to the main store AND initialise an empty `WeekPlan` for the current week. Without the WeekPlan, the dashboard has no plan to render and all selectors return 0.

**Current behavior**
`handleRetailersComplete()` in `src/app/onboarding/page.tsx`:
- ✅ Builds `UserProfile` and calls `setCanonicalUser(canonicalUser)`
- ✅ Writes profile to Supabase `user_profiles`
- ✅ Sets `step` to 5 (StepSuccess), which navigates to `/dashboard` on CTA click
- ❌ Does NOT call `setCurrentWeekPlan(...)` — store.currentWeekPlan remains null after onboarding

**Decision**
After `setCanonicalUser(canonicalUser)`, immediately call:
```typescript
const setCurrentWeekPlan = useBudgeAtsStore((state) => state.setCurrentWeekPlan);
// ...inside handleRetailersComplete, after setCanonicalUser:
setCurrentWeekPlan(createEmptyWeekPlan(user.id, getCurrentWeekStartDateIso()));
```
Also call `store.reset()` from the onboarding store after navigation to clear ephemeral onboarding state.

**Files to edit**
- `src/app/onboarding/page.tsx` — add `setCurrentWeekPlan` from `useBudgeAtsStore`, add `createEmptyWeekPlan` + `getCurrentWeekStartDateIso` imports from `@/lib/planner`, call both after `setCanonicalUser`, call `store.reset()` before navigating away (move to `StepSuccess`'s CTA handler or call after `setStep(5)`)

**Imports needed**
```typescript
import { createEmptyWeekPlan, getCurrentWeekStartDateIso } from "@/lib/planner";
// add setCurrentWeekPlan alongside setUser from useBudgeAtsStore
```

**Definition of done**
- [ ] After completing onboarding, `useBudgeAtsStore.getState().currentWeekPlan` is non-null
- [ ] `currentWeekPlan.weekStartDate` equals the ISO date of the current Monday
- [ ] `currentWeekPlan.userId` equals the authenticated user's Supabase UID
- [ ] Onboarding store is reset after the user clicks "Go to my dashboard"
- [ ] No TypeScript errors, no lint errors

---

## TASK-002 · Add missing selectors to store

**Context**
The functional spec defines three selectors needed by the dashboard overview screen. They do not yet exist in `src/store/selectors.ts`. A helper function `getTodayDayIndex` is also needed and belongs in `src/lib/planner.ts`.

**Current behavior**
`src/store/selectors.ts` exports: `selectWeekSpendPence`, `selectBudgetRemainingPence`, `selectBudgetUtilisationPct`, `selectCheapestRetailer`. Missing: `selectPlannedMealCount`, `selectTodaysMeals`, `selectDashboardAlertState`.

`src/lib/planner.ts` does not export `getTodayDayIndex`.

**Decision**
Add helper to planner lib and three selectors to the selectors file, exactly as specified.

**Files to edit**

`src/lib/planner.ts` — add and export:
```typescript
/**
 * Returns the 0-based day index (Mon=0 … Sun=6) for today
 * relative to the week starting on weekStartDate.
 * Returns -1 if today is outside that week.
 */
export function getTodayDayIndex(weekStartDate: string, now = new Date()): number {
  const start = new Date(weekStartDate);
  const diffMs = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 6 ? diffDays : -1;
}
```

`src/store/selectors.ts` — add after existing selectors:
```typescript
import { getTodayDayIndex } from "@/lib/planner";
import type { DayPlan } from "@/models";

export const selectPlannedMealCount = (state: BudgeAtsState): number => {
  if (!state.currentWeekPlan) return 0;
  return state.currentWeekPlan.days
    .flatMap((day) => Object.values(day))
    .filter(Boolean).length;
};

export const selectTodaysMeals = (state: BudgeAtsState): DayPlan => {
  if (!state.currentWeekPlan) return {};
  const todayIndex = getTodayDayIndex(state.currentWeekPlan.weekStartDate);
  return todayIndex >= 0 ? (state.currentWeekPlan.days[todayIndex] ?? {}) : {};
};

export const selectDashboardAlertState = (
  state: BudgeAtsState,
): "under-planned" | "on-track" | "over-budget" => {
  const spent = selectWeekSpendPence(state);
  const budget = state.user?.budget.amount ?? 0;
  const count = selectPlannedMealCount(state);
  if (budget > 0 && spent > budget) return "over-budget";
  if (count < 14) return "under-planned";
  return "on-track";
};
```

**Definition of done**
- [ ] `getTodayDayIndex` exported from `src/lib/planner.ts`
- [ ] All three selectors exported from `src/store/selectors.ts`
- [ ] `selectPlannedMealCount` returns 0 for an empty plan and the correct count for a plan with meals
- [ ] `selectDashboardAlertState` returns `'under-planned'` for <14 meals, `'over-budget'` when spent > budget, `'on-track'` otherwise
- [ ] No TypeScript errors, no lint errors

---

## TASK-003 · Build dashboard overview screen at /dashboard

**Context**
The spec defines `/dashboard` as a landing overview (budget ring, week summary grid, quick actions, smart alert). Currently `/dashboard` renders `DashboardClient`, which is the full planner+shopping tab experience. The overview screen needs to be built as a new component and wired to the selectors added in TASK-002.

**Current behavior**
`src/app/dashboard/page.tsx` fetches Supabase data and renders `<DashboardClient .../>`. DashboardClient is a 1000+ line planner+shopping UI — not the overview described in the spec.

**Decision**
1. Create `src/components/dashboard/DashboardOverview.tsx` — the new dashboard UI
2. Update `src/app/dashboard/page.tsx` to render `<DashboardOverview .../>` instead of `<DashboardClient .../>`
3. Do NOT delete or modify `DashboardClient.tsx` — it will be used by the `/planner` route (TASK-004)

The overview component receives the same props as DashboardClient (userId, initialPlan, profileRetailers, profileWeeklyBudgetPence, profileBudgetPeriod) and hydrates the store the same way.

**Files to edit**
- `src/components/dashboard/DashboardOverview.tsx` — CREATE new file (spec below)
- `src/app/dashboard/page.tsx` — swap `DashboardClient` import/usage for `DashboardOverview`

**DashboardOverview spec**

```
Layout (two-column on desktop, single column on mobile):

LEFT COLUMN:
  BudgetRing — SVG ring showing utilisation %
    centre text: "X% used"
    sub-text: "£Y remaining"

RIGHT COLUMN:
  WeekSummaryGrid — 7 cells (Mon–Sun)
    Each cell shows: day label + date + count of planned meals (0/1/2/3)
    Today's cell is highlighted (teal border)
    Clicking a cell navigates to /planner (future: with day anchor)

FULL WIDTH BELOW:
  QuickActions — 3 buttons:
    [+ Add meals to this week] → /planner
    [View shopping list] → /shopping
    [See insights] → /insights

  AlertBanner — one of three states (see below)
```

**Alert banner states** (determined by `selectDashboardAlertState`):

State `under-planned`:
```
⚠️  "You've planned {count} meals this week.
     Aim for at least 14 to stay within your £{budget} budget."
CTA: [Finish planning →]  → /planner
```

State `on-track`:
```
✅  "Great week ahead. {count} meals planned, £{remaining} still available.
     Your shopping list is ready."
CTA: [View shopping list →]  → /shopping
```

State `over-budget`:
```
🔴  "You're £{overage} over your weekly budget.
     Remove a meal or try a cheaper swap."
CTAs: [Edit meals →] → /planner
```

**Store hydration**
DashboardOverview must hydrate the Zustand store from props exactly as DashboardClient does (lines 259–290 of DashboardClient.tsx). Extract this logic into a `useHydrateStore` hook or copy it directly — do not break DashboardClient's copy.

**Budget ring colours**
```
0–70%:   teal    #3DBFB8
70–90%:  amber   #F5A623
90–100%: coral   #E8693A
100%+:   red     #D94F4F
```

**Definition of done**
- [ ] `/dashboard` loads without errors for a user who has completed onboarding
- [ ] Budget ring shows correct `selectBudgetUtilisationPct` value
- [ ] Week summary grid shows one cell per day, today highlighted
- [ ] Correct alert state renders based on `selectDashboardAlertState`
- [ ] All three quick action buttons navigate to the correct routes
- [ ] `/dashboard` still server-renders (page.tsx remains a server component)
- [ ] DashboardClient.tsx is unchanged
- [ ] No TypeScript errors, no lint errors

---

## TASK-004 · Create /planner route (extract from DashboardClient)

**Context**
The spec defines `/planner` as the full 7-day meal planning grid. This already exists as the "Meal planner" tab inside DashboardClient at `/dashboard`. It needs to be accessible at its own route.

**Current behavior**
`/dashboard` renders DashboardClient with a `planner | shopping` tab switcher. There is no `/planner` route.

**Decision**
Create `src/app/planner/page.tsx` as a server component that:
1. Performs the same Supabase auth + data fetch as `src/app/dashboard/page.tsx`
2. Renders `<DashboardClient .../>` with `initialTab="planner"` (add this prop)

Add an `initialTab` prop to DashboardClient so the planner route lands on the planner tab by default. Default value: `"planner"`.

Update the nav bar in DashboardOverview (and DashboardClient) to include links to `/planner` and `/shopping`.

**Files to edit**
- `src/app/planner/page.tsx` — CREATE (copy server-side logic from dashboard/page.tsx, render DashboardClient)
- `src/components/dashboard/DashboardClient.tsx` — add `initialTab?: DashboardTab` prop, pass to `useState<DashboardTab>(initialTab ?? "planner")`
- `src/components/dashboard/DashboardOverview.tsx` — update nav links to include Meal Planner → `/planner`

**Definition of done**
- [ ] Navigating to `/planner` renders the meal planner grid (not the shopping tab)
- [ ] Navigating to `/dashboard` renders the overview (not the planner grid)
- [ ] Week navigation (prev/next week) works correctly on `/planner`
- [ ] Budget bar in planner updates live as meals are added/removed
- [ ] No TypeScript errors, no lint errors

---

## TASK-005 · Build standalone /shopping route

**Context**
The spec defines `/shopping` as a dedicated screen. The shopping list UI currently lives as a tab inside DashboardClient. Extract it into its own route and component.

**Current behavior**
Shopping list is the "Shopping list" tab inside DashboardClient. No `/shopping` route exists.

**Decision**
Extract the shopping tab JSX from DashboardClient into `src/components/shopping/ShoppingClient.tsx`. Create `src/app/shopping/page.tsx`.

The ShoppingClient receives the same props as DashboardClient (minus plannerspecific ones) and renders the spec's layout:
- Header: "Shopping List — Week of {date}" + estimated total + savings delta
- Left: Store split summary (basket by retailer)
- Right: Item list grouped by category with checkboxes and best-price labels
- Empty state: "Plan your meals first." CTA → /planner

Keep the existing shopping logic in DashboardClient functional (don't remove the shopping tab — just duplicate the logic into ShoppingClient for now; the tab can be deprecated in a later cleanup task).

**Files to edit**
- `src/app/shopping/page.tsx` — CREATE (server component, same Supabase fetch pattern)
- `src/components/shopping/ShoppingClient.tsx` — CREATE (extract + adapt shopping tab from DashboardClient)

**Savings delta display**
```
"Save £{savings} by splitting between {retailer1} + {retailer2}"
```
Savings = (cheapest single-store total) minus (split-basket total from `generatedShoppingList`).

**Definition of done**
- [ ] `/shopping` renders the shopping list for the current week
- [ ] Items grouped by category in the spec's order (Meat & Fish first, Other last)
- [ ] Each item shows best-price retailer and amount needed
- [ ] Checkbox state is ephemeral (not persisted across refreshes)
- [ ] Empty state shown when no meals are planned
- [ ] Savings delta shown in header when split basket is cheaper than single store
- [ ] No TypeScript errors, no lint errors

---

## TASK-006 · Build insights screen at /insights

**Context**
The spec defines `/insights` as the retention driver. For MVP, only current-week insights are required. Historical trends are out of scope.

**Current behavior**
No `/insights` route or component exists.

**Decision**
Create `src/app/insights/page.tsx` (server component) and `src/components/insights/InsightsClient.tsx` (client component).

Render only the cards where data exists to support them (guard each card).

**Files to create**
- `src/app/insights/page.tsx`
- `src/components/insights/InsightsClient.tsx`

**Cards to implement (in order)**

**Card 1 — Week Summary** (always show if user exists)
```
This week: £{spent} of £{budget}
{n} meals planned
```

**Card 2 — Most Expensive Meal** (show if ≥1 meal planned)
```
💸 Your priciest meal this week: {mealName} — £{cost}
   That's {pct}% of your weekly budget.
```

**Card 3 — Best Value Meal** (show if ≥1 meal planned)
```
👍 Best value this week: {mealName} — £{cost}
```

**Card 4 — Retailer Split** (show if ≥1 meal planned and shoppingList has items)
```
Where you'd shop:
  {retailer}  ████████  {pct}%  £{total}
  ...
```
Data source: `generateShoppingList().totalByRetailer` filtered to `user.preferredRetailers`.

**Card 5 — Waste Risk** (show only if any ingredient leftover > 30% of pack size)
See spec for logic. Use `ShoppingList.items[n].totalQuantityNeeded` vs pack size from `Ingredient.packSize` (check model — if packSize doesn't exist, skip this card for MVP).

**Card 6 — Month Projection** (skip for MVP — requires ≥2 weeks of data)

**Empty state** (no meals planned):
```
"No data yet. Plan your first week of meals to see insights."
CTA → /planner
```

**Definition of done**
- [ ] `/insights` loads without error for users with and without planned meals
- [ ] Cards 1–4 render when meals are planned
- [ ] No card renders when its data is unavailable
- [ ] Empty state shown when no meals planned
- [ ] No TypeScript errors, no lint errors

---

## TASK-007 · Build settings screen at /settings

**Context**
Settings is the lowest priority screen. It allows users to edit their profile after onboarding.

**Current behavior**
No `/settings` route or component exists.

**Decision**
Create `src/app/settings/page.tsx` and `src/components/settings/SettingsClient.tsx`.

Reuse onboarding UI components where possible (StepBudget logic, StepHousehold logic, dietary pill selector, retailer grid). Do not duplicate them — import them or extract shared sub-components.

**Files to create**
- `src/app/settings/page.tsx`
- `src/components/settings/SettingsClient.tsx`

**Sections to implement**

1. **Budget** — amount input + period toggle (same as StepBudget). On save: update Supabase `user_profiles.weekly_budget_pence` and store.
2. **Household** — stepper (same as StepHousehold). On save: update Supabase + store.
3. **Dietary Preferences** — pill selector (same as StepDietary). On save: update Supabase + store. Show warning: "Changing this will re-filter your meal suggestions."
4. **Preferred Retailers** — grid (same as StepRetailers). Minimum 1 required. On save: update Supabase + store.
5. **Account (stub)** — display email (read-only). "Delete all my data" button → clears Zustand store + localStorage (`localStorage.removeItem('budgeats-storage')`) + redirect to `/`.

**Save behaviour**
Each section has its own Save button. Saving one section does not affect others. Show a subtle success confirmation ("Saved ✓") inline after each save.

**Definition of done**
- [ ] `/settings` loads pre-populated with the user's current profile values
- [ ] Each section saves independently to Supabase and updates the Zustand store
- [ ] Dietary warning is shown when the user modifies dietary preferences
- [ ] "Delete all my data" clears local state and redirects to `/`
- [ ] Minimum-1-retailer constraint enforced
- [ ] No TypeScript errors, no lint errors

---

## Nav bar — applies to TASKS 003–007

The persistent nav bar (all screens except `/onboarding`) should match this spec:

```
logo | Meal Planner → /planner | Shopping List → /shopping | Insights → /insights | Settings → /settings
                                                    [£X of £Y ████ Z%]
```

Budget pill colour states:
- 0–70%: teal `#3DBFB8`
- 70–90%: amber `#F5A623`
- 90–100%: coral `#E8693A`
- 100%+: danger red `#D94F4F`

The budget pill reads from `selectWeekSpendPence` and `user.budget.amount` from the Zustand store. It is a client component. Extract it as `<NavBudgetPill />` and use it in a shared layout or in each page's client component.

---

## TASK-010 · Set up develop branch and push coming soon work to main

**Context**
The coming soon page (`src/components/coming-soon/ComingSoonPage.tsx`), env-var gate (`src/app/page.tsx`), and route-blocking middleware (`src/middleware.ts`) have been implemented on the local `main` branch but not yet committed or pushed. The production environment (Vercel) should serve the coming soon page via `main`; the preview environment should serve the full app from a `develop` branch. Vercel env vars have already been set (`NEXT_PUBLIC_COMING_SOON=true` for Production, `false` for Preview).

**Current behavior**
- Working tree on `main` has uncommitted changes to `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`, and untracked files `AGENTS.md`, `TASKS.md`, `src/components/coming-soon/`, `src/middleware.ts`.
- No `develop` branch exists locally or on origin.
- `onboarding` and `planner` feature branches exist locally and are ahead of the previous `main`.

**Decision**
1. Commit all coming-soon / env-gate work to `main` and push to origin.
2. Create `develop` branch from `main` and push it to origin (this becomes the Vercel preview target).
3. Rebase `onboarding` and `planner` feature branches onto `develop` so future PRs target `develop`, not `main`.
4. Verify `src/middleware.ts` is present and `src/components/coming-soon/ComingSoonPage.tsx` exists before committing.

**Files to edit / commands to run**

Step 1 — Commit coming soon work on `main`:
```bash
git add AGENTS.md TASKS.md \
  src/app/globals.css \
  src/app/layout.tsx \
  src/app/page.tsx \
  src/components/coming-soon/ \
  src/middleware.ts
git commit -m "feat: add coming soon page, env-var gate, and route-blocking middleware"
git push origin main
```

Step 2 — Create and push `develop` from `main`:
```bash
git checkout -b develop
git push -u origin develop
```

Step 3 — Rebase feature branches onto `develop`:
```bash
git checkout onboarding
git rebase develop
git checkout planner
git rebase develop
```

Step 4 — Return to `develop` as the working base:
```bash
git checkout develop
```

**Definition of done**
- `origin/main` exists and includes `src/middleware.ts` and `src/components/coming-soon/ComingSoonPage.tsx`.
- `origin/develop` exists, is at the same commit as `main`.
- `onboarding` and `planner` branches rebase cleanly onto `develop` (resolve any conflicts if they arise).
- Active branch after task is `develop`.
- No uncommitted changes remain on any branch.

---

*End of task specs — budgEAts v0.2*
*Generated from Functional Spec v0.2 by Claude*
*Hand off to Codex. One task = one branch = one PR.*
