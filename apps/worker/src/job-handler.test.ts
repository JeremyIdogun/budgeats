import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { RetailerConnector } from "../../../packages/retailer-connectors/src/types";
import { InMemoryIngestionRunSink } from "./ingestion-runs";
import type { IngestionPersistence } from "./job-handler";
import { runIngestionJob } from "./job-handler";

class StubConnector implements RetailerConnector {
  async bootstrapContext() {
    return {
      retailerId: "tesco",
      loyaltyEnabled: true,
      locale: "en-GB",
      initializedAt: "2026-03-12T00:00:00.000Z",
    };
  }

  async searchProducts() {
    return [
      {
        retailer_product_id: "p1",
        name: "Tesco Penne Pasta 500g",
        pack_size_raw: "500g",
        base_price_pence: 109,
        product_url: "https://www.tesco.com/p1",
        scraped_at: "2026-03-12T09:00:00.000Z",
      },
    ];
  }

  async fetchCategory() {
    return [
      {
        retailer_product_id: "p2",
        name: "Tesco Chopped Tomatoes 400g",
        pack_size_raw: "400g",
        base_price_pence: 75,
        product_url: "https://www.tesco.com/p2",
        scraped_at: "2026-03-12T09:00:00.000Z",
      },
    ];
  }

  async fetchProduct() {
    return {
      retailer_product_id: "p1",
      name: "Tesco Penne Pasta 500g",
      pack_size_raw: "500g",
      base_price_pence: 109,
      product_url: "https://www.tesco.com/p1",
      scraped_at: "2026-03-12T09:00:00.000Z",
    };
  }

  normalizeRawProduct(raw: {
    retailer_product_id: string;
    name: string;
    pack_size_raw?: string;
    base_price_pence?: number;
    promo_price_pence?: number | null;
    loyalty_price_pence?: number | null;
    product_url: string;
    scraped_at: string;
  }) {
    if (!raw.base_price_pence) throw new Error("Missing base price");
    return {
      retailer_product_id: raw.retailer_product_id,
      name: raw.name,
      pack_size_raw: raw.pack_size_raw,
      base_price_pence: raw.base_price_pence,
      promo_price_pence: raw.promo_price_pence ?? undefined,
      loyalty_price_pence: raw.loyalty_price_pence ?? undefined,
      product_url: raw.product_url,
      scraped_at: raw.scraped_at,
      loyalty_scheme: "none" as const,
    };
  }
}

describe("runIngestionJob", () => {
  it("executes connector->DB write->ingestion run record", async () => {
    const contexts: unknown[] = [];
    const products: unknown[] = [];

    const persistence: IngestionPersistence = {
      async resolveRetailerIdBySlug(slug) {
        assert.equal(slug, "tesco");
        return "retailer-uuid-1";
      },
      async upsertRetailerContext(input) {
        contexts.push(input);
      },
      async upsertRetailerProduct(input) {
        products.push(input);
      },
    };
    const runSink = new InMemoryIngestionRunSink();

    const result = await runIngestionJob({
      retailerSlug: "tesco",
      connector: new StubConnector(),
      persistence,
      runSink,
      searchQueries: ["pasta"],
      categoryIds: ["cupboard"],
      now: new Date("2026-03-12T10:00:00.000Z"),
    });

    assert.equal(result.status, "completed");
    assert.equal(result.productsScraped, 2);
    assert.equal(contexts.length, 1);
    assert.equal(products.length, 2);

    assert.equal(runSink.rows.length, 1);
    assert.equal(runSink.rows[0].retailer_id, "retailer-uuid-1");
    assert.equal(runSink.rows[0].status, "completed");
    assert.equal(runSink.rows[0].products_scraped, 2);
  });

  it("records failed ingestion run when connector bootstrap fails", async () => {
    const runSink = new InMemoryIngestionRunSink();
    const connector: RetailerConnector = {
      async bootstrapContext() {
        throw new Error("blocked");
      },
      async searchProducts() {
        return [];
      },
      async fetchCategory() {
        return [];
      },
      async fetchProduct() {
        throw new Error("not implemented");
      },
      normalizeRawProduct() {
        throw new Error("not implemented");
      },
    };

    const persistence: IngestionPersistence = {
      async resolveRetailerIdBySlug() {
        return "retailer-uuid-2";
      },
      async upsertRetailerContext() {},
      async upsertRetailerProduct() {},
    };

    const result = await runIngestionJob({
      retailerSlug: "asda",
      connector,
      persistence,
      runSink,
      now: new Date("2026-03-12T10:00:00.000Z"),
    });

    assert.equal(result.status, "failed");
    assert.equal(result.productsScraped, 0);
    assert.equal(result.errors.length, 1);
    assert.equal(runSink.rows.length, 1);
    assert.equal(runSink.rows[0].status, "failed");
  });
});
