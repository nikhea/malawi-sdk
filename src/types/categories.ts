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

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  parent_id?: string;
  /** Detach the category back to root. Slugs are immutable. */
  clear_parent?: boolean;
}
