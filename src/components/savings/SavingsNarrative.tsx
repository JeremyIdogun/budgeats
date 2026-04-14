"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toDecisionLogEntry } from "@/lib/decision-mappers";
import type { DecisionLogRow } from "@/lib/logismos-ledger";
import { computeSavingsNarrative, type SavingsNarrative as SavingsData } from "@/lib/savings";
import type { DecisionLogEntry } from "@/models/logismos";
import { useDecisionStore } from "@/store/decisions";
import { formatPence } from "@/utils/currency";

type Variant = "compact" | "full";

interface Props {
  variant?: Variant;
}

function deltaCopy(deltaPence: number, periodLabel: string): string {
  if (deltaPence > 0) {
    return `${formatPence(deltaPence)} more than ${periodLabel}`;
  }
  if (deltaPence < 0) {
    return `${formatPence(Math.abs(deltaPence))} less than ${periodLabel}`;
  }
  return `On pace with ${periodLabel}`;
}

function useSavingsData(): { data: SavingsData; loading: boolean } {
  const localEntries = useDecisionStore((s) => s.entries);
  const [remoteEntries, setRemoteEntries] = useState<DecisionLogEntry[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/decisions", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as { data?: DecisionLogRow[] };
        if (!cancelled) {
          setRemoteEntries((payload.data ?? []).map(toDecisionLogEntry));
        }
      } catch {
        // Fall back to local entries below.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const entries =
    remoteEntries && remoteEntries.length > 0 ? remoteEntries : localEntries;
  return { data: computeSavingsNarrative(entries), loading };
}

export function SavingsNarrative({ variant = "full" }: Props) {
  const { data, loading } = useSavingsData();

  if (variant === "compact") {
    return (
      <CompactCard data={data} loading={loading} />
    );
  }

  return <FullPanel data={data} loading={loading} />;
}

function CompactCard({ data, loading }: { data: SavingsData; loading: boolean }) {
  if (loading && !data.hasEnoughData) {
    return (
      <section className="rounded-lg border border-cream-dark bg-white p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-navy-muted">
          Savings this month
        </p>
        <p className="mt-3 text-sm text-navy-muted">Loading your impact…</p>
      </section>
    );
  }

  if (!data.hasEnoughData) {
    return (
      <section className="rounded-lg border border-cream-dark bg-white p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-navy-muted">
          Savings this month
        </p>
        <p className="mt-3 text-lg font-semibold text-navy">Nothing saved yet</p>
        <p className="mt-1 text-sm text-navy-muted">
          Accept a Logismos recommendation to start building your savings story.
        </p>
      </section>
    );
  }

  const delta = data.monthOverMonthDeltaPence;
  const deltaTone =
    delta > 0 ? "text-teal" : delta < 0 ? "text-coral" : "text-navy-muted";

  return (
    <section className="rounded-lg border border-cream-dark bg-white p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-navy-muted">
        Savings this month
      </p>
      <p className="mt-3 text-3xl font-semibold text-navy">
        {formatPence(data.thisMonthPence)}
      </p>
      <p className={`mt-1 text-sm ${deltaTone}`}>
        {deltaCopy(delta, "last month")}
      </p>
      <div className="mt-3 flex items-center justify-between text-xs text-navy-muted">
        <span>{formatPence(data.lifetimePence)} saved in total</span>
        <Link href="/insights" className="text-teal underline">
          Details →
        </Link>
      </div>
    </section>
  );
}

function FullPanel({ data, loading }: { data: SavingsData; loading: boolean }) {
  if (loading && !data.hasEnoughData) {
    return (
      <section className="rounded-lg border border-cream-dark bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-navy-muted">
          Your savings story
        </h2>
        <p className="mt-3 text-sm text-navy-muted">Crunching your decision history…</p>
      </section>
    );
  }

  if (!data.hasEnoughData) {
    return (
      <section className="rounded-lg border border-cream-dark bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-navy-muted">
          Your savings story
        </h2>
        <p className="mt-3 text-lg font-semibold text-navy">Waiting on your first decision</p>
        <p className="mt-1 text-sm text-navy-muted">
          Each time you accept a cook recommendation, we&apos;ll bank the projected savings
          vs eating out here.
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white"
        >
          See today&apos;s recommendation →
        </Link>
      </section>
    );
  }

  const weekDelta = data.weekOverWeekDeltaPence;
  const monthDelta = data.monthOverMonthDeltaPence;
  const acceptanceRate =
    data.acceptedCount + data.dismissedCount > 0
      ? Math.round(
          (data.acceptedCount / (data.acceptedCount + data.dismissedCount)) * 100,
        )
      : 0;

  return (
    <section className="rounded-lg border border-cream-dark bg-white p-5">
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-navy-muted">
        Your savings story
      </h2>

      <p className="mt-3 text-3xl font-semibold text-navy">
        {formatPence(data.lifetimePence)}
      </p>
      <p className="mt-1 text-sm text-navy-muted">
        saved since you started using Loavish.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-cream/60 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-navy-muted">
            This week
          </p>
          <p className="mt-1 text-xl font-semibold text-navy">
            {formatPence(data.thisWeekPence)}
          </p>
          <p
            className={`mt-0.5 text-xs ${
              weekDelta > 0 ? "text-teal" : weekDelta < 0 ? "text-coral" : "text-navy-muted"
            }`}
          >
            {deltaCopy(weekDelta, "last week")}
          </p>
        </div>
        <div className="rounded-lg bg-cream/60 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-navy-muted">
            This month
          </p>
          <p className="mt-1 text-xl font-semibold text-navy">
            {formatPence(data.thisMonthPence)}
          </p>
          <p
            className={`mt-0.5 text-xs ${
              monthDelta > 0 ? "text-teal" : monthDelta < 0 ? "text-coral" : "text-navy-muted"
            }`}
          >
            {deltaCopy(monthDelta, "last month")}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-2 text-sm text-navy">
        <p>
          <strong>{data.acceptedCookCount}</strong> cook decision
          {data.acceptedCookCount === 1 ? "" : "s"} accepted — each one edged you closer
          to your weekly budget.
        </p>
        <p className="text-navy-muted">
          You&apos;ve acted on {acceptanceRate}% of the recommendations Logismos made.
        </p>
      </div>
    </section>
  );
}
