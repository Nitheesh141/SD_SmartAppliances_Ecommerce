"use client";

import React from "react";

export default function PageLoader() {
  const [isDark, setIsDark] = React.useState(() => {
    if (typeof window !== "undefined") {
      if (window.location.pathname.includes("/sales")) {
        return false;
      }
      const saved = localStorage.getItem("admin-theme");
      return saved !== "light"; // default to dark (true) unless explicitly saved as light
    }
    return true;
  });

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.location.pathname.includes("/sales")) {
        setIsDark(false);
        return;
      }
      const saved = localStorage.getItem("admin-theme");
      setIsDark(saved !== "light");
    }
  }, []);

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center font-sans ${isDark ? "bg-[#0d0d0d] text-white" : "bg-white text-slate-900"}`}>
      <div className="w-12 h-12 border-4 border-[#D71920]/25 border-t-[#D71920] rounded-full animate-spin"></div>
      <p className="mt-4 text-sm font-semibold text-neutral-500 tracking-wider">Loading...</p>
    </div>
  );
}
