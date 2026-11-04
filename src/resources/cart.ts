import { idempotencyHeaders } from "../headers.js";
import type { HttpClient } from "../http.js";
import { segment } from "../path.js";
import type {
  AddCartItemInput,
  BulkAddCartItemsInput,
  BulkAddCartItemsResponse,
  Cart,
  CartResponse,
  ListCartParams,
} from "../types/index.js";

/** Requires authentication. There is one active cart per user. */
export class CartResource {
  constructor(private readonly http: HttpClient) {}

  /** Active cart, created empty on first use (paging meta is dropped). */
  get(params: ListCartParams = {}): Promise<Cart> {
    return this.http.request<Cart>("GET", "/cart", {
      query: {
        q: params.q,
        product_id: params.product_id,
        variant_id: params.variant_id,
        sort: params.sort,
        page: params.page,
        limit: params.limit,
        offset: params.offset,
      },
    });
  }

  /** Same as `get`, plus the `meta` paging counters. */
  getPage(params: ListCartParams = {}): Promise<CartResponse> {
    return this.http.request<CartResponse>("GET", "/cart", {
      query: {
        q: params.q,
        product_id: params.product_id,
        variant_id: params.variant_id,
        sort: params.sort,
        page: params.page,
        limit: params.limit,
        offset: params.offset,
      },
      unwrap: false,
    });
  }

  /** Validates against the catalog and snapshots the current price. */
  addItem(input: AddCartItemInput): Promise<Cart> {
    return this.http.request<Cart>("POST", "/cart/items", {
      body: input,
      retry: false,
    });
  }

  /**
   * Adds up to MAX_BULK_ITEMS lines in one request. Per-line results carry
   * the written line, plus the full updated cart.
   */
  addItems(input: BulkAddCartItemsInput): Promise<BulkAddCartItemsResponse> {
    const { idempotencyKey, ...body } = input;
    return this.http.request<BulkAddCartItemsResponse>(
      "POST",
      "/cart/items/bulk",
      {
        body,
        headers: idempotencyHeaders(idempotencyKey),
        retry: false,
      },
    );
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
