export type RecommendationType = "cook" | "eat_out";
export type EnergyLevel = "low" | "medium" | "high";

export interface ContextSignals {
  calendarEventSoon: boolean; // event within 2 hours
  timeWindowMinutes: number; // mins until next calendar event
  energyLevel: EnergyLevel | null; // from daily check-in
  wasteRiskIngredients: string[]; // ingredient IDs expiring ≤48h
  budgetRemainingPence: number; // from selectBudgetRemainingPence()
  daysRemainingInWeek: number; // drives urgency weighting
  dayOfWeek: number; // 0=Mon … 6=Sun
  hourOfDay: number; // 0–23
}

export interface LogismosRecommendation {
  type: RecommendationType;
  mealId: string | null; // null when eat_out
  reason: string; // one-sentence human explanation
  confidenceBand: "low" | "medium" | "high";
  topFactors: [string, string, string];
  assumptions: {
    householdSize: number;
    energyLevel: EnergyLevel | null;
    daysRemainingInWeek: number;
    budgetRemainingPence: number;
    eatOutBaseline: string;
  };
  cookCostPence: number;
  eatOutEstimatePence: number;
  savingPence: number;
  timeRequiredMinutes: number | null;
  contextSignals: ContextSignals;
  generatedAt: string; // ISO 8601
  expiresAt: string; // ISO 8601; stale after this
}

export interface DecisionLogEntry {
  decision_id: string; // UUID
  timestamp: string; // ISO 8601
  recommendation_type: RecommendationType;
  recommendation_accepted: boolean;
  meal_id: string | null;
  estimated_cost_pence: number;
  actual_cost_pence: number | null; // Phase II
  context_signals: ContextSignals;
  points_awarded: number;
}

export interface LoavishPointsBalance {
  total: number;
  logismosScore: number | null; // 0–100; null until 7 days data
  streakDays: number;
  personalBestStreak: number;
}
