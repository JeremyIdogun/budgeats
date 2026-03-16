import { rankCandidates, type IngredientDescriptor, type MatchStatus, type ProductCandidate } from "@loavish/matching-engine";
import ingredientsData from "@/data/ingredients.json";
import pricesData from "@/data/prices.json";
import type { Ingredient, IngredientPrice, RetailerId } from "@/models";
import { buildRetailerProductUrl } from "@/lib/pricing-engine-adapter";

export interface ProductMatchReviewItem {
  retailerProductId: string;
  retailerId: RetailerId;
  retailerProductName: string;
  productUrl: string;
  matchStatus: MatchStatus | "approved" | "rejected";
  matchLabel: "exact" | "equivalent" | "substitute";
  matchScore: number;
  explanation: string;
  suggestedCanonical: Array<{
    ingredientId: string;
    ingredientName: string;
    score: number;
  }>;
}

const decisionOverrides = new Map<string, "approved" | "rejected">();

function parseRetailerId(value: string): RetailerId {
  const normalized = value.toLowerCase();
  if (
    normalized === "tesco" ||
    normalized === "sainsburys" ||
    normalized === "aldi" ||
    normalized === "lidl" ||
    normalized === "asda" ||
    normalized === "morrisons" ||
    normalized === "waitrose" ||
    normalized === "coop" ||
    normalized === "ocado"
  ) {
    return normalized;
  }
  return "tesco";
}

function ingredientDescriptors(): Array<IngredientDescriptor & { ingredientId: string }> {
  return (ingredientsData as Ingredient[]).map((ingredient) => ({
    ingredientId: ingredient.id,
    name: ingredient.name,
    category: ingredient.category,
    requiredSizeBaseUnit: ingredient.storageQuantity,
  }));
}

function buildRecords(): ProductMatchReviewItem[] {
  const descriptors = ingredientDescriptors();

  const derivedFromPrices: ProductCandidate[] = (pricesData as IngredientPrice[])
    .slice(0, 30)
    .map((price) => {
      const ingredient = (ingredientsData as Ingredient[]).find((item) => item.id === price.ingredientId);
      return {
        retailerProductId: `${price.retailerId}:${price.ingredientId}`,
        name: price.productName ?? ingredient?.name ?? price.ingredientId,
        category: ingredient?.category,
        sizeBaseUnit: ingredient?.storageQuantity ?? 1,
      };
    });

  const syntheticCandidates: ProductCandidate[] = [
    {
      retailerProductId: "review:veg-medley",
      name: "Mediterranean veggie medley pack",
      category: "frozen",
      sizeBaseUnit: 700,
    },
    {
      retailerProductId: "review:soup-mix",
      name: "Hearty soup vegetable mix",
      category: "fruit-veg",
      sizeBaseUnit: 500,
    },
    {
      retailerProductId: "unmatched:party-napkins",
      name: "Party napkins 50 pack",
      category: "other",
      sizeBaseUnit: 50,
    },
    {
      retailerProductId: "unmatched:pet-food",
      name: "Premium cat food selection",
      category: "other",
      sizeBaseUnit: 400,
    },
  ];

  const allCandidates = [...derivedFromPrices, ...syntheticCandidates];

  return allCandidates.map((candidate, index) => {
    const ranked = descriptors
      .map((descriptor) => {
        const [result] = rankCandidates(descriptor, [candidate]);
        return {
          ...result,
          ingredientId: descriptor.ingredientId,
          ingredientName: descriptor.name,
        };
      })
      .sort((left, right) => right.matchScore - left.matchScore);

    const top = ranked[0];
    const suggestions = ranked.slice(0, 3).map((entry) => ({
      ingredientId: entry.ingredientId,
      ingredientName: entry.ingredientName,
      score: entry.matchScore,
    }));

    const retailerId = parseRetailerId(candidate.retailerProductId.split(":")[0] ?? "tesco");
    const forcedStatus: MatchStatus | null =
      candidate.retailerProductId.startsWith("review:") ? "review"
      : candidate.retailerProductId.startsWith("unmatched:") ? "unmatched"
      : null;

    return {
      retailerProductId: candidate.retailerProductId || `candidate-${index}`,
      retailerId,
      retailerProductName: candidate.name,
      productUrl: buildRetailerProductUrl(retailerId, candidate.name),
      matchStatus: forcedStatus ?? top.status,
      matchLabel: top.matchLabel,
      matchScore: top.matchScore,
      explanation: top.explanation,
      suggestedCanonical: suggestions,
    };
  });
}

const baseRows = buildRecords();

function withOverride(item: ProductMatchReviewItem): ProductMatchReviewItem {
  const override = decisionOverrides.get(item.retailerProductId);
  if (!override) return item;
  return { ...item, matchStatus: override };
}

export function listReviewQueue(): ProductMatchReviewItem[] {
  return baseRows
    .map(withOverride)
    .filter((item) => item.matchStatus === "review")
    .sort((left, right) => right.matchScore - left.matchScore);
}

export function listUnmatchedProducts(): ProductMatchReviewItem[] {
  return baseRows
    .map(withOverride)
    .filter((item) => item.matchStatus === "unmatched")
    .sort((left, right) => left.matchScore - right.matchScore);
}

export function setMatchDecision(input: {
  retailerProductId: string;
  decision: "approved" | "rejected";
}): ProductMatchReviewItem {
  const row = baseRows.find((item) => item.retailerProductId === input.retailerProductId);
  if (!row) {
    throw new Error(`Unknown retailerProductId: ${input.retailerProductId}`);
  }

  decisionOverrides.set(input.retailerProductId, input.decision);
  return withOverride(row);
}
