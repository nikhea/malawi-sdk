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
