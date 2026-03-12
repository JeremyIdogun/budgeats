import type {
  BootstrapInput,
  NormalizedRetailerProduct,
  RawProduct,
  RetailerConnector,
  RetailerContext,
} from "../../../packages/retailer-connectors/src/types";
import { recordIngestionRun, type IngestionRunSink, type IngestionRunStatus } from "./ingestion-runs";
import { logEvent } from "./logger";

export interface IngestionPersistence {
  resolveRetailerIdBySlug(slug: string): Promise<string>;
  upsertRetailerContext(input: { retailerId: string; context: RetailerContext }): Promise<void>;
  upsertRetailerProduct(input: { retailerId: string; product: NormalizedRetailerProduct }): Promise<void>;
}

export interface RunIngestionJobInput {
  retailerSlug: string;
  connector: RetailerConnector;
  persistence: IngestionPersistence;
  runSink: IngestionRunSink;
  postcode?: string;
  loyaltyEnabled?: boolean;
  locale?: string;
  searchQueries?: string[];
  categoryIds?: string[];
  now?: Date;
}

export interface IngestionJobResult {
  retailerId: string;
  startedAt: string;
  completedAt: string;
  status: IngestionRunStatus;
  productsScraped: number;
  errors: string[];
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function uniqueByRetailerProductId(rows: RawProduct[]): RawProduct[] {
  const deduped = new Map<string, RawProduct>();
  for (const row of rows) {
    if (!row.retailer_product_id) continue;
    deduped.set(row.retailer_product_id, row);
  }
  return Array.from(deduped.values());
}

export async function runIngestionJob(input: RunIngestionJobInput): Promise<IngestionJobResult> {
  const startedAt = input.now ?? new Date();
  const startedAtMs = Date.now();
  const errors: string[] = [];
  let productsScraped = 0;

  const retailerId = await input.persistence.resolveRetailerIdBySlug(input.retailerSlug);

  try {
    const bootstrap: BootstrapInput = {
      retailerId: input.retailerSlug,
      postcode: input.postcode,
      loyaltyEnabled: input.loyaltyEnabled,
      locale: input.locale,
    };
    const context = await input.connector.bootstrapContext(bootstrap);
    await input.persistence.upsertRetailerContext({ retailerId, context });

    const searchQueries = input.searchQueries ?? ["milk", "pasta", "tomatoes"];
    const categoryIds = input.categoryIds ?? [];
    const rawProducts: RawProduct[] = [];

    for (const query of searchQueries) {
      try {
        rawProducts.push(...(await input.connector.searchProducts(query, context)));
      } catch (error) {
        errors.push(`search:${query} -> ${errorMessage(error)}`);
      }
    }

    for (const categoryId of categoryIds) {
      try {
        rawProducts.push(...(await input.connector.fetchCategory(categoryId, context)));
      } catch (error) {
        errors.push(`category:${categoryId} -> ${errorMessage(error)}`);
      }
    }

    for (const row of uniqueByRetailerProductId(rawProducts)) {
      try {
        const normalized = input.connector.normalizeRawProduct(row);
        await input.persistence.upsertRetailerProduct({ retailerId, product: normalized });
        productsScraped += 1;
      } catch (error) {
        errors.push(`product:${row.retailer_product_id} -> ${errorMessage(error)}`);
      }
    }

    const completedAt = new Date();
    const status: IngestionRunStatus =
      productsScraped > 0 || errors.length === 0 ? "completed" : "failed";

    await recordIngestionRun({
      sink: input.runSink,
      retailerId,
      startedAt,
      completedAt,
      status,
      productsScraped,
      errors: errors.length > 0 ? { errors } : null,
    });

    logEvent({
      event: "ingestion.run.completed",
      retailer_id: retailerId,
      duration_ms: Date.now() - startedAtMs,
      products_scraped: productsScraped,
      matched: productsScraped,
      review_queue: 0,
      unmatched: 0,
      errors: errors.length,
    });

    return {
      retailerId,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      status,
      productsScraped,
      errors,
    };
  } catch (error) {
    const completedAt = new Date();
    const failureMessage = errorMessage(error);
    errors.push(failureMessage);

    await recordIngestionRun({
      sink: input.runSink,
      retailerId,
      startedAt,
      completedAt,
      status: "failed",
      productsScraped,
      errors: { errors },
    });

    logEvent({
      event: "ingestion.run.failed",
      retailer_id: retailerId,
      duration_ms: Date.now() - startedAtMs,
      products_scraped: productsScraped,
      matched: 0,
      review_queue: 0,
      unmatched: 0,
      errors: errors.length,
      error: failureMessage,
    });

    return {
      retailerId,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      status: "failed",
      productsScraped,
      errors,
    };
  }
}

type MinimalPrismaClient = {
  retailer: {
    findUnique: (input: {
      where: { slug: string };
      select: { id: true };
    }) => Promise<{ id: string } | null>;
  };
  retailerContext: {
    upsert: (input: {
      where: { retailer_id_context_key: { retailer_id: string; context_key: string } };
      create: {
        retailer_id: string;
        context_key: string;
        context_json: unknown;
        postcode: string | null;
        store_id: string | null;
        loyalty_enabled: boolean;
      };
      update: {
        context_json: unknown;
        postcode: string | null;
        store_id: string | null;
        loyalty_enabled: boolean;
      };
    }) => Promise<unknown>;
  };
  retailerProduct: {
    upsert: (input: {
      where: {
        retailer_id_retailer_product_id: {
          retailer_id: string;
          retailer_product_id: string;
        };
      };
      create: {
        retailer_id: string;
        retailer_product_id: string;
        name: string;
        brand: string | null;
        category: string | null;
        pack_size_raw: string | null;
        image_url: string | null;
        product_url: string;
        scraped_at: Date;
      };
      update: {
        name: string;
        brand: string | null;
        category: string | null;
        pack_size_raw: string | null;
        image_url: string | null;
        product_url: string;
        scraped_at: Date;
      };
      select: { id: true };
    }) => Promise<{ id: string }>;
  };
  retailerPrice: {
    create: (input: {
      data: {
        retailer_id: string;
        retailer_product_id: string;
        base_price_pence: number;
        promo_price_pence: number | null;
        loyalty_price_pence: number | null;
        loyalty_scheme: string | null;
        observed_at: Date;
      };
    }) => Promise<unknown>;
  };
};

export function createPrismaIngestionPersistence(prisma: MinimalPrismaClient): IngestionPersistence {
  return {
    async resolveRetailerIdBySlug(slug: string): Promise<string> {
      const retailer = await prisma.retailer.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!retailer) {
        throw new Error(`Retailer not found for slug=${slug}`);
      }
      return retailer.id;
    },

    async upsertRetailerContext(input): Promise<void> {
      const contextKey = input.context.postcode
        ? `postcode:${input.context.postcode}`
        : "default";

      await prisma.retailerContext.upsert({
        where: {
          retailer_id_context_key: {
            retailer_id: input.retailerId,
            context_key: contextKey,
          },
        },
        create: {
          retailer_id: input.retailerId,
          context_key: contextKey,
          context_json: input.context,
          postcode: input.context.postcode ?? null,
          store_id: input.context.storeId ?? null,
          loyalty_enabled: input.context.loyaltyEnabled,
        },
        update: {
          context_json: input.context,
          postcode: input.context.postcode ?? null,
          store_id: input.context.storeId ?? null,
          loyalty_enabled: input.context.loyaltyEnabled,
        },
      });
    },

    async upsertRetailerProduct(input): Promise<void> {
      const scrapedAt = new Date(input.product.scraped_at);
      const product = await prisma.retailerProduct.upsert({
        where: {
          retailer_id_retailer_product_id: {
            retailer_id: input.retailerId,
            retailer_product_id: input.product.retailer_product_id,
          },
        },
        create: {
          retailer_id: input.retailerId,
          retailer_product_id: input.product.retailer_product_id,
          name: input.product.name,
          brand: input.product.brand ?? null,
          category: input.product.category ?? null,
          pack_size_raw: input.product.pack_size_raw ?? null,
          image_url: input.product.image_url ?? null,
          product_url: input.product.product_url,
          scraped_at: scrapedAt,
        },
        update: {
          name: input.product.name,
          brand: input.product.brand ?? null,
          category: input.product.category ?? null,
          pack_size_raw: input.product.pack_size_raw ?? null,
          image_url: input.product.image_url ?? null,
          product_url: input.product.product_url,
          scraped_at: scrapedAt,
        },
        select: { id: true },
      });

      await prisma.retailerPrice.create({
        data: {
          retailer_id: input.retailerId,
          retailer_product_id: product.id,
          base_price_pence: input.product.base_price_pence,
          promo_price_pence: input.product.promo_price_pence ?? null,
          loyalty_price_pence: input.product.loyalty_price_pence ?? null,
          loyalty_scheme: input.product.loyalty_scheme ?? null,
          observed_at: scrapedAt,
        },
      });
    },
  };
}
