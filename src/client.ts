import { HttpClient } from "./http.js";
import type {
  MalawiStoreOptions,
  RequestOptions,
  TokenState,
} from "./http.js";
import { AuthResource } from "./resources/auth.js";
import { CartResource } from "./resources/cart.js";
import { CategoriesResource } from "./resources/categories.js";
import { InventoryResource } from "./resources/inventory.js";
import { OrdersResource } from "./resources/orders.js";
import { PaymentsResource } from "./resources/payments.js";
import { ProductsResource } from "./resources/products.js";
import { ReviewsResource } from "./resources/reviews.js";
import { UsersResource } from "./resources/users.js";
import { VariantsResource } from "./resources/variants.js";
import { WishlistResource } from "./resources/wishlist.js";
import type { HealthResponse } from "./types/index.js";

/**
 * Client for the Malawi Store API.
 *
 * ```ts
 * const store = new MalawiStore({ baseUrl: "https://shop.mw/api/v1" });
 * const session = await store.auth.login({ email, password });
 * const cart = await store.cart.get();
 * ```
 */
export class MalawiStore {
  /** API base URL, including `/api/v1`. */
  readonly baseUrl: string;

  readonly auth: AuthResource;
  readonly users: UsersResource;
  readonly categories: CategoriesResource;
  readonly products: ProductsResource;
  readonly variants: VariantsResource;
  readonly cart: CartResource;
  readonly inventory: InventoryResource;
  readonly orders: OrdersResource;
  readonly payments: PaymentsResource;
  readonly wishlist: WishlistResource;
  readonly reviews: ReviewsResource;

  private readonly http: HttpClient;
  private refreshInFlight?: Promise<boolean>;

  constructor(options: MalawiStoreOptions = {}) {
    this.http = new HttpClient(options);
    this.baseUrl = this.http.baseUrl;

    this.auth = new AuthResource(this.http);
    this.users = new UsersResource(this.http);
    this.categories = new CategoriesResource(this.http);
    this.products = new ProductsResource(this.http);
    this.variants = new VariantsResource(this.http);
    this.cart = new CartResource(this.http);
    this.inventory = new InventoryResource(this.http);
    this.orders = new OrdersResource(this.http);
    this.payments = new PaymentsResource(this.http);
    this.wishlist = new WishlistResource(this.http);
    this.reviews = new ReviewsResource(this.http);

    this.http.setRefreshHandler(() => this.refreshSession());
  }

  get token(): string | undefined {
    return this.http.getToken();
  }

  get refreshToken(): string | undefined {
    return this.http.getRefreshToken();
  }

  setToken(token: string): void {
    this.http.setTokens({ token });
  }

  setTokens(tokens: TokenState): void {
    this.http.setTokens(tokens);
  }

  clearTokens(): void {
    this.http.clearTokens();
  }

  /** Raw API health check (`GET /health`, outside the envelope). */
  health(): Promise<HealthResponse> {
    return this.http.request<HealthResponse>("GET", "/health", {
      absoluteUrl: this.http.healthUrl,
      skipAuth: true,
      unwrap: false,
      retry: false,
    });
  }

  /**
   * Escape hatch for endpoints added after this SDK release. Responses
   * are unwrapped from `{ data }` by default.
   */
  request<T = unknown>(
    method: string,
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    return this.http.request<T>(method, path, options);
  }

  /** @internal Deduplicates concurrent refreshes behind a single call. */
  private refreshSession(): Promise<boolean> {
    if (!this.http.getRefreshToken()) return Promise.resolve(false);

    if (!this.refreshInFlight) {
      this.refreshInFlight = this.auth
        .refresh()
        .then(() => true)
        .catch(() => false)
        .finally(() => {
          this.refreshInFlight = undefined;
        });
    }

    return this.refreshInFlight;
  }
}
