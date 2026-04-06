import { describe, expect, it } from "vitest";
import { freshnessExpiresInMs, getFreshnessStatus } from "./freshness";

describe("freshness status windows", () => {
  const now = new Date("2026-03-12T12:00:00.000Z");

  it("marks <6h as fresh", () => {
    expect(getFreshnessStatus("2026-03-12T08:30:00.000Z", now)).toBe("fresh");
  });

  it("marks 6-24h as usable", () => {
    expect(getFreshnessStatus("2026-03-12T03:00:00.000Z", now)).toBe("usable");
  });

  it("marks 24-72h as stale", () => {
    expect(getFreshnessStatus("2026-03-10T12:30:00.000Z", now)).toBe("stale");
  });

  it("marks >72h as expired", () => {
    expect(getFreshnessStatus("2026-03-08T11:59:00.000Z", now)).toBe("expired");
  });
});

describe("freshness ttl helper", () => {
  it("returns expected ttl values", () => {
    expect(freshnessExpiresInMs("fresh")).toBe(21_600_000);
    expect(freshnessExpiresInMs("usable")).toBe(86_400_000);
    expect(freshnessExpiresInMs("stale")).toBe(259_200_000);
    expect(freshnessExpiresInMs("expired")).toBe(0);
  });
});
