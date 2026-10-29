# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.3] - 2026-10-29

### Added

- `cart.getPage()` with line filters (`q`, `product_id`, `variant_id`), sorting,
  and paging metadata; cart totals still cover every line.
- `orders.listPage()` with status/currency/date/total filters and sorting.
- `wishlist.listPage()` with product search, category filtering, and sorting.
- Review filters and paging through `reviews.summary(productId, params)`.
- `ListCartParams`, `ListOrdersParams`, `ListWishlistParams`,
  `ListReviewsParams`, and `CartResponse` wire types.

### Changed

- Storefront and shopper lists default to 12 rows per page; the admin user
  directory still defaults to 20. Every page remains capped at 100.
- Existing `list()`, `get()`, and `summary()` methods now accept the same
  optional query parameters without changing their return shapes.

## [0.1.1] - 2026-10-28

### Added

- `relevance` as a `ProductSort` value for `products.list` and
  `products.listPage`, matching the API's default full-text ranking when
  `q` is set.

### Changed

- `q` is documented as full-text search with a substring fallback instead
  of plain substring matching.

## [0.1.0] - 2026-10-27

### Added

- `MalawiStore` client with resources for auth, users, categories, products,
  variants, cart, inventory, orders, payments, wishlist, and reviews.
- Full coverage of the backend `/api/v1` surface, including admin writes,
  inventory operations, and multipart image uploads.
- Automatic unwrapping of the `{ data }` success envelope.
- `MalawiStoreError` with stable API codes, HTTP status, `X-Request-ID`, and
  `Retry-After` information.
- Automatic access-token rotation on `401` with single-flight refresh, token
  change notifications, and an `onUnauthorized` hook.
- Timeouts, `AbortSignal` support, and exponential backoff retries for
  idempotent `GET`/`HEAD` requests.
- `verifyStripeSignature` and `constructStripeEvent` helpers built on Web
  Crypto.
- Dual ESM/CommonJS output with type declarations, source maps, and zero
  runtime dependencies.
