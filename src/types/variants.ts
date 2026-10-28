/** A sellable SKU. Prices are absolute USD cents. */
export interface Variant {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  price_cents: number;
  is_active: boolean;
  /** Sellable units: on-hand minus active reservations. */
  available: number;
  in_stock: boolean;
  /** ISO-8601 timestamp. */
  created_at: string;
}

export interface CreateVariantInput {
  name: string;
  sku: string;
  price_cents?: number;
}

export interface UpdateVariantInput {
  name?: string;
  price_cents?: number;
  is_active?: boolean;
}
