import type { HttpClient } from "../http.js";
import { segment } from "../path.js";
import type {
  CreateReviewInput,
  ListReviewsParams,
  Review,
  ReviewSummary,
  UpdateReviewInput,
} from "../types/index.js";

export class ReviewsResource {
  constructor(private readonly http: HttpClient) {}

  /** Public aggregate plus one filtered review page (`summary.meta`). */
  summary(
    productId: string,
    params: ListReviewsParams = {},
  ): Promise<ReviewSummary> {
    return this.http.request<ReviewSummary>(
      "GET",
      `/products/${segment(productId)}/reviews`,
      {
        query: {
          q: params.q,
          rating: params.rating,
          sort: params.sort,
          page: params.page,
          limit: params.limit,
          offset: params.offset,
        },
        skipAuth: true,
      },
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
