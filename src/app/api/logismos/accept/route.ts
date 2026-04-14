import { NextResponse } from "next/server";
import { POINTS } from "@/lib/points";
import { writeDecisionLog, writePointsLedger, type RecommendationTypeApi } from "@/lib/logismos-ledger";
import { requireAuthenticatedApiUser } from "@/lib/server/auth";
import { captureServerError } from "@/lib/server/observability";

interface AcceptBody {
  recommendationType: RecommendationTypeApi;
  recommendationJson: unknown;
  explanation: string;
  completedPlannedMeal?: boolean;
  addedMealToPlan?: boolean;
  usedIngredientBeforeExpiry?: boolean;
  sevenDayStreakBonus?: boolean;
}

function buildPointEvents(body: AcceptBody): Array<{ eventType: keyof typeof POINTS; points: number }> {
  const events: Array<{ eventType: keyof typeof POINTS; points: number }> = [];
  events.push(
    body.recommendationType === "cook"
      ? { eventType: "ACCEPT_COOK_RECOMMENDATION", points: POINTS.ACCEPT_COOK_RECOMMENDATION }
      : { eventType: "ACCEPT_EAT_OUT_RECOMMENDATION", points: POINTS.ACCEPT_EAT_OUT_RECOMMENDATION },
  );

  if (body.completedPlannedMeal) {
    events.push({ eventType: "COMPLETE_PLANNED_MEAL", points: POINTS.COMPLETE_PLANNED_MEAL });
  }
  if (body.addedMealToPlan) {
    events.push({ eventType: "ADD_MEAL_TO_PLAN", points: POINTS.ADD_MEAL_TO_PLAN });
  }
  if (body.usedIngredientBeforeExpiry) {
    events.push({
      eventType: "USE_INGREDIENT_BEFORE_EXPIRY",
      points: POINTS.USE_INGREDIENT_BEFORE_EXPIRY,
    });
  }
  if (body.sevenDayStreakBonus) {
    events.push({
      eventType: "SEVEN_DAY_STREAK_BONUS",
      points: POINTS.SEVEN_DAY_STREAK_BONUS,
    });
  }
  return events;
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuthenticatedApiUser();
    if ("response" in auth) return auth.response;

    const body = (await req.json()) as AcceptBody;
    const events = buildPointEvents(body);
    const pointsAwarded = events.reduce((sum, item) => sum + item.points, 0);

    const decision = await writeDecisionLog({
      userId: auth.user.id,
      mealId:
        typeof (body.recommendationJson as { mealId?: unknown } | null)?.mealId === "string"
          ? ((body.recommendationJson as { mealId: string }).mealId || null)
          : null,
      recommendationType: body.recommendationType,
      recommendationJson: body.recommendationJson,
      explanation: body.explanation,
      accepted: true,
      pointsAwarded,
    });
    const pointsRows = await writePointsLedger(auth.user.id, decision.id, events);

    return NextResponse.json({
      data: {
        decisionId: decision.id,
        pointsAwarded,
        pointsEvents: pointsRows,
      },
      explanation: `Recorded accepted recommendation and awarded ${pointsAwarded} points.`,
    });
  } catch (error) {
    await captureServerError(error, { event: "api.logismos.accept.failed" });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to accept recommendation" },
      { status: 400 },
    );
  }
}
