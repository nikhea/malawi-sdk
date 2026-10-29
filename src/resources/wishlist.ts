import type { HttpClient } from "../http.js";
import { segment } from "../path.js";
import type {
  ListWishlistParams,
  StatusResponse,
  WishlistItem,
  WishlistListResponse,
} from "../types/index.js";

/** Requires authentication. */
export class WishlistResource {
  constructor(private readonly http: HttpClient) {}

  /** Newest first (paging meta is dropped). */
  list(params: ListWishlistParams = {}): Promise<WishlistItem[]> {
    return this.http.request<WishlistItem[]>("GET", "/wishlist", {
      query: {
        q: params.q,
        category_id: params.category_id,
        sort: params.sort,
        page: params.page,
        limit: params.limit,
        offset: params.offset,
      },
    });
  }

  /** Same filters as `list`, plus the `meta` paging counters. */
  listPage(params: ListWishlistParams = {}): Promise<WishlistListResponse> {
    return this.http.request<WishlistListResponse>("GET", "/wishlist", {
      query: {
        q: params.q,
        category_id: params.category_id,
        sort: params.sort,
        page: params.page,
        limit: params.limit,
        offset: params.offset,
      },
      unwrap: false,
    });
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
