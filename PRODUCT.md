# PRODUCT.md

This file defines the product vision, principles, and brand rules for **Loavish**. It is the canonical reference for *why* decisions are made. For technical setup and architecture, see `CLAUDE.md`.

## 1. Mission

You are the coding agent for **Loavish**, a consumer food-budgeting and meal-planning product. Your job is not merely to ship features. Your job is to build a product that helps users **balance time, cost, and satisfaction** so each meal decision fits their life and wallet, powered by **Logismos**, the proprietary decision engine. Every technical choice should reinforce that value proposition rather than drift into generic "budget app" behavior.

The product's core distinction is that it helps users make smarter food decisions **before** they shop or order, using ingredient-level pricing, retailer comparison, meal planning, waste reduction, and contextual recommendations. Logismos is the main product moat and should be treated as a first-class system, not a side feature.

## 2. Product North Star

Build Loavish as an **intelligent decision product**, not a passive expense tracker.

When making implementation choices, optimize for the following order:

1. **Decision quality** — Does this help the user make a better food decision now?
2. **Clarity** — Can the user understand the recommendation, savings, tradeoff, or next step instantly?
3. **Trustworthiness** — Are numbers explainable, consistent, and stable?
4. **Low friction** — Does this reduce planning effort rather than add admin burden?
5. **Extensibility** — Can the architecture support more retailers, more contexts, and future monetization without rewrites?

## 3. Core Product Principles

### 3.1 What Loavish is
- A meal planning and grocery decision platform
- A pricing intelligence layer across retailers
- A household food budget optimizer
- A recommendation engine for cook-at-home vs eat-out decisions
- A habit-forming product that turns small weekly savings into compounding outcomes

### 3.2 What Loavish is not
- Not a calorie-tracker-first app
- Not a punishment-oriented budgeting app
- Not a cashback gimmick app
- Not a generic grocery list clone
- Not a pure "recipe app" with budget features taped on afterward

### 3.3 Brand and UX philosophy
Loavish should feel: intelligent, calm, precise, warm, trustworthy, quietly aspirational.

It should never feel: preachy, guilt-driven, noisy, over-gamified, cheap or coupon-cluttered, financially shaming.

## 4. Canonical Product Scope

### 4.1 MVP focus
1. onboarding and user profile setup
2. budget setup
3. meal planning
4. retailer-aware ingredient pricing
5. shopping list generation
6. Logismos recommendation engine
7. dashboard surfacing recommendations and savings
8. basic insights and LoavishPoints foundation

### 4.2 MVP user promise
A user should be able to:
- set a weekly food budget
- plan meals for the week
- see estimated meal costs based on retailer data
- generate a shopping list
- receive a recommendation on whether to cook or eat out
- understand the savings impact of that recommendation
- build trust that Loavish is helping them eat well for less

### 4.3 Phase II candidates
Only build if the MVP foundation is stable:
- deeper retailer integrations and price alerts
- affiliate flows
- Google Calendar sync
- energy check-ins
- geolocation-aware eat-out suggestions
- export shopping lists to retailer apps
- advanced household collaboration
- nutrition-density and cost-per-nutrient layers
- sponsored or partner surfaces, clearly labeled

## 5. Build Order Rules

When uncertain, build in this order:

1. **pure data models and pure functions first**
2. **domain services second**
3. **UI surfaces third**
4. **analytics/events fourth**
5. **growth/monetization layers last**

Specifically:
- Build `logismos` as a testable domain module before polishing dashboard UI
- Build pricing normalization before advanced savings messaging
- Build shopping list derivation before export integrations
- Build stable recommendation reasoning before notifications
- Build trustworthy cost calculations before affiliate revenue hooks

## 6. Repository Structure Intent

Domain logic must stay separate from presentation and integrations.

Rules:
- Domain logic must not live inside UI components
- Pricing logic must not be duplicated across planner, dashboard, and shopping list features
- Recommendation scoring must be centralized and versioned
- Shared calculation code must live in domain packages or lib, never copied inline in screens

