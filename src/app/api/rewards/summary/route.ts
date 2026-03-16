import { NextResponse } from "next/server";
import { computeAcceptedThisMonth, computeLogismosScore } from "@/lib/points";
import { toDecisionLogEntry } from "@/lib/decision-mappers";
import { listDecisionLog, listPointsLedger } from "@/lib/logismos-ledger";
import { createClient } from "@/lib/supabase/server";
import { captureServerError } from "@/lib/server/observability";

function buildMonthlyBuckets() {
  const now = new Date();
  const buckets: Array<{ weekLabel: string; points: number; accepted: number }> = [];
  for (let index = 3; index >= 0; index -= 1) {
    const start = new Date(now);
    start.setDate(now.getDate() - index * 7);
    const weekLabel = `${start.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`;
    buckets.push({ weekLabel, points: 0, accepted: 0 });
  }
  return buckets;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const [decisionRows, ledgerRows] = await Promise.all([
      listDecisionLog({ userId: user?.id ?? undefined, limit: 500 }),
      listPointsLedger({ userId: user?.id ?? undefined, limit: 2000 }),
    ]);

    const decisions = decisionRows.map(toDecisionLogEntry);
    const totalPoints = ledgerRows.reduce((sum, row) => sum + row.points_awarded, 0);
    const pointsByCategory = ledgerRows.reduce<Record<string, number>>((acc, row) => {
      acc[row.event_type] = (acc[row.event_type] ?? 0) + row.points_awarded;
      return acc;
    }, {});

    const score = computeLogismosScore(decisions);
    const acceptedThisMonth = computeAcceptedThisMonth(decisions);

    const monthly = buildMonthlyBuckets();
    const fourWeeksAgo = Date.now() - 28 * 24 * 60 * 60 * 1000;
    for (const row of ledgerRows) {
      const ts = new Date(row.created_at).getTime();
      if (ts < fourWeeksAgo) continue;
      const weekOffset = Math.min(3, Math.max(0, Math.floor((Date.now() - ts) / (7 * 24 * 60 * 60 * 1000))));
      const bucketIndex = 3 - weekOffset;
      monthly[bucketIndex].points += row.points_awarded;
    }
    for (const row of decisions) {
      const ts = new Date(row.timestamp).getTime();
      if (ts < fourWeeksAgo || !row.recommendation_accepted) continue;
      const weekOffset = Math.min(3, Math.max(0, Math.floor((Date.now() - ts) / (7 * 24 * 60 * 60 * 1000))));
      const bucketIndex = 3 - weekOffset;
      monthly[bucketIndex].accepted += 1;
    }

    return NextResponse.json({
      data: {
        pointsBalance: totalPoints,
        pointsByCategory,
        logismosScore: score,
        acceptedThisMonth,
        monthly,
        streakDays: 0,
      },
      explanation: "Rewards summary computed from decision log and points ledger.",
    });
  } catch (error) {
    await captureServerError(error, { event: "api.rewards.summary.failed" });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load rewards summary" },
      { status: 500 },
    );
  }
}
