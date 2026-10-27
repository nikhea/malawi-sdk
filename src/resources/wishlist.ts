import type { HttpClient } from "../http.js";
import { segment } from "../path.js";
import type { StatusResponse, WishlistItem } from "../types/index.js";

/** Requires authentication. */
export class WishlistResource {
  constructor(private readonly http: HttpClient) {}

  /** Newest first. */
  list(): Promise<WishlistItem[]> {
    return this.http.request<WishlistItem[]>("GET", "/wishlist");
  }

  /** Idempotent: re-hearting succeeds silently. */
  add(productId: string): Promise<WishlistItem> {
    return this.http.request<WishlistItem>("POST", "/wishlist", {
      body: { product_id: productId },
      retry: false,
    });
  }

  /** `productId`, not the wishlist row ID. */
  remove(productId: string): Promise<StatusResponse> {
    return this.http.request<StatusResponse>(
      "DELETE",
      `/wishlist/${segment(productId)}`,
      { retry: false },
    );
  }
}
