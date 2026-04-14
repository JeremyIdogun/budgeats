import type { ApifyDatasetItem } from "../apify/fetcher";
import type { RawProduct } from "../types";

export const TESCO_ACTOR_ID = "radeance/tesco-scraper";

function poundsToPence(value: unknown): number | undefined {
  if (typeof value === "number") return Math.round(value * 100);
  if (typeof value === "string") {
    const parsed = parseFloat(value.replace(/[^0-9.]/g, ""));
    if (!Number.isNaN(parsed)) return Math.round(parsed * 100);
  }
  return undefined;
}

function extractProductId(item: ApifyDatasetItem): string {
  if (typeof item.id === "string" && item.id) return item.id;
  if (typeof item.url === "string") {
    const match = item.url.match(/\/products\/(\d+)/);
    if (match) return match[1];
  }
  return String(item.url ?? crypto.randomUUID());
}

export function mapTescoApifyItem(item: ApifyDatasetItem): RawProduct | null {
  const basePricePence = poundsToPence(item.price);
  if (!basePricePence || basePricePence <= 0) return null;

  const loyaltyPricePence = poundsToPence(item.clubcardPrice);

  return {
    retailer_product_id: extractProductId(item),
    name: String(item.name ?? item.title ?? ""),
    brand: typeof item.brand === "string" ? item.brand : undefined,
    category: typeof item.category === "string" ? item.category : undefined,
    pack_size_raw: typeof item.weight === "string" ? item.weight : undefined,
    base_price_pence: basePricePence,
    promo_price_pence: null,
    loyalty_price_pence: loyaltyPricePence ?? null,
    loyalty_scheme: loyaltyPricePence ? "clubcard" : "none",
    image_url: typeof item.imageUrl === "string" ? item.imageUrl : undefined,
    product_url: String(item.url ?? ""),
    scraped_at: new Date().toISOString(),
    raw_payload: item,
  };
}

export function mapTescoApifyItems(items: ApifyDatasetItem[]): RawProduct[] {
  return items.flatMap((item) => {
    const mapped = mapTescoApifyItem(item);
    return mapped ? [mapped] : [];
  });
}
