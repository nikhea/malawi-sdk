import { MalawiStoreError } from "./errors.js";
import { buildQuery, type QueryParams } from "./query.js";
import type { ErrorCode, ApiErrorEnvelope } from "./types/common.js";
import type { TokenPair } from "./types/index.js";

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface RetryOptions {
  /** Maximum retries after the first attempt. Default 2. */
  retries?: number;
  /** First backoff in milliseconds. Default 250. */
  baseDelayMs?: number;
  /** Backoff ceiling in milliseconds. Default 2000. */
  maxDelayMs?: number;
}

export interface TokenState {
  token?: string;
  refreshToken?: string;
}

export interface MalawiStoreOptions {
  /**
   * Full API base URL, including the version prefix.
   * @default "http://localhost:8080/api/v1"
   */
  baseUrl?: string;
  /** Access token to start with. */
  token?: string;
  /** Refresh token used by automatic session renewal. */
  refreshToken?: string;
  /** Custom fetch implementation (tests, proxies, instrumented runtimes). */
  fetch?: FetchLike;
  /** Headers sent with every request. */
  headers?: Record<string, string>;
  /** Per-request timeout in milliseconds. `0` disables it. Default 30000. */
  timeoutMs?: number;
  /**
   * Retry a request once with a rotated token after a 401. Only runs when
   * a refresh token is set. Default `true`.
   */
  autoRefresh?: boolean;
  /** Retries for idempotent requests (GET/HEAD) on 429, 5xx, or network errors. */
  retry?: RetryOptions | false;
  /** Override the derived `<origin>/health` URL. */
  healthUrl?: string;
  /** Persist tokens here (localStorage, cookies, a server session, …). */
  onTokenChange?: (state: TokenState) => void;
  /** Called once a request stays unauthorized after a refresh attempt. */
  onUnauthorized?: () => void;
}

export interface RequestOptions {
  query?: QueryParams;
  /** JSON body. Ignored when `form` is set. */
  body?: unknown;
  /** Multipart body. Sets no Content-Type so the boundary is generated. */
  form?: FormData;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
  /** Omit the Authorization header (auth and public endpoints). */
  skipAuth?: boolean;
  /** Do not attempt a token refresh on 401. Set internally by auth refresh. */
  skipAutoRefresh?: boolean;
  /** Set to `false` to return the whole envelope. Default `true`. */
  unwrap?: boolean;
  /** Per-request retry override. */
  retry?: RetryOptions | false;
  /** Absolute URL. Used by `health()`; path/baseUrl are ignored. */
  absoluteUrl?: string;
}

interface ResolvedRetry {
  retries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_BASE_URL = "http://localhost:8080/api/v1";
const DEFAULT_TIMEOUT_MS = 30_000;
const SAFE_METHODS = new Set(["GET", "HEAD"]);
const API_SUFFIX = "/api/v1";

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

function deriveHealthUrl(baseUrl: string): string {
  const root = baseUrl.endsWith(API_SUFFIX)
    ? baseUrl.slice(0, -API_SUFFIX.length)
    : baseUrl;
  return `${root}/health`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function resolveRetry(
  input: RetryOptions | false | undefined,
): ResolvedRetry | false {
  if (input === false) return false;
  return {
    retries: clamp(Math.trunc(input?.retries ?? 2), 0, 10),
    baseDelayMs: Math.max(0, input?.baseDelayMs ?? 250),
    maxDelayMs: Math.max(0, input?.maxDelayMs ?? 2_000),
  };
}

function backoffMs(attempt: number, retry: ResolvedRetry): number {
  return Math.min(retry.maxDelayMs, retry.baseDelayMs * 2 ** attempt);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function discard(response: Response): void {
  void response.body?.cancel().catch(() => undefined);
}

function retryAfterMs(response: Response): number | undefined {
  const header = response.headers.get("retry-after");
  if (!header) return undefined;

  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);

  const date = Date.parse(header);
  if (Number.isNaN(date)) return undefined;
  return Math.max(0, date - Date.now());
}

function codeForStatus(status: number): ErrorCode {
  switch (status) {
    case 400:
      return "VALIDATION_ERROR";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 429:
      return "RATE_LIMITED";
    default:
      return status >= 500 ? "INTERNAL" : "VALIDATION_ERROR";
  }
}

function asError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}

/**
 * Low-level transport used by every resource. Handles envelopes, errors,
 * timeouts, retries, and token rotation. Prefer `MalawiStore` over using
 * this class directly.
 */
export class HttpClient {
  readonly baseUrl: string;
  readonly healthUrl: string;
  readonly autoRefresh: boolean;

