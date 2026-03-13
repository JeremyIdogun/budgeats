"use client";

import { useEffect, useState } from "react";
import { AppNav } from "@/components/navigation/AppNav";

interface IngredientStats {
  canonicalIngredientCount: number;
  usedInMealsCount: number;
  unusedCount: number;
  coveragePct: number;
}

export default function IngredientsPage() {
  const [stats, setStats] = useState<IngredientStats | null>(null);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/admin/ingredients", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as { data?: IngredientStats };
      setStats(payload.data ?? null);
    })();
  }, []);

  return (
    <main className="min-h-screen bg-cream px-4 py-5 md:px-8 md:py-7">
      <div className="mx-auto max-w-4xl">
        <AppNav />
        <h1 className="mb-4 text-2xl font-semibold text-navy md:text-3xl">Ingredients Coverage</h1>
        <section className="rounded-lg border border-cream-dark bg-white p-4 text-sm text-navy">
          {stats ? (
            <div className="space-y-2">
              <p>Total canonical ingredients: <span className="font-semibold">{stats.canonicalIngredientCount}</span></p>
              <p>Used in meals: <span className="font-semibold">{stats.usedInMealsCount}</span></p>
              <p>Unused: <span className="font-semibold">{stats.unusedCount}</span></p>
              <p>Coverage: <span className="font-semibold">{stats.coveragePct}%</span></p>
            </div>
          ) : (
            <p className="text-navy-muted">Loading ingredient coverage...</p>
          )}
        </section>
      </div>
    </main>
  );
}
