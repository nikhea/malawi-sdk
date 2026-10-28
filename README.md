# @malawistore/store-sdk

Typed TypeScript client for the **Malawi Store** e-commerce API — catalog,
cart, checkout, Stripe payments, wishlist, reviews, auth, and the full admin
surface.

- Zero runtime dependencies (uses the built-in `fetch`, `FormData`, and Web Crypto)
- Works in browsers, Node.js 20+, Bun, Deno, and edge runtimes
- ESM + CommonJS builds with complete type declarations
- Automatic envelope unwrapping and typed API errors
- Automatic access-token refresh on `401`
- Timeouts, backoff retries for safe requests, and request cancellation
- Stripe webhook signature verification helper

## Install

```bash
npm install @malawistore/store-sdk
```

## Quick start

```ts
import { MalawiStore } from "@malawistore/store-sdk";

const store = new MalawiStore({
  baseUrl: "https://shop.malawi.mw/api/v1",
});

// Browse the catalog without logging in
const categories = await store.categories.list();
const products = await store.products.list({ category_id: categories[0].id });

// Log in — the client stores the returned tokens for you
const session = await store.auth.login({
  email: "aisha@example.mw",
  password: "correct horse battery staple",
});

// Authenticated calls now carry the access token
const me = await store.users.me();
const cart = await store.cart.get();
```

The default `baseUrl` is `http://localhost:8080/api/v1`, which matches the Go
backend's local development server.

## Configuration

```ts
const store = new MalawiStore({
  baseUrl: "https://shop.malawi.mw/api/v1", // full API base, including /api/v1
  token: savedAccessToken,                  // optional starting access token
  refreshToken: savedRefreshToken,          // enables automatic refresh
  timeoutMs: 30_000,                        // 0 disables the timeout
  autoRefresh: true,                        // rotate once on 401, then retry
  retry: { retries: 2, baseDelayMs: 250, maxDelayMs: 2_000 },
  headers: { "X-Client": "storefront-web" },
  onTokenChange: ({ token, refreshToken }) => {
    // Persist however your app does it: localStorage, cookies, secure storage…
  },
  onUnauthorized: () => {
    // Refresh failed or no refresh token: send the user to the login screen.
  },
});
```

| Option            | Type                          | Default                     | Purpose                                                        |
| ----------------- | ----------------------------- | --------------------------- | -------------------------------------------------------------- |
| `baseUrl`         | `string`                      | `http://localhost:8080/api/v1` | API base URL, including the version prefix                  |
| `token`           | `string`                      | —                           | Access token to start with                                     |
| `refreshToken`    | `string`                      | —                           | Enables automatic session renewal                              |
| `fetch`           | `FetchLike`                   | global `fetch`              | Custom transport (tests, proxies, tracing)                     |
| `headers`         | `Record<string, string>`      | `{}`                        | Headers added to every request                                 |
| `timeoutMs`       | `number`                      | `30000`                     | Per-request timeout; `0` disables it                           |
| `autoRefresh`     | `boolean`                     | `true`                      | Refresh once on `401` and replay the request                   |
| `retry`           | `RetryOptions \| false`       | `{ retries: 2, … }`         | Retries `GET`/`HEAD` on `429`, `5xx`, and network errors        |
| `healthUrl`       | `string`                      | derived `<origin>/health`   | Override the raw health-check URL                              |
| `onTokenChange`   | `(tokens) => void`            | —                           | Persist rotated tokens                                         |
| `onUnauthorized`  | `() => void`                  | —                           | Called when a request stays unauthorized                       |

### Session persistence

The SDK never touches `localStorage` itself. Persist the pair wherever your app
keeps secrets, then pass it back on the next boot:

```ts
const store = new MalawiStore({
  baseUrl: "https://shop.malawi.mw/api/v1",
  token: localStorage.getItem("access_token") ?? undefined,
  refreshToken: localStorage.getItem("refresh_token") ?? undefined,
  onTokenChange: ({ token, refreshToken }) => {
    if (token) localStorage.setItem("access_token", token);
    if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
  },
  onUnauthorized: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    redirectToLogin();
  },
});
```

Concurrent requests that hit `401` share a single refresh call, so a page with
several parallel queries does not rotate the token multiple times.

> ⚠️ Browser storage is readable by any script on the page. For high-value
> accounts, keep refresh tokens in an `HttpOnly` cookie on your own backend and
> proxy session handling. The API itself uses Authorization headers, not cookies.

