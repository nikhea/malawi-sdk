import { idempotencyHeaders } from "../headers.js";
import type { HttpClient } from "../http.js";
import { segment } from "../path.js";
import type {
  BulkCreateVariantsInput,
  BulkCreateVariantsResponse,
  BulkUpdateVariantsInput,
  BulkUpdateVariantsResponse,
  CreateVariantInput,
  UpdateVariantInput,
  Variant,
} from "../types/index.js";

export class VariantsResource {
  constructor(private readonly http: HttpClient) {}

  list(productId: string): Promise<Variant[]> {
    return this.http.request<Variant[]>(
      "GET",
      `/products/${segment(productId)}/variants`,
      { skipAuth: true },
    );
  }

  /** Admin only. */
  create(productId: string, input: CreateVariantInput): Promise<Variant> {
    return this.http.request<Variant>(
      "POST",
      `/products/${segment(productId)}/variants`,
      { body: input, retry: false },
    );
  }

  /** Admin only. `product_id` and `sku` are immutable. */
  update(id: string, input: UpdateVariantInput): Promise<Variant> {
    return this.http.request<Variant>(
      "PATCH",
      `/admin/variants/${segment(id)}`,
      { body: input, retry: false },
    );
  }

  /** Admin only. */
  delete(id: string): Promise<void> {
    return this.http.request<void>(
      "DELETE",
      `/admin/variants/${segment(id)}`,
      { retry: false },
    );
  }

  /** Admin only. Creates up to MAX_BULK_ITEMS SKUs for one product. */
  createBulk(
    productId: string,
    input: BulkCreateVariantsInput,
  ): Promise<BulkCreateVariantsResponse> {
    const { idempotencyKey, ...body } = input;
    return this.http.request<BulkCreateVariantsResponse>(
      "POST",
      `/products/${segment(productId)}/variants/bulk`,
      {
        body,
        headers: idempotencyHeaders(idempotencyKey),
        retry: false,
      },
    );
  }

  /** Admin only. Applies one partial patch per variant id. */
  updateBulk(input: BulkUpdateVariantsInput): Promise<BulkUpdateVariantsResponse> {
    const { idempotencyKey, ...body } = input;
    return this.http.request<BulkUpdateVariantsResponse>(
      "PATCH",
      "/admin/variants/bulk",
      {
        body,
        headers: idempotencyHeaders(idempotencyKey),
        retry: false,
      },
    );
  }
}
