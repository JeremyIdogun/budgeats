import type { RawProduct } from "../types";

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function extract(html: string, pattern: RegExp): string | undefined {
  const match = html.match(pattern);
  return match?.[1]?.trim();
}

export function extractAttribute(tagHtml: string, attribute: string): string | undefined {
  return extract(tagHtml, new RegExp(`${escapeRegExp(attribute)}=["']([^"']+)["']`, "i"));
}

export function parsePriceToPence(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const amount = raw.replace(/[^\d.,]/g, "").replace(",", ".");
  const asNumber = Number.parseFloat(amount);
  if (!Number.isFinite(asNumber)) return undefined;
  return Math.round(asNumber * 100);
}

export function splitBlocks(html: string, blockClassPattern: string): string[] {
  const regex = new RegExp(
    `<(?:article|div)[^>]*class=["'][^"']*${blockClassPattern}[^"']*["'][^>]*>[\\s\\S]*?<\\/(?:article|div)>`,
    "gi",
  );
  return Array.from(html.matchAll(regex), (match) => match[0]);
}

export function buildRawProduct(input: {
  retailerProductId?: string;
  name?: string;
  category?: string;
  packSizeRaw?: string;
  basePricePence?: number;
  loyaltyPricePence?: number;
  productUrl?: string;
  imageUrl?: string;
  loyaltyScheme?: RawProduct["loyalty_scheme"];
}): RawProduct | null {
  if (!input.retailerProductId || !input.name || !input.basePricePence || !input.productUrl) {
    return null;
  }

  return {
    retailer_product_id: input.retailerProductId,
    name: input.name,
    category: input.category,
    pack_size_raw: input.packSizeRaw,
    base_price_pence: input.basePricePence,
    loyalty_price_pence: input.loyaltyPricePence,
    loyalty_scheme: input.loyaltyScheme ?? "none",
    image_url: input.imageUrl,
    product_url: input.productUrl,
    scraped_at: new Date().toISOString(),
  };
}
