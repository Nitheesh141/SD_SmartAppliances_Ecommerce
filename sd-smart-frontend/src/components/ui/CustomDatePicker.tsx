"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string; // YYYY-MM-DD
  max?: string; // YYYY-MM-DD
  className?: string;
  required?: boolean;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function CustomDatePicker({
  value,
  onChange,
  placeholder = "Select date...",
  min,
  max,
  className,
  required
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calendar navigation state
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // 0-indexed

  // Synchronize calendar view with value when opened
  useEffect(() => {
    if (isOpen && value) {
      const parsedDate = new Date(value);
      if (!isNaN(parsedDate.getTime())) {
        setCurrentYear(parsedDate.getFullYear());
        setCurrentMonth(parsedDate.getMonth());
      }
    }
  }, [isOpen, value]);

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

  // Format date for trigger button e.g., "30 Jun 2026"
  const getFormattedDateLabel = () => {
    if (!value) return placeholder;
    const date = new Date(value);
    if (isNaN(date.getTime())) return placeholder;
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  // Helper to construct grid days
  const getDaysInGrid = () => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const cells: { dateStr: string; dayNum: number; isCurrentMonth: boolean; isDisabled: boolean; isToday: boolean; isSelected: boolean }[] = [];

    const todayStr = new Date().toISOString().split("T")[0];

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      
      cells.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: false,
        isDisabled: isDateDisabled(dateStr),
        isToday: dateStr === todayStr,
        isSelected: dateStr === value
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      
      cells.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        isDisabled: isDateDisabled(dateStr),
        isToday: dateStr === todayStr,
        isSelected: dateStr === value
      });
    }

    // Next month filler days (fill up to multiple of 7, let's keep grid size constant at 42 cells)
    const nextMonthFillerCount = 42 - cells.length;
    for (let d = 1; d <= nextMonthFillerCount; d++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

      cells.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: false,
        isDisabled: isDateDisabled(dateStr),
        isToday: dateStr === todayStr,
        isSelected: dateStr === value
      });
    }

    return cells;
  };

  const isDateDisabled = (dateStr: string) => {
    if (min && dateStr < min) return true;
    if (max && dateStr > max) return true;
    return false;
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const selectDate = (dateStr: string) => {
    onChange(dateStr);
    setIsOpen(false);
  };

  const selectToday = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    if (!isDateDisabled(todayStr)) {
      onChange(todayStr);
      setIsOpen(false);
    }
  };

  const clearDate = () => {
    onChange("");
    setIsOpen(false);
  };

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between pl-10 pr-4 py-2.5 bg-white border border-neutral-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white text-sm rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 outline-none transition-all cursor-pointer text-left"
      >
        <span className={cn(
          "truncate",
          !value && "text-neutral-400 dark:text-neutral-500"
        )}>
          {getFormattedDateLabel()}
        </span>
        <CalendarIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 p-4 bg-white dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 rounded-xl shadow-xl w-[290px] animate-in fade-in-0 zoom-in-95 duration-100 origin-top select-none left-0 sm:left-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-slate-900 mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-neutral-50 dark:hover:bg-slate-900 rounded-lg text-neutral-500 dark:text-neutral-400 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="text-sm font-bold text-neutral-850 dark:text-neutral-250">
              {MONTHS[currentMonth]}, {currentYear}
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-neutral-50 dark:hover:bg-slate-900 rounded-lg text-neutral-500 dark:text-neutral-400 transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-neutral-400 dark:text-neutral-500 mb-1">
            {WEEKDAYS.map(day => (
              <div key={day} className="py-1">{day}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {getDaysInGrid().map((cell, idx) => (
              <button
                key={idx}
                type="button"
                disabled={cell.isDisabled}
                onClick={() => selectDate(cell.dateStr)}
                className={cn(
                  "h-8 w-8 text-xs font-semibold rounded-lg flex items-center justify-center transition-all cursor-pointer",
                  // Current month style
                  cell.isCurrentMonth 
                    ? "text-neutral-800 dark:text-neutral-200" 
                    : "text-neutral-300 dark:text-neutral-600",
                  // Hover styles for enabled
                  !cell.isDisabled && "hover:bg-neutral-100 dark:hover:bg-slate-900",
                  // Selected style
                  cell.isSelected && "bg-[#D71920] dark:bg-[#D71920] hover:bg-[#b8141a] dark:hover:bg-[#b8141a] text-white dark:text-white font-bold ring-2 ring-[#D71920]/20",
                  // Today style (not selected)
                  cell.isToday && !cell.isSelected && "border border-[#D71920] text-[#D71920] dark:text-[#D71920] font-bold",
                  // Disabled style
                  cell.isDisabled && "opacity-30 cursor-not-allowed pointer-events-none"
                )}
              >
                {cell.dayNum}
              </button>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-slate-900 mt-3 text-xs">
            {!required ? (
              <button
                type="button"
                onClick={clearDate}
                className="font-bold text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
              >
                Clear
              </button>
            ) : (
              <div />
            )}
            <button
              type="button"
              onClick={selectToday}
              className="font-bold text-[#D71920] hover:text-[#b8141a] dark:text-red-400 dark:hover:text-red-500 transition-colors cursor-pointer"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
