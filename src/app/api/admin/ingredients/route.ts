import { NextResponse } from "next/server";
import { getIngredientCoverageStats } from "@/lib/server/admin-metrics";
import { requireAdminApiUser } from "@/lib/server/auth";

export async function GET() {
  const auth = await requireAdminApiUser();
  if ("response" in auth) return auth.response;

  const stats = getIngredientCoverageStats();
  return NextResponse.json({
    data: stats,
    explanation: `Ingredient coverage is ${stats.coveragePct}%.`,
  });
}
