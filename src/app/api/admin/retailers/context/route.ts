import { NextResponse } from "next/server";
import { getRetailerContextSummary } from "@/lib/server/admin-metrics";

export async function GET() {
  const summary = await getRetailerContextSummary();
  return NextResponse.json({
    data: summary,
    explanation: `Loaded ${summary.total} retailer context rows.`,
  });
}
