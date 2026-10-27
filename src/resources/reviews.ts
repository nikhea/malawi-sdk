import type { HttpClient } from "../http.js";
import { segment } from "../path.js";
import type {
  CreateReviewInput,
  Review,
  ReviewSummary,
  UpdateReviewInput,
} from "../types/index.js";

export class ReviewsResource {
  constructor(private readonly http: HttpClient) {}

  /** Public aggregate plus the newest reviews for a product. */
  summary(productId: string): Promise<ReviewSummary> {
    return this.http.request<ReviewSummary>(
      "GET",
      `/products/${segment(productId)}/reviews`,
      { skipAuth: true },
    );
  }

  /** One review per user per product. */
  create(productId: string, input: CreateReviewInput): Promise<Review> {
    return this.http.request<Review>(
      "POST",
      `/products/${segment(productId)}/reviews`,
      { body: input, retry: false },
    );
  }

  /** Edits the caller's own review. */
  update(reviewId: string, input: UpdateReviewInput): Promise<Review> {
    return this.http.request<Review>(
      "PATCH",
      `/reviews/${segment(reviewId)}`,
      { body: input, retry: false },
    );
  }

  /** Deletes the caller's own review. */
  delete(reviewId: string): Promise<void> {
    return this.http.request<void>(
      "DELETE",
      `/reviews/${segment(reviewId)}`,
      { retry: false },
    );
  }

  /** Admin moderation: removes any review. */
  deleteAny(reviewId: string): Promise<void> {
    return this.http.request<void>(
      "DELETE",
      `/admin/reviews/${segment(reviewId)}`,
      { retry: false },
    );
  }
}
