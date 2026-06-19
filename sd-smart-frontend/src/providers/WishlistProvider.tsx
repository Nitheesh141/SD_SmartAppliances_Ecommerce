"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { wishlistService } from "@/services/wishlistService";
import { useAuth } from "./AuthProvider";
import { Wishlist, WishlistItem } from "@/types/api";

export interface WishlistContextType {
  wishlist: Wishlist | null;
  wishlistItems: WishlistItem[];
  isLoading: boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const refreshWishlist = async () => {
    if (!isAuthenticated) {
      setWishlist(null);
      setWishlistItems([]);
      return;
    }
    
    try {
      setIsLoading(true);
      const res = await wishlistService.getWishlist();
      if (res.success && res.data) {
        setWishlist(res.data);
        setWishlistItems(res.data.items || []);
      }
    } catch (error) {
      console.error("Failed to refresh wishlist:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshWishlist();
  }, [isAuthenticated]);

  const addToWishlist = async (productId: string) => {
    try {
      const res = await wishlistService.addToWishlist(productId);
      if (res.success && res.data) {
        setWishlist(res.data);
        setWishlistItems(res.data.items || []);
      }
    } catch (error) {
      console.error("Failed to add to wishlist:", error);
      throw error;
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      const res = await wishlistService.removeFromWishlist(productId);
      if (res.success && res.data) {
        setWishlist(res.data);
        setWishlistItems(res.data.items || []);
      }
    } catch (error) {
      console.error("Failed to remove wishlist item:", error);
      throw error;
    }
  };

  return (
    <WishlistContext.Provider value={{ wishlist, wishlistItems, isLoading, addToWishlist, removeFromWishlist, refreshWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};
