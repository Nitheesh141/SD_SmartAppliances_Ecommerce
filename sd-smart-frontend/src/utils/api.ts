import { ENV } from "@/config/env";
/**
 * API Utilities
 * Handles common API operations like error handling, token management, etc.
 */

import { ApiResponse } from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ENV.API_BASE_URL;

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Get auth token from localStorage
 */
export const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("authToken");
  }
  return null;
};

/**
 * Set auth token in localStorage
 */
export const setAuthToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("authToken", token);
  }
};

/**
 * Clear auth token from localStorage
 */
export const clearAuthToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("authToken");
  }
};

/**
 * Get request headers with auth token
 */
export const getHeaders = (isFormData = false): HeadersInit => {
  const headers: HeadersInit = {};
  
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Make API request
 */
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const isFormData = options.body instanceof FormData;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getHeaders(isFormData),
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        response.status,
        data.message || "API request failed",
        data
      );
    }

    return {
      success: true,
      data: data.data !== undefined ? data.data : data,
      pagination: data.pagination,
      message: data.message,
      statusCode: response.status,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new ApiError(500, error.message);
    }

    throw new ApiError(500, "An unexpected error occurred");
  }
};

/**
 * GET request
 */
export const apiGet = async <T>(
  endpoint: string,
  params?: Record<string, any>
): Promise<ApiResponse<T>> => {
  let url = endpoint;
  if (params) {
    const queryString = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null)
        .reduce((acc, [key, value]) => {
          acc[key] = String(value);
          return acc;
        }, {} as Record<string, string>)
    ).toString();
    
    if (queryString) {
      url = `${endpoint}?${queryString}`;
    }
  }

  return apiRequest<T>(url, {
    method: "GET",
  });
};

/**
 * POST request
 */
export const apiPost = async <T>(
  endpoint: string,
  body?: any
): Promise<ApiResponse<T>> => {
  return apiRequest<T>(endpoint, {
    method: "POST",
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
};

/**
 * PUT request
 */
export const apiPut = async <T>(
  endpoint: string,
  body?: any
): Promise<ApiResponse<T>> => {
  return apiRequest<T>(endpoint, {
    method: "PUT",
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
};

/**
 * PATCH request
 */
export const apiPatch = async <T>(
  endpoint: string,
  body?: any
): Promise<ApiResponse<T>> => {
  return apiRequest<T>(endpoint, {
    method: "PATCH",
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
};

/**
 * DELETE request
 */
export const apiDelete = async <T>(endpoint: string): Promise<ApiResponse<T>> => {
  return apiRequest<T>(endpoint, {
    method: "DELETE",
  });
};