  private readonly fetchImpl: FetchLike;
  private readonly defaultHeaders: Record<string, string>;
  private readonly timeoutMs: number;
  private readonly retry: ResolvedRetry | false;
  private readonly onTokenChange?: (state: TokenState) => void;
  private readonly onUnauthorized?: () => void;

  private tokenValue?: string;
  private refreshTokenValue?: string;
  private refreshHandler?: () => Promise<boolean>;

  constructor(options: MalawiStoreOptions = {}) {
    const fetchImpl =
      options.fetch ??
      (typeof globalThis.fetch === "function"
        ? globalThis.fetch.bind(globalThis)
        : undefined);

    if (!fetchImpl) {
      throw new TypeError(
        "No fetch implementation available. Pass one via the `fetch` option.",
      );
    }

    this.baseUrl = stripTrailingSlash(options.baseUrl ?? DEFAULT_BASE_URL);
    this.healthUrl = options.healthUrl ?? deriveHealthUrl(this.baseUrl);
    this.fetchImpl = fetchImpl;
    this.defaultHeaders = { ...options.headers };
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.retry = resolveRetry(options.retry);
    this.autoRefresh = options.autoRefresh ?? true;
    this.tokenValue = options.token;
    this.refreshTokenValue = options.refreshToken;
    this.onTokenChange = options.onTokenChange;
    this.onUnauthorized = options.onUnauthorized;
  }

  getToken(): string | undefined {
    return this.tokenValue;
  }

  getRefreshToken(): string | undefined {
    return this.refreshTokenValue;
  }

  getTokenState(): TokenState {
    return { token: this.tokenValue, refreshToken: this.refreshTokenValue };
  }

  setTokens(state: TokenState): void {
    if (state.token !== undefined) this.tokenValue = state.token;
    if (state.refreshToken !== undefined) this.refreshTokenValue = state.refreshToken;
    this.onTokenChange?.(this.getTokenState());
  }

  setTokenPair(pair: TokenPair): void {
    this.tokenValue = pair.token;
    this.refreshTokenValue = pair.refresh_token;
    this.onTokenChange?.(this.getTokenState());
  }

  clearTokens(): void {
    this.tokenValue = undefined;
    this.refreshTokenValue = undefined;
    this.onTokenChange?.(this.getTokenState());
  }

  /** @internal Wired by `MalawiStore` so resources stay decoupled. */
  setRefreshHandler(handler: () => Promise<boolean>): void {
    this.refreshHandler = handler;
  }

  async request<T = unknown>(
    method: string,
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const base = options.absoluteUrl ?? `${this.baseUrl}${normalizePath(path)}`;
    const url = `${base}${buildQuery(options.query)}`;
    const retry =
      options.retry === false
        ? false
        : resolveRetry(options.retry ?? this.retry ?? undefined);
    const maxRetries = retry ? retry.retries : 0;
    const safe = SAFE_METHODS.has(method.toUpperCase());

    for (let attempt = 0; ; attempt += 1) {
      let response: Response;

      try {
        response = await this.fetchWithRefresh(method, url, options);
      } catch (error) {
        if (error instanceof MalawiStoreError) throw error;
        if (retry && safe && attempt < maxRetries) {
          await sleep(backoffMs(attempt, retry));
          continue;
        }
        throw new MalawiStoreError({
          code: "NETWORK_ERROR",
          message: `Network request failed: ${asError(error).message}`,
          cause: error,
        });
      }

      if (
        retry &&
        safe &&
        attempt < maxRetries &&
        (response.status === 429 || response.status >= 500)
      ) {
        const wait = retryAfterMs(response) ?? backoffMs(attempt, retry);
        discard(response);
        await sleep(wait);
        continue;
      }

      return this.parse<T>(response, options);
    }
  }

