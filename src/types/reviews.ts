import type { PageParams, PaginationMeta } from "./common.js";

export interface Review {
  id: string;
  user_id: string;
  /** Display name snapshotted when the review was written. */
  author: string;
  product_id: string;
  rating: number;
  title: string;
  body: string;
  /** ISO-8601 timestamp. */
  created_at: string;
}

export interface ReviewSummary {
  average: number;
  count: number;
  reviews: Review[];
  /** Counters for the filtered review page (average/count are unfiltered). */
  meta: PaginationMeta;
}

export type ReviewSort = "newest" | "oldest" | "highest" | "lowest";

export interface ListReviewsParams extends PageParams {
  /** Case-insensitive substring over title, body and author. */
  q?: string;
  /** Only this rating (1-5). */
  rating?: number;
  sort?: ReviewSort;
}

export interface CreateReviewInput {
  /** 1–5. */
  rating: number;
  title?: string;
  body?: string;
}

export interface UpdateReviewInput {
  rating?: number;
  title?: string;
  body?: string;
}
