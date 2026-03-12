import { POINTS } from "@/lib/points";
import { getOptionalPrisma } from "@/lib/server/optional-prisma";

export type RecommendationTypeApi = "cook" | "eat_out";

export interface DecisionLogRow {
  id: string;
  user_id: string;
  meal_id: string | null;
  created_at: string;
  recommendation_type: RecommendationTypeApi;
  recommendation_json: unknown;
  explanation: string;
  accepted: boolean | null;
  points_awarded: number | null;
}

export interface PointsLedgerRow {
  id: string;
  user_id: string;
  decision_id: string;
  event_type: keyof typeof POINTS;
  points_awarded: number;
  explanation: string | null;
  created_at: string;
}

type MinimalPrisma = {
  decisionLog: {
    create: (input: {
      data: {
        user_id: string;
        meal_id: string | null;
        recommendation_type: RecommendationTypeApi;
        recommendation_json: object;
        explanation: string;
        accepted: boolean | null;
        points_awarded: number | null;
      };
    }) => Promise<{
      id: string;
      user_id: string;
      meal_id: string | null;
      created_at: Date;
      recommendation_type: string;
      recommendation_json: unknown;
      explanation: string;
      accepted: boolean | null;
      points_awarded: number | null;
    }>;
    findMany: (input: {
      where: { user_id?: string; accepted?: boolean };
      orderBy: { created_at: "desc" };
      take: number;
    }) => Promise<Array<{
      id: string;
      user_id: string;
      meal_id: string | null;
      created_at: Date;
      recommendation_type: string;
      recommendation_json: unknown;
      explanation: string;
      accepted: boolean | null;
      points_awarded: number | null;
    }>>;
  };
  pointsLedger: {
    create: (input: {
      data: {
        user_id: string;
        decision_log_id: string;
        event_type: keyof typeof POINTS;
        points_awarded: number;
        explanation: string | null;
      };
    }) => Promise<{
      id: string;
      user_id: string;
      decision_log_id: string;
      event_type: keyof typeof POINTS;
      points_awarded: number;
      explanation: string | null;
      created_at: Date;
    }>;
    findMany: (input: {
      where: { user_id?: string };
      orderBy: { created_at: "desc" };
      take: number;
    }) => Promise<Array<{
      id: string;
      user_id: string;
      decision_log_id: string;
      event_type: keyof typeof POINTS;
      points_awarded: number;
      explanation: string | null;
      created_at: Date;
    }>>;
  };
};