  private canRefresh(options: RequestOptions): boolean {
    return (
      this.autoRefresh &&
      !options.skipAuth &&
      !options.skipAutoRefresh &&
      this.refreshTokenValue !== undefined &&
      this.refreshHandler !== undefined
    );
  }

  private async fetchWithRefresh(
    method: string,
    url: string,
    options: RequestOptions,
  ): Promise<Response> {
    const response = await this.send(method, url, options);

    if (response.status !== 401) return response;

    if (!this.canRefresh(options)) {
      this.onUnauthorized?.();
      return response;
    }

    let refreshed = false;
    try {
      refreshed = await this.refreshHandler!();
    } catch {
      refreshed = false;
    }

    if (!refreshed) {
      this.onUnauthorized?.();
      return response;
    }

    discard(response);
    return this.send(method, url, options);
  }

  private async send(
    method: string,
    url: string,
    options: RequestOptions,
  ): Promise<Response> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...this.defaultHeaders,
      ...options.headers,
    };

    if (this.tokenValue !== undefined && !options.skipAuth) {
      headers.Authorization = `Bearer ${this.tokenValue}`;
    }

    let body: BodyInit | undefined;
    if (options.form !== undefined) {
      body = options.form;
    } else if (options.body !== undefined) {
      const hasContentType = Object.keys(headers).some(
        (key) => key.toLowerCase() === "content-type",
      );
      if (!hasContentType) headers["Content-Type"] = "application/json";
      body = JSON.stringify(options.body);
    }

    const timeoutMs = options.timeoutMs ?? this.timeoutMs;
    const controller = new AbortController();
    const externalSignal = options.signal;
    let timedOut = false;

    const timer =
      timeoutMs > 0
        ? setTimeout(() => {
            timedOut = true;
            controller.abort();
          }, timeoutMs)
        : undefined;

    const onAbort = () => controller.abort(externalSignal?.reason);
    if (externalSignal) {
      if (externalSignal.aborted) onAbort();
      else externalSignal.addEventListener("abort", onAbort, { once: true });
    }

    try {
      return await this.fetchImpl(url, {
        method,
        headers,
        body,
        signal: controller.signal,
      });
    } catch (error) {
      if (timedOut) {
        throw new MalawiStoreError({
          code: "TIMEOUT",
          message: `Request timed out after ${timeoutMs}ms`,
          cause: error,
        });
      }
      if (externalSignal?.aborted) {
        throw new MalawiStoreError({
          code: "ABORTED",
          message: "Request aborted",
          cause: error,
        });
      }
      throw error;
    } finally {
      if (timer !== undefined) clearTimeout(timer);
      externalSignal?.removeEventListener("abort", onAbort);
    }
  }

  private async parse<T>(
    response: Response,
    options: RequestOptions,
  ): Promise<T> {
    const text = await response.text();
    let parsed: unknown;

    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch (error) {
        if (response.ok) {
          throw new MalawiStoreError({
            code: "PARSE_ERROR",
            message: "The API returned a non-JSON response",
            status: response.status,
            body: text,
            cause: error,
          });
        }
      }
    }

    if (!response.ok) {
      const detail = (parsed as ApiErrorEnvelope | undefined)?.error;
      throw new MalawiStoreError({
        code: detail?.code ?? codeForStatus(response.status),
        message:
          detail?.message ?? `Request failed with status ${response.status}`,
        status: response.status,
        requestId: response.headers.get("x-request-id") ?? undefined,
        retryAfterMs: retryAfterMs(response),
        body: parsed ?? (text || undefined),
      });
    }

    if (options.unwrap === false) return parsed as T;

    if (
      parsed !== null &&
      typeof parsed === "object" &&
      "data" in (parsed as Record<string, unknown>)
    ) {
      return (parsed as { data: T }).data;
    }

    return parsed as T;
  }
}
