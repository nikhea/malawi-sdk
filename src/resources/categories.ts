import type { HttpClient } from "../http.js";
import { segment } from "../path.js";
import type {
  Category,
  CreateCategoryInput,
  StatusResponse,
  UpdateCategoryInput,
} from "../types/index.js";
import { createUploadForm, type UploadFile } from "../upload.js";

export class CategoriesResource {
  constructor(private readonly http: HttpClient) {}

  /** Public taxonomy, flat and ordered by name. */
  list(): Promise<Category[]> {
    return this.http.request<Category[]>("GET", "/categories", {
      skipAuth: true,
    });
  }

  get(id: string): Promise<Category> {
    return this.http.request<Category>("GET", `/categories/${segment(id)}`, {
      skipAuth: true,
    });
  }

  getBySlug(slug: string): Promise<Category> {
    return this.http.request<Category>(
      "GET",
      `/categories/slug/${segment(slug)}`,
      { skipAuth: true },
    );
  }

  /** Admin only. */
  create(input: CreateCategoryInput): Promise<Category> {
    return this.http.request<Category>("POST", "/admin/categories", {
      body: input,
      retry: false,
    });
  }

  /** Admin only. Slugs are immutable. */
  update(id: string, input: UpdateCategoryInput): Promise<Category> {
    return this.http.request<Category>(
      "PATCH",
      `/admin/categories/${segment(id)}`,
      { body: input, retry: false },
    );
  }

  /** Admin only. Children become roots, they are not deleted. */
  delete(id: string): Promise<void> {
    return this.http.request<void>(
      "DELETE",
      `/admin/categories/${segment(id)}`,
      { retry: false },
    );
  }

  /**
   * Admin only. Queues an async Cloudinary upload (HTTP 202); the image
   * appears on the category once the worker finishes.
   */
  async uploadImage(id: string, file: UploadFile): Promise<StatusResponse> {
    return this.http.request<StatusResponse>(
      "POST",
      `/admin/categories/${segment(id)}/image`,
      { form: createUploadForm(file), retry: false },
    );
  }
}
