import type { ApifyDatasetItem } from "../apify/fetcher";
import type { RawProduct } from "../types";

export const ASDA_ACTOR_ID = "jupri/asda-scraper";

function poundsToPence(value: unknown): number | undefined {
  if (typeof value === "number") return Math.round(value * 100);
  if (typeof value === "string") {
    const parsed = parseFloat(value.replace(/[^0-9.]/g, ""));
    if (!Number.isNaN(parsed)) return Math.round(parsed * 100);
  }
  return undefined;
}

export function mapAsdaApifyItem(item: ApifyDatasetItem): RawProduct | null {
  const currentPricePence = poundsToPence(item.price);
  if (!currentPricePence || currentPricePence <= 0) return null;

  const previousPricePence = poundsToPence(item.wasPrice);
  const hasPromo =
    typeof previousPricePence === "number" &&
    previousPricePence > currentPricePence;

  return {
    retailer_product_id: String(item.id ?? item.url ?? crypto.randomUUID()),
    name: String(item.name ?? item.title ?? ""),
    brand: typeof item.brand === "string" ? item.brand : undefined,
    category: typeof item.category === "string" ? item.category : undefined,
    pack_size_raw: typeof item.weight === "string" ? item.weight : undefined,
    base_price_pence: hasPromo ? previousPricePence : currentPricePence,
    promo_price_pence: hasPromo ? currentPricePence : null,
    loyalty_price_pence: null,
    loyalty_scheme: "none",
    image_url: typeof item.imageUrl === "string" ? item.imageUrl : undefined,
    product_url: String(item.url ?? ""),
    scraped_at: new Date().toISOString(),
    raw_payload: item,
  };
}

export function mapAsdaApifyItems(items: ApifyDatasetItem[]): RawProduct[] {
  return items.flatMap((item) => {
    const mapped = mapAsdaApifyItem(item);
    return mapped ? [mapped] : [];
  });
}
