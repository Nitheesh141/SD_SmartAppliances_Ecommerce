import React from "react";
import { Star } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface RatingStarsProps extends React.HTMLAttributes<HTMLDivElement> {
  rating: number;
  max?: number;
  starSize?: number;
  reviewCount?: number;
}

export default function RatingStars({
  rating,
  max = 5,
  starSize = 16,
  reviewCount,
  className,
  ...props
}: RatingStarsProps) {
  const stars = [];
  const fullStarsCount = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.4; // Simplified logic: if decimal is >= 0.4, treat it as half star

  for (let i = 1; i <= max; i++) {
    if (i <= fullStarsCount) {
      stars.push(
        <Star
          key={i}
          size={starSize}
          weight="fill"
          className="text-amber-500 fill-amber-500 shrink-0"
        />
      );
    } else if (i === fullStarsCount + 1 && hasHalfStar) {
      // Direct phosphor doesn't have a direct HalfStar weight, let's render a half filled or standard weight="duotone"
      stars.push(
        <Star
          key={i}
          size={starSize}
          weight="duotone"
          className="text-amber-500 fill-amber-500 shrink-0"
        />
      );
    } else {
      stars.push(
        <Star
          key={i}
          size={starSize}
          weight="regular"
          className="text-slate-300 dark:text-slate-700 shrink-0"
        />
      );
    }
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)} {...props}>
      <div className="flex items-center gap-0.5">
        {stars}
      </div>
      {reviewCount !== undefined && (
        <span className="text-xs text-neutral-500 font-medium">({reviewCount})</span>
      )}
    </div>
  );
}

