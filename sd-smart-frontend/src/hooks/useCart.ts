/**
 * Cart Hooks
 */

import { cartService } from "@/services/cartService";
import { Cart, AddToCartRequest } from "@/types/api";
import { useMutation } from "./useApi";
import { useState, useCallback } from "react";

/**
 * Hook to fetch cart
 */
export const useCart = () => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const response = await cartService.getCart();
      setCart(response.data || null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { cart, loading, error, fetchCart };
};

/**
 * Hook to add item to cart
 */
export const useAddToCart = () => {
  const { mutate, ...rest } = useMutation((data: AddToCartRequest) =>
    cartService.addToCart(data)
  );

  return { addToCart: mutate, ...rest };
};

/**
 * Hook to update cart item
 */
export const useUpdateCartItem = () => {
  const { mutate, ...rest } = useMutation((data: { cartItemId: string; quantity: number }) =>
    cartService.updateCartItem(data)
  );

  return { updateCartItem: mutate, ...rest };
};

/**
 * Hook to remove from cart
 */
export const useRemoveFromCart = () => {
  const { mutate, ...rest } = useMutation((cartItemId: string) =>
    cartService.removeFromCart(cartItemId)
  );

  return { removeFromCart: mutate, ...rest };
};

/**
 * Hook to clear cart
 */
export const useClearCart = () => {
  return useMutation(() => cartService.clearCart());
};

/**
 * Hook to apply coupon
 */
export const useApplyCoupon = () => {
  const { mutate, ...rest } = useMutation((code: string) =>
    cartService.applyCoupon(code)
  );

  return { applyCoupon: mutate, ...rest };
};
