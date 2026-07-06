/**
 * Service Request Service
 * Handles all service request-related API calls
 */

import { ApiResponse } from "@/types/api";
import { apiGet, apiPost, apiPatch } from "@/utils/api";

export const serviceRequestService = {
  /**
   * Create a new service request
   */
  createServiceRequest: async (data: any): Promise<ApiResponse<any>> => {
    return apiPost<any>("/service-requests", data);
  },

  /**
   * Get service requests (optionally filter by status)
   */
  getServiceRequests: async (params?: { status?: string }): Promise<ApiResponse<any[]>> => {
    return apiGet<any[]>("/service-requests", params);
  },

  /**
   * Get service request details by ID
   */
  getServiceRequestById: async (id: string): Promise<ApiResponse<any>> => {
    return apiGet<any>(`/service-requests/${id}`);
  },

  /**
   * Get unique purchased products for logged-in user
   */
  getPurchasedProducts: async (): Promise<ApiResponse<any[]>> => {
    return apiGet<any[]>("/service-requests/purchased-products");
  },

  /**
   * Update service request status (Admin action)
   */
  updateServiceRequestStatus: async (
    id: string,
    data: { 
      status: string; 
      remarks?: string;
      serviceCharge?: number;
      sparePartsCost?: number;
      inspectionRemarks?: string;
    }
  ): Promise<ApiResponse<any>> => {
    return apiPatch<any>(`/service-requests/${id}/status`, data);
  },

  /**
   * Respond to cost estimate (Customer action)
   */
  respondToEstimate: async (
    id: string,
    data: { action: "APPROVE" | "REJECT"; cancellationReason?: string }
  ): Promise<ApiResponse<any>> => {
    return apiPatch<any>(`/service-requests/${id}/customer-response`, data);
  },
};
