import type { PageParams, Paginated } from "./common.js";

/**
 * A product (SPU). Prices are integer USD cents:
 * `12500` means $125.00. Never use floats for money.
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
  /** Sellable units: on-hand minus active reservations. */
  available: number;
  in_stock: boolean;
}

/** The storefront product page: product plus its sellable SKUs. */
export interface ProductDetail {
  product: Product;
  variants: ProductVariantView[];
}

export type ProductSort =
  | "name_asc"
  | "name_desc"
  | "price_asc"
  | "price_desc"
  | "newest"
  | "oldest"
  | "rating_asc"
  | "rating_desc"
  | "relevance";

export interface ListProductsParams extends PageParams {
  /**
   * Full-text search over name, description and slug. Word prefixes match
   * ("cook" finds "cooking"); the API falls back to substring search when
   * full-text finds nothing.
   */
  q?: string;
  category_id?: string;
  category_slug?: string;
  min_price_cents?: number;
  max_price_cents?: number;
  /** true = in stock; false = out of stock only. */
  in_stock?: boolean;
  /** Active variant name, e.g. XS, M, XL. */
  size?: string;
  /** 0-5; products without reviews are excluded when set above 0. */
  min_rating?: number;
  /** RFC3339 timestamp or YYYY-MM-DD. */
  created_after?: string;
  created_before?: string;
  /** Defaults to `true` on the API. */
  active_only?: boolean;
  sort?: ProductSort;
}

/** Raw paged products envelope returned by `listPage`. */
export type ProductListResponse = Paginated<Product>;

export interface CreateProductInput {
  category_id?: string;
  name: string;
  /** Generated from the name when omitted. */
  slug?: string;
  description?: string;
  /** USD cents (12500 = $125.00). */
  price_cents?: number;
  /** Defaults to USD on the API. */
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
