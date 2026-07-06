"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Eye, ArrowLeftRight, ShoppingCart, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useCart } from "@/providers/CartProvider";
import { useWishlist } from "@/providers/WishlistProvider";
import { cn } from "@/lib/utils";
import type { Product } from "../../app/LandingPage/types";
import RatingStars from "../shared/RatingStars";
import ProductPrice from "../shared/ProductPrice";
import BadgePill from "../shared/BadgePill";
import EnquiryModal from "../shared/EnquiryModal";

interface ProductCardProps {
  product: Product;
  className?: string;
}

const badgeVariantMap: Record<string, "red" | "orange" | "green"> = {
  "Best Seller": "red",
  "Top Rated": "red",
  New: "orange",
  Sale: "orange",
};

const getSpecTags = (category: string) => {
  if (category.toLowerCase().includes("cooker")) return ["Tri-Ply Steel", "Smart Control", "15 PSI Safe"];
  if (category.toLowerCase().includes("grinder")) return ["Stone Grinding", "High Torque", "Smart Timer"];
  if (category.toLowerCase().includes("stove")) return ["Auto Ignition", "Brass Burners", "Glass Top"];
  if (category.toLowerCase().includes("stick")) return ["PFOA Free", "5-Layer Coat", "Metal Safe"];
  if (category.toLowerCase().includes("commercial")) return ["Heavy Duty", "Stainless 304", "High Output"];
  return ["IoT Connected", "Smart Control", "5-Star Energy"];
};

export default function ProductCard({ product, className }: ProductCardProps) {
  const specTags = getSpecTags(product.categoryLabel);
  const { isAuthenticated, user } = useAuth();
  const { addToCart } = useCart();
  const isDistributor = isAuthenticated && user && (user.role?.toUpperCase() === "DISTRIBUTOR" || user.role === "distributor");
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const { wishlistItems, addToWishlist, removeFromWishlist } = useWishlist();
  const router = useRouter();

  const isWishlisted = wishlistItems.some(item => item.productId === product.id);

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    try {
      if (isWishlisted) {
        await removeFromWishlist(product.id);
      } else {
        await addToWishlist(product.id);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    try {
      await addToCart(product.id, 1);
    } catch (err) {
      console.error(err);
    }
  };

  // Extract display attribute dynamically from variantDetails or fallback to product.capacity
  const displayAttribute = (() => {
    if (product.capacity) return product.capacity;
    const details = product.variantDetails;
    if (details && typeof details === "object") {
      const keys = Object.keys(details);
      if (keys.length > 0) {
        // Prefer Capacity, Size, Burner Count, Type if they exist (case-insensitive)
        const preferredKey = keys.find(k => 
          /capacity|size|burner|type/i.test(k)
        );
        if (preferredKey) {
          return details[preferredKey];
        }
        // Fallback to first attribute value
        return details[keys[0]];
      }
    }
    return null;
  })();

  return (
    <div
      className={cn(
        "group relative bg-white rounded-2xl overflow-hidden border border-neutral-100 transition-all duration-300 ease-out hover:shadow-2xl hover:border-neutral-200/80",
        className
      )}
    >
      {/* Absolute overlay link to make the entire card clickable */}
      <Link href={`/product/${product.id}`} className="absolute inset-0 z-10" aria-label={product.name} />

      {/* Image area */}
      <div className="block relative aspect-[4/3] overflow-hidden bg-neutral-50 flex items-center justify-center">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/sd-smart-ecommerce/SD-logo.png";
          }}
        />

        {/* Overlay action buttons (show on hover) */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
          <button
            onClick={handleWishlistToggle}
            className="w-9 h-9 bg-white rounded-full shadow flex items-center justify-center hover:bg-red-50 transition-colors"
            aria-label="Add to wishlist"
          >
            <Heart
              size={16}
              className={cn(isWishlisted ? "fill-[#D71920] text-[#D71920]" : "text-neutral-600")}
            />
          </button>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.badge && (
            <BadgePill
              label={product.badge}
              variant={badgeVariantMap[product.badge] ?? "red"}
            />
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 pt-2 text-left">
        <p className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
          {product.categoryLabel}
        </p>
        <h3 className="text-[15px] sm:text-[16px] font-extrabold text-slate-900 dark:text-white leading-snug mb-2 group-hover:text-[#D71920] transition-colors line-clamp-2">
          {product.name.length > 50 ? (
            <>
              {product.name.substring(0, 47)}
              <span className="text-neutral-450 dark:text-neutral-500 font-medium text-xs ml-0.5">... see more</span>
            </>
          ) : (
            product.name
          )}
        </h3>

        {/* <RatingStars rating={product.rating} reviewCount={product.reviewCount} className="mb-3" /> */}

        {isDistributor ? (
          <div className="mb-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsEnquiryOpen(true);
              }}
              className="relative z-20 w-full text-center py-2 px-3 border-2 border-[#D71920] hover:bg-red-50 dark:hover:bg-slate-800 text-[#D71920] hover:text-[#b8141a] text-sm font-bold rounded-xl transition-all duration-200"
            >
              Enquiry for Price
            </button>
          </div>
        ) : (
           <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 mb-2">
          <ProductPrice
            price={product.price}
            originalPrice={product.originalPrice}
            priceClass="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white"
            originalPriceClass="text-xs sm:text-sm line-through text-slate-400 dark:text-neutral-500"
          />
          {product.discountPercent > 0 && (
            <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-500 shrink-0">
              {product.discountPercent}% OFF
            </span>
          )}
        </div>
        )}

        {/* Warranty + capacity */}
        <div className="flex items-center gap-1 text-xs text-neutral-500 mb-4">
          <ShieldCheck size={12} className="text-neutral-400" />
          <span>{product.warranty}</span>
          {displayAttribute && (
            <>
              <span className="text-neutral-300">·</span>
              <span>{displayAttribute}</span>
            </>
          )}
        </div>

        {/* Add to Cart / Out of Stock button */}
        {(!product.inStock || product.availableStock === 0) ? (
          <button 
            disabled
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="w-full flex items-center justify-center gap-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 text-sm font-semibold py-3 rounded-xl cursor-not-allowed relative z-20"
          >
            Out of Stock
          </button>
        ) : (
          <button 
            onClick={handleAddToCart}
            className="w-full flex items-center justify-center gap-2 bg-[#D71920] hover:bg-[#b8141a] text-white text-sm font-semibold py-3 rounded-xl transition-colors duration-200 cursor-pointer relative z-20"
          >
            <ShoppingCart size={16} />
            Add to Cart
          </button>
        )}
      </div>
      {isEnquiryOpen && (
        <EnquiryModal isOpen={isEnquiryOpen} onClose={() => setIsEnquiryOpen(false)} />
      )}
    </div>
  );
}
