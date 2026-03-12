import { NextResponse } from "next/server";
import { writeDecisionLog, type RecommendationTypeApi } from "@/lib/logismos-ledger";
import { createClient } from "@/lib/supabase/server";
import { captureServerError } from "@/lib/server/observability";

interface DismissBody {
  recommendationType: RecommendationTypeApi;
  recommendationJson: unknown;
  explanation: string;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = (await req.json()) as DismissBody;
    const decision = await writeDecisionLog({
      userId: user?.id ?? "anonymous",
      mealId:
        typeof (body.recommendationJson as { mealId?: unknown } | null)?.mealId === "string"
          ? ((body.recommendationJson as { mealId: string }).mealId || null)
          : null,
      recommendationType: body.recommendationType,
      recommendationJson: body.recommendationJson,
      explanation: body.explanation,
      accepted: false,
      pointsAwarded: 0,
    });

    return NextResponse.json({
      data: {
        decisionId: decision.id,
        pointsAwarded: 0,
      },
      explanation: "Recorded dismissed recommendation.",
    });
  } catch (error) {
    await captureServerError(error, { event: "api.logismos.dismiss.failed" });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to dismiss recommendation" },
      { status: 400 },
    );
  }
}
