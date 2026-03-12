import { NextResponse } from "next/server";
import { generateRecommendation, type CookableMeal } from "@/lib/logismos";
import type { ContextSignals } from "@/models/logismos";

interface RecommendationRequestBody {
  contextSignals: ContextSignals;
  cookableMeals: CookableMeal[];
  householdSize: number;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RecommendationRequestBody;
    const recommendation = generateRecommendation(
      body.contextSignals,
      body.cookableMeals,
      body.householdSize,
    );

    return NextResponse.json({
      data: recommendation,
      explanation: recommendation.reason,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate recommendation",
      },
      { status: 400 },
    );
  }
}
