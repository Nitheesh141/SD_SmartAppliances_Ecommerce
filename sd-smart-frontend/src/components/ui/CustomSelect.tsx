"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface Group {
  label: string;
  options: Option[];
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  groups: Group[];
  className?: string;
  required?: boolean;
}

export function CustomSelect({
  value,
  onChange,
  placeholder = "Select an option...",
  groups,
  className,
  required
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Find the selected option label
  let selectedLabel = "";
  for (const group of groups) {
    const found = group.options.find(opt => opt.value === value);
    if (found) {
      selectedLabel = found.label;
      break;
    }
  }

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-neutral-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white text-sm rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 outline-none transition-all cursor-pointer text-left"
      >
        <span className={cn(
          "truncate",
          !value && "text-neutral-400 dark:text-neutral-500"
        )}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown size={16} className={cn("text-neutral-400 dark:text-neutral-500 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 overflow-hidden bg-white dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-100 origin-top">
          <div className="py-1">
            {/* Standard "None" or Placeholder Option if not required */}
            {!required && (
              <button
                type="button"
                onClick={() => handleSelect("")}
                className={cn(
                  "w-full px-4 py-2 text-left text-sm text-neutral-500 hover:bg-neutral-50 dark:hover:bg-slate-900/50 cursor-pointer flex justify-between items-center transition-colors",
                  !value && "bg-neutral-50 dark:bg-slate-900 font-semibold text-[#D71920] dark:text-[#D71920]"
                )}
              >
                <span>{placeholder}</span>
                {!value && <Check size={14} />}
              </button>
            )}

            {groups.map((group, groupIdx) => {
              if (group.options.length === 0) return null;
              return (
                <div key={groupIdx} className="first:mt-0 mt-1">
                  <div className="px-3.5 py-1.5 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider bg-neutral-50/50 dark:bg-slate-900/30 border-y border-neutral-100/50 dark:border-slate-900/50">
                    {group.label}
                  </div>
                  <div className="py-0.5">
                    {group.options.map(opt => {
                      const isSelected = opt.value === value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSelect(opt.value)}
                          className={cn(
                            "w-full px-4 py-2.5 text-left text-sm text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-slate-900/50 cursor-pointer flex justify-between items-center transition-colors",
                            isSelected && "bg-[#D71920]/5 dark:bg-[#D71920]/10 font-bold text-[#D71920] dark:text-red-400"
                          )}
                        >
                          <span className="truncate pr-4">{opt.label}</span>
                          {isSelected && <Check size={14} className="shrink-0 text-[#D71920] dark:text-red-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
