import { NextResponse } from "next/server";
import { getIngredientCoverageStats } from "@/lib/server/admin-metrics";

export async function GET() {
  const stats = getIngredientCoverageStats();
  return NextResponse.json({
    data: stats,
    explanation: `Ingredient coverage is ${stats.coveragePct}%.`,
  });
}
