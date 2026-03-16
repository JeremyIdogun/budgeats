import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { InMemoryIngestionRunSink, recordIngestionRun } from "./ingestion-runs";

describe("recordIngestionRun", () => {
  it("writes ingestion run payload with required fields", async () => {
    const sink = new InMemoryIngestionRunSink();
    const row = await recordIngestionRun({
      sink,
      retailerId: "tesco",
      startedAt: new Date("2026-03-12T08:00:00.000Z"),
      completedAt: new Date("2026-03-12T08:10:00.000Z"),
      status: "completed",
      productsScraped: 123,
      errors: null,
    });

    assert.equal(row.retailer_id, "tesco");
    assert.equal(row.status, "completed");
    assert.equal(row.products_scraped, 123);
    assert.equal(sink.rows.length, 1);
  });
});
