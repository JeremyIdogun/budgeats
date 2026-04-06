import { rankCandidates, type IngredientDescriptor, type ProductCandidate } from "@loavish/matching-engine";
import { normalizeToBaseUnit, parsePackSize } from "../../../packages/shared/src/units";
import ingredientsData from "@/data/ingredients.json";
import pricesData from "@/data/prices.json";
import type { Ingredient, IngredientPrice, RetailerId } from "@/models";
import { getOptionalPrisma } from "./optional-prisma";

interface LoadIngredientPricesInput {
  ingredientIds?: string[];
  retailerIds?: RetailerId[];
}

type RetailerPriceRow = {
  observed_at: Date;
  base_price_pence: number;
  promo_price_pence: number | null;
  loyalty_price_pence: number | null;
  loyalty_scheme: string | null;
  retailer: {
    slug: string;
    name: string;
  };
  product: {
    id: string;
    name: string;
    category: string | null;
    pack_size_raw: string | null;
  };
};

type MinimalPrisma = {
  retailerPrice: {
    findMany: (input: {
      orderBy: { observed_at: "desc" };
      take: number;
      include: {
        retailer: { select: { slug: true; name: true } };
        product: { select: { id: true; name: true; category: true; pack_size_raw: true } };
      };
    }) => Promise<RetailerPriceRow[]>;
  };
};

type IngredientDescriptorRow = IngredientDescriptor & {
  ingredientId: string;
  storageQuantity: number;
};

const INGREDIENT_ALIASES: Partial<Record<Ingredient["id"], string[]>> = {
  "rolled-oats": ["rolled oats", "oats"],
  "wholemeal-bread": ["wholemeal bread"],
  "cherry-tomatoes": ["cherry tomatoes"],
  "mixed-veg": ["mixed vegetables", "frozen mixed vegetables"],
  "tomato-soup": ["tomato soup"],
  "chicken-breast": ["chicken breast"],
  "beef-mince-500g": ["beef mince", "minced beef"],
  "tinned-tomatoes": ["tinned tomatoes", "chopped tomatoes"],
  "olive-oil": ["olive oil"],
  "red-lentils": ["red lentils"],
  "coconut-milk": ["coconut milk"],
  "salmon-fillets": ["salmon fillet", "salmon fillets"],
  "green-beans": ["green beans"],
};

function isRetailerId(value: string): value is RetailerId {
  return (
    value === "tesco" ||
    value === "sainsburys" ||
    value === "aldi" ||
    value === "lidl" ||
    value === "asda" ||
    value === "morrisons" ||
    value === "waitrose" ||
    value === "coop" ||
    value === "ocado"
  );
}

function loyaltySchemeFromValue(value: string | null): IngredientPrice["loyaltyScheme"] {
  if (value === "clubcard" || value === "nectar" || value === "none") return value;
  return "none";
}

function buildIngredientDescriptors(
  ingredients: Ingredient[],
  ingredientFilter?: Set<string>,
): IngredientDescriptorRow[] {
  return ingredients
    .filter((ingredient) => !ingredientFilter || ingredientFilter.has(ingredient.id))
    .flatMap((ingredient) => {
      const names = [ingredient.name, ...(INGREDIENT_ALIASES[ingredient.id] ?? [])];
      return names.map((name) => ({
        ingredientId: ingredient.id,
        storageQuantity: ingredient.storageQuantity,
        name,
        category: ingredient.category,
        requiredSizeBaseUnit: ingredient.storageQuantity,
      }));
    });
}

function candidateSizeBaseUnit(packSizeRaw: string | null): number | null {
  if (!packSizeRaw) return null;
  try {
    const parsed = parsePackSize(packSizeRaw);
    return normalizeToBaseUnit(parsed.quantity, parsed.unit);
  } catch {
    return null;
  }
}

function scalePriceForIngredient(
  pricePence: number | null,
  ingredientStorageQuantity: number,
  candidateSize: number | null,
): number | null {
  if (pricePence == null) return null;
  if (!candidateSize || candidateSize <= 0) return pricePence;
  return Math.max(1, Math.round((pricePence * ingredientStorageQuantity) / candidateSize));
}

function inferOwnLabel(retailerName: string, productName: string): boolean {
  return productName.toLowerCase().includes(retailerName.toLowerCase());
}

