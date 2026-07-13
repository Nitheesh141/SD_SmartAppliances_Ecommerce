import { ENV } from "@/config/env";
/**
 * Order Service
 * Handles all order-related API calls
 */

import {
  Order,
  CreateOrderRequest,
  ApiResponse,
} from "@/types/api";
import { apiGet, apiPost } from "@/utils/api";

export const orderService = {
  /**
   * Get all user orders
   */
  getOrders: async (page = 1, limit = 10): Promise<ApiResponse<any>> => {
    return apiGet("/orders", { page, limit });
  },

  /**
   * Get order by ID
   */
  getOrderById: async (orderId: string): Promise<ApiResponse<Order>> => {
    return apiGet<Order>(`/orders/${orderId}`);
  },

  /**
   * Get order by order number
   */
  getOrderByNumber: async (orderNumber: string): Promise<ApiResponse<Order>> => {
    return apiGet<Order>("/orders/track", { orderNumber });
  },

  /**
   * Create new order
   */
  createOrder: async (data: CreateOrderRequest): Promise<ApiResponse<Order>> => {
    return apiPost<Order>("/orders", data);
  },

  /**
   * Cancel order
   */
  cancelOrder: async (orderId: string): Promise<ApiResponse<Order>> => {
    return apiPost<Order>(`/orders/${orderId}/cancel`);
  },

  /**
   * Return order
   */
  returnOrder: async (orderId: string, reason: string): Promise<ApiResponse<any>> => {
    return apiPost(`/orders/${orderId}/return`, { reason });
  },

  /**
   * Get order invoice
   */
  downloadInvoice: async (orderId: string): Promise<Blob> => {
    const token = localStorage.getItem("authToken");
    const response = await fetch(`${ENV.API_BASE_URL}/orders/${orderId}/invoice`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to download invoice");
    }

    return response.blob();
  },

  /**
   * Estimate shipping cost
   */
  estimateShipping: async (address: any): Promise<ApiResponse<{ cost: number }>> => {
    return apiPost<{ cost: number }>("/orders/estimate-shipping", address);
  },
};
