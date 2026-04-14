"use client";

import { useEffect, useMemo, useState } from "react";
import { AppNav } from "@/components/navigation/AppNav";
import { useHydratedProfile } from "@/components/dashboard/useHydratedProfile";
import type { DashboardClientCommonProps } from "@/lib/dashboard-client";
import { computeAcceptedThisMonth, computeLogismosScore } from "@/lib/points";
import { useBudgeAtsStore } from "@/store";
import { useDecisionStore } from "@/store/decisions";

interface ScoreBand {
  label: string;
  color: string;
}

interface RewardsSummary {
  pointsBalance: number;
  pointsByCategory: Record<string, number>;
  logismosScore: number | null;
  acceptedThisMonth: number;
  monthly: Array<{ weekLabel: string; points: number; accepted: number }>;
  streakDays: number;
}

function getScoreBand(score: number): ScoreBand {
  if (score <= 40) return { label: "Getting Started", color: "text-navy-muted" };
  if (score <= 65) return { label: "On Track", color: "text-coral" };
  if (score <= 85) return { label: "Smart Spender", color: "text-teal" };
  return { label: "Loavish", color: "text-[#5D9B00]" };
}

function getTierBadge(score: number | null): string {
  if (score === null) return "Getting Started";
  if (score <= 40) return "Getting Started";
  if (score <= 65) return "On Track";
  if (score <= 85) return "Smart Spender";
  return "Loavish";
}

