const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

interface MealCoverage {
  id: string;
  name: string;
  ingredientCount: number;
  pricedCount: number;
  coveragePercent: number;
}

function CoverageBadge({ pct }: { pct: number }) {
  const style =
    pct >= 85
      ? "bg-teal/15 text-teal"
      : pct >= 50
      ? "bg-coral/15 text-coral"
      : "bg-danger/15 text-danger";
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${style}`}>
      {pct.toFixed(0)}%
    </span>
  );
}

export default async function MealsCoveragePage() {
  const res = await fetch(`${BASE_URL}/api/admin/meals/cost-coverage`, { cache: "no-store" });
  const data = await res.json();
  const meals: MealCoverage[] = data.meals ?? [];

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-navy mb-6">Meals Coverage</h1>

      {meals.length === 0 ? (
        <p className="font-body text-sm text-navy-muted">No meals found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-card">
          <table className="w-full border-collapse bg-white">
            <thead>
              <tr className="bg-cream-dark text-navy text-sm font-semibold">
                <th className="py-3 px-4 text-left">Meal Name</th>
                <th className="py-3 px-4 text-right">Ingredients</th>
                <th className="py-3 px-4 text-right">Priced</th>
                <th className="py-3 px-4 text-center">Coverage</th>
              </tr>
            </thead>
            <tbody>
              {meals.map((meal) => (
                <tr key={meal.id} className="hover:bg-cream/60 transition-colors">
                  <td className="py-3 px-4 border-b border-cream-dark text-sm font-body font-medium text-navy">
                    {meal.name}
                  </td>
                  <td className="py-3 px-4 border-b border-cream-dark text-sm font-body text-navy text-right">
                    {meal.ingredientCount}
                  </td>
                  <td className="py-3 px-4 border-b border-cream-dark text-sm font-body text-navy text-right">
                    {meal.pricedCount}
                  </td>
                  <td className="py-3 px-4 border-b border-cream-dark text-sm font-body text-center">
                    <CoverageBadge pct={meal.coveragePercent} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
