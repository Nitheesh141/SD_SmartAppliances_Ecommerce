"use client";

import { useState, useEffect } from "react";
export function useDynamicProducts(category?: string) {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/products");
        if (!response.ok) throw new Error("Failed to fetch products");
        const data = await response.json();
        const apiProducts = data.products || [];
        if (apiProducts.length > 0) {
          if (category) {
            setProducts(apiProducts.filter((p: any) => p.category === category));
          } else {
            setProducts(apiProducts);
          }
        }
      } catch (error) {
        console.warn("Backend API offline, falling back to static product data.", error);
      }
    };
    loadProducts();
  }, [category]);

  return products;
}
