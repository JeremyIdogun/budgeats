import { NextResponse } from "next/server";
import { runLogismos, type CookOption, type ContextSignals as EngineSignals } from "@loavish/logismos";
import type { ContextSignals, LogismosRecommendation } from "@/models/logismos";
import { captureServerError } from "@/lib/server/observability";

interface RecommendationRequestBody {
  contextSignals: ContextSignals;
  cookableMeals: Array<{
    id: string;
    name: string;
    prepTimeMinutes: number;
    estimatedCostPence: number;
  }>;
  householdSize: number;
}

function mapEnergyLevel(level: ContextSignals["energyLevel"]): EngineSignals["energyLevel"] {
  if (level === "low") return 1;
  if (level === "medium") return 3;
  if (level === "high") return 5;
  return 3;
}

function mealTypeFromHour(hourOfDay: number): "breakfast" | "lunch" | "dinner" {
  if (hourOfDay < 11) return "breakfast";
  if (hourOfDay < 16) return "lunch";
  return "dinner";
}

function formatPenceInEngine(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

function toLegacyRecommendation(
  result: ReturnType<typeof runLogismos>,
  input: RecommendationRequestBody,
): LogismosRecommendation {
  const mealType = mealTypeFromHour(input.contextSignals.hourOfDay);
  const eatOutEstimatePence = mealType === "breakfast" ? 400 : mealType === "lunch" ? 700 : 1400;
  const cookCostPence = result.primaryMeal?.estimatedCostPence ?? 0;
  const savingPence = Math.max(0, eatOutEstimatePence - cookCostPence);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
  const confidenceBand: LogismosRecommendation["confidenceBand"] =
    result.score >= 0.75 ? "high" : result.score >= 0.45 ? "medium" : "low";

  const candidateFactors = [
    savingPence > 0 ? `Cooking saves ${formatPenceInEngine(savingPence)} vs eating out` : null,
    input.contextSignals.energyLevel === "low" && result.primaryMeal
      ? `Low energy: ${result.primaryMeal.meal.prepTimeMinutes}-minute meal`
      : null,
    input.contextSignals.wasteRiskIngredients.length > 0 ? "Ingredient expiry risk detected" : null,
    `${input.contextSignals.daysRemainingInWeek} days left in budget week`,
    "Recommendation generated from your current context",
  ].filter((value): value is string => typeof value === "string");
  const uniqueFactors = Array.from(new Set(candidateFactors));
  const topFactors: [string, string, string] = [
    uniqueFactors[0] ?? "Recommendation generated",
    uniqueFactors[1] ?? "Based on your context",
    uniqueFactors[2] ?? "Check assumptions below",
  ];

  return {
    type: result.recommendation === "cook" ? "cook" : "eat_out",
    mealId: result.primaryMeal?.meal.id ?? null,
    reason: result.explanation,
    confidenceBand,
    topFactors,
    assumptions: {
      householdSize: input.householdSize,
      energyLevel: input.contextSignals.energyLevel,
      daysRemainingInWeek: input.contextSignals.daysRemainingInWeek,
      budgetRemainingPence: input.contextSignals.budgetRemainingPence,
      eatOutBaseline: `ONS estimate: ${mealType} ${formatPenceInEngine(eatOutEstimatePence)}`,
    },
    cookCostPence,
    eatOutEstimatePence,
    savingPence,
    timeRequiredMinutes: result.primaryMeal?.meal.prepTimeMinutes ?? null,
    contextSignals: input.contextSignals,
    generatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RecommendationRequestBody;
    const cookableMeals: CookOption[] = body.cookableMeals.map((meal) => ({
      meal: {
        id: meal.id,
        name: meal.name,
        prepTimeMinutes: meal.prepTimeMinutes,
      },
      estimatedCostPence: meal.estimatedCostPence,
      wastePenaltyPence: 0,
      explanation: `${meal.name} estimated at ${meal.estimatedCostPence}p.`,
    }));

    const mealType = mealTypeFromHour(body.contextSignals.hourOfDay);
    const eatOutEstimatePence = mealType === "breakfast" ? 400 : mealType === "lunch" ? 700 : 1400;

    const result = runLogismos({
      userProfile: {
        id: "active-user",
        budget: {
          amount: body.contextSignals.budgetRemainingPence,
          period: "weekly",
        },
      },
      contextSignals: {
        timeAvailableMinutes: body.contextSignals.timeWindowMinutes,
        energyLevel: mapEnergyLevel(body.contextSignals.energyLevel),
        calendarEventSoon: body.contextSignals.calendarEventSoon,
        wasteRiskIngredientIds: body.contextSignals.wasteRiskIngredients,
      },
      cookableMeals,
      eatOutEstimate: {
        estimatedCostPence: eatOutEstimatePence,
        mealType,
      },
      spendThisWeekPence: 0,
    });

    const recommendation = toLegacyRecommendation(result, body);

    return NextResponse.json({
      data: recommendation,
      explanation: recommendation.reason,
    });
  } catch (error) {
    await captureServerError(error, { event: "api.logismos.recommendation.failed" });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate recommendation",
      },
      { status: 400 },
    );
  }
}
