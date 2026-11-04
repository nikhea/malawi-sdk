import type { PageParams, Paginated, PaginationMeta } from "./common.js";

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

/** Catalog context attached to a review in the caller's own history. */
export interface MyReviewProduct {
  id: string;
  name: string;
  slug: string;
  image_url?: string;
}

/** One of the caller's reviews, with product context. */
export interface MyReview {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  title: string;
  body: string;
  /** ISO-8601 timestamp. */
  created_at: string;
  /** ISO-8601 timestamp. */
  updated_at: string;
  product: MyReviewProduct;
}

export interface ListMyReviewsParams extends PageParams {
  sort?: ReviewSort;
}

/** Raw paged envelope returned by `listMinePage`. */
export type MyReviewsResponse = Paginated<MyReview>;
