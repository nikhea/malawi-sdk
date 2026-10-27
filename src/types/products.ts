import type { PageParams } from "./common.js";

/**
 * A product (SPU). Prices are integer minor units — tambala:
 * `12500` means K125.00. Never use floats for money.
 */
export interface Product {
  id: string;
  category_id?: string;
  category_name?: string;
  name: string;
  slug: string;
  description: string;
  price_cents: number;
  currency: string;
  image_url?: string;
  is_active: boolean;
  /** ISO-8601 timestamp. */
  created_at: string;
}

/** Flat variant view embedded in a product detail response. */
export interface ProductVariantView {
  id: string;
  name: string;
  sku: string;
  price_cents: number;
  is_active: boolean;
}

/** The storefront product page: product plus its sellable SKUs. */
export interface ProductDetail {
  product: Product;
  variants: ProductVariantView[];
}

export interface ListProductsParams extends PageParams {
  category_id?: string;
  /** Defaults to `true` on the API. */
  active_only?: boolean;
}

export interface CreateProductInput {
  category_id?: string;
  name: string;
  /** Generated from the name when omitted. */
  slug?: string;
  description?: string;
  /** Minor units (tambala). */
  price_cents?: number;
  /** Defaults to MWK on the API. */
  currency?: string;
  image_url?: string;
}

export interface UpdateProductInput {
  category_id?: string;
  name?: string;
  description?: string;
  price_cents?: number;
  currency?: string;
  is_active?: boolean;
  /** Unfile the product. Slugs are immutable. */
  clear_category?: boolean;
}
