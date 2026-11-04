/** Machine-readable error codes emitted by the API. */
export type ApiErrorCode =
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL"
  | "BULK_LIMIT_EXCEEDED"
  | "DUPLICATE_ITEM"
  | "IDEMPOTENCY_CONFLICT";

/** Error codes that can originate inside the SDK itself. */
export type ClientErrorCode =
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "ABORTED"
  | "PARSE_ERROR";

export type ErrorCode = ApiErrorCode | ClientErrorCode;

/** Standard success envelope returned by every /api/v1 endpoint. */
export interface ApiEnvelope<T> {
  data: T;
}

/** Standard failure envelope returned by every /api/v1 endpoint. */
export interface ApiErrorEnvelope {
  error: {
    code: ApiErrorCode;
    message: string;
  };
}

/** Raw body returned by GET /health. */
export interface HealthResponse {
  status: string;
}

/** Simple `{ "status": "..." }` acknowledgement used by a few endpoints. */
export interface StatusResponse {
  status: string;
}

/** Offset pagination shared by list endpoints that support it. */
export interface PageParams {
  /** 1-based page. Wins over `offset` when both are sent. */
  page?: number;
  /** Page size. Storefront/shopper lists default to 12; admin user lists default to 20. Capped at 100. */
  limit?: number;
  /** Number of rows to skip. */
  offset?: number;
}

/** Paging counters shipped beside list rows in the `meta` envelope. */
export interface PaginationMeta {
  page: number;
  limit: number;
  offset: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

/** Raw paged envelope: `{ data: rows, meta: counters }`. */
export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

/** One item's outcome inside a bulk response. */
export type BulkItemStatus = "ok" | "error" | "rolled_back";

/** Machine-readable per-item failure. */
export interface BulkItemError {
  code: ApiErrorCode;
  message: string;
}

/** Per-item bulk outcome. `index` lines the result up with the request. */
export interface BulkResult<T> {
  index: number;
  /** Request line identity (row id, or `product_id|variant_id` for cart lines). */
  id?: string;
  status: BulkItemStatus;
  data?: T;
  error?: BulkItemError;
  /** Customer writes: the row already existed / was already gone. */
  alreadyExists?: boolean;
  alreadyRemoved?: boolean;
  /** Dry runs: the row would have been deleted; `blockers` explains refusals. */
  wouldDelete?: boolean;
  blockers?: string[];
}

/** Standard bulk envelope payload. */
export interface BulkResponse<T> {
  results: BulkResult<T>[];
  summary: BulkSummary;
}

/** Batch counters. Anything not `ok` (error or rolled_back) counts as failed. */
export interface BulkSummary {
  total: number;
  succeeded: number;
  failed: number;
}

/** Shared options for every bulk write. */
export interface BulkOptions {
  /** All lines commit, or the batch rolls back on the first failure. */
  atomic?: boolean;
  /** Replay-safe request key (sent as `Idempotency-Key`, 24h window). */
  idempotencyKey?: string;
}

/** Bulk writes that can validate without writing. */
export interface DryRunOptions extends BulkOptions {
  /** Validate and project the outcome without writing. */
  dryRun?: boolean;
}
