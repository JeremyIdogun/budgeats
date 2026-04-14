import pricesData from "@/data/prices.json";
import type { IngredientPrice } from "@/models";
import { getOptionalPrisma } from "@/lib/server/optional-prisma";

type ReadinessLevel = "ready" | "degraded" | "blocked";
type FreshnessStatus = "fresh" | "aging" | "stale" | "missing";
type ConnectorMode = "apify" | "fixture";
type SnapshotStoreMode = "supabase" | "filesystem" | "memory";

interface RetailerReadinessRow {
  id: string;
  slug: string;
  name: string;
  status: string;
  productCount: number;
  priceCount: number;
  contextCount: number;
  latestAttemptedRunAt: string | null;
  latestSuccessfulRunAt: string | null;
  latestPriceObservedAt: string | null;
  latestContextUpdatedAt: string | null;
  latestRunStatus: string | null;
  latestRunProductsScraped: number | null;
  latestRunErrors: unknown;
}

type MinimalPrisma = {
  retailer: {
    findMany: (input: {
      orderBy: { name: "asc" };
      select: {
        id: true;
        slug: true;
        name: true;
        status: true;
        _count: {
          select: {
            products: true;
            prices: true;
            contexts: true;
          };
        };
        prices: {
          orderBy: { observed_at: "desc" };
          take: 1;
          select: { observed_at: true };
        };
        contexts: {
          orderBy: { updated_at: "desc" };
          take: 1;
          select: { updated_at: true };
        };
        ingestion_runs: {
          orderBy: { started_at: "desc" };
          take: 5;
          select: {
            started_at: true;
            completed_at: true;
            status: true;
            products_scraped: true;
            errors_json: true;
          };
        };
      };
    }) => Promise<
      Array<{
        id: string;
        slug: string;
        name: string;
        status: string;
        _count: {
          products: number;
          prices: number;
          contexts: number;
        };
        prices: Array<{ observed_at: Date }>;
        contexts: Array<{ updated_at: Date }>;
        ingestion_runs: Array<{
          started_at: Date;
          completed_at: Date | null;
          status: string;
          products_scraped: number;
          errors_json: unknown;
        }>;
      }>
    >;
  };
};

export interface RetailerReadinessSummary {
  id: string;
  slug: string;
  name: string;
  status: string;
  readiness: ReadinessLevel;
  ingestionFreshness: FreshnessStatus;
  pricingFreshness: FreshnessStatus;
  productCount: number;
  priceCount: number;
  contextCount: number;
  latestAttemptedRunAt: string | null;
  latestSuccessfulRunAt: string | null;
  latestPriceObservedAt: string | null;
  latestContextUpdatedAt: string | null;
  latestRunStatus: string | null;
  latestRunProductsScraped: number | null;
  latestRunErrors: unknown;
}

export interface PricingReadinessReport {
  generatedAt: string;
  overall: ReadinessLevel;
  sourceMode: "live" | "seed_fallback";
  connectorMode: ConnectorMode;
  snapshotStoreMode: SnapshotStoreMode;
  dbConfigured: boolean;
  livePriceRetailerCount: number;
  liveReadyRetailerCount: number;
  seedPriceCount: number;
  seedCatalogLastUpdated: string | null;
  retailers: RetailerReadinessSummary[];
  notes: string[];
}

const FRESH_HOURS = 72;
const AGING_HOURS = 24 * 7;

function getConnectorMode(): ConnectorMode {
  return process.env.APIFY_TOKEN?.trim() ? "apify" : "fixture";
}

function getSnapshotStoreMode(): SnapshotStoreMode {
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() &&
    process.env.SNAPSHOT_BUCKET?.trim()
  ) {
    return "supabase";
  }

  if (process.env.SNAPSHOT_DIR?.trim() || process.env.TMPDIR?.trim()) {
    return "filesystem";
  }

  return "memory";
}

function latestSeedCatalogTimestamp(): string | null {
  const seedRows = pricesData as IngredientPrice[];
  const latest = seedRows.reduce<string | null>((current, row) => {
    if (!row.lastUpdated) return current;
    if (!current || row.lastUpdated > current) return row.lastUpdated;
    return current;
  }, null);

  return latest ? new Date(latest).toISOString() : null;
}

function freshnessForIso(iso: string | null, now: Date): FreshnessStatus {
  if (!iso) return "missing";
  const observedAt = new Date(iso);
  if (Number.isNaN(observedAt.getTime())) return "missing";

  const ageHours = (now.getTime() - observedAt.getTime()) / (1000 * 60 * 60);
  if (ageHours <= FRESH_HOURS) return "fresh";
  if (ageHours <= AGING_HOURS) return "aging";
  return "stale";
}

