import type { PageParams, Paginated } from "./common.js";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  /** `null`/absent means a root category. */
  parent_id?: string;
  image_url?: string;
  /** ISO-8601 timestamp. */
  created_at: string;
}

export interface CreateCategoryInput {
  name: string;
  /** Generated from the name when omitted. */
  slug?: string;
  description?: string;
  parent_id?: string;
  image_url?: string;
}

export type CategorySort =
  | "name_asc"
  | "name_desc"
  | "newest"
  | "oldest"
  | "product_count_asc"
  | "product_count_desc";

export interface ListCategoriesParams extends PageParams {
  /** Case-insensitive substring over name, description and slug. */
  q?: string;
  parent_id?: string;
  root_only?: boolean;
  /** true = categories with active products; false = empty only. */
  has_products?: boolean;
  sort?: CategorySort;
}

/** Raw paged categories envelope returned by `listPage`. */
export type CategoryListResponse = Paginated<Category>;

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  parent_id?: string;
  /** Detach the category back to root. Slugs are immutable. */
  clear_parent?: boolean;
}
