"use client";

import React from "react";

interface AuthBackgroundProps {
  children: React.ReactNode;
  focusPos?: { x: number; y: number } | null;
  isSuccess?: boolean;
}

export default function AuthBackground({ children, focusPos = null, isSuccess = false }: AuthBackgroundProps) {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-white dark:bg-white">
      {/* Auth Card container wrapper */}
      <div className="relative z-30 w-full h-full flex items-center justify-center px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
