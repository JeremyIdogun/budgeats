import { NextResponse } from "next/server";
import { writeDecisionLog, type RecommendationTypeApi } from "@/lib/logismos-ledger";

interface DismissBody {
  recommendationType: RecommendationTypeApi;
  recommendationJson: unknown;
  explanation: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as DismissBody;
    const decision = writeDecisionLog({
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to dismiss recommendation" },
      { status: 400 },
    );
  }
}
