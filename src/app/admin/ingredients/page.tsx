const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

interface IngredientStats {
  total: number;
  withPrices: number;
  coveragePercent: number;
}

export default async function IngredientsPage() {
  const res = await fetch(`${BASE_URL}/api/admin/ingredients`, { cache: "no-store" });
  const data = await res.json();
  const stats: IngredientStats = data.stats ?? { total: 0, withPrices: 0, coveragePercent: 0 };

  const coverageClamped = Math.min(100, Math.max(0, stats.coveragePercent));

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-navy mb-6">Ingredients</h1>

      <div className="bg-white rounded-lg shadow-card px-6 py-6 max-w-sm">
        <h2 className="font-heading text-base font-semibold text-navy mb-4">Price Coverage</h2>

        <dl className="grid grid-cols-2 gap-y-3 text-sm font-body mb-5">
          <dt className="text-navy-muted">Total Ingredients</dt>
          <dd className="text-right font-semibold text-navy">{stats.total.toLocaleString()}</dd>

          <dt className="text-navy-muted">With Prices</dt>
          <dd className="text-right font-semibold text-navy">{stats.withPrices.toLocaleString()}</dd>

          <dt className="text-navy-muted">Coverage</dt>
          <dd className="text-right font-semibold text-navy">{coverageClamped.toFixed(1)}%</dd>
        </dl>

        <div className="w-full h-3 rounded-full bg-cream-dark overflow-hidden">
          <div
            className="h-full rounded-full bg-teal transition-all"
            style={{ width: `${coverageClamped}%` }}
          />
        </div>
      </div>
    </div>
  );
}
