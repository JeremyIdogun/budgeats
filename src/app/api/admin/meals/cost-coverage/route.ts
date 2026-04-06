import { NextResponse } from "next/server";
import { getMealCostCoverage } from "@/lib/server/admin-metrics";
import { requireAdminApiUser } from "@/lib/server/auth";

export async function GET() {
  const auth = await requireAdminApiUser();
  if ("response" in auth) return auth.response;

  const summary = getMealCostCoverage();
  return NextResponse.json({
    data: summary,
    explanation: `${summary.coveredMeals} of ${summary.mealCount} meals have >=85% ingredient cost coverage.`,
  });
}
