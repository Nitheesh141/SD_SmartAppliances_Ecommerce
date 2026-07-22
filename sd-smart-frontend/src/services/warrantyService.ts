/**
 * Warranty Registration Service
 * Handles all warranty registration-related API calls
 */

import { ApiResponse } from "@/types/api";
import { apiGet, apiPost, apiPatch } from "@/utils/api";

export const warrantyService = {
  /**
   * Register a new warranty
   */
  createWarrantyRegistration: async (data: any): Promise<ApiResponse<any>> => {
    return apiPost<any>("/warranty-registrations", data);
  },

  /**
   * Get all warranty registrations (Admin view)
   */
  getWarrantyRegistrations: async (params?: {
    search?: string;
    status?: string;
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any[]>> => {
    return apiGet<any[]>("/warranty-registrations", params);
  },

  /**
   * Get a single warranty registration details by ID
   */
  getWarrantyRegistrationById: async (id: string): Promise<ApiResponse<any>> => {
    return apiGet<any>(`/warranty-registrations/${id}`);
  },

  /**
   * Update warranty verification status (Admin action)
   */
  updateWarrantyRegistrationStatus: async (
    id: string,
    data: { status: string; remarks?: string }
  ): Promise<ApiResponse<any>> => {
    return apiPatch<any>(`/warranty-registrations/${id}/status`, data);
  },

  /**
   * Check if details are duplicate before submission
   */
  checkDuplicate: async (params: {
    serialNumber: string;
    invoiceNumber?: string;
  }): Promise<ApiResponse<{ isDuplicate: boolean; message?: string }>> => {
    return apiGet<{ isDuplicate: boolean; message?: string }>(
      "/warranty-registrations/check-duplicate",
      params
    );
  },
};