## Resources

| Property              | Covers                                                              |
| --------------------- | ------------------------------------------------------------------- |
| `store.auth`          | Register, login, refresh, logout, email verification, password reset |
| `store.users`         | Current account, user lookup, role management (admin)               |
| `store.categories`    | Taxonomy reads, admin CRUD, image upload                            |
| `store.products`      | Catalog reads, admin CRUD, image upload                             |
| `store.variants`      | SKU reads and admin CRUD                                            |
| `store.cart`          | Get, add, update quantity, remove, clear                            |
| `store.inventory`     | Stock lookup and admin set/reserve/release/confirm                  |
| `store.orders`        | Checkout, list, get, cancel                                         |
| `store.payments`      | Stripe payment intents and hosted Checkout sessions                 |
| `store.wishlist`      | List, add, remove                                                   |
| `store.reviews`       | Product summary, create, edit, delete, admin moderation             |

### Auth

```ts
await store.auth.register({ email, name, password });
await store.auth.login({ email, password });
await store.auth.refresh();                 // rotate the stored refresh token
await store.auth.logout();                  // revoke + clear local tokens

await store.auth.requestEmailVerification(email);
await store.auth.verifyEmail({ email, code: "482914" });

await store.auth.requestPasswordReset(email);
await store.auth.resetPassword({ token, new_password });
```

Register, login, and refresh store the returned `TokenPair` automatically.
Password reset clears local tokens because the API revokes sessions.

### Catalog

```ts
const categories = await store.categories.list();
const category = await store.categories.getBySlug("cooking-oil");

const products = await store.products.list({
  category_id: category.id,
  active_only: true,
  limit: 20,
  offset: 0,
});

const detail = await store.products.getBySlug("sunseed-cooking-oil-2l");
console.log(detail.product.price_cents); // 12500 → K125.00
console.log(detail.variants);            // sellable SKUs

const skus = await store.variants.list(detail.product.id);
```

For paginated grids use `listPage()`, which returns `{ data, meta }`:

```ts
const page = await store.products.listPage({
  q: "dress",
  category_slug: "dresses",
  min_price_cents: 1_000_00,
  max_price_cents: 9_000_00,
  in_stock: true,
  size: "XL",
  min_rating: 4,
  sort: "price_desc",
  page: 2,
  limit: 24,
});

page.meta; // page, limit, offset, total, total_pages, has_next, has_prev
```

Categories support `q`, `parent_id`, `root_only`, `has_products`, `sort`,
`page`, `limit` and `offset` through `categories.list()` or
`categories.listPage()`. `page` wins over `offset`; the API defaults to 20
rows and caps a page at 100.

Variant rows include `available` (on-hand minus reservations) and `in_stock`,
both in the product detail and `/products/:id/variants` responses.

Prices are integer **USD cents**: `12500` means `$125.00`. Never convert to
floating point for arithmetic. Historical orders may still carry MWK
tambala; the API converts those at charge time.

### Cart and checkout

```ts
await store.cart.addItem({ product_id: "…", qty: 2 });
await store.cart.addItem({ product_id: "…", variant_id: "…", qty: 1 });
await store.cart.setQty("cart-line-id", 3);
await store.cart.removeItem("cart-line-id");

const cart = await store.cart.get();
console.log(cart.subtotal_cents);

// Freezes the cart, reserves stock, and clears the cart
const order = await store.orders.checkout();

// Create a Stripe intent and confirm it with Stripe.js
const payment = await store.payments.createIntent(order.id);
// stripe.confirmCardPayment(payment.client_secret, { … })

// Or send the customer to Stripe's hosted payment page
const checkout = await store.payments.createCheckoutSession(order.id);
window.location.assign(checkout.url);
```

### Orders

```ts
const orders = await store.orders.list();
const order = await store.orders.get(orderId);
const cancelled = await store.orders.cancel(orderId); // pending orders only
```

### Wishlist and reviews

```ts
await store.wishlist.add(productId);
const wishlist = await store.wishlist.list();
await store.wishlist.remove(productId); // product ID, not row ID

const summary = await store.reviews.summary(productId);
await store.reviews.create(productId, { rating: 5, title: "Great", body: "…" });
await store.reviews.update(reviewId, { rating: 4 });
await store.reviews.delete(reviewId);
```

### Admin

All write methods require an account with the `admin` role.

