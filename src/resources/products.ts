import { idempotencyHeaders } from "../headers.js";
import type { HttpClient } from "../http.js";
import { segment } from "../path.js";
import type {
  BulkCreateProductsInput,
  BulkCreateProductsResponse,
  BulkDeleteProductsInput,
  BulkDeleteProductsResponse,
  BulkUpdateProductsInput,
  BulkUpdateProductsResponse,
  CreateProductInput,
  ListProductsParams,
  Product,
  ProductDetail,
  ProductImage,
  ProductImageList,
  ProductListResponse,
  StatusResponse,
  UpdateProductInput,
  UploadImagesResponse,
} from "../types/index.js";
import {
  createUploadForm,
  createUploadFormMany,
  type UploadFile,
} from "../upload.js";

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
        ids: params.ids,
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
        ids: params.ids,
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

  /**
   * Admin only. Creates products in bulk. Per-item failures stay inside
   * the 200 envelope; `atomic` rolls the whole batch back.
   */
  bulkCreate(input: BulkCreateProductsInput): Promise<BulkCreateProductsResponse> {
    const { idempotencyKey, ...body } = input;
    return this.http.request<BulkCreateProductsResponse>(
      "POST",
      "/admin/products/bulk",
      {
        body,
        headers: idempotencyHeaders(idempotencyKey),
        retry: false,
      },
    );
  }

  /** Admin only. Applies one partial patch per product id. */
  bulkUpdate(input: BulkUpdateProductsInput): Promise<BulkUpdateProductsResponse> {
    const { idempotencyKey, ...body } = input;
    return this.http.request<BulkUpdateProductsResponse>(
      "PATCH",
      "/admin/products/bulk",
      {
        body,
        headers: idempotencyHeaders(idempotencyKey),
        retry: false,
      },
    );
  }

  /**
   * Admin only. POST rather than DELETE so the id list can travel in JSON.
   * `dryRun` reports `wouldDelete` without writing.
   */
  bulkDelete(input: BulkDeleteProductsInput): Promise<BulkDeleteProductsResponse> {
    const { idempotencyKey, ...body } = input;
    return this.http.request<BulkDeleteProductsResponse>(
      "POST",
      "/admin/products/bulk-delete",
      {
        body,
        headers: idempotencyHeaders(idempotencyKey),
        retry: false,
      },
    );
  }

  /** Admin only. Gallery rows, including uploads still queued (empty url). */
  async listImages(id: string): Promise<ProductImage[]> {
    const result = await this.http.request<ProductImageList>(
      "GET",
      `/admin/products/${segment(id)}/images`,
    );
    return result.images;
  }

  /**
   * Admin only. Multipart with repeated `files` parts (up to 20 per
   * request). Each accepted file is queued asynchronously (HTTP 202).
   */
  async uploadImages(
    id: string,
    files: UploadFile | UploadFile[],
  ): Promise<UploadImagesResponse> {
    return this.http.request<UploadImagesResponse>(
      "POST",
      `/admin/products/${segment(id)}/images`,
      { form: createUploadFormMany(files), retry: false },
    );
  }

  /** Admin only. Promotes the next ready image when the primary is deleted. */
  deleteImage(id: string, imageId: string): Promise<void> {
    return this.http.request<void>(
      "DELETE",
      `/admin/products/${segment(id)}/images/${segment(imageId)}`,
      { retry: false },
    );
  }

  /** Admin only. Points the storefront primary image at one gallery row. */
  setPrimaryImage(id: string, imageId: string): Promise<Product> {
    return this.http.request<Product>(
      "PUT",
      `/admin/products/${segment(id)}/images/${segment(imageId)}/primary`,
      { retry: false },
    );
  }
}
