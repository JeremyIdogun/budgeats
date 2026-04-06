import { parsePackSize } from "../../../shared/src/units";
import { runApifyActor, type ApifyFetcherOptions } from "../apify/fetcher";
import { scrapeWithPlaywright } from "../internal/scraping";
import { buildRawProduct, extract, parsePriceToPence, splitBlocks } from "../internal/parsing";
import { persistSnapshot, withExponentialBackoff, type SnapshotStore } from "../runtime";
import { ASDA_ACTOR_ID, mapAsdaApifyItems } from "./apify-mapper";
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
    private readonly apifyOptions?: ApifyFetcherOptions,
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

  private async fetchApify(
    resourceKey: string,
    input: Record<string, unknown>,
  ): Promise<RawProduct[]> {
    const items = await withExponentialBackoff(
      () => runApifyActor(this.apifyOptions!, { actorId: ASDA_ACTOR_ID, input }),
      { attempts: 3, baseDelayMs: 2000 },
    );

    await persistSnapshot({
      retailerId: "asda",
      resource: resourceKey,
      body: JSON.stringify(items),
      contentType: "application/json",
      store: this.snapshotStore,
    });

    return mapAsdaApifyItems(items);
  }

  async searchProducts(query: string, context: RetailerContext): Promise<RawProduct[]> {
    if (this.apifyOptions) {
      return this.fetchApify(`search/${query}`, {
        query,
        postcode: context.postcode ?? undefined,
        maxItems: 50,
      });
    }

    const url = `https://groceries.asda.com/search/${encodeURIComponent(query)}`;
    const html = await this.fetchHtml(url, context, `search/${query}`);
    return parseAsdaHtml(html);
  }

  async fetchCategory(categoryId: string, context: RetailerContext): Promise<RawProduct[]> {
    if (this.apifyOptions) {
      return this.fetchApify(`category/${categoryId}`, {
        query: categoryId,
        postcode: context.postcode ?? undefined,
        maxItems: 50,
      });
    }

    const url = `https://groceries.asda.com/section/${encodeURIComponent(categoryId)}`;
    const html = await this.fetchHtml(url, context, `category/${categoryId}`);
    return parseAsdaHtml(html);
  }

  async fetchProduct(productId: string, context: RetailerContext): Promise<RawProduct> {
    if (this.apifyOptions) {
      const products = await this.fetchApify(`product/${productId}`, {
        query: productId,
        postcode: context.postcode ?? undefined,
        maxItems: 25,
      });
      const product = products.find((item) => item.retailer_product_id === productId) ?? products[0];
      if (!product) throw new Error(`Asda product not found for productId=${productId}`);
      return product;
    }

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
      promo_price_pence: raw.promo_price_pence ?? undefined,
      product_url: raw.product_url,
      scraped_at: raw.scraped_at,
      image_url: raw.image_url,
      loyalty_scheme: "none",
    };
  }
}
