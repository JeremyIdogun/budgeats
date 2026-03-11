"use client";

import { useState } from "react";
import { useBudgeAtsStore } from "@/store";
import { formatPence, poundsToPence } from "@/utils/currency";

interface WeeklyBudgetNudgeProps {
  weekStartDate: string;
  defaultBudgetPence: number; // profile default, passed from server
}

export function WeeklyBudgetNudge({ weekStartDate, defaultBudgetPence }: WeeklyBudgetNudgeProps) {
  const setWeekBudgetOverride = useBudgeAtsStore((s) => s.setWeekBudgetOverride);
  const dismissBudgetNudge = useBudgeAtsStore((s) => s.dismissBudgetNudge);
  const budgetNudgeDismissedForWeek = useBudgeAtsStore((s) => s.budgetNudgeDismissedForWeek);
  const currentWeekOverridePence = useBudgeAtsStore((s) =>
    s.currentWeekPlan?.weekStartDate === weekStartDate ? s.currentWeekPlan.budgetOverridePence : undefined,
  );
  const hasOverride = currentWeekOverridePence !== undefined;

  const [inputPounds, setInputPounds] = useState(
    String(((currentWeekOverridePence ?? defaultBudgetPence) / 100).toFixed(0)),
  );
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Don't show if already dismissed for this week or override already set
  if (budgetNudgeDismissedForWeek === weekStartDate || hasOverride) return null;

  function handleSetBudget() {
    const pounds = parseFloat(inputPounds);
    if (isNaN(pounds) || pounds < 1) {
      setError("Enter a valid amount (min £1)");
      return;
    }
    setError(null);
    setWeekBudgetOverride(poundsToPence(pounds));
    // Dismiss the nudge now that an override is set
    dismissBudgetNudge(weekStartDate);
  }

  function handleDismiss() {
    dismissBudgetNudge(weekStartDate);
  }

  return (
    <section className="rounded-2xl border border-cream-dark bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-navy">
            New week — want to adjust your budget?
          </p>
          <p className="mt-1 text-sm text-navy-muted">
            Your default is{" "}
            <span className="font-semibold text-navy">{formatPence(defaultBudgetPence)}/wk</span>.
            Set a one-time amount for this week, or keep it the same.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="shrink-0 text-navy-muted hover:text-navy transition-colors text-lg leading-none"
        >
          ✕
        </button>
      </div>

      {editing ? (
        <div className="mt-4 flex items-start gap-2">
          <div className="flex-1">
            <div className="flex items-center rounded-xl border border-cream-dark bg-cream px-3 py-2 focus-within:border-navy/40">
              <span className="mr-1 text-sm font-semibold text-navy-muted">£</span>
              <input
                type="number"
                min={1}
                step={1}
                value={inputPounds}
                onChange={(e) => {
                  setInputPounds(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSetBudget()}
                className="w-full bg-transparent text-sm font-semibold text-navy outline-none"
                autoFocus
              />
            </div>
            {error && <p className="mt-1 text-xs text-[#D94F4F]">{error}</p>}
          </div>
          <button
            onClick={handleSetBudget}
            className="rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#172744]"
          >
            Set
          </button>
          <button
            onClick={() => setEditing(false)}
            className="rounded-xl border border-cream-dark px-4 py-2.5 text-sm font-semibold text-navy-muted transition hover:border-navy/25"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setEditing(true)}
            className="rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#172744]"
          >
            Adjust this week
          </button>
          <button
            onClick={handleDismiss}
            className="rounded-xl border border-cream-dark px-4 py-2.5 text-sm font-semibold text-navy-muted transition hover:border-navy/25"
          >
            Keep {formatPence(defaultBudgetPence)}
          </button>
        </div>
      )}
    </section>
  );
}
