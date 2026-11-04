import { idempotencyHeaders } from "../headers.js";
import type { HttpClient } from "../http.js";
import type {
  BulkSetStockInput,
  BulkSetStockResponse,
  BulkStockResponse,
  GetStockParams,
  ReserveStockInput,
  SetStockInput,
  StatusResponse,
  Stock,
} from "../types/index.js";

/** Admin-only stock operations, mounted under `/admin/inventory`. */
export class InventoryResource {
  constructor(private readonly http: HttpClient) {}

  getStock(params: GetStockParams): Promise<Stock> {
    return this.http.request<Stock>("GET", "/admin/inventory/stock", {
      query: {
        product_id: params.product_id,
        variant_id: params.variant_id,
      },
    });
  }

  /**
   * Reads availability for up to MAX_BULK_ITEMS variants in one request.
   * Unknown ids are returned in `notFound` instead of failing.
   */
  getStockByVariants(
    variantIds: string | string[],
  ): Promise<BulkStockResponse> {
    return this.http.request<BulkStockResponse>(
      "GET",
      "/admin/inventory/stock",
      {
        query: {
          variantIds: Array.isArray(variantIds) ? variantIds : [variantIds],
        },
      },
    );
  }

  /** Upserts the on-hand quantity (restocking). */
  setStock(input: SetStockInput): Promise<Stock> {
    return this.http.request<Stock>("POST", "/admin/inventory/stock", {
      body: input,
      retry: false,
    });
  }

  /** Sets on-hand stock for many SKUs; `atomic` commits all or none. */
  setStockBulk(input: BulkSetStockInput): Promise<BulkSetStockResponse> {
    const { idempotencyKey, ...body } = input;
    return this.http.request<BulkSetStockResponse>(
      "POST",
      "/admin/inventory/stock/bulk",
      {
        body,
        headers: idempotencyHeaders(idempotencyKey),
        retry: false,
      },
    );
  }

  /** Holds all lines atomically; one short line fails the whole order. */
  reserve(input: ReserveStockInput): Promise<StatusResponse> {
    return this.http.request<StatusResponse>(
      "POST",
      "/admin/inventory/reserve",
      { body: input, retry: false },
    );
  }

  /** Idempotent. */
  release(orderRef: string): Promise<StatusResponse> {
    return this.http.request<StatusResponse>(
      "POST",
      "/admin/inventory/release",
      { body: { order_ref: orderRef }, retry: false },
    );
  }

  /** Converts holds into sales. Idempotent. */
  confirm(orderRef: string): Promise<StatusResponse> {
    return this.http.request<StatusResponse>(
      "POST",
      "/admin/inventory/confirm",
      { body: { order_ref: orderRef }, retry: false },
    );
  }
}
