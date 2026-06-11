/**
 * Product Service
 * Handles all product-related API calls
 */

import {
  Product,
  ProductFilters,
  ProductListResponse,
  Category,
  ApiResponse,
} from "@/types/api";
import { apiGet } from "@/utils/api";

export const productService = {
  /**
   * Get all products with filters
   */
  getProducts: async (filters?: ProductFilters): Promise<ApiResponse<ProductListResponse>> => {
    return apiGet<ProductListResponse>("/products", filters);
  },

  /**
   * Get product by ID
   */
  getProductById: async (id: string): Promise<ApiResponse<Product>> => {
    return apiGet<Product>(`/products/${id}`);
  },

  /**
   * Search products
   */
  searchProducts: async (query: string, limit = 10): Promise<ApiResponse<Product[]>> => {
    return apiGet<Product[]>("/products/search", { query, limit });
  },

  /**
   * Get products by category
   */
  getProductsByCategory: async (
    category: string,
    filters?: Omit<ProductFilters, "category">
  ): Promise<ApiResponse<ProductListResponse>> => {
    return apiGet<ProductListResponse>(`/products/category/${category}`, filters);
  },

  /**
   * Get featured products
   */
  getFeaturedProducts: async (limit = 12): Promise<ApiResponse<Product[]>> => {
    return apiGet<Product[]>("/products/featured", { limit });
  },

  /**
   * Get bestselling products
   */
  getBestsellingProducts: async (limit = 12): Promise<ApiResponse<Product[]>> => {
    return apiGet<Product[]>("/products/bestselling", { limit });
  },

  /**
   * Get product reviews
   */
  getProductReviews: async (
    productId: string,
    page = 1,
    limit = 10
  ): Promise<ApiResponse<any>> => {
    return apiGet(`/products/${productId}/reviews`, { page, limit });
  },

  /**
   * Get all categories
   */
  getCategories: async (): Promise<ApiResponse<Category[]>> => {
    return apiGet<Category[]>("/categories");
  },

  /**
   * Get category by slug
   */
  getCategoryBySlug: async (slug: string): Promise<ApiResponse<Category>> => {
    return apiGet<Category>(`/categories/${slug}`);
  },
};
