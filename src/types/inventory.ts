import type { BulkOptions, BulkResponse } from "./common.js";

export interface Stock {
  product_id: string;
  variant_id?: string;
  on_hand: number;
  reserved: number;
  available: number;
}

export interface GetStockParams {
  product_id: string;
  variant_id?: string;
}

export interface SetStockInput {
  product_id: string;
  variant_id?: string;
  qty: number;
}

/** One line of a batch restock. Stock is keyed by product + variant. */
export interface BulkSetStockItemInput {
  product_id: string;
  variant_id?: string;
  qty: number;
}

export interface BulkSetStockInput extends BulkOptions {
  items: BulkSetStockItemInput[];
}

export type BulkSetStockResponse = BulkResponse<Stock>;

/** Batch availability read: rows plus ids that did not resolve. */
export interface BulkStockResponse {
  stock: Stock[];
  notFound: string[];
}

export interface ReserveLineInput {
  product_id: string;
  variant_id?: string;
  qty: number;
}

export interface ReserveStockInput {
  order_ref: string;
  lines: ReserveLineInput[];
  /** Hold lifetime in seconds. The API default is 900. */
  ttl_seconds?: number;
}
