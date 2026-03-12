import { parsePackSize } from "../../../shared/src/units";
import { scrapeWithPlaywright } from "../internal/scraping";
import { buildRawProduct, extract, parsePriceToPence, splitBlocks } from "../internal/parsing";
import type { SnapshotStore } from "../runtime";
import type {
  BootstrapInput,
  NormalizedRetailerProduct,
  RawProduct,
  RetailerConnector,
  RetailerContext,
} from "../types";

function inferPackSizeFromName(name: string): string | undefined {
  const match = name.match(/(\d+(?:\.\d+)?\s?(?:kg|g|ml|l))/i);
  return match?.[1];
}

function normalizePackSize(raw?: string, fallbackName?: string): string | undefined {
  const candidate = raw?.trim() || (fallbackName ? inferPackSizeFromName(fallbackName) : undefined);
  if (!candidate) return undefined;
  try {
    const parsed = parsePackSize(candidate);
    return `${parsed.quantity}${parsed.unit}`;
  } catch {
    return candidate;
  }
}

function extractFromBlock(block: string): RawProduct | null {
  const productId = extract(block, /data-product-id=["']([^"']+)["']/i);
  const name = extract(block, /class=["'][^"']*product-link[^"']*["'][^>]*>([^<]+)</i);
  const productUrl = extract(block, /class=["'][^"']*product-link[^"']*["'][^>]*href=["']([^"']+)["']/i);
  const imageUrl = extract(block, /<img[^>]*src=["']([^"']+)["']/i);
  const weight = extract(block, /class=["'][^"']*(?:weight|product-weight)[^"']*["'][^>]*>([^<]+)</i);
  const basePrice = parsePriceToPence(
    extract(block, /class=["'][^"']*(?:price|value)[^"']*["'][^>]*>([^<]+)</i),
  );
  const clubcardPrice = parsePriceToPence(
    extract(block, /class=["'][^"']*(?:clubcard|loyalty)[^"']*["'][^>]*>([^<]+)</i),
  );

  return buildRawProduct({
    retailerProductId: productId,
    name,
    productUrl,
    imageUrl,
    packSizeRaw: normalizePackSize(weight, name),
    basePricePence: basePrice,
    loyaltyPricePence: clubcardPrice,
    loyaltyScheme: clubcardPrice ? "clubcard" : "none",
  });
}

export function parseTescoHtml(html: string): RawProduct[] {
  const blocks = splitBlocks(html, "product");
  return blocks
    .map((block) => extractFromBlock(block))
    .filter((row): row is RawProduct => Boolean(row));
}

export class TescoConnector implements RetailerConnector {
  constructor(
    private readonly snapshotStore: SnapshotStore,
    private readonly htmlFetcher?: (url: string, context: RetailerContext) => Promise<string>,
  ) {}

  async bootstrapContext(input: BootstrapInput): Promise<RetailerContext> {
    return {
      retailerId: input.retailerId,
      postcode: input.postcode,
      loyaltyEnabled: input.loyaltyEnabled ?? true,
      locale: input.locale ?? "en-GB",
      initializedAt: new Date().toISOString(),
      headers: {
        "accept-language": "en-GB,en;q=0.9",
      },
    };
  }

  private async fetchHtml(url: string, context: RetailerContext, resourceKey: string): Promise<string> {
    if (this.htmlFetcher) return this.htmlFetcher(url, context);
    return scrapeWithPlaywright({
      retailerId: "tesco",
      url,
      context,
      snapshotStore: this.snapshotStore,
      resourceKey,
    });
  }

  async searchProducts(query: string, context: RetailerContext): Promise<RawProduct[]> {
    const url = `https://www.tesco.com/groceries/en-GB/search?query=${encodeURIComponent(query)}`;
    const html = await this.fetchHtml(url, context, `search/${query}`);
    return parseTescoHtml(html);
  }

  async fetchCategory(categoryId: string, context: RetailerContext): Promise<RawProduct[]> {
    const url = `https://www.tesco.com/groceries/en-GB/shop/${encodeURIComponent(categoryId)}`;
    const html = await this.fetchHtml(url, context, `category/${categoryId}`);
    return parseTescoHtml(html);
  }

  async fetchProduct(productId: string, context: RetailerContext): Promise<RawProduct> {
    const url = `https://www.tesco.com/groceries/en-GB/products/${encodeURIComponent(productId)}`;
    const html = await this.fetchHtml(url, context, `product/${productId}`);
    const product = parseTescoHtml(html).find((item) => item.retailer_product_id === productId) ?? parseTescoHtml(html)[0];
    if (!product) {
      throw new Error(`Tesco product not found for productId=${productId}`);
    }
    return product;
  }

  normalizeRawProduct(raw: RawProduct): NormalizedRetailerProduct {
    if (!raw.base_price_pence || raw.base_price_pence <= 0) {
      throw new Error(`Tesco raw product missing base price: ${raw.retailer_product_id}`);
    }

    return {
      retailer_product_id: raw.retailer_product_id,
      name: raw.name,
      brand: raw.brand,
      category: raw.category,
      pack_size_raw: normalizePackSize(raw.pack_size_raw, raw.name),
      base_price_pence: raw.base_price_pence,
      promo_price_pence: raw.promo_price_pence ?? undefined,
      loyalty_price_pence: raw.loyalty_price_pence ?? undefined,
      loyalty_scheme: raw.loyalty_price_pence ? "clubcard" : "none",
      image_url: raw.image_url,
      product_url: raw.product_url,
      scraped_at: raw.scraped_at,
    };
  }
}