declare global {
  var __logismosDecisionLog: DecisionLogRow[] | undefined;
  var __logismosPointsLedger: PointsLedgerRow[] | undefined;
  var __retailerContextStore:
    | Array<{
        user_id: string;
        retailer_id: string;
        postcode: string | null;
        context_json: unknown;
        updated_at: string;
      }>
    | undefined;
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

function retailerContextStore(): Array<{
  user_id: string;
  retailer_id: string;
  postcode: string | null;
  context_json: unknown;
  updated_at: string;
}> {
  if (!globalThis.__retailerContextStore) {
    globalThis.__retailerContextStore = [];
  }
  return globalThis.__retailerContextStore;
}

function toRecommendationType(value: string): RecommendationTypeApi {
  return value === "cook" ? "cook" : "eat_out";
}

export async function writeDecisionLog(input: {
  userId: string;
  mealId?: string | null;
  recommendationType: RecommendationTypeApi;
  recommendationJson: unknown;
  explanation: string;
  accepted: boolean | null;
  pointsAwarded: number | null;
}): Promise<DecisionLogRow> {
  const prisma = (await getOptionalPrisma()) as MinimalPrisma | null;

  if (prisma) {
    try {
      const row = await prisma.decisionLog.create({
        data: {
          user_id: input.userId,
          meal_id: input.mealId ?? null,
          recommendation_type: input.recommendationType,
          recommendation_json: input.recommendationJson as object,
          explanation: input.explanation,
          accepted: input.accepted,
          points_awarded: input.pointsAwarded,
        },
      });

      return {
        id: row.id,
        user_id: row.user_id,
        meal_id: row.meal_id ?? null,
        created_at: row.created_at.toISOString(),
        recommendation_type: toRecommendationType(row.recommendation_type),
        recommendation_json: row.recommendation_json,
        explanation: row.explanation,
        accepted: row.accepted,
        points_awarded: row.points_awarded,
      };
    } catch {
      // fall through to in-memory fallback
    }
  }

  const row: DecisionLogRow = {
    id: crypto.randomUUID(),
    user_id: input.userId,
    meal_id: input.mealId ?? null,
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

export async function writePointsLedger(
  userId: string,
  decisionId: string,
  events: Array<{
    eventType: keyof typeof POINTS;
    points: number;
    explanation?: string;
  }>,
): Promise<PointsLedgerRow[]> {
  const prisma = (await getOptionalPrisma()) as MinimalPrisma | null;
  const now = new Date().toISOString();

  if (prisma) {
    try {
      const created = await Promise.all(
        events.map((event) =>
          prisma.pointsLedger.create({
            data: {
              user_id: userId,
              decision_log_id: decisionId,
              event_type: event.eventType,
              points_awarded: event.points,
              explanation: event.explanation ?? null,
            },
          }),
        ),
      );

      return created.map((row) => ({
        id: row.id,
        user_id: row.user_id,
        decision_id: row.decision_log_id,
        event_type: row.event_type,
        points_awarded: row.points_awarded,
        explanation: row.explanation,
        created_at: row.created_at.toISOString(),
      }));
    } catch {
      // fall through to in-memory fallback
    }
  }

  const rows = events.map((event) => ({
    id: crypto.randomUUID(),
    user_id: userId,
    decision_id: decisionId,
    event_type: event.eventType,
    points_awarded: event.points,
    explanation: event.explanation ?? null,
    created_at: now,
  }));
  pointsLedgerStore().unshift(...rows);
  return rows;
}

export async function listDecisionLog(input?: {
  userId?: string;
  accepted?: boolean;
  limit?: number;
}): Promise<DecisionLogRow[]> {
  const prisma = (await getOptionalPrisma()) as MinimalPrisma | null;

  if (prisma) {
    try {
      const rows = await prisma.decisionLog.findMany({
        where: {
          user_id: input?.userId ?? undefined,
          accepted: input?.accepted ?? undefined,
        },
        orderBy: { created_at: "desc" },
        take: input?.limit ?? 200,
      });

      return rows.map((row) => ({
        id: row.id,
        user_id: row.user_id,
        meal_id: row.meal_id ?? null,
        created_at: row.created_at.toISOString(),
        recommendation_type: toRecommendationType(row.recommendation_type),
        recommendation_json: row.recommendation_json,
        explanation: row.explanation,
        accepted: row.accepted,
        points_awarded: row.points_awarded,
      }));
    } catch {
      // fall through to in-memory fallback
    }
  }

  let rows = [...decisionLogStore()];
  if (input?.userId) rows = rows.filter((row) => row.user_id === input.userId);
  if (typeof input?.accepted === "boolean") rows = rows.filter((row) => row.accepted === input.accepted);
  return rows.slice(0, input?.limit ?? 200);
}

export async function listPointsLedger(input?: {
  userId?: string;
  limit?: number;
}): Promise<PointsLedgerRow[]> {
  const prisma = (await getOptionalPrisma()) as MinimalPrisma | null;

  if (prisma) {
    try {
      const rows = await prisma.pointsLedger.findMany({
        where: {
          user_id: input?.userId ?? undefined,
        },
        orderBy: { created_at: "desc" },
        take: input?.limit ?? 500,
      });
      return rows.map((row) => ({
        id: row.id,
        user_id: row.user_id,
        decision_id: row.decision_log_id,
        event_type: row.event_type,
        points_awarded: row.points_awarded,
        explanation: row.explanation,
        created_at: row.created_at.toISOString(),
      }));
    } catch {
      // fall through to in-memory fallback
    }
  }

  let rows = [...pointsLedgerStore()];
  if (input?.userId) rows = rows.filter((row) => row.user_id === input.userId);
  return rows.slice(0, input?.limit ?? 500);
}

export async function upsertRetailerContext(input: {
  userId: string;
  retailerId: string;
  postcode: string | null;
  contextJson: unknown;
}): Promise<{
  user_id: string;
  retailer_id: string;
  postcode: string | null;
  context_json: unknown;
  updated_at: string;
}> {
  const now = new Date().toISOString();
  const store = retailerContextStore();
  const existing = store.find(
    (row) => row.user_id === input.userId && row.retailer_id === input.retailerId,
  );

  if (existing) {
    existing.postcode = input.postcode;
    existing.context_json = input.contextJson;
    existing.updated_at = now;
    return existing;
  }

  const row = {
    user_id: input.userId,
    retailer_id: input.retailerId,
    postcode: input.postcode,
    context_json: input.contextJson,
    updated_at: now,
  };
  store.unshift(row);
  return row;
}

export async function listRetailerContexts(input?: {
  userId?: string;
}): Promise<Array<{
  user_id: string;
  retailer_id: string;
  postcode: string | null;
  context_json: unknown;
  updated_at: string;
}>> {
  const store = retailerContextStore();
  if (!input?.userId) return [...store];
  return store.filter((row) => row.user_id === input.userId);
}
