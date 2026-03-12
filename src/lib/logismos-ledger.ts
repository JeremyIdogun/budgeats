import { POINTS } from "@/lib/points";

export type RecommendationTypeApi = "cook" | "eat_out";

export interface DecisionLogRow {
  id: string;
  created_at: string;
  recommendation_type: RecommendationTypeApi;
  recommendation_json: unknown;
  explanation: string;
  accepted: boolean | null;
  points_awarded: number | null;
}

export interface PointsLedgerRow {
  id: string;
  decision_id: string;
  event_type: keyof typeof POINTS;
  points_awarded: number;
  created_at: string;
}

declare global {
  var __logismosDecisionLog: DecisionLogRow[] | undefined;
  var __logismosPointsLedger: PointsLedgerRow[] | undefined;
}

function decisionLogStore(): DecisionLogRow[] {
  if (!globalThis.__logismosDecisionLog) {
    globalThis.__logismosDecisionLog = [];
  }
  return globalThis.__logismosDecisionLog;
}

function pointsLedgerStore(): PointsLedgerRow[] {
  if (!globalThis.__logismosPointsLedger) {
    globalThis.__logismosPointsLedger = [];
  }
  return globalThis.__logismosPointsLedger;
}

export function writeDecisionLog(input: {
  recommendationType: RecommendationTypeApi;
  recommendationJson: unknown;
  explanation: string;
  accepted: boolean | null;
  pointsAwarded: number | null;
}): DecisionLogRow {
  const row: DecisionLogRow = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    recommendation_type: input.recommendationType,
    recommendation_json: input.recommendationJson,
    explanation: input.explanation,
    accepted: input.accepted,
    points_awarded: input.pointsAwarded,
  };
  decisionLogStore().unshift(row);
  return row;
}

export function writePointsLedger(decisionId: string, events: Array<{
  eventType: keyof typeof POINTS;
  points: number;
}>): PointsLedgerRow[] {
  const rows = events.map((event) => ({
    id: crypto.randomUUID(),
    decision_id: decisionId,
    event_type: event.eventType,
    points_awarded: event.points,
    created_at: new Date().toISOString(),
  }));
  pointsLedgerStore().unshift(...rows);
  return rows;
}

export function listDecisionLog(): DecisionLogRow[] {
  return [...decisionLogStore()];
}

export function listPointsLedger(): PointsLedgerRow[] {
  return [...pointsLedgerStore()];
}
