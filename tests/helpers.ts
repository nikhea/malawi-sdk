import { vi } from "vitest";
import type { FetchLike, TokenPair } from "../src/index.js";

export interface RecordedCall {
  url: string;
  init: RequestInit;
}

export function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

export function emptyResponse(status = 204): Response {
  return new Response(null, { status });
}

export function tokenPair(overrides: Partial<TokenPair> = {}): TokenPair {
  return {
    token: "access-token",
    expires_at: "2026-11-01T00:00:00Z",
    refresh_token: "refresh-token",
    refresh_expires_at: "2026-12-01T00:00:00Z",
    user_id: "user-1",
    email: "aisha@example.mw",
    name: "Aisha Banda",
    role: "customer",
    ...overrides,
  };
}

export interface RecordingFetch {
  fetch: FetchLike;
  calls: RecordedCall[];
}

export function recordingFetch(
  handler?: (
    url: string,
    init: RequestInit,
    call: number,
  ) => Response | Promise<Response>,
): RecordingFetch {
  const calls: RecordedCall[] = [];

  const fetchImpl = vi.fn(async (url: string, init: RequestInit = {}) => {
    calls.push({ url, init });
    return handler
      ? handler(url, init, calls.length)
      : jsonResponse({ data: null });
  });

  return { fetch: fetchImpl as unknown as FetchLike, calls };
}

export function bodyOf(init: RequestInit): unknown {
  return typeof init.body === "string" ? JSON.parse(init.body) : undefined;
}

export function headerOf(init: RequestInit, name: string): string | undefined {
  const headers = (init.headers ?? {}) as Record<string, string>;
  const entry = Object.entries(headers).find(
    ([key]) => key.toLowerCase() === name.toLowerCase(),
  );
  return entry?.[1];
}
