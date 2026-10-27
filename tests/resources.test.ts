import { describe, expect, it } from "vitest";
import { MalawiStore } from "../src/index.js";
import {
  bodyOf,
  headerOf,
  jsonResponse,
  recordingFetch,
  tokenPair,
} from "./helpers.js";

const BASE = "https://api.malawi.test/api/v1";

interface Case {
  name: string;
  run: (store: MalawiStore) => Promise<unknown>;
  method: string;
  path: string;
  body?: unknown;
}

const cases: Case[] = [
  // auth
  {
    name: "auth.register",
    run: (s) => s.auth.register({ email: "a@b.mw", name: "A", password: "pw" }),
    method: "POST",
    path: "/auth/register",
    body: { email: "a@b.mw", name: "A", password: "pw" },
  },
  {
    name: "auth.login",
    run: (s) => s.auth.login({ email: "a@b.mw", password: "pw" }),
    method: "POST",
    path: "/auth/login",
    body: { email: "a@b.mw", password: "pw" },
  },
  {
    name: "auth.refresh",
    run: (s) => s.auth.refresh(),
    method: "POST",
    path: "/auth/refresh",
    body: { refresh_token: "refresh-token" },
  },
  {
    name: "auth.logout",
    run: (s) => s.auth.logout(),
    method: "POST",
    path: "/auth/logout",
    body: { refresh_token: "refresh-token" },
  },
  {
    name: "auth.requestEmailVerification",
    run: (s) => s.auth.requestEmailVerification("a@b.mw"),
    method: "POST",
    path: "/auth/verify-email/request",
    body: { email: "a@b.mw" },
  },
  {
    name: "auth.verifyEmail",
    run: (s) => s.auth.verifyEmail({ email: "a@b.mw", code: "123456" }),
    method: "POST",
    path: "/auth/verify-email",
    body: { email: "a@b.mw", code: "123456" },
  },
  {
    name: "auth.requestPasswordReset",
    run: (s) => s.auth.requestPasswordReset("a@b.mw"),
    method: "POST",
    path: "/auth/password/forgot",
    body: { email: "a@b.mw" },
  },
  {
    name: "auth.resetPassword",
    run: (s) => s.auth.resetPassword({ token: "tok", new_password: "new" }),
    method: "POST",
    path: "/auth/password/reset",
    body: { token: "tok", new_password: "new" },
  },

  // users
  { name: "users.me", run: (s) => s.users.me(), method: "GET", path: "/users/me" },
  {
    name: "users.get",
    run: (s) => s.users.get("u1"),
    method: "GET",
    path: "/users/u1",
  },
  {
    name: "users.setRole",
    run: (s) => s.users.setRole("u1", { role: "admin" }),
    method: "PATCH",
    path: "/admin/users/u1/role",
    body: { role: "admin" },
  },

  // categories
  {
    name: "categories.list",
    run: (s) => s.categories.list(),
    method: "GET",
    path: "/categories",
  },
  {
    name: "categories.get",
    run: (s) => s.categories.get("c1"),
    method: "GET",
    path: "/categories/c1",
  },
  {
    name: "categories.getBySlug",
    run: (s) => s.categories.getBySlug("cooking oil"),
    method: "GET",
    path: "/categories/slug/cooking%20oil",
  },
  {
    name: "categories.create",
    run: (s) => s.categories.create({ name: "Oil" }),
    method: "POST",
    path: "/admin/categories",
    body: { name: "Oil" },
  },
  {
    name: "categories.update",
    run: (s) => s.categories.update("c1", { name: "Oil" }),
    method: "PATCH",
    path: "/admin/categories/c1",
    body: { name: "Oil" },
  },
  {
    name: "categories.delete",
    run: (s) => s.categories.delete("c1"),
    method: "DELETE",
    path: "/admin/categories/c1",
  },

  // products
  {
    name: "products.list",
    run: (s) => s.products.list(),
    method: "GET",
    path: "/products",
  },
  {
    name: "products.get",
    run: (s) => s.products.get("p1"),
    method: "GET",
    path: "/products/p1",
  },
  {
    name: "products.getBySlug",
    run: (s) => s.products.getBySlug("sunseed-oil"),
    method: "GET",
    path: "/products/slug/sunseed-oil",
  },
  {
    name: "products.create",
    run: (s) => s.products.create({ name: "Oil", price_cents: 12500 }),
    method: "POST",
    path: "/admin/products",
    body: { name: "Oil", price_cents: 12500 },
  },
  {
    name: "products.update",
    run: (s) => s.products.update("p1", { is_active: false }),
    method: "PATCH",
    path: "/admin/products/p1",
    body: { is_active: false },
  },
  {
    name: "products.delete",
    run: (s) => s.products.delete("p1"),
    method: "DELETE",
    path: "/admin/products/p1",
  },

  // variants
  {
    name: "variants.list",
    run: (s) => s.variants.list("p1"),
    method: "GET",
    path: "/products/p1/variants",
  },
  {
    name: "variants.create",
    run: (s) => s.variants.create("p1", { name: "500ml", sku: "OIL-1" }),
    method: "POST",
    path: "/products/p1/variants",
    body: { name: "500ml", sku: "OIL-1" },
  },
  {
    name: "variants.update",
    run: (s) => s.variants.update("v1", { price_cents: 2500 }),
    method: "PATCH",
    path: "/admin/variants/v1",
    body: { price_cents: 2500 },
  },
  {
    name: "variants.delete",
    run: (s) => s.variants.delete("v1"),
    method: "DELETE",
    path: "/admin/variants/v1",
  },

  // cart
  { name: "cart.get", run: (s) => s.cart.get(), method: "GET", path: "/cart" },
  {
    name: "cart.addItem",
    run: (s) => s.cart.addItem({ product_id: "p1", variant_id: "v1", qty: 2 }),
    method: "POST",
    path: "/cart/items",
    body: { product_id: "p1", variant_id: "v1", qty: 2 },
  },
  {
    name: "cart.setQty",
    run: (s) => s.cart.setQty("i1", 3),
    method: "PATCH",
    path: "/cart/items/i1",
    body: { qty: 3 },
  },
  {
    name: "cart.removeItem",
    run: (s) => s.cart.removeItem("i1"),
    method: "DELETE",
    path: "/cart/items/i1",
  },
  {
    name: "cart.clear",
    run: (s) => s.cart.clear(),
    method: "DELETE",
    path: "/cart",
  },

  // inventory
  {
    name: "inventory.getStock",
    run: (s) => s.inventory.getStock({ product_id: "p1", variant_id: "v1" }),
    method: "GET",
    path: "/admin/inventory/stock?product_id=p1&variant_id=v1",
  },
  {
    name: "inventory.setStock",
    run: (s) => s.inventory.setStock({ product_id: "p1", qty: 10 }),
    method: "POST",
    path: "/admin/inventory/stock",
    body: { product_id: "p1", qty: 10 },
  },
  {
    name: "inventory.reserve",
    run: (s) =>
      s.inventory.reserve({
        order_ref: "o1",
        lines: [{ product_id: "p1", qty: 2 }],
      }),
    method: "POST",
    path: "/admin/inventory/reserve",
    body: { order_ref: "o1", lines: [{ product_id: "p1", qty: 2 }] },
  },
  {
    name: "inventory.release",
    run: (s) => s.inventory.release("o1"),
    method: "POST",
    path: "/admin/inventory/release",
    body: { order_ref: "o1" },
  },
  {
    name: "inventory.confirm",
    run: (s) => s.inventory.confirm("o1"),
    method: "POST",
    path: "/admin/inventory/confirm",
    body: { order_ref: "o1" },
  },

  // orders
  {
    name: "orders.checkout",
    run: (s) => s.orders.checkout(),
    method: "POST",
    path: "/orders/checkout",
  },
  {
    name: "orders.list",
    run: (s) => s.orders.list(),
    method: "GET",
    path: "/orders",
  },
  {
    name: "orders.get",
    run: (s) => s.orders.get("o1"),
    method: "GET",
    path: "/orders/o1",
  },
  {
    name: "orders.cancel",
    run: (s) => s.orders.cancel("o1"),
    method: "POST",
    path: "/orders/o1/cancel",
  },

  // payments
  {
    name: "payments.createIntent",
    run: (s) => s.payments.createIntent("o1"),
    method: "POST",
    path: "/payments/intents",
    body: { order_id: "o1" },
  },

  // wishlist
  {
    name: "wishlist.list",
    run: (s) => s.wishlist.list(),
    method: "GET",
    path: "/wishlist",
  },
  {
    name: "wishlist.add",
    run: (s) => s.wishlist.add("p1"),
    method: "POST",
    path: "/wishlist",
    body: { product_id: "p1" },
  },
  {
    name: "wishlist.remove",
    run: (s) => s.wishlist.remove("p1"),
    method: "DELETE",
    path: "/wishlist/p1",
  },

  // reviews
  {
    name: "reviews.summary",
    run: (s) => s.reviews.summary("p1"),
    method: "GET",
    path: "/products/p1/reviews",
  },
  {
    name: "reviews.create",
    run: (s) => s.reviews.create("p1", { rating: 5, title: "Great" }),
    method: "POST",
    path: "/products/p1/reviews",
    body: { rating: 5, title: "Great" },
  },
  {
    name: "reviews.update",
    run: (s) => s.reviews.update("r1", { rating: 4 }),
    method: "PATCH",
    path: "/reviews/r1",
    body: { rating: 4 },
  },
  {
    name: "reviews.delete",
    run: (s) => s.reviews.delete("r1"),
    method: "DELETE",
    path: "/reviews/r1",
  },
  {
    name: "reviews.deleteAny",
    run: (s) => s.reviews.deleteAny("r1"),
    method: "DELETE",
    path: "/admin/reviews/r1",
  },
];

