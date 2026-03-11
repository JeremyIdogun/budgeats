"use client";

import { useState } from "react";
import { AppNav } from "@/components/navigation/AppNav";
import { computeAcceptedThisMonth, computeLogismosScore } from "@/lib/points";
import { useBudgeAtsStore } from "@/store";
import { useDecisionStore } from "@/store/decisions";

interface ScoreBand {
  label: string;
  color: string;
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

export default function RewardsPage() {
  const loavishPoints = useBudgeAtsStore((s) => s.loavishPoints);
  const streakDays = useBudgeAtsStore((s) => s.streakDays);
  const entries = useDecisionStore((s) => s.entries);
  const [showProModal, setShowProModal] = useState(false);
  const [proToast, setProToast] = useState(false);

  const logismosScore = computeLogismosScore(entries);
  const scoreBand = logismosScore !== null ? getScoreBand(logismosScore) : null;
  const tier = getTierBadge(logismosScore);

  const acceptedThisMonth = computeAcceptedThisMonth(entries);

  // Score ring SVG values
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const scoreProgress = logismosScore !== null ? logismosScore : 0;
  const dashOffset = circumference - (scoreProgress / 100) * circumference;
  const ringStroke =
    logismosScore === null
      ? "#EDEBE7"
      : logismosScore <= 40
        ? "#6B7A99"
        : logismosScore <= 65
          ? "#E8693A"
          : logismosScore <= 85
            ? "#3DBFB8"
            : "#5D9B00";

  function handleProClick() {
    setShowProModal(false);
    setProToast(true);
    setTimeout(() => setProToast(false), 3000);
    console.log("[Logismos] Pro upgrade CTA clicked");
  }

  const achievements = [
    { icon: "🍳", label: "First Cook", unlocked: entries.some((e) => e.recommendation_type === "cook" && e.recommendation_accepted) },
    { icon: "🔥", label: "3-Day Streak", unlocked: streakDays >= 3 },
    { icon: "💰", label: "Budget Hero", unlocked: loavishPoints >= 100 },
    { icon: "🌱", label: "Waste Warrior", unlocked: false },
    { icon: "⭐", label: "Loavish Star", unlocked: logismosScore !== null && logismosScore >= 86 },
    { icon: "🏆", label: "Smart Spender", unlocked: logismosScore !== null && logismosScore >= 66 },
  ];

  return (
    <main className="min-h-screen bg-cream px-4 py-5 md:px-8 md:py-7">
      <div className="mx-auto max-w-3xl">
        <AppNav />

        <section className="mb-4">
          <h1 className="text-2xl font-semibold text-navy md:text-3xl">Rewards</h1>
          <p className="text-sm text-navy-muted">Your LoavishPoints &amp; Logismos Score.</p>
        </section>

        {/* Pro toast */}
        {proToast && (
          <div className="mb-4 rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-white text-center">
            Pro coming soon — you&apos;ll be first to know!
          </div>
        )}

        {/* 1. Points balance + tier badge */}
        <section className="rounded-2xl border border-cream-dark bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-navy-muted">
                LoavishPoints
              </p>
              <p className="mt-1 text-4xl font-semibold text-navy">{loavishPoints}</p>
            </div>
            <span className="rounded-full bg-cream px-4 py-2 text-sm font-semibold text-navy">
              {tier}
            </span>
          </div>
        </section>

        {/* 2. Logismos Score ring */}
        <section className="mt-4 rounded-2xl border border-cream-dark bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-navy-muted">
            Logismos Score
          </p>
          <div className="mt-4 flex items-center justify-center">
            <svg viewBox="0 0 140 140" className="h-44 w-44 -rotate-90" aria-hidden>
              <circle cx="70" cy="70" r={radius} stroke="#EDEBE7" strokeWidth="12" fill="none" />
              <circle
                cx="70"
                cy="70"
                r={radius}
                stroke={ringStroke}
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="transition-all duration-300"
              />
            </svg>
          </div>
          {logismosScore !== null ? (
            <>
              <p className={`-mt-28 text-center text-3xl font-semibold ${scoreBand?.color ?? "text-navy"}`}>
                {logismosScore}
              </p>
              <p className={`mt-16 text-center text-sm font-semibold ${scoreBand?.color ?? "text-navy"}`}>
                {scoreBand?.label}
              </p>
            </>
          ) : (
            <>
              <p className="-mt-28 text-center text-3xl font-semibold text-navy-muted">—</p>
              <p className="mt-16 text-center text-sm text-navy-muted">
                Make 7 decisions to unlock your score
              </p>
            </>
          )}
          <p className="mt-2 text-center text-xs text-navy-muted">
            {logismosScore !== null ? "Based on last 28 days" : `${entries.length} / 7 decisions logged`}
          </p>
        </section>

        {/* 3. Monthly summary */}
        <section className="mt-4 rounded-2xl border border-cream-dark bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-navy-muted">
            This Month
          </p>
          <p className="mt-2 text-navy">
            You made{" "}
            <span className="font-semibold text-teal">{acceptedThisMonth} smart decision{acceptedThisMonth !== 1 ? "s" : ""}</span>{" "}
            this month.
          </p>
        </section>

        {/* 4. Streak tracker */}
        <section className="mt-4 rounded-2xl border border-cream-dark bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-navy-muted">
            Streak
          </p>
          <div className="mt-2 flex items-center gap-6">
            <div>
              <p className="text-3xl font-semibold text-navy">{streakDays}</p>
              <p className="text-xs text-navy-muted">Current streak</p>
            </div>
            <div className="h-10 w-px bg-cream-dark" />
            <div>
              <p className="text-3xl font-semibold text-navy-muted">{streakDays}</p>
              <p className="text-xs text-navy-muted">Personal best</p>
            </div>
          </div>
        </section>

        {/* 5. Achievements */}
        <section className="mt-4 rounded-2xl border border-cream-dark bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-navy-muted">
            Achievements
          </p>
          <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {achievements.map((achievement) => (
              <div
                key={achievement.label}
                className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center ${
                  achievement.unlocked
                    ? "border-teal/30 bg-teal/5"
                    : "border-cream-dark opacity-40"
                }`}
              >
                <span className="text-2xl">{achievement.icon}</span>
                <p className="text-xs font-semibold text-navy leading-tight">{achievement.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Pro upgrade CTA */}
        <section className="mt-4 rounded-2xl border border-cream-dark bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-navy">Upgrade to Loavish Pro</p>
              <p className="mt-1 text-sm text-navy-muted">
                £3.99/mo or £39/yr · Unlock advanced insights, calendar sync, and more.
              </p>
            </div>
            <button
              onClick={() => setShowProModal(true)}
              className="shrink-0 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#172744]"
            >
              Upgrade
            </button>
          </div>
        </section>
      </div>

      {/* Pro stub modal */}
      {showProModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-card-hover">
            <p className="text-lg font-semibold text-navy">Loavish Pro</p>
            <ul className="mt-3 space-y-2 text-sm text-navy-muted">
              <li>✅ Calendar sync for smarter recommendations</li>
              <li>✅ Geo-aware eat-out deals near you</li>
              <li>✅ Advanced spending analytics</li>
              <li>✅ Social leaderboard</li>
              <li>✅ Priority support</li>
            </ul>
            <p className="mt-4 text-sm font-semibold text-navy">£3.99/mo or £39/yr</p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={handleProClick}
                className="flex-1 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#172744]"
              >
                Join the waitlist
              </button>
              <button
                onClick={() => setShowProModal(false)}
                className="rounded-xl border border-cream-dark px-4 py-2.5 text-sm font-semibold text-navy-muted"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
