import type { HttpClient } from "../http.js";
import { segment } from "../path.js";
import type {
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
}
