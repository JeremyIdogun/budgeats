"use client";

import { useMemo } from "react";
import { useBudgeAtsStore } from "@/store";
import { selectWeekSpendPence } from "@/store/selectors";
import { formatPence } from "@/utils/currency";

function getBudgetColor(utilisationPct: number): string {
  if (utilisationPct > 100) return "#D94F4F";
  if (utilisationPct >= 90) return "#E8693A";
  if (utilisationPct >= 70) return "#F5A623";
  return "#3DBFB8";
}

export function NavBudgetPill() {
  const spentPence = useBudgeAtsStore(selectWeekSpendPence);
  const budgetPence = useBudgeAtsStore((state) => state.user?.budget.amount ?? 0);

  const utilisationPct = useMemo(() => {
    if (budgetPence <= 0) return 0;
    return Math.max(0, (spentPence / budgetPence) * 100);
  }, [spentPence, budgetPence]);

  const color = getBudgetColor(utilisationPct);
  const remainingPence = budgetPence - spentPence;

  return (
    <div className="flex items-center gap-2 rounded-full border border-cream-dark bg-white px-3 py-1.5 text-xs">
      <span
        className="h-2 w-2 rounded-full"
        style={{
          backgroundColor: color,
        }}
      />
      <span className="font-semibold text-navy">
        {Math.round(utilisationPct)}% ·{" "}
        {remainingPence >= 0
          ? `${formatPence(remainingPence)} left`
          : `${formatPence(Math.abs(remainingPence))} over`}
      </span>
    </div>
  );
}
