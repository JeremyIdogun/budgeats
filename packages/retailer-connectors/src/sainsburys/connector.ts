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
  const productId = extract(block, /data-product-id=["']([^"']+)["']/i);
  const name = extract(block, /class=["'][^"']*(?:pt__title|productName)[^"']*["'][^>]*>([^<]+)</i);
  const productUrl = extract(block, /<a[^>]*class=["'][^"']*(?:pt__title|productName)[^"']*["'][^>]*href=["']([^"']+)["']/i);
  const imageUrl = extract(block, /<img[^>]*src=["']([^"']+)["']/i);
  const packSize = extract(block, /class=["'][^"']*(?:size|pt__size)[^"']*["'][^>]*>([^<]+)</i);
  const basePrice = parsePriceToPence(
    extract(block, /class=["'][^"']*(?:pt__cost|price)[^"']*["'][^>]*>([^<]+)</i),
  );
  const nectarPrice = parsePriceToPence(
    extract(block, /class=["'][^"']*(?:pt__nectar|nectar-price)[^"']*["'][^>]*>([^<]+)</i),
  );

  return buildRawProduct({
    retailerProductId: productId,
    name,
    productUrl,
    imageUrl,
    packSizeRaw: normalizePackSize(packSize, name),
    basePricePence: basePrice,
    loyaltyPricePence: nectarPrice,
    loyaltyScheme: nectarPrice ? "nectar" : "none",
  });
}

export function parseSainsburysHtml(html: string): RawProduct[] {
  const blocks = splitBlocks(html, "(?:product-tile|pt__wrapper)");
  return blocks
    .map((block) => extractFromBlock(block))
    .filter((row): row is RawProduct => Boolean(row));
}

export class SainsburysConnector implements RetailerConnector {
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
    };
  }

  private async fetchHtml(url: string, context: RetailerContext, resourceKey: string): Promise<string> {
    if (this.htmlFetcher) return this.htmlFetcher(url, context);
    return scrapeWithPlaywright({
      retailerId: "sainsburys",
      url,
      context,
      snapshotStore: this.snapshotStore,
      resourceKey,
    });
  }

  async searchProducts(query: string, context: RetailerContext): Promise<RawProduct[]> {
    const url = `https://www.sainsburys.co.uk/gol-ui/SearchResults/${encodeURIComponent(query)}`;
    const html = await this.fetchHtml(url, context, `search/${query}`);
    return parseSainsburysHtml(html);
  }

  async fetchCategory(categoryId: string, context: RetailerContext): Promise<RawProduct[]> {
    const url = `https://www.sainsburys.co.uk/gol-ui/groceries/${encodeURIComponent(categoryId)}`;
    const html = await this.fetchHtml(url, context, `category/${categoryId}`);
    return parseSainsburysHtml(html);
  }

  async fetchProduct(productId: string, context: RetailerContext): Promise<RawProduct> {
    const url = `https://www.sainsburys.co.uk/gol-ui/product/${encodeURIComponent(productId)}`;
    const html = await this.fetchHtml(url, context, `product/${productId}`);
    const product =
      parseSainsburysHtml(html).find((item) => item.retailer_product_id === productId) ??
      parseSainsburysHtml(html)[0];
    if (!product) throw new Error(`Sainsburys product not found for productId=${productId}`);
    return product;
  }

  normalizeRawProduct(raw: RawProduct): NormalizedRetailerProduct {
    if (!raw.base_price_pence || raw.base_price_pence <= 0) {
      throw new Error(`Sainsburys raw product missing base price: ${raw.retailer_product_id}`);
    }

    return {
      retailer_product_id: raw.retailer_product_id,
      name: raw.name,
      brand: raw.brand,
      category: raw.category,
      pack_size_raw: normalizePackSize(raw.pack_size_raw, raw.name),
      base_price_pence: raw.base_price_pence,
      loyalty_price_pence: raw.loyalty_price_pence ?? undefined,
      loyalty_scheme: raw.loyalty_price_pence ? "nectar" : "none",
      product_url: raw.product_url,
      image_url: raw.image_url,
      scraped_at: raw.scraped_at,
    };
  }
}
