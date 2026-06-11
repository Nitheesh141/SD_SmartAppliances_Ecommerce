"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Eye, ArrowLeftRight, ShoppingCart, ShieldCheck } from "lucide-react";
import { useState } from "react";
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

export default function ProductCard({ product, className }: ProductCardProps) {
  const [wishlisted, setWishlisted] = useState(false);

  return (
    <div
      className={cn(
        "group relative bg-white rounded-2xl overflow-hidden border border-neutral-100",
        "hover:shadow-xl hover:-translate-y-1 transition-all duration-300",
        className
      )}
    >
      {/* Image area */}
      <Link href={product.href} className="block relative aspect-[4/3] overflow-hidden bg-neutral-50">
        {product.image.startsWith("/") ? (
          <div className="w-full h-full flex items-center justify-center bg-neutral-100 text-neutral-300 text-sm">
            {product.name}
          </div>
        ) : (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        )}

        {/* Overlay action buttons (show on hover) */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={(e) => { e.preventDefault(); setWishlisted(!wishlisted); }}
            className="w-9 h-9 bg-white rounded-full shadow flex items-center justify-center hover:bg-red-50 transition-colors"
            aria-label="Add to wishlist"
          >
            <Heart
              size={16}
              className={cn(wishlisted ? "fill-[#D71920] text-[#D71920]" : "text-neutral-600")}
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
          {product.capacity && (
            <>
              <span className="text-neutral-300">·</span>
              <span>{product.capacity}</span>
            </>
          )}
        </div>

        {/* Add to Cart */}
        <button className="w-full flex items-center justify-center gap-2 bg-[#D71920] hover:bg-[#b8141a] text-white text-sm font-semibold py-3 rounded-xl transition-colors duration-200 cursor-pointer">
          <ShoppingCart size={16} />
          Add to Cart
        </button>
      </div>
    </div>
  );
}
