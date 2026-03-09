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
  const progressWidth = Math.min(utilisationPct, 100);

  return (
    <div className="min-w-56 rounded-xl border border-cream-dark bg-white px-4 py-3">
      <p className="text-sm font-semibold text-navy">
        {formatPence(spentPence)} of {formatPence(budgetPence)}
      </p>
      <div className="mt-2 h-1.5 rounded-full bg-cream-dark">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${progressWidth}%`,
            background: color,
          }}
        />
      </div>
      <p className="mt-1 text-xs text-navy-muted">{Math.round(utilisationPct)}% used</p>
    </div>
  );
}
