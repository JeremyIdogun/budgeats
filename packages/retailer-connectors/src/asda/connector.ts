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

function normalizePackSize(raw?: string, fallbackName?: string): string | undefined {
  const candidate =
    raw?.trim() ?? fallbackName?.match(/(\d+(?:\.\d+)?\s?(?:kg|g|ml|l))/i)?.[1];
  if (!candidate) return undefined;
  try {
    const parsed = parsePackSize(candidate);
    return `${parsed.quantity}${parsed.unit}`;
  } catch {
    return candidate;
  }
}

function extractFromBlock(block: string): RawProduct | null {
  const productId = extract(block, /data-product-id=["']([^"']+)["']/i)
    ?? extract(block, /data-auto-id=["']([^"']+)["']/i);
  const name = extract(block, /class=["'][^"']*(?:product-title|co-product__title)[^"']*["'][^>]*>([^<]+)</i);
  const productUrl = extract(block, /<a[^>]*class=["'][^"']*(?:product-title|co-product__title)[^"']*["'][^>]*href=["']([^"']+)["']/i);
  const imageUrl = extract(block, /<img[^>]*src=["']([^"']+)["']/i);
  const packSize = extract(block, /class=["'][^"']*(?:size|weight)[^"']*["'][^>]*>([^<]+)</i);
  const basePrice = parsePriceToPence(
    extract(block, /class=["'][^"']*(?:price|co-product__price)[^"']*["'][^>]*>([^<]+)</i),
  );

  return buildRawProduct({
    retailerProductId: productId,
    name,
    productUrl,
    imageUrl,
    packSizeRaw: normalizePackSize(packSize, name),
    basePricePence: basePrice,
    loyaltyScheme: "none",
  });
}

export function parseAsdaHtml(html: string): RawProduct[] {
  const blocks = splitBlocks(html, "(?:co-product|product-card)");
  return blocks
    .map((block) => extractFromBlock(block))
    .filter((row): row is RawProduct => Boolean(row));
}

export class AsdaConnector implements RetailerConnector {
  constructor(
    private readonly snapshotStore: SnapshotStore,
    private readonly htmlFetcher?: (url: string, context: RetailerContext) => Promise<string>,
  ) {}

  async bootstrapContext(input: BootstrapInput): Promise<RetailerContext> {
    if (!input.postcode?.trim()) {
      throw new Error("Asda bootstrapContext requires postcode");
    }

    const postcode = input.postcode.trim().toUpperCase();
    return {
      retailerId: input.retailerId,
      postcode,
      loyaltyEnabled: false,
      locale: input.locale ?? "en-GB",
      initializedAt: new Date().toISOString(),
      cookies: {
        asda_postcode: postcode,
      },
      headers: {
        "x-asda-postcode": postcode,
      },
    };
  }

  private async fetchHtml(url: string, context: RetailerContext, resourceKey: string): Promise<string> {
    if (this.htmlFetcher) return this.htmlFetcher(url, context);
    return scrapeWithPlaywright({
      retailerId: "asda",
      url,
      context,
      snapshotStore: this.snapshotStore,
      resourceKey,
    });
  }

  async searchProducts(query: string, context: RetailerContext): Promise<RawProduct[]> {
    const url = `https://groceries.asda.com/search/${encodeURIComponent(query)}`;
    const html = await this.fetchHtml(url, context, `search/${query}`);
    return parseAsdaHtml(html);
  }

  async fetchCategory(categoryId: string, context: RetailerContext): Promise<RawProduct[]> {
    const url = `https://groceries.asda.com/section/${encodeURIComponent(categoryId)}`;
    const html = await this.fetchHtml(url, context, `category/${categoryId}`);
    return parseAsdaHtml(html);
  }

  async fetchProduct(productId: string, context: RetailerContext): Promise<RawProduct> {
    const url = `https://groceries.asda.com/product/${encodeURIComponent(productId)}`;
    const html = await this.fetchHtml(url, context, `product/${productId}`);
    const product = parseAsdaHtml(html).find((item) => item.retailer_product_id === productId) ?? parseAsdaHtml(html)[0];
    if (!product) throw new Error(`Asda product not found for productId=${productId}`);
    return product;
  }

  normalizeRawProduct(raw: RawProduct): NormalizedRetailerProduct {
    if (!raw.base_price_pence || raw.base_price_pence <= 0) {
      throw new Error(`Asda raw product missing base price: ${raw.retailer_product_id}`);
    }

    return {
      retailer_product_id: raw.retailer_product_id,
      name: raw.name,
      brand: raw.brand,
      category: raw.category,
      pack_size_raw: normalizePackSize(raw.pack_size_raw, raw.name),
      base_price_pence: raw.base_price_pence,
      product_url: raw.product_url,
      scraped_at: raw.scraped_at,
      image_url: raw.image_url,
      loyalty_scheme: "none",
    };
  }
}
