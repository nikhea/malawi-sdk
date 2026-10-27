import type { HttpClient } from "../http.js";
import { segment } from "../path.js";
import type { Order } from "../types/index.js";

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

  /** Newest first. */
  list(): Promise<Order[]> {
    return this.http.request<Order[]>("GET", "/orders");
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