function computeRetailerReadiness(
  row: RetailerReadinessRow,
  now: Date,
  connectorMode: ConnectorMode,
): RetailerReadinessSummary {
  const pricingFreshness = freshnessForIso(row.latestPriceObservedAt, now);
  const ingestionFreshness = freshnessForIso(row.latestSuccessfulRunAt, now);

  let readiness: ReadinessLevel = "ready";
  if (row.productCount === 0 || row.priceCount === 0 || pricingFreshness === "missing") {
    readiness = "blocked";
  } else if (
    pricingFreshness === "stale" ||
    ingestionFreshness === "stale" ||
    ingestionFreshness === "missing" ||
    row.latestRunStatus === "failed"
  ) {
    readiness = "degraded";
  }

  if (connectorMode === "fixture") {
    readiness = readiness === "ready" ? "degraded" : readiness;
  }

  return {
    ...row,
    readiness,
    ingestionFreshness,
    pricingFreshness,
  };
}

export async function getPricingReadinessReport(): Promise<PricingReadinessReport> {
  const now = new Date();
  const seedRows = pricesData as IngredientPrice[];
  const seedCatalogLastUpdated = latestSeedCatalogTimestamp();
  const connectorMode = getConnectorMode();
  const snapshotStoreMode = getSnapshotStoreMode();
  const prisma = (await getOptionalPrisma()) as MinimalPrisma | null;

  const notes: string[] = [];
  if (!prisma) {
    notes.push("Database pricing is unavailable, so the app is relying on bundled seed prices.");
  }
  if (connectorMode === "fixture") {
    notes.push("Retailer ingestion is using local HTML fixtures because APIFY_TOKEN is not configured.");
  }
  if (snapshotStoreMode === "memory") {
    notes.push("Snapshots are not durable yet. Configure SNAPSHOT_BUCKET or SNAPSHOT_DIR before launch.");
  }

  if (!prisma) {
    return {
      generatedAt: now.toISOString(),
      overall: "blocked",
      sourceMode: "seed_fallback",
      connectorMode,
      snapshotStoreMode,
      dbConfigured: false,
      livePriceRetailerCount: 0,
      liveReadyRetailerCount: 0,
      seedPriceCount: seedRows.length,
      seedCatalogLastUpdated,
      retailers: [],
      notes,
    };
  }

  const rows = await prisma.retailer.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      status: true,
      _count: {
        select: {
          products: true,
          prices: true,
          contexts: true,
        },
      },
      prices: {
        orderBy: { observed_at: "desc" },
        take: 1,
        select: { observed_at: true },
      },
      contexts: {
        orderBy: { updated_at: "desc" },
        take: 1,
        select: { updated_at: true },
      },
      ingestion_runs: {
        orderBy: { started_at: "desc" },
        take: 5,
        select: {
          started_at: true,
          completed_at: true,
          status: true,
          products_scraped: true,
          errors_json: true,
        },
      },
    },
  });

  const retailers = rows.map((row) => {
    const latestRun = row.ingestion_runs[0] ?? null;
    const latestSuccessfulRun =
      row.ingestion_runs.find((run) => run.status === "completed") ?? null;

    return computeRetailerReadiness(
      {
        id: row.id,
        slug: row.slug,
        name: row.name,
        status: row.status,
        productCount: row._count.products,
        priceCount: row._count.prices,
        contextCount: row._count.contexts,
        latestAttemptedRunAt: latestRun?.started_at.toISOString() ?? null,
        latestSuccessfulRunAt: latestSuccessfulRun?.completed_at?.toISOString() ?? latestSuccessfulRun?.started_at.toISOString() ?? null,
        latestPriceObservedAt: row.prices[0]?.observed_at.toISOString() ?? null,
        latestContextUpdatedAt: row.contexts[0]?.updated_at.toISOString() ?? null,
        latestRunStatus: latestRun?.status ?? null,
        latestRunProductsScraped: latestRun?.products_scraped ?? null,
        latestRunErrors: latestRun?.errors_json ?? null,
      },
      now,
      connectorMode,
    );
  });

  const livePriceRetailerCount = retailers.filter((row) => row.priceCount > 0).length;
  const liveReadyRetailerCount = retailers.filter((row) => row.readiness === "ready").length;
  const sourceMode = livePriceRetailerCount > 0 ? "live" : "seed_fallback";
  const overall: ReadinessLevel =
    sourceMode === "seed_fallback" ? "blocked"
    : liveReadyRetailerCount >= 2 && connectorMode === "apify" && snapshotStoreMode !== "memory" ? "ready"
    : "degraded";

  return {
    generatedAt: now.toISOString(),
    overall,
    sourceMode,
    connectorMode,
    snapshotStoreMode,
    dbConfigured: true,
    livePriceRetailerCount,
    liveReadyRetailerCount,
    seedPriceCount: seedRows.length,
    seedCatalogLastUpdated,
    retailers,
    notes,
  };
}
