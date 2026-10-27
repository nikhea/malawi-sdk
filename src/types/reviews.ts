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
