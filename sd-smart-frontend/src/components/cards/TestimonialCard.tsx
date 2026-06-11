import React from "react";
import { Testimonial } from "../../app/LandingPage/types";
import RatingStars from "../shared/RatingStars";
import { Quotes } from "@phosphor-icons/react";

interface TestimonialCardProps {
  testimonial: Testimonial;
}

export default function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <div className="relative bg-white border border-slate-100 rounded-xl p-6 md:p-8 flex flex-col justify-between hover:shadow-lg hover:shadow-slate-100/30 transition-all duration-300 dark:bg-slate-900/50 dark:border-slate-800 dark:hover:shadow-none">
      {/* Absolute quotes icon for aesthetic backdrop */}
      <div className="absolute top-6 right-6 text-slate-100 dark:text-slate-800 pointer-events-none">
        <Quotes size={48} weight="fill" className="opacity-60" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col text-left">
        {/* Rating stars */}
        <RatingStars rating={testimonial.rating} starSize={14} className="mb-4" />
        
        {/* Testimonial text */}
        <p className="text-xs md:text-sm text-slate-650 italic leading-relaxed flex-1 mb-6 dark:text-slate-300">
          "{testimonial.review}"
        </p>
      </div>

      {/* Profile summary row */}
      <div className="relative z-10 flex items-center gap-3 pt-4 border-t border-slate-100/80 dark:border-slate-800/80">
        <div className="h-10 w-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs uppercase dark:bg-teal-950 dark:text-teal-400 shrink-0">
          {testimonial.authorInitials}
        </div>
        <div className="flex flex-col text-left">
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
            {testimonial.authorName}
          </h4>
          <span className="text-4xs font-medium text-slate-400 mt-0.5">
            {testimonial.authorLocation} • Verified Buyer of <strong className="text-teal-600 dark:text-teal-400">{testimonial.productName}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
