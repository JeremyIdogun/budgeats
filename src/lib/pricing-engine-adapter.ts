import {
  computeCheapestMixedRetailer,
  computeCheapestSingleRetailer,
  computeMealCostPence,
  resolveIngredientPrice,
  type BasketMealInput,
  type IngredientOption,
  type MealCostInput,
  type WeekPlanContext,
} from "@loavish/pricing-engine";
import type { Ingredient, IngredientPrice, Meal, RetailerId } from "@/models";

type MatchLabel = "exact" | "equivalent" | "substitute";

export interface PricedIngredientOption {
  retailerId: RetailerId;
  pricePence: number;
  productName: string;
  productUrl: string;
}

export interface IngredientPricingResult {
  ingredientId: string;
  ingredientName: string;
  pricePence: number;
  retailerId: RetailerId;
  matchLabel: MatchLabel;
  explanation: string;
  chosenProductName: string;
  productUrl: string;
  alternativeOptions: PricedIngredientOption[];
}

export interface MealPricingResult {
  mealId: string;
  mealName: string;
  retailerId: RetailerId;
  totalCostPence: number;
  wastePenaltyPence: number;
  explanation: string;
}

export interface BasketPricingResult {
  singleRetailer: {
    retailerId: RetailerId | null;
    totalCostPence: number;
    explanation: string;
    breakdown: Record<RetailerId, number>;
  };
  mixedRetailer: {
    totalCostPence: number;
    explanation: string;
    breakdown: Record<RetailerId, number>;
  };
}

