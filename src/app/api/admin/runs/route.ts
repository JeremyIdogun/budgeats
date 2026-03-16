import { NextResponse } from "next/server";
import { listIngestionRuns } from "@/lib/server/admin-metrics";
import { captureServerError } from "@/lib/server/observability";
import { getOptionalPrisma } from "@/lib/server/optional-prisma";
import { runIngestionJob, createPrismaIngestionPersistence } from "../../../../../apps/worker/src/job-handler";
import { PrismaIngestionRunSink } from "../../../../../apps/worker/src/ingestion-runs";
import { TescoConnector } from "../../../../../packages/retailer-connectors/src/tesco";
import { AsdaConnector } from "../../../../../packages/retailer-connectors/src/asda";
import { SainsburysConnector } from "../../../../../packages/retailer-connectors/src/sainsburys";
import type { SnapshotStore } from "../../../../../packages/retailer-connectors/src/runtime";
import type { RetailerConnector, RetailerContext } from "../../../../../packages/retailer-connectors/src/types";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

interface TriggerRunBody {
  retailerSlug?: unknown;
  postcode?: unknown;
  searchQueries?: unknown;
  categoryIds?: unknown;
}

class InMemorySnapshotStore implements SnapshotStore {
  private readonly snapshots = new Set<string>();

  async hasSnapshot(hash: string): Promise<boolean> {
    return this.snapshots.has(hash);
  }

  async putSnapshot(input: {
    key: string;
    body: string;
    contentType: "text/html" | "application/json";
  }): Promise<void> {
    void input.body;
    void input.contentType;
    this.snapshots.add(input.key);
  }
}

type RetailerSlug = "tesco" | "asda" | "sainsburys";

function parseRetailerSlug(value: unknown): RetailerSlug {
  if (typeof value !== "string") return "tesco";
  const normalized = value.trim().toLowerCase();
  if (normalized === "tesco" || normalized === "asda" || normalized === "sainsburys") {
    return normalized;
  }
  return "tesco";
}

async function loadFixtureHtml(slug: RetailerSlug): Promise<string> {
  const fixtureName =
    slug === "tesco" ? "tesco-search.html"
    : slug === "asda" ? "asda-search.html"
    : "sainsburys-search.html";
  const fixturePath = join(
    process.cwd(),
    "packages/retailer-connectors/src/__fixtures__",
    fixtureName,
  );
  return readFile(fixturePath, "utf8");
}

async function fixtureFetcherFor(slug: RetailerSlug): Promise<(url: string, context: RetailerContext) => Promise<string>> {
  const html = await loadFixtureHtml(slug);
  return async () => html;
}

async function connectorForRetailer(slug: RetailerSlug, snapshotStore: SnapshotStore): Promise<RetailerConnector> {
  const htmlFetcher = await fixtureFetcherFor(slug);
  if (slug === "tesco") return new TescoConnector(snapshotStore, htmlFetcher);
  if (slug === "asda") return new AsdaConnector(snapshotStore, htmlFetcher);
  return new SainsburysConnector(snapshotStore, htmlFetcher);
}

function parseStringArray(input: unknown): string[] | undefined {
  if (!Array.isArray(input)) return undefined;
  const rows = input
    .map((row) => (typeof row === "string" ? row.trim() : ""))
    .filter((row) => row.length > 0);
  return rows.length > 0 ? rows : undefined;
}

export async function GET() {
  const runs = await listIngestionRuns(200);
  return NextResponse.json({
    data: runs,
    explanation: `Loaded ${runs.length} ingestion runs.`,
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TriggerRunBody;
    const retailerSlug = parseRetailerSlug(body.retailerSlug);
    const snapshotStore = new InMemorySnapshotStore();
    const connector = await connectorForRetailer(retailerSlug, snapshotStore);
    const prisma = await getOptionalPrisma();

    if (!prisma) {
      return NextResponse.json(
        { error: "Database connection is not configured for ingestion runs." },
        { status: 503 },
      );
    }

    const result = await runIngestionJob({
      retailerSlug,
      connector,
      persistence: createPrismaIngestionPersistence(prisma as Parameters<typeof createPrismaIngestionPersistence>[0]),
      runSink: new PrismaIngestionRunSink(prisma as ConstructorParameters<typeof PrismaIngestionRunSink>[0]),
      postcode: typeof body.postcode === "string" ? body.postcode : retailerSlug === "asda" ? "SW1A 1AA" : undefined,
      searchQueries: parseStringArray(body.searchQueries),
      categoryIds: parseStringArray(body.categoryIds),
    });

    return NextResponse.json({
      data: result,
      explanation: `Triggered ${retailerSlug} ingestion run with status ${result.status}.`,
    });
  } catch (error) {
    captureServerError(error, { event: "api.admin.runs.trigger.failed" });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to trigger ingestion run" },
      { status: 500 },
    );
  }
}
