export type LoyaltyScheme = "clubcard" | "nectar" | "none";

export interface BootstrapInput {
  retailerId: string;
  postcode?: string;
  loyaltyEnabled?: boolean;
  locale?: string;
}

export interface RetailerContext {
  retailerId: string;
  postcode?: string;
  storeId?: string;
  loyaltyEnabled: boolean;
  locale: string;
  cookies?: Record<string, string>;
  headers?: Record<string, string>;
  initializedAt: string;
  metadata?: Record<string, unknown>;
}

export interface RawProduct {
  retailer_product_id: string;
  name: string;
  brand?: string;
  category?: string;
  pack_size_raw?: string;
  base_price_pence?: number;
  promo_price_pence?: number | null;
  loyalty_price_pence?: number | null;
  loyalty_scheme?: LoyaltyScheme;
  image_url?: string;
  product_url: string;
  scraped_at: string;
  raw_payload?: unknown;
}

export interface NormalizedRetailerProduct {
  retailer_product_id: string;
  name: string;
  brand?: string;
  category?: string;
  pack_size_raw?: string;
  base_price_pence: number;
  promo_price_pence?: number;
  loyalty_price_pence?: number;
  loyalty_scheme?: LoyaltyScheme;
  image_url?: string;
  product_url: string;
  scraped_at: string;
}

export interface RetailerConnector {
  bootstrapContext(input: BootstrapInput): Promise<RetailerContext>;
  searchProducts(query: string, context: RetailerContext): Promise<RawProduct[]>;
  fetchCategory(categoryId: string, context: RetailerContext): Promise<RawProduct[]>;
  fetchProduct(productId: string, context: RetailerContext): Promise<RawProduct>;
  normalizeRawProduct(raw: RawProduct): NormalizedRetailerProduct;
}
