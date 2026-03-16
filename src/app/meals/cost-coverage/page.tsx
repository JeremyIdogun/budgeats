"use client";

import { useEffect, useState } from "react";
import { AppNav } from "@/components/navigation/AppNav";

interface MealCoverage {
  mealCount: number;
  coveredMeals: number;
  coveragePct: number;
}

export default function MealCostCoveragePage() {
  const [summary, setSummary] = useState<MealCoverage | null>(null);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/admin/meals/cost-coverage", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as { data?: MealCoverage };
      setSummary(payload.data ?? null);
    })();
  }, []);

  return (
    <main className="min-h-screen bg-cream px-4 py-5 md:px-8 md:py-7">
      <div className="mx-auto max-w-4xl">
        <AppNav />
        <h1 className="mb-4 text-2xl font-semibold text-navy md:text-3xl">Meal Cost Coverage</h1>
        <section className="rounded-lg border border-cream-dark bg-white p-4 text-sm text-navy">
          {summary ? (
            <div className="space-y-2">
              <p>Meals total: <span className="font-semibold">{summary.mealCount}</span></p>
              <p>Meals at 85%+ coverage: <span className="font-semibold">{summary.coveredMeals}</span></p>
              <p>Coverage: <span className="font-semibold">{summary.coveragePct}%</span></p>
            </div>
          ) : (
            <p className="text-navy-muted">Loading meal coverage...</p>
          )}
        </section>
      </div>
    </main>
  );
}
