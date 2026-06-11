/**
 * User Service
 * Handles user profile and account-related API calls
 */

import {
  User,
  Address,
  ApiResponse,
} from "@/types/api";
import { apiGet, apiPost, apiPatch } from "@/utils/api";

export const userService = {
  /**
   * Get user profile
   */
  getProfile: async (): Promise<ApiResponse<User>> => {
    return apiGet<User>("/users/profile");
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    return apiPatch<User>("/users/profile", data);
  },

  /**
   * Change password
   */
  changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse<{ message: string }>> => {
    return apiPost<{ message: string }>("/users/change-password", {
      currentPassword,
      newPassword,
    });
  },

  /**
   * Get user addresses
   */
  getAddresses: async (): Promise<ApiResponse<Address[]>> => {
    return apiGet<Address[]>("/users/addresses");
  },

  /**
   * Add address
   */
  addAddress: async (address: Address): Promise<ApiResponse<any>> => {
    return apiPost("/users/addresses", address);
  },

  /**
   * Update address
   */
  updateAddress: async (addressId: string, address: Partial<Address>): Promise<ApiResponse<any>> => {
    return apiPatch(`/users/addresses/${addressId}`, address);
  },

  /**
   * Delete address
   */
  deleteAddress: async (addressId: string): Promise<ApiResponse<{ message: string }>> => {
    return apiPost<{ message: string }>(`/users/addresses/${addressId}/delete`);
  },

  /**
   * Set default address
   */
  setDefaultAddress: async (addressId: string): Promise<ApiResponse<any>> => {
    return apiPost(`/users/addresses/${addressId}/set-default`);
  },

  /**
   * Upload profile image
   */
  uploadProfileImage: async (file: File): Promise<ApiResponse<{ imageUrl: string }>> => {
    const formData = new FormData();
    formData.append("profileImage", file);
    return apiPost<{ imageUrl: string }>("/users/profile/upload-image", formData);
  },

  /**
   * Delete user account
   */
  deleteAccount: async (password: string): Promise<ApiResponse<{ message: string }>> => {
    return apiPost<{ message: string }>("/users/delete-account", { password });
  },
};
