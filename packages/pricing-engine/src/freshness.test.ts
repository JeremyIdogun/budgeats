import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { freshnessExpiresInMs, getFreshnessStatus } from "./freshness";

describe("freshness status windows", () => {
  const now = new Date("2026-03-12T12:00:00.000Z");

  it("marks <6h as fresh", () => {
    assert.equal(getFreshnessStatus("2026-03-12T08:30:00.000Z", now), "fresh");
  });

  it("marks 6-24h as usable", () => {
    assert.equal(getFreshnessStatus("2026-03-12T03:00:00.000Z", now), "usable");
  });

  it("marks 24-72h as stale", () => {
    assert.equal(getFreshnessStatus("2026-03-10T12:30:00.000Z", now), "stale");
  });

  it("marks >72h as expired", () => {
    assert.equal(getFreshnessStatus("2026-03-08T11:59:00.000Z", now), "expired");
  });
});

describe("freshness ttl helper", () => {
  it("returns expected ttl values", () => {
    assert.equal(freshnessExpiresInMs("fresh"), 21_600_000);
    assert.equal(freshnessExpiresInMs("usable"), 86_400_000);
    assert.equal(freshnessExpiresInMs("stale"), 259_200_000);
    assert.equal(freshnessExpiresInMs("expired"), 0);
  });
});
