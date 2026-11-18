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

/** Shared filters for both aggregate endpoints. `user_id` is admin-only. */
export interface AggregateOrdersParams {
  status?: OrderStatus;
  currency?: string;
  /** RFC3339 or YYYY-MM-DD. */
  created_after?: string;
  /** RFC3339 or YYYY-MM-DD; a date-only value includes the whole day. */
  created_before?: string;
  /** Admin only: optional customer UUID. Omit to aggregate every customer. */
  user_id?: string;
}

/** Money is grouped by currency: legacy MWK is never added to USD. */
export interface OrderStatusTotal {
  status: OrderStatus;
  currency: string;
  orders: number;
  total_cents: number;
  average_cents: number;
}

export interface OrderCurrencyTotal {
  currency: string;
  orders: number;
  total_cents: number;
  average_cents: number;
}

export interface OrderAggregate {
  count: number;
  /** RFC3339 timestamps; absent when no orders match. */
  first_order_at?: string;
  last_order_at?: string;
  by_status: OrderStatusTotal[];
  by_currency: OrderCurrencyTotal[];
}

/** One product's paid-order line totals, ranked by units sold. */
export interface ProductTotal {
  product_id: string;
  name: string;
  sku?: string;
  currency: string;
  units_sold: number;
  orders: number;
  revenue_cents: number;
}

export interface CurrencyRevenue {
  currency: string;
  lines: number;
  units_sold: number;
  revenue_cents: number;
}

export interface ItemsAggregate {
  lines: number;
  units_sold: number;
  revenue_by_currency: CurrencyRevenue[];
  /** Ranked by units sold, capped at 10 by the server. */
  top_products: ProductTotal[];
}

/** GET /orders/aggregates and GET /admin/orders/aggregates (`data` payload). */
export interface OrderAggregates {
  orders: OrderAggregate;
  items: ItemsAggregate;
}
