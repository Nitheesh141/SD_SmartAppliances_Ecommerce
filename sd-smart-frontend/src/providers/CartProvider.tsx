"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { cartService } from "@/services/cartService";
import { useAuth } from "./AuthProvider";
import { Cart, CartItem } from "@/types/api";
import { toast } from "sonner";

export interface CartContextType {
  cart: Cart | null;
  cartItems: CartItem[];
  cartTotal: number;
  cartCount: number;
  isLoading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const refreshCart = async () => {
    if (!isAuthenticated) {
      setCart(null);
      setCartItems([]);
      return;
    }

    try {
      setIsLoading(true);
      const res = await cartService.getCart();
      if (res.success && res.data) { // Since cartService uses ApiResponse which returns { success, data }
        setCart(res.data);
        setCartItems(res.data.items || []);
      }
    } catch (error) {
      console.error("Failed to refresh cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, [isAuthenticated]);

  const addToCart = async (productId: string, quantity = 1) => {
    try {
      const res = await cartService.addToCart({ productId, quantity });
      if (res.success && res.data) {
        setCart(res.data);
        setCartItems(res.data.items || []);
        toast.success("Item added to your cart! 🛒");
      }
    } catch (error) {
      console.error("Failed to add to cart:", error);
      throw error;
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    try {
      const res = await cartService.updateCartItem({ cartItemId, quantity });
      if (res.success && res.data) {
        setCart(res.data);
        setCartItems(res.data.items || []);
      }
    } catch (error) {
      console.error("Failed to update cart item:", error);
      throw error;
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      const res = await cartService.removeFromCart(cartItemId);
      if (res.success && res.data) {
        setCart(res.data);
        setCartItems(res.data.items || []);
      }
    } catch (error) {
      console.error("Failed to remove cart item:", error);
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      const res = await cartService.clearCart();
      if (res.success) {
        setCart(null);
        setCartItems([]);
      }
    } catch (error) {
      console.error("Failed to clear cart:", error);
      throw error;
    }
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const cartTotal = cartItems.reduce((acc, item) => {
    const price = item.product?.price || 0;
    return acc + (price * item.quantity);
  }, 0);

  return (
    <CartContext.Provider value={{ cart, cartItems, cartTotal, cartCount, isLoading, addToCart, updateQuantity, removeFromCart, clearCart, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