## 7. Core Domain Modules

### Budget domain
weekly/monthly budget setup, remaining budget calculations, household allocation, budget impact summaries

### Meal domain
meal entities, portion scaling, prep time, ingredient composition, meal cost derivation hooks

### Pricing domain
product price ingestion, unit normalization, equivalent item mapping, cost-per-unit calculation, meal cost aggregation, retailer comparison logic

### Retailer domain
retailer metadata, availability and freshness of pricing data, source confidence, retailer-specific overrides, API/scraping adapter boundaries

### Waste domain
expiry windows, ingredient utilization, duplicate item detection, waste-risk surfacing

### Recommendation domain / Logismos
contextual signal ingestion, weighted scoring, recommendation generation, explanation generation, alternative suggestions, recommendation expiry/staleness handling

### Insights domain
savings totals, hours saved estimates, streaks, score calculation, summary cards

## 8. Logismos Rules

### 8.1 Required inputs
- budget remaining, days left in period
- household size, planned meals
- prep time required, current time/day context
- waste-risk ingredients, energy level check-in
- calendar time-window constraints
- retailer pricing context, eat-out baseline estimate

### 8.2 Required outputs
Every recommendation object must contain:
- recommendation type: `cook` or `eat_out`
- selected meal id or null
- one-sentence human-readable reason
- cook cost estimate, eat-out estimate, savings delta
- time required, contextual signals used
- generated timestamp, expiry timestamp
- confidence or score metadata if useful internally

### 8.3 Non-negotiable behavior
- Every recommendation must be explainable in plain language
- Recommendation reasons must map directly to underlying signals
- Logismos must be testable as a pure function where possible
- The system must support alternatives, not just a single answer
- Recommendation expiry/staleness must be explicit
- Fallback behavior for sparse-user-data cases must be deliberate and safe

### 8.4 Design philosophy
Recommendations must feel like: *"Here is the smartest next move for tonight."*

Not like: *"You failed your budget."* or *"Best financial choice only."*

The engine balances **cost, time, and satisfaction** — not cost alone.

### 8.5 Versioning
- Keep a version identifier for scoring logic
- Document scoring changes in `/docs/decisions` or `/docs/changelog`
- Avoid silent changes that make analytics or QA comparisons impossible

## 9. Pricing and Retailer Data Rules

### 9.1 Principles
- Always normalize units before comparing prices
- Never compare incompatible pack sizes without conversion logic
- Track data freshness per item and per retailer
- Preserve source metadata for debugging and trust
- Prefer deterministic transforms over heuristic shortcuts

### 9.2 Equivalence logic
Distinguish between: exact matches, close substitutes, category-level fallbacks.

Do not pretend equivalence where it does not exist. A substitute is not the same product.

### 9.3 Source strategy
Support multiple source modes behind clean adapters:
- official APIs where available
- affiliate or partner feeds where viable
- paid data providers if adopted later
- compliant scraping or extraction layers if legally approved
- manual seeding / curated datasets for development and testing

Keep adapters isolated so the source strategy can evolve without polluting domain logic.

## 10. UX and UI Guardrails

### 10.1 Every interface should answer one of these quickly
- What should I do next?
- What will it cost?
- How much will I save?
- What do I need to buy?
- Where is the better value?

### 10.2 Information hierarchy for cost information
1. total decision impact
2. immediate recommendation
3. retailer comparison
4. supporting explanation
5. optional detail expansion

### 10.3 Required UX qualities
- mobile-first, low cognitive load
- resilient empty states
- graceful offline/loading behavior
- transparent uncertainty when data is stale or estimated

### 10.4 Avoid
- cluttered dashboards
- dense tables as the primary mobile experience
- financial jargon without translation
- loud success celebrations for routine actions
- dark patterns for upgrades

## 11. Brand Implementation Rules