```ts
const product = await store.products.create({
  name: "Sunseed Cooking Oil 2L",
  category_id: categoryId,
  price_cents: 12500,
  currency: "USD",
});

await store.products.update(product.id, { is_active: false });
await store.variants.create(product.id, { name: "500ml", sku: "OIL-500" });
await store.inventory.setStock({ product_id: product.id, qty: 50 });

await store.users.setRole(userId, { role: "admin" });
await store.reviews.deleteAny(reviewId); // moderation

// Admin user directory: filters + pagination
const users = await store.users.list({ role: "customer", q: "aisha", sort: "newest" });
const page = await store.users.listPage({ email_verified: false, page: 1, limit: 50 });
page.meta.total; // matching accounts
```

### Image uploads

Uploads are queued server-side (HTTP `202`) and applied by the worker once
Cloudinary finishes. The method resolves as soon as the job is accepted.

```ts
// Browser
const file = fileInput.files![0];
await store.products.uploadImage(productId, file);

// Node: wrap a Buffer
import { readFile } from "node:fs/promises";
const data = await readFile("./photo.jpg");
await store.categories.uploadImage(categoryId, {
  data,
  name: "photo.jpg",
  type: "image/jpeg",
});
```

Maximum size is 10 MiB per image.

## Error handling

Every failure is a `MalawiStoreError` with a stable `code`, the HTTP `status`,
and the API's `X-Request-ID` when available.

```ts
import { isMalawiStoreError } from "@malawistore/store-sdk";

try {
  await store.products.get("missing");
} catch (error) {
  if (isMalawiStoreError(error)) {
    switch (error.code) {
      case "NOT_FOUND":       /* show an empty state */ break;
      case "UNAUTHORIZED":    /* log in again */ break;
      case "FORBIDDEN":       /* not an admin */ break;
      case "CONFLICT":        /* duplicate / state conflict */ break;
      case "RATE_LIMITED":    /* back off for error.retryAfterMs */ break;
      case "TIMEOUT":         /* network too slow */ break;
      default:                /* INTERNAL, NETWORK_ERROR, PARSE_ERROR, ABORTED */
    }
    console.error(error.code, error.message, error.requestId);
  }
}
```

API codes: `NOT_FOUND`, `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`,
`CONFLICT`, `RATE_LIMITED`, `INTERNAL`.
Client-side codes: `NETWORK_ERROR`, `TIMEOUT`, `ABORTED`, `PARSE_ERROR`.

Cancellation and per-request overrides are supported on every method via the
escape hatch:

```ts
const controller = new AbortController();
await store.request("GET", "/products", {
  signal: controller.signal,
  timeoutMs: 5_000,
});
```

## Stripe webhook verification

The Go API verifies its own Stripe webhooks. If you also receive events in an
edge function or a separate service, the SDK ships a dependency-free verifier
built on Web Crypto:

```ts
import { constructStripeEvent, verifyStripeSignature } from "@malawistore/store-sdk";

// Edge function / Node handler
const payload = await request.text(); // raw body, never re-stringified
const signature = request.headers.get("stripe-signature")!;

if (!(await verifyStripeSignature({ payload, signature, secret }))) {
  return new Response("invalid signature", { status: 400 });
}

const event = await constructStripeEvent({ payload, signature, secret });
if (event.type === "checkout.session.completed") {
  // fulfil the order
}
```

The verifier enforces a 5-minute timestamp tolerance by default
(`toleranceSeconds: 300`; set `0` to disable). It also accepts `Uint8Array`
payloads.

## Health check

`health()` calls the raw `/health` endpoint outside `/api/v1` and does not
unwrap an envelope:

```ts
await store.health(); // { status: "ok" }
```

## Runtime notes

- **Node.js 20+** is required (global `fetch`, `FormData`, and Web Crypto).
- In browsers, route requests through the same origin or enable CORS on the API
  (`FRONTEND_URL` on the backend).
- The SDK sets `Content-Type: application/json` only when sending a JSON body;
  multipart uploads let the runtime generate the boundary.
- All IDs in paths are URL-encoded.
- `request()` is available as an escape hatch for endpoints added after an SDK
  release.

## Development

```bash
npm install
npm run typecheck   # strict TypeScript
npm test            # Vitest, 81 tests
npm run build       # ESM + CJS + declarations
npm run pack:check  # inspect the published tarball
```

## License

MIT
