export type OrderStatus = "pending" | "paid" | "cancelled";

/** Frozen record of one purchased line. */
export interface OrderLine {
  product_id: string;
  variant_id?: string;
  name: string;
  sku?: string;
  unit_price_cents: number;
  qty: number;
  line_total_cents: number;
}

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  subtotal_cents: number;
  currency: string;
  lines: OrderLine[];
  /** ISO-8601 timestamp. */
  created_at: string;
}
