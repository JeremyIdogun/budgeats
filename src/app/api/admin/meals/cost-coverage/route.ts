import { NextResponse } from "next/server";
import { getMealCostCoverage } from "@/lib/server/admin-metrics";

export async function GET() {
  const summary = getMealCostCoverage();
  return NextResponse.json({
    data: summary,
    explanation: `${summary.coveredMeals} of ${summary.mealCount} meals have >=85% ingredient cost coverage.`,
  });
}
