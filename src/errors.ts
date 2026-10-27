import type { ErrorCode } from "./types/common.js";

export interface MalawiStoreErrorInit {
  code: ErrorCode;
  message: string;
  /** HTTP status, or 0 for client-side failures. */
  status?: number;
  /** `X-Request-ID` echoed by the API, useful when reporting bugs. */
  requestId?: string;
  /** Populated for 429 responses from the `Retry-After` header. */
  retryAfterMs?: number;
  /** Raw response body, when one was available. */
  body?: unknown;
  cause?: unknown;
}

/**
 * Every API or transport failure is surfaced as this error. Switch on
 * `code` rather than `message` — messages are human-facing and may change.
 */
export class MalawiStoreError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly requestId?: string;
  readonly retryAfterMs?: number;
  readonly body?: unknown;

  constructor(init: MalawiStoreErrorInit) {
    super(init.message, init.cause === undefined ? undefined : { cause: init.cause });
    this.name = "MalawiStoreError";
    this.code = init.code;
    this.status = init.status ?? 0;
    this.requestId = init.requestId;
    this.retryAfterMs = init.retryAfterMs;
    this.body = init.body;
  }

  /** True when the caller hit the API rate limit (HTTP 429). */
  get isRateLimited(): boolean {
    return this.code === "RATE_LIMITED";
  }

  /** True when the access token is missing, invalid, or expired. */
  get isUnauthorized(): boolean {
    return this.code === "UNAUTHORIZED";
  }

  /** True when the caller is authenticated but lacks permission. */
  get isForbidden(): boolean {
    return this.code === "FORBIDDEN";
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      status: this.status,
      requestId: this.requestId,
    };
  }
}

export function isMalawiStoreError(error: unknown): error is MalawiStoreError {
  return error instanceof MalawiStoreError;
}
