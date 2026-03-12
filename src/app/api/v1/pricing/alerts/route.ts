import { NextResponse } from "next/server";
import { createPriceAlert, listPriceAlerts } from "@/lib/server/price-alerts";
import { createClient } from "@/lib/supabase/server";
import { toRetailerId } from "@/lib/pricing-engine-adapter";
import { captureServerError } from "@/lib/server/observability";

interface PriceAlertBody {
  ingredientId?: unknown;
  retailerId?: unknown;
  thresholdPricePence?: unknown;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const rows = await listPriceAlerts({ userId: user?.id ?? "anonymous" });
    return NextResponse.json({
      data: rows,
      explanation: `Loaded ${rows.length} active price alerts.`,
    });
  } catch (error) {
    await captureServerError(error, { event: "api.pricing.alerts.get.failed" });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load price alerts" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = (await request.json()) as PriceAlertBody;
    const ingredientId = typeof body.ingredientId === "string" ? body.ingredientId.trim() : "";
    const threshold = Number(body.thresholdPricePence);
    const retailerId =
      typeof body.retailerId === "string" ? toRetailerId(body.retailerId) : null;

    if (!ingredientId || !Number.isFinite(threshold) || threshold <= 0) {
      return NextResponse.json(
        { error: "ingredientId and positive thresholdPricePence are required" },
        { status: 400 },
      );
    }

    const row = await createPriceAlert({
      userId: user?.id ?? "anonymous",
      ingredientId,
      retailerId,
      thresholdPricePence: Math.round(threshold),
    });

    return NextResponse.json({
      data: row,
      explanation: `Alert created for ${ingredientId} at ${Math.round(threshold)}p.`,
    });
  } catch (error) {
    await captureServerError(error, { event: "api.pricing.alerts.post.failed" });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create price alert" },
      { status: 500 },
    );
  }
}
