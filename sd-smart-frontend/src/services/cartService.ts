/**
 * Cart Service
 * Handles all cart-related API calls
 */

import {
  Cart,
  AddToCartRequest,
  UpdateCartItemRequest,
  ApiResponse,
} from "@/types/api";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/utils/api";

export const cartService = {
  /**
   * Get user's cart
   */
  getCart: async (): Promise<ApiResponse<Cart>> => {
    return apiGet<Cart>("/cart");
  },

  /**
   * Add item to cart
   */
  addToCart: async (data: AddToCartRequest): Promise<ApiResponse<Cart>> => {
    return apiPost<Cart>("/cart/items", data);
  },

  /**
   * Update cart item quantity
   */
  updateCartItem: async (data: UpdateCartItemRequest): Promise<ApiResponse<Cart>> => {
    return apiPatch<Cart>(`/cart/items/${data.cartItemId}`, {
      quantity: data.quantity,
    });
  },

  /**
   * Remove item from cart
   */
  removeFromCart: async (cartItemId: string): Promise<ApiResponse<Cart>> => {
    return apiDelete<Cart>(`/cart/items/${cartItemId}`);
  },

  /**
   * Clear entire cart
   */
  clearCart: async (): Promise<ApiResponse<{ message: string }>> => {
    return apiDelete<{ message: string }>("/cart");
  },

  /**
   * Apply coupon/promo code
   */
  applyCoupon: async (code: string): Promise<ApiResponse<Cart>> => {
    return apiPost<Cart>("/cart/apply-coupon", { code });
  },

  /**
   * Remove coupon/promo code
   */
  removeCoupon: async (): Promise<ApiResponse<Cart>> => {
    return apiPost<Cart>("/cart/remove-coupon");
  },
};
