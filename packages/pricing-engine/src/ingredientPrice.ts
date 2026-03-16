import { getEffectivePricePence } from "./effectivePrice";
import type {
  IngredientOption,
  IngredientPriceInput,
  IngredientPriceResolution,
  MatchLabel,
} from "./types";

function pickBestOption(options: IngredientOption[], loyaltyEnabled: boolean): IngredientOption {
  return [...options].sort((left, right) => {
    const leftPrice = getEffectivePricePence(left.prices, loyaltyEnabled);
    const rightPrice = getEffectivePricePence(right.prices, loyaltyEnabled);
    const leftUnit = leftPrice / Math.max(left.packSizeBaseUnit, 1);
    const rightUnit = rightPrice / Math.max(right.packSizeBaseUnit, 1);

    if (leftUnit !== rightUnit) return leftUnit - rightUnit;
    if ((left.isOwnLabel ?? false) !== (right.isOwnLabel ?? false)) {
      return left.isOwnLabel ? -1 : 1;
    }
    return leftPrice - rightPrice;
  })[0];
}

function resolveFromOptions(
  options: IngredientOption[],
  matchLabel: MatchLabel,
  source: string,
  loyaltyEnabled: boolean,
): IngredientPriceResolution {
  const chosen = pickBestOption(options, loyaltyEnabled);
  const effectivePackPricePence = getEffectivePricePence(chosen.prices, loyaltyEnabled);
  return {
    pricePence: effectivePackPricePence,
    matchLabel,
    chosenOption: chosen,
    effectivePackPricePence,
    explanation: `${source}: selected ${chosen.name} at ${effectivePackPricePence}p (${matchLabel})`,
  };
}

export function resolveIngredientPrice(
  input: IngredientPriceInput,
): IngredientPriceResolution {
  if (input.exactProductMatches.length > 0) {
    return resolveFromOptions(input.exactProductMatches, "exact", "exact product match", input.loyaltyEnabled);
  }

  if (input.canonicalIngredientMatches.length > 0) {
    return resolveFromOptions(
      input.canonicalIngredientMatches,
      "equivalent",
      "canonical ingredient match",
      input.loyaltyEnabled,
    );
  }

  if (input.approvedSubstitutes.length > 0) {
    return resolveFromOptions(
      input.approvedSubstitutes,
      "substitute",
      "approved substitute",
      input.loyaltyEnabled,
    );
  }

  if (input.cheapestValidOptions.length > 0) {
    return resolveFromOptions(
      input.cheapestValidOptions,
      "substitute",
      "cheapest valid fallback",
      input.loyaltyEnabled,
    );
  }

  throw new Error(`No valid price options for ${input.ingredientName}`);
}
