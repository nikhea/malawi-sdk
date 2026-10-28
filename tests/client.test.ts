import { describe, expect, it, vi } from "vitest";
import {
  isMalawiStoreError,
  MalawiStore,
  MalawiStoreError,
  type TokenPair,
} from "../src/index.js";
import {
  bodyOf,
  emptyResponse,
  headerOf,
  jsonResponse,
  recordingFetch,
  tokenPair,
} from "./helpers.js";

const BASE = "https://api.malawi.test/api/v1";

describe("MalawiStore", () => {
  it("unwraps the data envelope and sends JSON bodies", async () => {
    const pair = tokenPair();
    const recorder = recordingFetch(async (url) => {
      if (url.endsWith("/auth/login")) return jsonResponse({ data: pair });
      throw new Error(`unexpected request: ${url}`);
    });
    const store = new MalawiStore({ baseUrl: BASE, fetch: recorder.fetch });

    const session = await store.auth.login({
      email: "aisha@example.mw",
      password: "secret",
    });

    expect(session).toEqual(pair);
    expect(recorder.calls).toHaveLength(1);

    const [call] = recorder.calls;
    expect(call?.url).toBe(`${BASE}/auth/login`);
    expect(call?.init.method).toBe("POST");
    expect(bodyOf(call!.init)).toEqual({
      email: "aisha@example.mw",
      password: "secret",
    });
    expect(headerOf(call!.init, "content-type")).toBe("application/json");
    expect(store.token).toBe(pair.token);
    expect(store.refreshToken).toBe(pair.refresh_token);
  });

  it("maps API failures to MalawiStoreError with code and request id", async () => {
    const recorder = recordingFetch(() =>
      jsonResponse(
        { error: { code: "NOT_FOUND", message: "product not found" } },
        404,
        { "x-request-id": "req-123" },
      ),
    );
    const store = new MalawiStore({ baseUrl: BASE, fetch: recorder.fetch });

    const error = await store.products.get("missing").catch((err: unknown) => err);

    expect(isMalawiStoreError(error)).toBe(true);
    expect(error).toBeInstanceOf(MalawiStoreError);
    expect(error).toMatchObject({
      code: "NOT_FOUND",
      message: "product not found",
      status: 404,
      requestId: "req-123",
    });
    expect((error as MalawiStoreError).isUnauthorized).toBe(false);
  });

  it("keeps false and zero query values but drops undefined ones", async () => {
    const recorder = recordingFetch(() => jsonResponse({ data: [] }));
    const store = new MalawiStore({ baseUrl: BASE, fetch: recorder.fetch });

    await store.products.list({
      category_id: "cat 1",
      active_only: false,
      limit: 0,
      offset: undefined,
    });

    const url = recorder.calls[0]?.url ?? "";
    expect(url).toContain("category_id=cat+1");
    expect(url).toContain("active_only=false");
    expect(url).toContain("limit=0");
    expect(url).not.toContain("offset");
  });

  it("serializes product filters and returns paged metadata", async () => {
    const meta = {
      page: 2,
      limit: 10,
      offset: 10,
      total: 41,
      total_pages: 5,
      has_next: true,
      has_prev: true,
    };
    const recorder = recordingFetch(() =>
      jsonResponse({ data: [{ id: "p1" }], meta }),
    );
    const store = new MalawiStore({ baseUrl: BASE, fetch: recorder.fetch });

    const page = await store.products.listPage({
      q: "dress",
      category_slug: "dresses",
      min_price_cents: 1000,
      max_price_cents: 5000,
      in_stock: true,
      size: "XL",
      min_rating: 4,
      created_after: "2026-01-01",
      created_before: "2026-12-31",
      active_only: false,
      sort: "price_desc",
      page: 2,
      limit: 10,
    });

    const url = new URL(recorder.calls[0]?.url ?? "");
    expect(url.pathname).toBe("/api/v1/products");
    expect(url.searchParams.get("q")).toBe("dress");
    expect(url.searchParams.get("category_slug")).toBe("dresses");
    expect(url.searchParams.get("min_price_cents")).toBe("1000");
    expect(url.searchParams.get("max_price_cents")).toBe("5000");
    expect(url.searchParams.get("in_stock")).toBe("true");
    expect(url.searchParams.get("size")).toBe("XL");
    expect(url.searchParams.get("min_rating")).toBe("4");
    expect(url.searchParams.get("created_after")).toBe("2026-01-01");
    expect(url.searchParams.get("created_before")).toBe("2026-12-31");
    expect(url.searchParams.get("active_only")).toBe("false");
    expect(url.searchParams.get("sort")).toBe("price_desc");
    expect(url.searchParams.get("page")).toBe("2");
    expect(page.meta.total).toBe(41);
    expect(page.data).toEqual([{ id: "p1" }]);
  });

  it("serializes category filters and returns paged metadata", async () => {
    const meta = {
      page: 1,
      limit: 10,
      offset: 0,
      total: 5,
      total_pages: 1,
      has_next: false,
      has_prev: false,
    };
    const recorder = recordingFetch(() =>
      jsonResponse({ data: [{ id: "c1" }], meta }),
    );
    const store = new MalawiStore({ baseUrl: BASE, fetch: recorder.fetch });

    const page = await store.categories.listPage({
      q: "dress",
      root_only: true,
      has_products: true,
      sort: "product_count_desc",
      limit: 10,
    });

    const url = new URL(recorder.calls[0]?.url ?? "");
    expect(url.searchParams.get("q")).toBe("dress");
    expect(url.searchParams.get("root_only")).toBe("true");
    expect(url.searchParams.get("has_products")).toBe("true");
    expect(url.searchParams.get("sort")).toBe("product_count_desc");
    expect(page.meta.total).toBe(5);
  });

  it("handles 204 responses", async () => {
    const recorder = recordingFetch(() => emptyResponse());
    const store = new MalawiStore({
      baseUrl: BASE,
      token: "access",
      fetch: recorder.fetch,
    });

    const result = await store.cart.clear();

    expect(result).toBeUndefined();
    expect(recorder.calls[0]?.url).toBe(`${BASE}/cart`);
    expect(recorder.calls[0]?.init.method).toBe("DELETE");
  });

  it("refreshes the token once on 401 and retries the request", async () => {
    const fresh = tokenPair({
      token: "new-access",
      refresh_token: "new-refresh",
    });
    let cartCalls = 0;

    const recorder = recordingFetch((url, init) => {
      if (url.endsWith("/cart")) {
        cartCalls += 1;
        if (cartCalls === 1) {
          expect(headerOf(init, "authorization")).toBe("Bearer old-access");
          return jsonResponse(
            { error: { code: "UNAUTHORIZED", message: "invalid token" } },
            401,
          );
        }
        expect(headerOf(init, "authorization")).toBe("Bearer new-access");
        return jsonResponse({ data: { id: "cart-1", items: [] } });
      }

      if (url.endsWith("/auth/refresh")) {
        expect(bodyOf(init)).toEqual({ refresh_token: "old-refresh" });
        return jsonResponse({ data: fresh });
      }

      throw new Error(`unexpected request: ${url}`);
    });

    const store = new MalawiStore({
      baseUrl: BASE,
      token: "old-access",
      refreshToken: "old-refresh",
      fetch: recorder.fetch,
      retry: false,
    });

    const cart = await store.cart.get();

    expect(cart).toMatchObject({ id: "cart-1" });
    expect(store.token).toBe("new-access");
    expect(store.refreshToken).toBe("new-refresh");
    expect(recorder.calls.map((call) => call.url)).toEqual([
      `${BASE}/cart`,
      `${BASE}/auth/refresh`,
      `${BASE}/cart`,
    ]);
  });

  it("calls onUnauthorized when a 401 cannot be refreshed", async () => {
    const onUnauthorized = vi.fn();
    const recorder = recordingFetch(() =>
      jsonResponse(
        { error: { code: "UNAUTHORIZED", message: "authentication required" } },
        401,
      ),
    );
    const store = new MalawiStore({
      baseUrl: BASE,
      fetch: recorder.fetch,
      onUnauthorized,
      retry: false,
    });

    await expect(store.users.me()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      status: 401,
    });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(recorder.calls).toHaveLength(1);
  });

  it("notifies token listeners and exposes them for persistence", async () => {
    const changes: Array<{ token?: string; refreshToken?: string }> = [];
    const recorder = recordingFetch(() =>
      jsonResponse({ data: tokenPair({ token: "persisted" }) }),
    );
    const store = new MalawiStore({
      baseUrl: BASE,
      fetch: recorder.fetch,
      onTokenChange: (state) => changes.push(state),
    });

    await store.auth.login({ email: "a@b.mw", password: "pw" });
    store.clearTokens();

    expect(changes).toEqual([
      { token: "persisted", refreshToken: "refresh-token" },
      { token: undefined, refreshToken: undefined },
    ]);
  });

  it("retries idempotent requests on 5xx", async () => {
    let attempts = 0;
    const recorder = recordingFetch(() => {
      attempts += 1;
      if (attempts === 1) {
        return jsonResponse(
          { error: { code: "INTERNAL", message: "boom" } },
          500,
        );
      }
      return jsonResponse({ data: [{ id: "p-1" }] });
    });

    const store = new MalawiStore({
      baseUrl: BASE,
      fetch: recorder.fetch,
      retry: { retries: 1, baseDelayMs: 0, maxDelayMs: 0 },
    });

    await store.products.list();

    expect(attempts).toBe(2);
  });

  it("does not retry mutations", async () => {
    const recorder = recordingFetch(() =>
      jsonResponse({ error: { code: "INTERNAL", message: "boom" } }, 500),
    );
    const store = new MalawiStore({
      baseUrl: BASE,
      token: "access",
      fetch: recorder.fetch,
      retry: { retries: 2, baseDelayMs: 0, maxDelayMs: 0 },
    });

    await expect(
      store.cart.addItem({ product_id: "p-1", qty: 1 }),
    ).rejects.toMatchObject({ code: "INTERNAL" });
    expect(recorder.calls).toHaveLength(1);
  });

  it("times out hanging requests", async () => {
    const fetchImpl = vi.fn(
      (_url: string, init: RequestInit = {}) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        }),
    );

    const store = new MalawiStore({
      baseUrl: BASE,
      fetch: fetchImpl as unknown as typeof fetch,
      timeoutMs: 10,
      retry: false,
    });

    await expect(store.categories.list()).rejects.toMatchObject({
      code: "TIMEOUT",
      status: 0,
    });
  });

  it("surfaces non-JSON success bodies as PARSE_ERROR", async () => {
    const recorder = recordingFetch(
      () => new Response("<html>oops</html>", { status: 200 }),
    );
    const store = new MalawiStore({ baseUrl: BASE, fetch: recorder.fetch });

    await expect(store.products.list()).rejects.toMatchObject({
      code: "PARSE_ERROR",
    });
  });

  it("derives and calls the health endpoint outside /api/v1", async () => {
    const recorder = recordingFetch(() => jsonResponse({ status: "ok" }));
    const store = new MalawiStore({ baseUrl: BASE, fetch: recorder.fetch });

    const health = await store.health();

    expect(health).toEqual({ status: "ok" });
    expect(recorder.calls[0]?.url).toBe("https://api.malawi.test/health");
  });

  it("accepts a relative base URL (browser proxy setups)", async () => {
    const recorder = recordingFetch(() => jsonResponse({ data: [] }));
    const store = new MalawiStore({
      baseUrl: "/api/v1/",
      fetch: recorder.fetch,
    });

    await store.categories.list();

    expect(recorder.calls[0]?.url).toBe("/api/v1/categories");
  });

  it("supports the request escape hatch", async () => {
    const recorder = recordingFetch(() => jsonResponse({ data: { ok: true } }));
    const store = new MalawiStore({ baseUrl: BASE, fetch: recorder.fetch });

    const result = await store.request<{ ok: boolean }>("GET", "/custom", {
      query: { page: 2 },
    });

    expect(result).toEqual({ ok: true });
    expect(recorder.calls[0]?.url).toBe(`${BASE}/custom?page=2`);
  });
});

describe("auth refresh", () => {
  it("requires a refresh token", async () => {
    const store = new MalawiStore({
      baseUrl: BASE,
      fetch: recordingFetch().fetch,
    });

    await expect(store.auth.refresh()).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("clears local tokens on logout even if the API fails", async () => {
    const recorder = recordingFetch(() =>
      jsonResponse({ error: { code: "INTERNAL", message: "down" } }, 500),
    );
    const store = new MalawiStore({
      baseUrl: BASE,
      token: "access",
      refreshToken: "refresh",
      fetch: recorder.fetch,
      retry: false,
    });

    await expect(store.auth.logout()).rejects.toMatchObject({
      code: "INTERNAL",
    });
    expect(store.token).toBeUndefined();
    expect(store.refreshToken).toBeUndefined();
  });
});

// Compile-time check that the exported TokenPair type is usable by consumers.
const _typeCheck: TokenPair | undefined = undefined;
void _typeCheck;
