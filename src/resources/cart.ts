import type { HttpClient } from "../http.js";
import { segment } from "../path.js";
import type { AddCartItemInput, Cart } from "../types/index.js";

/** Requires authentication. There is one active cart per user. */
export class CartResource {
  constructor(private readonly http: HttpClient) {}

  /** Active cart, created empty on first use. */
  get(): Promise<Cart> {
    return this.http.request<Cart>("GET", "/cart");
  }

  /** Validates against the catalog and snapshots the current price. */
  addItem(input: AddCartItemInput): Promise<Cart> {
    return this.http.request<Cart>("POST", "/cart/items", {
      body: input,
      retry: false,
    });
  }

  /** `qty: 0` removes the line. */
  setQty(itemId: string, qty: number): Promise<Cart> {
    return this.http.request<Cart>(
      "PATCH",
      `/cart/items/${segment(itemId)}`,
      { body: { qty }, retry: false },
    );
  }

  removeItem(itemId: string): Promise<Cart> {
    return this.http.request<Cart>(
      "DELETE",
      `/cart/items/${segment(itemId)}`,
      { retry: false },
    );
  }

  /** Empties the cart. A successful checkout does this already. */
  clear(): Promise<void> {
    return this.http.request<void>("DELETE", "/cart", { retry: false });
  }
}
