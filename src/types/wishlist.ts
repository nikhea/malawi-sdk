import type { PageParams, Paginated } from "./common.js";

/** Catalog snapshot embedded in a wishlist item. */
export interface WishlistProduct {
  id: string;
  name: string;
  slug: string;
  price_cents: number;
  currency: string;
  image_url?: string;
}

export interface WishlistItem {
  product_id: string;
  product: WishlistProduct;
  /** ISO-8601 timestamp. */
  added_at: string;
}

export type WishlistSort =
  | "newest"
  | "oldest"
  | "name_asc"
  | "name_desc"
  | "price_asc"
  | "price_desc";

export interface ListWishlistParams extends PageParams {
  /** Case-insensitive substring over product name and slug. */
  q?: string;
  category_id?: string;
  sort?: WishlistSort;
}

/** Raw paged wishlist envelope returned by `listPage`. */
export type WishlistListResponse = Paginated<WishlistItem>;