export function RewardsClient({
  userId,
  profileRetailers,
  profileWeeklyBudgetPence,
  profileBudgetPeriod,
  profileHouseholdSize,
  profileDietaryPreferences,
}: DashboardClientCommonProps) {
  useHydratedProfile({
    userId,
    profileRetailers,
    profileWeeklyBudgetPence,
    profileBudgetPeriod,
    profileHouseholdSize,
    profileDietaryPreferences,
  });

  const loavishPoints = useBudgeAtsStore((s) => s.loavishPoints);
  const streakDays = useBudgeAtsStore((s) => s.streakDays);
  const entries = useDecisionStore((s) => s.entries);
  const [summary, setSummary] = useState<RewardsSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadSummary() {
      setSummaryLoading(true);
      try {
        const response = await fetch("/api/rewards/summary", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as { data?: RewardsSummary };
        if (!cancelled && payload.data) {
          setSummary(payload.data);
        }
      } finally {
        if (!cancelled) {
          setSummaryLoading(false);
        }
      }
    }
    void loadSummary();
    return () => {
      cancelled = true;
    };
  }, []);

  const logismosScore = summary?.logismosScore ?? computeLogismosScore(entries);
  const scoreBand = logismosScore !== null ? getScoreBand(logismosScore) : null;
  const tier = getTierBadge(logismosScore);
  const acceptedThisMonth = summary?.acceptedThisMonth ?? computeAcceptedThisMonth(entries);
  const displayedPoints = summary?.pointsBalance ?? loavishPoints;
  const displayedStreak = summary?.streakDays ?? streakDays;
  const pointsByCategory = summary?.pointsByCategory ?? {};
  const monthly = useMemo(() => summary?.monthly ?? [], [summary]);
  const maxMonthlyPoints = useMemo(
    () => Math.max(1, ...monthly.map((bucket) => bucket.points)),
    [monthly],
  );

  const scoreProgress =
    logismosScore !== null
      ? Math.min(Math.max(logismosScore, 0), 100)
      : 0;

  const achievements = [
    {
      label: "First Cook",
      unlocked: entries.some((e) => e.recommendation_type === "cook" && e.recommendation_accepted),
    },
    { label: "3-Day Streak", unlocked: displayedStreak >= 3 },
    { label: "Budget Hero", unlocked: displayedPoints >= 100 },
    { label: "Smart Spender", unlocked: logismosScore !== null && logismosScore >= 66 },
    { label: "Loavish Star", unlocked: logismosScore !== null && logismosScore >= 86 },
  ];

  return (
    <main className="min-h-screen bg-cream px-4 py-5 md:px-8 md:py-7">
      <div className="mx-auto max-w-3xl">
        <AppNav />

        <section className="mb-4">
          <h1 className="text-2xl font-extrabold text-navy md:text-3xl">Rewards</h1>
          <p className="text-sm text-navy-muted">Your LoavishPoints &amp; Logismos Score.</p>
        </section>

        <section className="rounded-lg border border-cream-dark bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-navy-muted">
                LoavishPoints
              </p>
              <p className="mt-1 text-4xl font-semibold text-navy">{displayedPoints}</p>
            </div>
            <span className="rounded-full bg-cream px-4 py-2 text-sm font-semibold text-navy">
              {tier}
            </span>
          </div>
          {summaryLoading && (
            <p className="mt-2 text-xs text-navy-muted">Refreshing rewards summary...</p>
          )}
        </section>

        <section className="mt-4 rounded-lg border border-cream-dark bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-navy-muted">
            Points Breakdown
          </p>
          <div className="mt-3 space-y-2">
            {Object.entries(pointsByCategory).length === 0 && (
              <p className="text-sm text-navy-muted">No points events yet.</p>
            )}
            {Object.entries(pointsByCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([event, points]) => (
                <div key={event} className="flex items-center justify-between rounded-lg bg-cream px-3 py-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-navy-muted">
                    {event.replaceAll("_", " ")}
                  </span>
                  <span className="text-sm font-semibold text-navy">{points} pts</span>
                </div>
              ))}
          </div>
        </section>

        <section className="mt-4 rounded-lg border border-cream-dark bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-navy-muted">
            Logismos Score
          </p>
          <div className="mt-4 h-1 rounded-full bg-cream-dark">
            <div
              className="h-1 rounded-full bg-teal transition-opacity duration-150"
              style={{ width: `${scoreProgress}%` }}
            />
          </div>
          {logismosScore !== null ? (
            <>
              <p className={`mt-4 text-center text-3xl font-semibold ${scoreBand?.color ?? "text-navy"}`}>
                {logismosScore}
              </p>
              <p className={`mt-1 text-center text-sm font-semibold ${scoreBand?.color ?? "text-navy"}`}>
                {scoreBand?.label}
              </p>
            </>
          ) : (
            <p className="mt-4 text-center text-sm text-navy-muted">
              Not enough data yet
            </p>
          )}
          <p className="mt-2 text-center text-xs text-navy-muted">
            {logismosScore !== null ? "Based on last 28 days" : `${entries.length} / 3 decisions logged`}
          </p>
        </section>

        <section className="mt-4 rounded-lg border border-cream-dark bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-navy-muted">
            This Month
          </p>
          <p className="mt-2 text-navy">
            You made{" "}
            <span className="font-semibold text-teal">{acceptedThisMonth} smart decision{acceptedThisMonth !== 1 ? "s" : ""}</span>{" "}
            this month.
          </p>
          {monthly.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {monthly.map((bucket) => {
                const heightPct = Math.max(8, Math.round((bucket.points / maxMonthlyPoints) * 100));
                return (
                  <div key={bucket.weekLabel} className="flex flex-col items-center gap-1">
                    <div className="flex h-24 w-full items-end rounded-lg bg-cream px-1">
                      <div
                        className="w-full rounded-lg bg-teal/70"
                        style={{ height: `${heightPct}%` }}
                        title={`${bucket.points} pts · ${bucket.accepted} accepted`}
                      />
                    </div>
                    <p className="text-[10px] text-navy-muted">{bucket.weekLabel}</p>
                    <p className="text-[10px] font-semibold text-navy">{bucket.points}</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-4 rounded-lg border border-cream-dark bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-navy-muted">
            Streak
          </p>
          <div className="mt-2 flex items-center gap-6">
            <div>
              <p className="text-3xl font-semibold text-navy">{displayedStreak}</p>
              <p className="text-xs text-navy-muted">
                {displayedStreak === 1 ? "day" : "days"} in a row
              </p>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-lg border border-cream-dark bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-navy-muted">
            Achievements
          </p>
          <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {achievements.map((achievement) => (
              <div
                key={achievement.label}
                className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center ${
                  achievement.unlocked
                    ? "border-teal/30 bg-teal/5"
                    : "border-cream-dark opacity-40"
                }`}
              >
                <span
                  className={`h-5 w-5 rounded-lg ${achievement.unlocked ? "bg-teal/20" : "bg-cream-dark"}`}
                />
                <p className="text-xs font-semibold text-navy leading-tight">{achievement.label}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
