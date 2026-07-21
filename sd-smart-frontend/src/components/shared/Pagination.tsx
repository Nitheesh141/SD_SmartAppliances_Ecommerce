"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  theme?: "light" | "dark";
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  theme = "dark",
}: PaginationProps) {
  const isDark = theme === "dark";

  if (totalPages < 1) {
    return null;
  }

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      pages.push(totalPages);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  const btnClasses = cn(
    "px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 select-none",
    isDark
      ? "bg-neutral-900/60 border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white"
      : "bg-white border-neutral-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs"
  );

  const activeBtnClasses = cn(
    "px-3.5 py-1.5 rounded-xl text-xs font-extrabold border cursor-pointer transition-all shadow-md shadow-[#D71920]/20 select-none",
    "bg-[#D71920] border-[#D71920] text-white"
  );

  const numberBtnClasses = (isActive: boolean) =>
    isActive
      ? activeBtnClasses
      : cn(
          "px-3.5 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all select-none",
          isDark
            ? "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white"
            : "bg-white border-neutral-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-xs"
        );

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 py-4 px-4 border-t transition-colors duration-300 w-full mt-2",
        isDark ? "border-neutral-800/60 bg-neutral-950/40" : "border-neutral-200/80 bg-neutral-50/50"
      )}
    >
      {/* Previous button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={btnClasses}
      >
        <ChevronLeft size={14} />
        <span>Previous</span>
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1.5">
        {pageNumbers.map((page, idx) => {
          if (page === "...") {
            return (
              <span
                key={`dots-${idx}`}
                className={cn(
                  "px-2 py-1.5 text-xs font-bold tracking-widest select-none",
                  isDark ? "text-neutral-600" : "text-slate-400"
                )}
              >
                ...
              </span>
            );
          }
          return (
            <button
              key={`page-${page}`}
              onClick={() => onPageChange(page as number)}
              className={numberBtnClasses(currentPage === page)}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* Next button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || totalPages === 0}
        className={btnClasses}
      >
        <span>Next</span>
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

