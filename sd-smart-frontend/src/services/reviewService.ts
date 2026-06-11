/**
 * Review Service
 * Handles all review-related API calls
 */

import {
  Review,
  CreateReviewRequest,
  ApiResponse,
} from "@/types/api";
import { apiGet, apiPost, apiDelete } from "@/utils/api";

export const reviewService = {
  /**
   * Get reviews for a product
   */
  getProductReviews: async (
    productId: string,
    page = 1,
    limit = 10
  ): Promise<ApiResponse<any>> => {
    return apiGet(`/products/${productId}/reviews`, { page, limit });
  },

  /**
   * Get user's reviews
   */
  getUserReviews: async (page = 1, limit = 10): Promise<ApiResponse<any>> => {
    return apiGet("/reviews/my-reviews", { page, limit });
  },

  /**
   * Create review for product
   */
  createReview: async (data: CreateReviewRequest): Promise<ApiResponse<Review>> => {
    const formData = new FormData();
    formData.append("productId", data.productId);
    formData.append("rating", String(data.rating));
    formData.append("title", data.title);
    formData.append("comment", data.comment);

    if (data.images) {
      data.images.forEach((image, index) => {
        formData.append(`images[${index}]`, image);
      });
    }

    return apiPost<Review>("/reviews", formData);
  },

  /**
   * Update review
   */
  updateReview: async (reviewId: string, data: Partial<Review>): Promise<ApiResponse<Review>> => {
    return apiPost<Review>(`/reviews/${reviewId}`, data);
  },

  /**
   * Delete review
   */
  deleteReview: async (reviewId: string): Promise<ApiResponse<{ message: string }>> => {
    return apiDelete<{ message: string }>(`/reviews/${reviewId}`);
  },

  /**
   * Mark review as helpful
   */
  markAsHelpful: async (reviewId: string): Promise<ApiResponse<Review>> => {
    return apiPost<Review>(`/reviews/${reviewId}/helpful`);
  },

  /**
   * Report review
   */
  reportReview: async (reviewId: string, reason: string): Promise<ApiResponse<{ message: string }>> => {
    return apiPost<{ message: string }>(`/reviews/${reviewId}/report`, { reason });
  },
};
