import React from "react";
import { cn } from "@/lib/utils";

interface ProductPriceProps extends React.HTMLAttributes<HTMLDivElement> {
  price: number;
  originalPrice?: number;
  priceClass?: string;
  originalPriceClass?: string;
  size?: "sm" | "md" | "lg";
}

export default function ProductPrice({
  price,
  originalPrice,
  priceClass,
  originalPriceClass,
  size = "md",
  className,
  ...props
}: ProductPriceProps) {
  const formatRupees = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const priceSizes = {
    sm: "text-base font-bold",
    md: "text-lg font-bold",
    lg: "text-2xl font-black",
  };

  const originalPriceSizes = {
    sm: "text-xs line-through",
    md: "text-sm line-through",
    lg: "text-base line-through",
  };

  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5", className)} {...props}>
      <span className={cn(priceSizes[size], "text-slate-900 dark:text-slate-100", priceClass)}>
        {formatRupees(price)}
      </span>
      {originalPrice && originalPrice > price && (
        <span className={cn(originalPriceSizes[size], "text-slate-400 font-medium", originalPriceClass)}>
          {formatRupees(originalPrice)}
        </span>
      )}
    </div>
  );
}

