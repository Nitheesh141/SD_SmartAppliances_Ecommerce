"use client";

import React from "react";
import { Filter, Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

interface ShopSidebarProps {
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  maxPrice: number;
  setMaxPrice: (val: number) => void;
  inStockOnly: boolean;
  setInStockOnly: (val: boolean) => void;
  priceLimits: { min: number; max: number };
  handleResetFilters: () => void;
  categoriesList: Array<{ id: string; label: string }>;
  className?: string;
}

export default function ShopSidebar({
  selectedCategory,
  setSelectedCategory,
  maxPrice,
  setMaxPrice,
  inStockOnly,
  setInStockOnly,
  priceLimits,
  handleResetFilters,
  categoriesList,
  className,
}: ShopSidebarProps) {
  const { user, isAuthenticated } = useAuth();
  const isDistributor = isAuthenticated && user && (user.role?.toUpperCase() === "DISTRIBUTOR" || user.role === "distributor");

  return (
    <aside className={cn("space-y-8 text-left", className)}>


      {/* Categories */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E5D6C] dark:text-slate-400">
            Categories
          </label>
          <Filter size={13} className="text-[#4E5D6C] dark:text-slate-400" />
        </div>
        <div className="space-y-1.5">
          {categoriesList.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                id={`sidebar-category-btn-${cat.id}`}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  if (typeof window !== "undefined") {
                    const nextUrl = cat.id === "all" ? "/shop" : `/shop?category=${cat.id}`;
                    window.history.replaceState({}, "", nextUrl);
                  }
                }}
                className={cn(
                  "w-full text-left px-3.5 py-2.5 text-sm font-semibold rounded-xl flex items-center justify-between transition-all duration-200 cursor-pointer border",
                  isSelected
                    ? "bg-[#FDF2F2] border-[#FBD5D5] text-[#D71920] dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-400"
                    : "text-slate-600 dark:text-neutral-400 hover:text-[#D71920] dark:hover:text-red-400 hover:bg-slate-50 dark:hover:bg-neutral-900/50 border-transparent"
                )}
              >
                <span>{cat.label}</span>
                {isSelected && <Check size={14} className="text-[#D71920] dark:text-red-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Filter */}
      {!isDistributor && (
        <div className="space-y-3 cursor-pointer select-none">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E5D6C] dark:text-slate-400 cursor-pointer">
            Max Price (₹{maxPrice.toLocaleString("en-IN")})
          </label>
          <div className="relative pt-1 cursor-pointer">
            <input
              id="sidebar-price-range-input"
              type="range"
              min={priceLimits.min}
              max={priceLimits.max}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#D71920] focus:outline-none"
            />
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 dark:text-neutral-500 mt-2 cursor-pointer">
              <span className="cursor-pointer">Min: ₹{priceLimits.min.toLocaleString("en-IN")}</span>
              <span className="cursor-pointer">Max: ₹{priceLimits.max.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>
      )}

      {/* Availability */}
      <div className="space-y-3">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E5D6C] dark:text-slate-400">
          Availability
        </label>
        <label className="flex items-center gap-3 cursor-pointer text-sm font-semibold text-slate-700 dark:text-neutral-300 hover:text-slate-900 transition-colors">
          <input
            id="sidebar-in-stock-checkbox"
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="w-4.5 h-4.5 rounded border-slate-300 dark:border-neutral-700 text-[#D71920] focus:ring-0 focus:ring-offset-0 accent-[#D71920] cursor-pointer"
          />
          <span>In Stock Only</span>
        </label>
      </div>

      {/* Reset Actions */}
      <button
        id="sidebar-reset-filters-btn"
        onClick={handleResetFilters}
        className="w-full flex items-center justify-center gap-2.5 py-3 bg-[#EEF2F6] hover:bg-[#E2E8F0] dark:bg-neutral-900 dark:hover:bg-neutral-800/80 border border-[#E2E8F0] dark:border-neutral-800 rounded-xl text-xs font-bold text-[#334155] dark:text-neutral-300 transition-all cursor-pointer shadow-sm hover:shadow"
      >
        <RotateCcw size={14} className="text-[#334155] dark:text-neutral-400" />
        <span>Reset All Filters</span>
      </button>
    </aside>
  );
}
