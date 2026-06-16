import React from "react";
import { TimelineItem } from "../../app/LandingPage/types";

interface TimelineCardProps {
  item: TimelineItem;
}

export default function TimelineCard({ item }: TimelineCardProps) {
  const isLeft = item.side === "left";

  return (
    <div className={`relative flex flex-col md:flex-row items-center justify-between w-full mb-12 md:mb-16 last:mb-0 ${isLeft ? "" : "md:flex-row-reverse"}`}>
      {/* Spacer or Card Container for split view */}
      <div className="w-full md:w-[45%] flex flex-col items-start px-2">
        <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 dark:bg-slate-900/50 dark:border-slate-800 dark:hover:shadow-none w-full">
          {/* Mobile Year Badge */}
          <span className="inline-flex md:hidden items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 mb-3 uppercase dark:bg-red-950 dark:text-red-400">
            {item.year}
          </span>
          <h3 className="text-base font-bold text-slate-900 mb-2 font-heading dark:text-slate-100 text-left font-heading">
            {item.title}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed dark:text-slate-400 text-left">
            {item.description}
          </p>
        </div>
      </div>

      {/* Central Timeline Year / Bullet */}
      <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 top-4 md:top-1/2 md:-translate-y-1/2 z-10 flex items-center justify-center">
        {/* Outer Circle */}
        <div className="h-8 w-8 rounded-full bg-red-50 border-2 border-red-500 flex items-center justify-center dark:bg-red-950">
          {/* Inner Bullet */}
          <div className="h-3 w-3 rounded-full bg-[#D71920]" />
        </div>
        
        {/* Floating Year label for desktop */}
        <div className={`hidden md:block absolute whitespace-nowrap text-xl font-bold font-heading text-[#D71920] dark:text-red-400 ${isLeft ? "left-12" : "right-12"}`}>
          {item.year}
        </div>
      </div>

      {/* Empty Spacer Column for Desktop Grid */}
      <div className="hidden md:block w-[45%]" />
    </div>
  );
}