const RETAILER_SEARCH_BASE: Record<RetailerId, string> = {
  tesco: "https://www.tesco.com/groceries/en-GB/search?query=",
  sainsburys: "https://www.sainsburys.co.uk/gol-ui/SearchResults/",
  aldi: "https://groceries.aldi.co.uk/en-GB/search?text=",
  lidl: "https://www.lidl.co.uk/search?query=",
  asda: "https://groceries.asda.com/search/",
  morrisons: "https://groceries.morrisons.com/search?entry=",
  waitrose: "https://www.waitrose.com/ecom/shop/search?searchTerm=",
  coop: "https://shop.coop.co.uk/search?query=",
  ocado: "https://www.ocado.com/search?entry=",
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

export function toRetailerId(value: string | null | undefined): RetailerId | null {
  if (!value) return null;
  const normalized = value.toLowerCase().trim();
  return isRetailerId(normalized) ? normalized : null;
}

export function parseBooleanFlag(value: string | null | undefined): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase().trim();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export function buildRetailerProductUrl(retailerId: RetailerId, ingredientName: string): string {
  const base = RETAILER_SEARCH_BASE[retailerId];
  return `${base}${encodeURIComponent(ingredientName)}`;
}

function wasteHalfLifeDaysForCategory(category: Ingredient["category"]): number {
  if (category === "meat-fish") return 2;
  if (category === "fruit-veg") return 5;
  if (category === "dairy-eggs") return 7;
  if (category === "frozen") return 150;
  if (category === "tinned-dried" || category === "condiments" || category === "grains-pasta") return 180;
  return 30;
}

function normalizeRecipeQuantity(quantity: number, unit: string, storageUnit: Ingredient["storageUnit"]): number {
  if (unit === storageUnit) return quantity;
  if (unit === "tbsp" && storageUnit === "ml") return quantity * 15;
  if (unit === "tsp" && storageUnit === "ml") return quantity * 5;
  return quantity;
}

function optionFromPrice(price: IngredientPrice, ingredient: Ingredient): IngredientOption {
  return {
    retailerProductId: `${price.retailerId}:${price.ingredientId}`,
    retailerId: price.retailerId,
    name: price.productName ?? ingredient.name,
    packSizeBaseUnit: Math.max(ingredient.storageQuantity, 1),
    prices: {
      base_price_pence: price.pricePerStorageUnit,
      promo_price_pence: price.promoPricePence ?? undefined,
      loyalty_price_pence: price.loyaltyPricePence ?? undefined,
    },
    isOwnLabel: price.isOwnLabel,
  };
}

function buildResolutionOptions(
  ingredient: Ingredient,
  prices: IngredientPrice[],
  preferredRetailers: RetailerId[],
): IngredientOption[] {
  const preferred = preferredRetailers.length > 0
    ? prices.filter((price) => preferredRetailers.includes(price.retailerId))
    : prices;

  const source = preferred.length > 0 ? preferred : prices;
  return source.map((price) => optionFromPrice(price, ingredient));
}

export function resolveIngredientPricing(input: {
  ingredient: Ingredient;
  prices: IngredientPrice[];
  preferredRetailers: RetailerId[];
  loyaltyEnabled: boolean;
  forcedRetailerId?: RetailerId;
}): IngredientPricingResult {
  const options = buildResolutionOptions(input.ingredient, input.prices, input.preferredRetailers);
  if (options.length === 0) {
    throw new Error(`No price options available for ingredient ${input.ingredient.id}`);
  }

  const effectiveOptions = input.forcedRetailerId
    ? options.filter((option) => option.retailerId === input.forcedRetailerId)
    : options;

  if (effectiveOptions.length === 0 && input.forcedRetailerId) {
    throw new Error(`No prices available at retailer ${input.forcedRetailerId} for ${input.ingredient.name}`);
  }

  const resolution = resolveIngredientPrice({
    ingredientName: input.ingredient.name,
    exactProductMatches: effectiveOptions,
    canonicalIngredientMatches: [],
    approvedSubstitutes: [],
    cheapestValidOptions: options,
    loyaltyEnabled: input.loyaltyEnabled,
  });

  const alternatives = effectiveOptions
    .filter((option) => option.retailerProductId !== resolution.chosenOption.retailerProductId)
    .map((option) => ({
      retailerId: option.retailerId as RetailerId,
      pricePence: option.prices.base_price_pence,
      productName: option.name,
      productUrl: buildRetailerProductUrl(option.retailerId as RetailerId, input.ingredient.name),
    }))
    .sort((left, right) => left.pricePence - right.pricePence);

  return {
    ingredientId: input.ingredient.id,
    ingredientName: input.ingredient.name,
    pricePence: resolution.pricePence,
    retailerId: resolution.chosenOption.retailerId as RetailerId,
    matchLabel: resolution.matchLabel,
    explanation: resolution.explanation,
    chosenProductName: resolution.chosenOption.name,
    productUrl: buildRetailerProductUrl(
      resolution.chosenOption.retailerId as RetailerId,
      input.ingredient.name,
    ),
    alternativeOptions: alternatives,
  };
}

function buildMealCostInput(input: {
  meal: Meal;
  ingredientsById: Map<string, Ingredient>;
  prices: IngredientPrice[];
  preferredRetailers: RetailerId[];
  householdSize: number;
}): MealCostInput {
  return {
    id: input.meal.id,
    name: input.meal.name,
    ingredients: input.meal.ingredients
      .filter((entry) => !entry.optional)
      .map((entry) => {
        const ingredient = input.ingredientsById.get(entry.ingredientId);
        if (!ingredient) {
          throw new Error(`Ingredient not found: ${entry.ingredientId}`);
        }
        const ingredientPrices = input.prices.filter((price) => price.ingredientId === ingredient.id);
        const options = buildResolutionOptions(ingredient, ingredientPrices, input.preferredRetailers);
        if (options.length === 0) {
          throw new Error(`No prices found for ingredient ${ingredient.id}`);
        }

        const scaledQuantity = (entry.quantity * Math.max(input.householdSize, 1)) / Math.max(input.meal.basePortions, 1);
        return {
          ingredientName: ingredient.name,
          recipeRequiredQuantity: normalizeRecipeQuantity(
            scaledQuantity,
            entry.unit,
            ingredient.storageUnit,
          ),
          reuseInWeekPlan: 0,
          reuseDaysFromNow: 0,
          wasteHalfLifeDays: wasteHalfLifeDaysForCategory(ingredient.category),
          priceInput: {
            ingredientName: ingredient.name,
            exactProductMatches: options,
            canonicalIngredientMatches: [],
            approvedSubstitutes: [],
            cheapestValidOptions: options,
            loyaltyEnabled: false,
          },
        };
      }),
  };
}

export function computeMealPricing(input: {
  meal: Meal;
  ingredients: Ingredient[];
  prices: IngredientPrice[];
  preferredRetailers: RetailerId[];
  loyaltyEnabled: boolean;
  householdSize: number;
  forcedRetailerId?: RetailerId;
  weekPlan?: WeekPlanContext;
}): MealPricingResult {
  const ingredientsById = new Map(input.ingredients.map((ingredient) => [ingredient.id, ingredient]));
  const mealCostInput = buildMealCostInput({
    meal: input.meal,
    ingredientsById,
    prices: input.prices,
    preferredRetailers: input.preferredRetailers,
    householdSize: input.householdSize,
  });

  const fallbackRetailers = input.preferredRetailers.length > 0
    ? input.preferredRetailers
    : (["tesco"] as RetailerId[]);
  const candidateRetailers = input.forcedRetailerId ? [input.forcedRetailerId] : fallbackRetailers;

  let best: MealPricingResult | null = null;
  for (const retailerId of candidateRetailers) {
    const result = computeMealCostPence(
      mealCostInput,
      input.weekPlan ?? { weekStartDate: new Date().toISOString().slice(0, 10) },
      retailerId,
      input.loyaltyEnabled,
    );

    const priced: MealPricingResult = {
      mealId: input.meal.id,
      mealName: input.meal.name,
      retailerId,
      totalCostPence: result.totalCostPence,
      wastePenaltyPence: result.wastePenaltyPence,
      explanation: `${result.explanation}. Computed for ${retailerId}.`,
    };

    if (!best || priced.totalCostPence < best.totalCostPence) {
      best = priced;
    }
  }

  if (!best) {
    throw new Error(`Unable to price meal ${input.meal.id}`);
  }

  return best;
}

function buildBasketMealInput(input: {
  meals: Meal[];
  ingredientsById: Map<string, Ingredient>;
  prices: IngredientPrice[];
  retailerIds: RetailerId[];
}): BasketMealInput {
  const lines: BasketMealInput["ingredients"] = [];

  for (const meal of input.meals) {
    for (const ingredientEntry of meal.ingredients) {
      if (ingredientEntry.optional) continue;
      const ingredient = input.ingredientsById.get(ingredientEntry.ingredientId);
      if (!ingredient) continue;

      const options = input.prices
        .filter((price) => price.ingredientId === ingredient.id && input.retailerIds.includes(price.retailerId))
        .map((price) => ({
          retailerId: price.retailerId,
          option: optionFromPrice(price, ingredient),
        }));

      if (options.length === 0) continue;
      lines.push({
        ingredientName: ingredient.name,
        options,
      });
    }
  }

  return {
    id: "basket",
    name: "Weekly Basket",
    ingredients: lines,
  };
}

function normalizeBreakdown(input: Record<string, number>): Record<RetailerId, number> {
  const normalized: Record<RetailerId, number> = {
    tesco: 0,
    sainsburys: 0,
    aldi: 0,
    lidl: 0,
    asda: 0,
    morrisons: 0,
    waitrose: 0,
    coop: 0,
    ocado: 0,
  };

  for (const [retailerId, total] of Object.entries(input)) {
    if (isRetailerId(retailerId)) {
      normalized[retailerId] = total;
    }
  }

  return normalized;
}

export function computeBasketPricing(input: {
  meals: Meal[];
  ingredients: Ingredient[];
  prices: IngredientPrice[];
  retailerIds: RetailerId[];
  loyaltyPrefs: Partial<Record<RetailerId, boolean>>;
}): BasketPricingResult {
  const basketMeal = buildBasketMealInput({
    meals: input.meals,
    ingredientsById: new Map(input.ingredients.map((ingredient) => [ingredient.id, ingredient])),
    prices: input.prices,
    retailerIds: input.retailerIds,
  });

  const loyalty = Object.fromEntries(
    input.retailerIds.map((retailerId) => [retailerId, input.loyaltyPrefs[retailerId] ?? false]),
  ) as Record<string, boolean>;

  const single = computeCheapestSingleRetailer(
    basketMeal,
    input.retailerIds,
    loyalty,
  );
  const mixed = computeCheapestMixedRetailer(
    basketMeal,
    input.retailerIds,
    loyalty,
  );

  const singleRetailerId = Object.entries(single.retailerBreakdown)
    .sort((left, right) => left[1] - right[1])[0]?.[0];

  return {
    singleRetailer: {
      retailerId: singleRetailerId && isRetailerId(singleRetailerId) ? singleRetailerId : null,
      totalCostPence: single.totalCostPence,
      explanation: single.explanation,
      breakdown: normalizeBreakdown(single.retailerBreakdown),
    },
    mixedRetailer: {
      totalCostPence: mixed.totalCostPence,
      explanation: mixed.explanation,
      breakdown: normalizeBreakdown(mixed.retailerBreakdown),
    },
  };
}
