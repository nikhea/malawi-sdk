import type { PageParams, PaginationMeta } from "./common.js";

/** One cart row. Variant fields are empty for simple products. */
export interface CartLine {
  id: string;
  product_id: string;
  variant_id?: string;
  name: string;
  sku?: string;
  unit_price_cents: number;
  currency: string;
  qty: number;
  line_total_cents: number;
}

export interface Cart {
  id: string;
  user_id: string;
  items: CartLine[];
  subtotal_cents: number;
  currency: string;
  /** ISO-8601 timestamp. */
  updated_at: string;
}

export interface AddCartItemInput {
  product_id: string;
  /** Omit for the base product price; set for a specific SKU. */
  variant_id?: string;
  qty: number;
}

export type CartSort =
  | "oldest"
  | "newest"
  | "name_asc"
  | "name_desc"
  | "price_asc"
  | "price_desc"
  | "qty_asc"
  | "qty_desc";

export interface ListCartParams extends PageParams {
  /** Case-insensitive substring over line name and SKU. */
  q?: string;
  product_id?: string;
  variant_id?: string;
  sort?: CartSort;
}

/**
 * Raw paged cart envelope returned by `getPage`. `data.subtotal_cents`
 * always covers the whole cart; `meta` counts cart lines.
 */
export interface CartResponse {
  data: Cart;
  meta: PaginationMeta;
}
