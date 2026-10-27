import type { HttpClient } from "../http.js";
import type {
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

  /** Upserts the on-hand quantity (restocking). */
  setStock(input: SetStockInput): Promise<Stock> {
    return this.http.request<Stock>("POST", "/admin/inventory/stock", {
      body: input,
      retry: false,
    });
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
