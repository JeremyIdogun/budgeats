import type { DecisionLogEntry } from "@/models/logismos";

export interface SavingsNarrative {
  lifetimePence: number;
  thisMonthPence: number;
  lastMonthPence: number;
  thisWeekPence: number;
  lastWeekPence: number;
  monthOverMonthDeltaPence: number;
  weekOverWeekDeltaPence: number;
  acceptedCount: number;
  dismissedCount: number;
  acceptedCookCount: number;
  hasEnoughData: boolean;
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function startOfWeekMonday(d: Date): Date {
  const copy = startOfDay(d);
  const day = copy.getDay(); // 0 = Sun … 6 = Sat
  const diff = (day + 6) % 7; // days since Monday
  copy.setDate(copy.getDate() - diff);
  return copy;
}

function startOfMonth(d: Date): Date {
  const copy = startOfDay(d);
  copy.setDate(1);
  return copy;
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function addMonths(d: Date, months: number): Date {
  const copy = new Date(d);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

function inRange(iso: string, start: Date, endExclusive: Date): boolean {
  const t = new Date(iso).getTime();
  return t >= start.getTime() && t < endExclusive.getTime();
}

function savingFor(entry: DecisionLogEntry): number {
  // Only accepted decisions actually realise savings.
  if (!entry.recommendation_accepted) return 0;
  const value = entry.saving_pence ?? 0;
  return value > 0 ? value : 0;
}

/**
 * Aggregates a user's decision history into a savings narrative.
 * Pure function — no side effects — so it can be tested and reused on server or client.
 */
export function computeSavingsNarrative(
  entries: DecisionLogEntry[],
  now: Date = new Date(),
): SavingsNarrative {
  const weekStart = startOfWeekMonday(now);
  const lastWeekStart = addDays(weekStart, -7);
  const monthStart = startOfMonth(now);
  const lastMonthStart = addMonths(monthStart, -1);

  let lifetimePence = 0;
  let thisMonthPence = 0;
  let lastMonthPence = 0;
  let thisWeekPence = 0;
  let lastWeekPence = 0;
  let acceptedCount = 0;
  let dismissedCount = 0;
  let acceptedCookCount = 0;

  for (const entry of entries) {
    if (entry.recommendation_accepted) {
      acceptedCount += 1;
      if (entry.recommendation_type === "cook") acceptedCookCount += 1;
    } else {
      dismissedCount += 1;
    }

    const saving = savingFor(entry);
    if (saving <= 0) continue;

    lifetimePence += saving;
    if (inRange(entry.timestamp, monthStart, addMonths(monthStart, 1))) {
      thisMonthPence += saving;
    } else if (inRange(entry.timestamp, lastMonthStart, monthStart)) {
      lastMonthPence += saving;
    }
    if (inRange(entry.timestamp, weekStart, addDays(weekStart, 7))) {
      thisWeekPence += saving;
    } else if (inRange(entry.timestamp, lastWeekStart, weekStart)) {
      lastWeekPence += saving;
    }
  }

  return {
    lifetimePence,
    thisMonthPence,
    lastMonthPence,
    thisWeekPence,
    lastWeekPence,
    monthOverMonthDeltaPence: thisMonthPence - lastMonthPence,
    weekOverWeekDeltaPence: thisWeekPence - lastWeekPence,
    acceptedCount,
    dismissedCount,
    acceptedCookCount,
    // We need at least one accepted decision with a saving to tell any story.
    hasEnoughData: acceptedCount > 0 && lifetimePence > 0,
  };
}
