import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
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

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "__fixtures__");

function fixture(name: string): string {
  return readFileSync(join(fixturesDir, name), "utf8");
}

describe("tesco connector fixture parsing", () => {
  it("extracts base and clubcard prices separately", () => {
    const rows = parseTescoHtml(fixture("tesco-search.html"));
    expect(rows).toHaveLength(1);
    expect(rows[0].base_price_pence).toBe(85);
    expect(rows[0].loyalty_price_pence).toBe(69);
    expect(rows[0].loyalty_scheme).toBe("clubcard");
    expect(rows[0].pack_size_raw).toBe("400g");
  });

  it("normalizes raw product payload", async () => {
    const connector = new TescoConnector(new InMemorySnapshotStore(), async () => fixture("tesco-search.html"));
    const context = await connector.bootstrapContext({ retailerId: "tesco" });
    const rows = await connector.searchProducts("tomatoes", context);
    const normalized = connector.normalizeRawProduct(rows[0]);
    expect(normalized.base_price_pence).toBe(85);
    expect(normalized.loyalty_price_pence).toBe(69);
  });
});

describe("asda connector postcode-aware bootstrap", () => {
  it("requires postcode and stores cookie/header", async () => {
    const connector = new AsdaConnector(new InMemorySnapshotStore(), async () => fixture("asda-search.html"));
    const context = await connector.bootstrapContext({ retailerId: "asda", postcode: "SE1 0AA" });
    expect(context.cookies?.asda_postcode).toBe("SE1 0AA");
    expect(context.headers?.["x-asda-postcode"]).toBe("SE1 0AA");
  });

  it("parses standard prices without loyalty", () => {
    const rows = parseAsdaHtml(fixture("asda-search.html"));
    expect(rows).toHaveLength(1);
    expect(rows[0].base_price_pence).toBe(68);
    expect(rows[0].loyalty_price_pence).toBeUndefined();
    expect(rows[0].loyalty_scheme).toBe("none");
  });
});

describe("sainsburys connector fixture parsing", () => {
  it("extracts base and nectar prices separately", () => {
    const rows = parseSainsburysHtml(fixture("sainsburys-search.html"));
    expect(rows).toHaveLength(1);
    expect(rows[0].base_price_pence).toBe(120);
    expect(rows[0].loyalty_price_pence).toBe(100);
    expect(rows[0].loyalty_scheme).toBe("nectar");
  });

  it("normalizes nectar-backed payload", async () => {
    const connector = new SainsburysConnector(
      new InMemorySnapshotStore(),
      async () => fixture("sainsburys-search.html"),
    );
    const context = await connector.bootstrapContext({ retailerId: "sainsburys" });
    const rows = await connector.searchProducts("penne", context);
    const normalized = connector.normalizeRawProduct(rows[0]);
    expect(normalized.base_price_pence).toBe(120);
    expect(normalized.loyalty_price_pence).toBe(100);
    expect(normalized.loyalty_scheme).toBe("nectar");
  });
});
