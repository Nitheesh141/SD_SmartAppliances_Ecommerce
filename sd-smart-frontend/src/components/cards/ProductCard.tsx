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
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { wishlistItems, addToWishlist, removeFromWishlist } = useWishlist();
  const router = useRouter();

  const isWishlisted = wishlistItems.some(item => item.productId === product.id);

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
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
      onMouseMove={(e) => {
        const el = e.currentTarget;
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const mx = (x / rect.width) - 0.5;
        const my = (y / rect.height) - 0.5;
        el.style.setProperty("--p-mx", `${x}px`);
        el.style.setProperty("--p-my", `${y}px`);
        el.style.setProperty("--tx", `${mx * 8}px`); // magnetic pull
        el.style.setProperty("--ty", `${my * 8}px`);
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.setProperty("--tx", "0px");
        el.style.setProperty("--ty", "0px");
      }}
      style={{
        transform: "translate3d(var(--tx, 0px), var(--ty, 0px), 0px)",
      }}
      className={cn(
        "group relative bg-white rounded-2xl overflow-hidden border border-neutral-100 transition-all duration-300 ease-out hover:shadow-2xl hover:border-neutral-200/80",
        className
      )}
    >
      {/* Glow effect follows mouse */}
      <div
        className="absolute inset-0 pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: "radial-gradient(circle 120px at var(--p-mx, 0px) var(--p-my, 0px), rgba(215, 25, 32, 0.05), transparent)",
        }}
      />
      {/* Image area */}
      <Link href={product.href} className="block relative aspect-[4/3] overflow-hidden bg-neutral-50 flex items-center justify-center">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/sd-smart-ecommerce/SD-logo.png";
          }}
        />

        {/* Overlay action buttons (show on hover) */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
          <button
            className="w-9 h-9 bg-white rounded-full shadow flex items-center justify-center hover:bg-neutral-50 transition-colors"
            aria-label="Quick view"
          >
            <Eye size={16} className="text-neutral-600" />
          </button>
          <button
            className="w-9 h-9 bg-white rounded-full shadow flex items-center justify-center hover:bg-neutral-50 transition-colors"
            aria-label="Compare"
          >
            <ArrowLeftRight size={14} className="text-neutral-600" />
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
          {product.discountPercent > 0 && (
            <BadgePill
              label={`${product.discountPercent}% OFF`}
              variant="orange"
            />
          )}
        </div>

        {/* Floating specification indicators (slide up on hover) */}
        <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1 z-10 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-75">
          {specTags.map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 text-[9px] font-bold text-white bg-slate-950/75 border border-white/10 backdrop-blur-md rounded-md select-none uppercase tracking-wider"
            >
              {tag}
            </span>
          ))}
        </div>
      </Link>

      {/* Info */}
      <div className="p-4 text-left">
        <p className="text-xs font-semibold text-[#D71920] tracking-widest uppercase mb-1">
          {product.categoryLabel}
        </p>
        <Link href={product.href}>
          <h3 className="text-[15px] font-bold text-[#1C1C1C] leading-snug mb-2 hover:text-[#D71920] transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        <RatingStars rating={product.rating} reviewCount={product.reviewCount} className="mb-3" />

        <ProductPrice
          price={product.price}
          originalPrice={product.originalPrice}
          size="md"
          className="mb-2"
        />

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

        {/* Add to Cart */}
        <button 
          onClick={handleAddToCart}
          className="w-full flex items-center justify-center gap-2 bg-[#D71920] hover:bg-[#b8141a] text-white text-sm font-semibold py-3 rounded-xl transition-colors duration-200 cursor-pointer"
        >
          <ShoppingCart size={16} />
          Add to Cart
        </button>
      </div>
    </div>
  );
}
