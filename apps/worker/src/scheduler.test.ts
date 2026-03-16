import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildProviderSchedules, ingestionSchedules, shouldRunOnDemand } from "./scheduler";

describe("ingestion schedule definitions", () => {
  it("includes all required periodic jobs", () => {
    assert.equal(ingestionSchedules.length, 4);
    assert.equal(ingestionSchedules[0].id, "full-category-refresh");
    assert.equal(ingestionSchedules[1].id, "offers-refresh");
    assert.equal(ingestionSchedules[2].id, "top-ingredient-refresh");
    assert.equal(ingestionSchedules[3].id, "price-alerts-check");
  });

  it("maps schedules to trigger-dev and bullmq descriptors", () => {
    const triggerJobs = buildProviderSchedules("trigger-dev");
    const bullJobs = buildProviderSchedules("bullmq");
    assert.equal(triggerJobs.length, 4);
    assert.equal(bullJobs.length, 4);
    assert.equal(triggerJobs[0].provider, "trigger-dev");
    assert.equal(bullJobs[0].provider, "bullmq");
  });
});

describe("on-demand trigger window", () => {
  const now = new Date("2026-03-12T12:00:00.000Z");

  it("triggers when snapshot is missing", () => {
    assert.equal(shouldRunOnDemand(null, now), true);
  });

  it("does not trigger before 12 hours", () => {
    assert.equal(shouldRunOnDemand("2026-03-12T04:30:00.000Z", now), false);
  });

  it("triggers at or after 12 hours", () => {
    assert.equal(shouldRunOnDemand("2026-03-12T00:00:00.000Z", now), true);
  });
});
