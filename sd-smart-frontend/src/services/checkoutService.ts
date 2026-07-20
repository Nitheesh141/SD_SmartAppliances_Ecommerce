import { apiGet, apiPost, apiPut, apiDelete } from "@/utils/api";
import { Address, Order, CreateAddressRequest, CreateOrderRequest, ApiResponse } from "@/types/api";

export const checkoutService = {
  /**
   * Get all user addresses
   */
  getAddresses: async (): Promise<ApiResponse<{ addresses: Address[] }>> => {
    return apiGet<{ addresses: Address[] }>("/addresses");
  },

  /**
   * Create a new address
   */
  createAddress: async (data: CreateAddressRequest): Promise<ApiResponse<{ address: Address }>> => {
    return apiPost<{ address: Address }>("/addresses", data);
  },

  /**
   * Update an address
   */
  updateAddress: async (id: string, data: Partial<CreateAddressRequest>): Promise<ApiResponse<{ address: Address }>> => {
    return apiPut<{ address: Address }>(`/addresses/${id}`, data);
  },

  /**
   * Create an order
   */
  createOrder: async (data: CreateOrderRequest): Promise<ApiResponse<{ order: Order }>> => {
    return apiPost<{ order: Order }>("/orders", data);
  },

  /**
   * Get user orders
   */
  getOrders: async (): Promise<ApiResponse<{ orders: Order[] }>> => {
    return apiGet<{ orders: Order[] }>("/orders");
  },

  /**
   * Get specific order details
   */
  getOrder: async (id: string): Promise<ApiResponse<{ order: Order }>> => {
    return apiGet<{ order: Order }>(`/orders/${id}`);
  }
};
