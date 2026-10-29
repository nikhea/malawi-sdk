import type { HttpClient } from "../http.js";
import { segment } from "../path.js";
import type { ListOrdersParams, Order, OrderListResponse } from "../types/index.js";

/** Requires authentication. Ownership is enforced from the JWT. */
export class OrdersResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Freezes the cart into a pending order, reserves stock, and clears
   * the cart.
   */
  checkout(): Promise<Order> {
    return this.http.request<Order>("POST", "/orders/checkout", {
      retry: false,
    });
  }

  /** Newest first (paging meta is dropped). */
  list(params: ListOrdersParams = {}): Promise<Order[]> {
    return this.http.request<Order[]>("GET", "/orders", {
      query: {
        status: params.status,
        currency: params.currency,
        created_after: params.created_after,
        created_before: params.created_before,
        min_total_cents: params.min_total_cents,
        max_total_cents: params.max_total_cents,
        sort: params.sort,
        page: params.page,
        limit: params.limit,
        offset: params.offset,
      },
    });
  }

  /** Same filters as `list`, plus the `meta` paging counters. */
  listPage(params: ListOrdersParams = {}): Promise<OrderListResponse> {
    return this.http.request<OrderListResponse>("GET", "/orders", {
      query: {
        status: params.status,
        currency: params.currency,
        created_after: params.created_after,
        created_before: params.created_before,
        min_total_cents: params.min_total_cents,
        max_total_cents: params.max_total_cents,
        sort: params.sort,
        page: params.page,
        limit: params.limit,
        offset: params.offset,
      },
      unwrap: false,
    });
  }

  get(id: string): Promise<Order> {
    return this.http.request<Order>("GET", `/orders/${segment(id)}`);
  }

  /** Pending orders only; releases the stock hold. */
  cancel(id: string): Promise<Order> {
    return this.http.request<Order>(
      "POST",
      `/orders/${segment(id)}/cancel`,
      { retry: false },
    );
  }
}
