/**
 * Wishlist Service
 * Handles all wishlist-related API calls
 */

import {
  Wishlist,
  WishlistItem,
  ApiResponse,
} from "@/types/api";
import { apiGet, apiPost, apiDelete } from "@/utils/api";

export const wishlistService = {
  /**
   * Get user's wishlist
   */
  getWishlist: async (): Promise<ApiResponse<Wishlist>> => {
    return apiGet<Wishlist>("/wishlist");
  },

  /**
   * Add item to wishlist
   */
  addToWishlist: async (productId: string): Promise<ApiResponse<Wishlist>> => {
    return apiPost<Wishlist>("/wishlist/items", { productId });
  },

  /**
   * Remove item from wishlist
   */
  removeFromWishlist: async (wishlistItemId: string): Promise<ApiResponse<Wishlist>> => {
    return apiDelete<Wishlist>(`/wishlist/items/${wishlistItemId}`);
  },

  /**
   * Check if product is in wishlist
   */
  isInWishlist: async (productId: string): Promise<ApiResponse<{ inWishlist: boolean }>> => {
    return apiGet<{ inWishlist: boolean }>(`/wishlist/check/${productId}`);
  },

  /**
   * Clear entire wishlist
   */
  clearWishlist: async (): Promise<ApiResponse<{ message: string }>> => {
    return apiDelete<{ message: string }>("/wishlist");
  },

  /**
   * Move wishlist item to cart
   */
  moveToCart: async (wishlistItemId: string): Promise<ApiResponse<any>> => {
    return apiPost("/wishlist/move-to-cart", { wishlistItemId });
  },
};
