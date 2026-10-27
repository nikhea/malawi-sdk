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
