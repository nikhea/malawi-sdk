import type { PageParams, Paginated } from "./common.js";

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

export type OrderSort = "newest" | "oldest" | "total_asc" | "total_desc";

export interface ListOrdersParams extends PageParams {
  status?: OrderStatus;
  currency?: string;
  /** RFC3339 or YYYY-MM-DD. */
  created_after?: string;
  /** RFC3339 or YYYY-MM-DD; a date-only value includes the whole day. */
  created_before?: string;
  min_total_cents?: number;
  max_total_cents?: number;
  sort?: OrderSort;
}

/** Raw paged orders envelope returned by `listPage`. */
export type OrderListResponse = Paginated<Order>;
