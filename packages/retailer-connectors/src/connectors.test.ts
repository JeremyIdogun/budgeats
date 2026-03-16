import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { AsdaConnector, parseAsdaHtml } from "./asda/connector";
import { SainsburysConnector, parseSainsburysHtml } from "./sainsburys/connector";
import { parseTescoHtml, TescoConnector } from "./tesco/connector";
import type { SnapshotStore } from "./runtime";

class InMemorySnapshotStore implements SnapshotStore {
  private readonly snapshots = new Set<string>();

  async hasSnapshot(hash: string): Promise<boolean> {
    return this.snapshots.has(hash);
  }

  async putSnapshot(input: { key: string; body: string; contentType: "text/html" | "application/json" }): Promise<void> {
    void input.body;
    void input.contentType;
    this.snapshots.add(input.key);
  }
}

function fixture(name: string): string {
  return readFileSync(join(process.cwd(), "packages/retailer-connectors/src/__fixtures__", name), "utf8");
}

describe("tesco connector fixture parsing", () => {
  it("extracts base and clubcard prices separately", () => {
    const rows = parseTescoHtml(fixture("tesco-search.html"));
    assert.equal(rows.length, 1);
    assert.equal(rows[0].base_price_pence, 85);
    assert.equal(rows[0].loyalty_price_pence, 69);
    assert.equal(rows[0].loyalty_scheme, "clubcard");
    assert.equal(rows[0].pack_size_raw, "400g");
  });

  it("normalizes raw product payload", async () => {
    const connector = new TescoConnector(new InMemorySnapshotStore(), async () => fixture("tesco-search.html"));
    const context = await connector.bootstrapContext({ retailerId: "tesco" });
    const rows = await connector.searchProducts("tomatoes", context);
    const normalized = connector.normalizeRawProduct(rows[0]);
    assert.equal(normalized.base_price_pence, 85);
    assert.equal(normalized.loyalty_price_pence, 69);
  });
});

describe("asda connector postcode-aware bootstrap", () => {
  it("requires postcode and stores cookie/header", async () => {
    const connector = new AsdaConnector(new InMemorySnapshotStore(), async () => fixture("asda-search.html"));
    const context = await connector.bootstrapContext({ retailerId: "asda", postcode: "SE1 0AA" });
    assert.equal(context.cookies?.asda_postcode, "SE1 0AA");
    assert.equal(context.headers?.["x-asda-postcode"], "SE1 0AA");
  });

  it("parses standard prices without loyalty", () => {
    const rows = parseAsdaHtml(fixture("asda-search.html"));
    assert.equal(rows.length, 1);
    assert.equal(rows[0].base_price_pence, 68);
    assert.equal(rows[0].loyalty_price_pence, undefined);
    assert.equal(rows[0].loyalty_scheme, "none");
  });
});

describe("sainsburys connector fixture parsing", () => {
  it("extracts base and nectar prices separately", () => {
    const rows = parseSainsburysHtml(fixture("sainsburys-search.html"));
    assert.equal(rows.length, 1);
    assert.equal(rows[0].base_price_pence, 120);
    assert.equal(rows[0].loyalty_price_pence, 100);
    assert.equal(rows[0].loyalty_scheme, "nectar");
  });

  it("normalizes nectar-backed payload", async () => {
    const connector = new SainsburysConnector(
      new InMemorySnapshotStore(),
      async () => fixture("sainsburys-search.html"),
    );
    const context = await connector.bootstrapContext({ retailerId: "sainsburys" });
    const rows = await connector.searchProducts("penne", context);
    const normalized = connector.normalizeRawProduct(rows[0]);
    assert.equal(normalized.base_price_pence, 120);
    assert.equal(normalized.loyalty_price_pence, 100);
    assert.equal(normalized.loyalty_scheme, "nectar");
  });
});
