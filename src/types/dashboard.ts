import type { PaymentStatus } from "./payments.js";
import type { ProductTotal } from "./orders.js";

/**
 * Whole-store admin snapshot from `GET /admin/dashboard/overview`.
 * Money is grouped by currency, never summed across currencies.
 */
export interface DashboardOverview {
  /** ISO-8601 timestamp. */
  generated_at: string;
  catalog: DashboardCatalog;
  customers: DashboardCustomers;
  orders: DashboardOrders;
  /** Orders have no shipping states; these are inventory reservation counts. */
  fulfillment: DashboardFulfillment;
  stock: DashboardStock;
  reviews: DashboardReviews;
  payments: DashboardPayments;
  demand: DashboardDemand;
}

export interface DashboardCatalog {
  total_products: number;
  active_products: number;
  inactive_products: number;
  total_variants: number;
  active_variants: number;
  total_categories: number;
  ready_images: number;
}

/** `paying_customers` counts buyers with paid orders; the payment-ledger
 * count can differ during the webhook retry window. */
export interface DashboardCustomers {
  total_users: number;
  total_customers: number;
  verified_customers: number;
  total_admins: number;
  new_customers_30d: number;
  paying_customers: number;
  succeeded_payment_customers: number;
}

export interface DashboardCurrencyTotal {
  currency: string;
  orders: number;
  total_cents: number;
}

export interface DashboardOrders {
  total: number;
  pending: number;
  paid: number;
  cancelled: number;
  last_30d: number;
  by_currency: DashboardCurrencyTotal[];
  paid_revenue_by_currency: DashboardCurrencyTotal[];
}

export interface DashboardFulfillment {
  active_reservations: number;
  confirmed_reservations: number;
  released_reservations: number;
  active_reserved_qty: number;
  confirmed_qty: number;
  released_qty: number;
  /** Active holds past their TTL, awaiting the worker's expiry sweep. */
  expired_active_holds: number;
}

export interface DashboardStock {
  rows: number;
  on_hand_qty: number;
  reserved_qty: number;
  available_qty: number;
  out_of_stock_rows: number;
}

export interface DashboardReviews {
  total: number;
  average_rating: number;
  last_30d: number;
}

export interface DashboardPaymentStatusTotal {
  status: PaymentStatus;
  currency: string;
  payments: number;
  charged_cents: number;
  original_order_cents: number;
}

export interface DashboardPayments {
  by_status: DashboardPaymentStatusTotal[];
}

export interface DashboardWishlistedProduct {
  product_id: string;
  name: string;
  slug: string;
  wishlists: number;
}

export interface DashboardCartedProduct {
  product_id: string;
  name: string;
  slug: string;
  cart_qty: number;
  carts: number;
}

/** Three top-5 "most required items" rankings, capped by the server. */
export interface DashboardDemand {
  /** Ranked by units in paid orders. */
  most_ordered: ProductTotal[];
  /** Ranked by wishlist hearts. */
  most_wishlisted: DashboardWishlistedProduct[];
  /** Ranked by quantity in live carts. */
  most_carted: DashboardCartedProduct[];
}
