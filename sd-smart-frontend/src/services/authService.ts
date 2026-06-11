/**
 * Auth Service
 * Handles all authentication-related API calls
 */

import {
  LoginRequest,
  LoginResponse,
  SignupRequest,
  ForgotPasswordRequest,
  VerifyCodeRequest,
  ResetPasswordRequest,
  User,
  ApiResponse,
} from "@/types/api";
import { apiPost, apiGet } from "@/utils/api";

export const authService = {
  /**
   * Login user
   */
  login: async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    return apiPost<LoginResponse>("/auth/login", credentials);
  },

  /**
   * Register new user
   */
  signup: async (data: SignupRequest): Promise<ApiResponse<LoginResponse>> => {
    return apiPost<LoginResponse>("/auth/signup", data);
  },

  /**
   * Request password reset code
   */
  forgotPassword: async (data: ForgotPasswordRequest): Promise<ApiResponse<{ message: string }>> => {
    return apiPost<{ message: string }>("/auth/forgot-password", data);
  },

  /**
   * Verify reset code
   */
  verifyResetCode: async (data: VerifyCodeRequest): Promise<ApiResponse<{ message: string }>> => {
    return apiPost<{ message: string }>("/auth/verify-reset-code", data);
  },

  /**
   * Reset password
   */
  resetPassword: async (data: ResetPasswordRequest): Promise<ApiResponse<{ message: string }>> => {
    return apiPost<{ message: string }>("/auth/reset-password", data);
  },

  /**
   * Get current user profile
   */
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    return apiGet<User>("/auth/me");
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    return apiPost<User>("/auth/profile/update", data);
  },

  /**
   * Logout user
   */
  logout: async (): Promise<ApiResponse<{ message: string }>> => {
    return apiPost<{ message: string }>("/auth/logout");
  },
};