function bestIngredientMatch(
  candidate: ProductCandidate,
  descriptors: IngredientDescriptorRow[],
): { ingredientId: string; storageQuantity: number } | null {
  const rankedByIngredient = new Map<
    string,
    { ingredientId: string; storageQuantity: number; matchScore: number }
  >();

  for (const descriptor of descriptors) {
    const [result] = rankCandidates(descriptor, [candidate]);
    const existing = rankedByIngredient.get(descriptor.ingredientId);
    if (!existing || result.matchScore > existing.matchScore) {
      rankedByIngredient.set(descriptor.ingredientId, {
        ingredientId: descriptor.ingredientId,
        storageQuantity: descriptor.storageQuantity,
        matchScore: result.matchScore,
      });
    }
  }

  const ranked = [...rankedByIngredient.values()].sort((left, right) => right.matchScore - left.matchScore);
  const top = ranked[0];
  const runnerUp = ranked[1];

  if (!top || top.matchScore < 0.68) return null;
  if (runnerUp && top.matchScore - runnerUp.matchScore < 0.05) return null;

  return {
    ingredientId: top.ingredientId,
    storageQuantity: top.storageQuantity,
  };
}

export async function loadIngredientPrices(input: LoadIngredientPricesInput = {}): Promise<IngredientPrice[]> {
  const seedPrices = (pricesData as IngredientPrice[]).filter((price) => {
    const matchesIngredient = !input.ingredientIds || input.ingredientIds.includes(price.ingredientId);
    const matchesRetailer = !input.retailerIds || input.retailerIds.includes(price.retailerId);
    return matchesIngredient && matchesRetailer;
  });

  const prisma = (await getOptionalPrisma()) as MinimalPrisma | null;
  if (!prisma) return seedPrices;

  try {
    const ingredients = ingredientsData as Ingredient[];
    const ingredientFilter = input.ingredientIds ? new Set(input.ingredientIds) : undefined;
    const descriptors = buildIngredientDescriptors(ingredients, ingredientFilter);

    const rows = await prisma.retailerPrice.findMany({
      orderBy: { observed_at: "desc" },
      take: 1500,
      include: {
        retailer: { select: { slug: true, name: true } },
        product: { select: { id: true, name: true, category: true, pack_size_raw: true } },
      },
    });

    const latestByProduct = new Map<string, RetailerPriceRow>();
    for (const row of rows) {
      if (!latestByProduct.has(row.product.id)) {
        latestByProduct.set(row.product.id, row);
      }
    }

    const merged = new Map(seedPrices.map((price) => [`${price.ingredientId}::${price.retailerId}`, price]));

    for (const row of latestByProduct.values()) {
      if (!isRetailerId(row.retailer.slug)) continue;
      if (input.retailerIds && !input.retailerIds.includes(row.retailer.slug)) continue;

      const candidate: ProductCandidate = {
        retailerProductId: row.product.id,
        name: row.product.name,
        category: row.product.category ?? undefined,
        sizeBaseUnit: candidateSizeBaseUnit(row.product.pack_size_raw) ?? undefined,
      };

      const match = bestIngredientMatch(candidate, descriptors);
      if (!match) continue;

      const scaledBase = scalePriceForIngredient(
        row.base_price_pence,
        match.storageQuantity,
        candidate.sizeBaseUnit ?? null,
      );
      if (scaledBase == null) continue;

      const price: IngredientPrice = {
        ingredientId: match.ingredientId,
        retailerId: row.retailer.slug,
        pricePerStorageUnit: scaledBase,
        promoPricePence: scalePriceForIngredient(
          row.promo_price_pence,
          match.storageQuantity,
          candidate.sizeBaseUnit ?? null,
        ) ?? undefined,
        loyaltyPricePence: scalePriceForIngredient(
          row.loyalty_price_pence,
          match.storageQuantity,
          candidate.sizeBaseUnit ?? null,
        ) ?? undefined,
        loyaltyScheme: loyaltySchemeFromValue(row.loyalty_scheme),
        isOwnLabel: inferOwnLabel(row.retailer.name, row.product.name),
        lastUpdated: row.observed_at.toISOString(),
        productName: row.product.name,
      };

      merged.set(`${price.ingredientId}::${price.retailerId}`, price);
    }

    return [...merged.values()];
  } catch {
    return seedPrices;
  }
}