### 11.1 Tone of voice
Write like a brilliant friend who understands food, money, and supermarkets.

- Good: `Save £2.40 by swapping salmon for cod at Aldi.`
- Good: `Week fully planned. Estimated spend: £61 of £75.`
- Avoid: `Amazing!!! You crushed your budget!!!`
- Avoid: `You overspent again.`

### 11.2 Visual rules
- Display/headings: **Plus Jakarta Sans**
- Body text: **Manrope**
- Navy: `#1E2D4E`
- Coral: `#E8693A`
- Teal: `#3DBFB8`
- Cream: `#F7F5F2`

Design expression: clean, modern, minimal, premium but accessible, intelligent rather than playful-chaotic.

### 11.3 Logo and identity
- Do not improvise new brand marks inside the product
- Respect the established fork-meets-coin concept where brand assets are used

## 12. Data Modeling Rules

- Money: integer minor units (pence/cents)
- Timestamps: ISO 8601
- Unit normalization: explicit and centralized
- Nullable fields: intentional and documented
- No anonymous JSON blobs for business-critical logic

## 13. Testing Standards

### 13.1 Unit tests mandatory for
- price normalization, cost calculations, meal cost derivation
- retailer comparison logic, waste-risk logic
- Logismos scoring and recommendation generation
- points earning logic, score calculation

### 13.2 Integration tests required for
- planner → shopping list generation
- pricing source → normalized product mapping
- recommendation request → dashboard payload
- acceptance/dismissal flows → decision logging

### 13.3 Edge cases to cover extensively
- incomplete retailer data, weird pack sizes and unit conversions
- sparse or empty meal plans, low remaining budget
- stale price snapshots, no calendar access, no energy check-in
- conflicting signals between time and cost

### 13.4 Regression protection
Any bug involving money, recommendations, or retailer comparison must get a regression test before closure.

## 14. Analytics

### 14.1 Track events such as
- onboarding completed, budget set, meal planned, shopping list generated
- Logismos recommendation viewed, accepted, dismissed
- alternatives opened, retailer comparison viewed
- price alert viewed or acted on, insights viewed
- Pro paywall viewed, subscription started

### 14.2 Log decision metrics to answer
- which signals drive acceptance
- which meal types convert best
- where users abandon planning
- whether recommendations are perceived as useful

## 15. Security and Privacy

- Only collect what is needed for product value
- Mark estimates and stale prices clearly
- Provide reasons for recommendations; avoid "black box" phrasing
- Calendar sync: prefer start/end availability context over event content

## 16. Performance

- Budget and pricing summaries should feel near-instant on common flows
- Recommendation card rendering should not block on non-essential calls
- Cache retailer data intelligently with freshness rules
- On mobile: minimize layout jank, keep dashboard load lean, progressively disclose deep comparison data

## 17. Documentation Expectations

Update docs when changing: recommendation logic, pricing source strategy, data models, architecture decisions, analytics schemas.

Preferred docs:
- `/docs/architecture.md`
- `/docs/data-model.md`
- `/docs/logismos.md`
- `/docs/retailer-sources.md`
- `/docs/testing-strategy.md`
- `/docs/decisions/ADR-xxxx.md`

## 18. Definition of Done

A task is only done when:
- the code works and tests cover the critical logic
- money-related calculations are verified
- recommendation behavior is explainable
- edge cases are addressed or documented
- analytics events are considered where relevant
- docs are updated where behavior/contracts changed
- the implementation matches Loavish product and brand intent

## 19. Final Instruction

Build Loavish like a product that someone will trust on a tired Tuesday evening when they are low on time, low on energy, and trying not to overspend.

If a feature is clever but does not help that moment, it is probably not the priority.
If a recommendation is technically correct but emotionally tone-deaf, it is not ready.
If a cost number cannot be explained, it should not be shown.
If a shortcut makes future retailer expansion painful, do not take it.

**Clarity, trust, and decision usefulness beat feature volume.**
