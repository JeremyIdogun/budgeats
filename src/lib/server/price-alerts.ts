import type { IngredientPrice, RetailerId } from "@/models";
import { getOptionalPrisma } from "@/lib/server/optional-prisma";
import { loadIngredientPrices } from "@/lib/server/ingredient-prices";

export interface PriceAlertRow {
  id: string;
  user_id: string;
  canonical_ingredient_id: string;
  retailer_id: string | null;
  threshold_price_pence: number;
  last_notified_price_pence: number | null;
  is_active: boolean;
  triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

type MinimalPrisma = {
  priceAlert: {
    create: (input: {
      data: {
        user_id: string;
        canonical_ingredient_id: string;
        retailer_id: RetailerId | null;
        threshold_price_pence: number;
        is_active: boolean;
      };
    }) => Promise<{
      id: string;
      user_id: string;
      canonical_ingredient_id: string;
      retailer_id: string | null;
      threshold_price_pence: number;
      last_notified_price_pence: number | null;
      is_active: boolean;
      triggered_at: Date | null;
      created_at: Date;
      updated_at: Date;
    }>;
    findMany: (input: {
      where: { user_id?: string; is_active: boolean };
      orderBy: { created_at: "desc" };
    }) => Promise<Array<{
      id: string;
      user_id: string;
      canonical_ingredient_id: string;
      retailer_id: string | null;
      threshold_price_pence: number;
      last_notified_price_pence: number | null;
      is_active: boolean;
      triggered_at: Date | null;
      created_at: Date;
      updated_at: Date;
    }>>;
  };
};

async function resolveCurrentPrice(
  ingredientId: string,
  retailerId: string | null,
): Promise<number | null> {
  const prices = (await loadIngredientPrices({
    ingredientIds: [ingredientId],
    retailerIds: retailerId ? [retailerId as RetailerId] : undefined,
  })) as IngredientPrice[];

  const relevant = prices.filter((row) => {
    if (row.ingredientId !== ingredientId) return false;
    return retailerId ? row.retailerId === retailerId : true;
  });

  if (relevant.length === 0) return null;
  return relevant.reduce<number | null>((best, row) => {
    if (best === null || row.pricePerStorageUnit < best) return row.pricePerStorageUnit;
    return best;
  }, null);
}

export async function createPriceAlert(input: {
  userId: string;
  ingredientId: string;
  retailerId: RetailerId | null;
  thresholdPricePence: number;
}): Promise<PriceAlertRow> {
  const prisma = (await getOptionalPrisma()) as MinimalPrisma | null;
  if (!prisma) {
    throw new Error("Persistent price-alert storage is unavailable");
  }

  const row = await prisma.priceAlert.create({
    data: {
      user_id: input.userId,
      canonical_ingredient_id: input.ingredientId,
      retailer_id: input.retailerId,
      threshold_price_pence: input.thresholdPricePence,
      is_active: true,
    },
  });
  return {
    id: row.id,
    user_id: row.user_id,
    canonical_ingredient_id: row.canonical_ingredient_id,
    retailer_id: row.retailer_id,
    threshold_price_pence: row.threshold_price_pence,
    last_notified_price_pence: row.last_notified_price_pence,
    is_active: row.is_active,
    triggered_at: row.triggered_at ? row.triggered_at.toISOString() : null,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  };
}

export async function listPriceAlerts(input?: { userId?: string }): Promise<PriceAlertRow[]> {
  const prisma = (await getOptionalPrisma()) as MinimalPrisma | null;
  if (!prisma) {
    throw new Error("Persistent price-alert storage is unavailable");
  }

  const rows = await prisma.priceAlert.findMany({
    where: {
      user_id: input?.userId ?? undefined,
      is_active: true,
    },
    orderBy: { created_at: "desc" },
  });
  return rows.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    canonical_ingredient_id: row.canonical_ingredient_id,
    retailer_id: row.retailer_id,
    threshold_price_pence: row.threshold_price_pence,
    last_notified_price_pence: row.last_notified_price_pence,
    is_active: row.is_active,
    triggered_at: row.triggered_at ? row.triggered_at.toISOString() : null,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  }));
}

export async function runPriceAlertsCheck(): Promise<{
  checked: number;
  triggered: number;
  rows: PriceAlertRow[];
}> {
  const rows = await listPriceAlerts();
  const now = new Date().toISOString();
  let triggered = 0;
  const updated: PriceAlertRow[] = [];

  for (const row of rows) {
    const current = await resolveCurrentPrice(row.canonical_ingredient_id, row.retailer_id);
    if (current !== null && current <= row.threshold_price_pence) {
      row.last_notified_price_pence = current;
      row.triggered_at = now;
      row.updated_at = now;
      triggered += 1;
    }
    updated.push(row);
  }

  return {
    checked: rows.length,
    triggered,
    rows: updated,
  };
}
