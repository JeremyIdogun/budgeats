export type FreshnessStatus = "fresh" | "usable" | "stale" | "expired";

const HOUR_MS = 60 * 60 * 1000;

export function getFreshnessStatus(
  observedAtIso: string,
  now: Date = new Date(),
): FreshnessStatus {
  const observedAt = new Date(observedAtIso);
  const ageMs = Math.max(0, now.getTime() - observedAt.getTime());

  if (ageMs < 6 * HOUR_MS) return "fresh";
  if (ageMs < 24 * HOUR_MS) return "usable";
  if (ageMs < 72 * HOUR_MS) return "stale";
  return "expired";
}

export function freshnessExpiresInMs(status: FreshnessStatus): number {
  switch (status) {
    case "fresh":
      return 6 * HOUR_MS;
    case "usable":
      return 24 * HOUR_MS;
    case "stale":
      return 72 * HOUR_MS;
    case "expired":
      return 0;
  }
}
