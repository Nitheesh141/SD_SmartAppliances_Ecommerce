/**
 * Product Hooks
 */

import { productService } from "@/services/productService";
import { Product, ProductFilters, ProductListResponse, Category } from "@/types/api";
import { useFetch, useMutation } from "./useApi";
import { useState, useCallback } from "react";

/**
 * Hook to fetch products with filters
 */
export const useProducts = (filters?: ProductFilters) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await productService.getProducts(filters);
      setProducts(response.data?.products || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  return { products, loading, error, fetchProducts };
};

/**
 * Hook to fetch single product
 */
export const useProduct = (productId: string) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      const response = await productService.getProductById(productId);
      setProduct(response.data || null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  return { product, loading, error, fetchProduct };
};

/**
 * Hook to search products
 */
export const useSearchProducts = () => {
  return useMutation((query: string) =>
    productService.searchProducts(query)
  );
};

/**
 * Hook to fetch featured products
 */
export const useFeaturedProducts = (limit = 12) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFeatured = useCallback(async () => {
    try {
      setLoading(true);
      const response = await productService.getFeaturedProducts(limit);
      setProducts(response.data || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  return { products, loading, error, fetchFeatured };
};

/**
 * Hook to fetch bestselling products
 */
export const useBestsellingProducts = (limit = 12) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBestselling = useCallback(async () => {
    try {
      setLoading(true);
      const response = await productService.getBestsellingProducts(limit);
      setProducts(response.data || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  return { products, loading, error, fetchBestselling };
};

/**
 * Hook to fetch categories
 */
export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await productService.getCategories();
      setCategories(response.data || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { categories, loading, error, fetchCategories };
};