function responseFor(url: string): Response {
  if (url.includes("/auth/")) {
    return jsonResponse({ data: tokenPair() });
  }
  return jsonResponse({ data: null });
}

describe("resource endpoints", () => {
  it.each(cases)("$name", async ({ run, method, path, body }) => {
    const recorder = recordingFetch(responseFor);
    const store = new MalawiStore({
      baseUrl: BASE,
      token: "access-token",
      refreshToken: "refresh-token",
      fetch: recorder.fetch,
      retry: false,
    });

    await run(store);

    expect(recorder.calls).toHaveLength(1);
    const [call] = recorder.calls;
    expect(call?.url).toBe(`${BASE}${path}`);
    expect(call?.init.method).toBe(method);

    const isPublic =
      path.startsWith("/auth/") ||
      (method === "GET" &&
        (path === "/categories" ||
          path.startsWith("/categories/") ||
          path === "/products" ||
          path.startsWith("/products/")));

    if (isPublic) {
      expect(headerOf(call!.init, "authorization")).toBeUndefined();
    } else {
      expect(headerOf(call!.init, "authorization")).toBe(
        "Bearer access-token",
      );
    }

    if (body !== undefined) {
      expect(bodyOf(call!.init)).toEqual(body);
      expect(headerOf(call!.init, "content-type")).toBe("application/json");
    }
  });

  it("omits Authorization for public and auth endpoints", async () => {
    const recorder = recordingFetch(responseFor);
    const store = new MalawiStore({
      baseUrl: BASE,
      token: "access-token",
      fetch: recorder.fetch,
    });

    await store.categories.list();
    await store.auth.login({ email: "a@b.mw", password: "pw" });

    for (const call of recorder.calls) {
      expect(headerOf(call.init, "authorization")).toBeUndefined();
    }
  });
});
