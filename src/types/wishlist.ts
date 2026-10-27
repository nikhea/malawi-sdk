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
