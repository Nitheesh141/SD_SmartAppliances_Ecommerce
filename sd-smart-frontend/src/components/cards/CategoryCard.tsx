import React from "react";
import { Category } from "../../app/LandingPage/types";
import { ArrowUpRight } from "@phosphor-icons/react";

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  if (category.isActive === false) return null;

  return (
    <a
      href={category.href}
      className="group relative h-64 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:shadow-slate-100/50 transition-all duration-300 flex flex-col justify-end p-6 border border-slate-100 dark:border-slate-800"
    >
      {/* Background Image */}
      <div className="absolute inset-0 bg-slate-100 overflow-hidden dark:bg-slate-900">
        <img
          src={category.image}
          alt={category.name}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />
        {/* Elegant overlay gradient: Slate overlay fading upward */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
      </div>

      {/* Content overlay */}
      <div className="relative z-10 text-white text-left">
        <h3 className="text-lg font-bold font-heading group-hover:text-red-300 transition-colors duration-200">
          {category.name}
        </h3>
        <p className="mt-1 text-xs text-slate-350 line-clamp-2 leading-normal font-sans">
          {category.description}
        </p>
      </div>

      {/* Hover Arrow Icon */}
      <div className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 transform translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
        <ArrowUpRight size={14} weight="bold" />
      </div>
    </a>
  );
}
