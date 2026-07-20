"use client";

import React from "react";

export default function PageLoader() {
  return (
    <>
      <style>{`
        @keyframes loaderFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-loader-fade {
          animation: loaderFadeIn 0.25s ease-out forwards;
          animation-delay: 200ms;
          opacity: 0;
        }
      `}</style>
      <div 
        suppressHydrationWarning={true}
        className="min-h-screen flex flex-col items-center justify-center font-sans transition-colors duration-300 animate-loader-fade bg-neutral-50 dark:bg-[#080808] text-slate-900 dark:text-white"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#D71920]/20 border-t-[#D71920] rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Loading</p>
        </div>
      </div>
    </>
  );
}
