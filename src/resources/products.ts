import type { HttpClient } from "../http.js";
import { segment } from "../path.js";
import type {
  CreateProductInput,
  ListProductsParams,
  Product,
  ProductDetail,
  ProductListResponse,
  StatusResponse,
  UpdateProductInput,
} from "../types/index.js";
import { createUploadForm, type UploadFile } from "../upload.js";

export class ProductsResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Catalog rows without variants. `active_only` defaults to `true` on
   * the API; pass `false` for the admin view.
   */
  list(params: ListProductsParams = {}): Promise<Product[]> {
    return this.http.request<Product[]>("GET", "/products", {
      query: {
        q: params.q,
        category_id: params.category_id,
        category_slug: params.category_slug,
        min_price_cents: params.min_price_cents,
        max_price_cents: params.max_price_cents,
        in_stock: params.in_stock,
        size: params.size,
        min_rating: params.min_rating,
        created_after: params.created_after,
        created_before: params.created_before,
        active_only: params.active_only,
        sort: params.sort,
        page: params.page,
        limit: params.limit,
        offset: params.offset,
      },
      skipAuth: true,
    });
  }

  /** Same filters as `list`, plus the `meta` paging counters. */
  listPage(params: ListProductsParams = {}): Promise<ProductListResponse> {
    return this.http.request<ProductListResponse>("GET", "/products", {
      query: {
        q: params.q,
        category_id: params.category_id,
        category_slug: params.category_slug,
        min_price_cents: params.min_price_cents,
        max_price_cents: params.max_price_cents,
        in_stock: params.in_stock,
        size: params.size,
        min_rating: params.min_rating,
        created_after: params.created_after,
        created_before: params.created_before,
        active_only: params.active_only,
        sort: params.sort,
        page: params.page,
        limit: params.limit,
        offset: params.offset,
      },
      skipAuth: true,
      unwrap: false,
    });
  }

  /** Product plus its variants — the storefront product page. */
  get(id: string): Promise<ProductDetail> {
    return this.http.request<ProductDetail>(
      "GET",
      `/products/${segment(id)}`,
      { skipAuth: true },
    );
  }

  getBySlug(slug: string): Promise<ProductDetail> {
    return this.http.request<ProductDetail>(
      "GET",
      `/products/slug/${segment(slug)}`,
      { skipAuth: true },
    );
  }

  /** Admin only. */
  create(input: CreateProductInput): Promise<Product> {
    return this.http.request<Product>("POST", "/admin/products", {
      body: input,
      retry: false,
    });
  }

  /** Admin only. Slugs are immutable. */
  update(id: string, input: UpdateProductInput): Promise<Product> {
    return this.http.request<Product>(
      "PATCH",
      `/admin/products/${segment(id)}`,
      { body: input, retry: false },
    );
  }

  /** Admin only. Hard delete — variants cascade. Prefer deactivating. */
  delete(id: string): Promise<void> {
    return this.http.request<void>(
      "DELETE",
      `/admin/products/${segment(id)}`,
      { retry: false },
    );
  }

  /** Admin only. Queues an async Cloudinary upload (HTTP 202). */
  async uploadImage(id: string, file: UploadFile): Promise<StatusResponse> {
    return this.http.request<StatusResponse>(
      "POST",
      `/admin/products/${segment(id)}/image`,
      { form: createUploadForm(file), retry: false },
    );
  }
}
