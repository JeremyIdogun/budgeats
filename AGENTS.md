# Agent Collaboration Guide

This project uses two AI agents with a defined division of labor to move fast and avoid conflicts.

---

## Division of Labor

| Role | Agent | Responsibilities |
|---|---|---|
| Discovery & Design | **Claude** | Clarify product behavior, edge cases, UX copy, data-model proposals, task specs |
| Implementation & Verification | **Codex** | Code edits, SQL changes, refactors, running checks and tests, change summaries |

---

## File Ownership

| Path | Primary Owner | Notes |
|---|---|---|
| `src/components/onboarding/*` | Codex | |
| `src/stores/*` | Codex | |
| `supabase/snippets/*` | Claude proposes, Codex implements | |
| Data model docs / specs | Claude | |
| All other files | Shared | Explicit handoff required before parallel edits |

> **Read access:** Claude may read any file for spec purposes but does not edit Codex-primary files without an explicit handoff.

---

## Handoff Format

Use this format for every task handed off between agents:

```
## Task: <short title>

**Context**
What is happening and why this task exists.

**Current behavior**
What the code does today (for changes/fixes — omit for net-new).

**Decision**
What we are changing and why.

**Files to edit**
- path/to/file.ts — what changes
- path/to/other.ts — what changes

**Definition of done**
- [ ] Acceptance criterion 1
- [ ] Acceptance criterion 2
- [ ] No TypeScript errors
- [ ] No lint errors
```

---

## Branch Discipline

- One task = one branch = one PR
- No parallel edits to the same file without an explicit handoff
- Branch naming: `<agent>/<short-description>` e.g. `codex/fix-onboarding-budget-step`

---

## Conflict Resolution

1. Acceptance criteria in the task spec is the tie-breaker
2. If acceptance criteria don't resolve it, escalate to the user immediately
3. Neither agent merges a PR that contradicts an open spec without user sign-off
