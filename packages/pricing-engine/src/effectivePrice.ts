import type { RetailerPrice } from "./types";

export function getEffectivePricePence(
  prices: RetailerPrice,
  loyaltyEnabled: boolean,
): number {
  if (loyaltyEnabled && prices.loyalty_price_pence != null) {
    return prices.loyalty_price_pence;
  }

  if (prices.promo_price_pence != null) {
    return prices.promo_price_pence;
  }

  return prices.base_price_pence;
}
