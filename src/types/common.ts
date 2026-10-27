/** Machine-readable error codes emitted by the API. */
export type ApiErrorCode =
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL";

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
  /** Page size. The API defaults to 20 and caps at 100. */
  limit?: number;
  /** Number of rows to skip. */
  offset?: number;
}
