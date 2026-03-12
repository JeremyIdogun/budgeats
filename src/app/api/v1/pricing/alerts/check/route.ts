import { NextResponse } from "next/server";
import { runPriceAlertsCheck } from "@/lib/server/price-alerts";

export async function POST() {
  const result = await runPriceAlertsCheck();
  return NextResponse.json({
    data: result,
    explanation: `Checked ${result.checked} alerts and triggered ${result.triggered}.`,
  });
}
