import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/server/auth";
import { runPriceAlertsCheck } from "@/lib/server/price-alerts";

export async function POST() {
  const auth = await requireAdminApiUser();
  if ("response" in auth) return auth.response;

  const result = await runPriceAlertsCheck();
  return NextResponse.json({
    data: result,
    explanation: `Checked ${result.checked} alerts and triggered ${result.triggered}.`,
  });
}
