"use client";

import React, { useEffect, useState } from "react";

interface AuthBackgroundProps {
  children: React.ReactNode;
  focusPos?: { x: number; y: number } | null;
  isSuccess?: boolean;
}

export default function AuthBackground({ children, focusPos = null, isSuccess = false }: AuthBackgroundProps) {
  const [pulseRadius, setPulseRadius] = useState(0);
  const [isDark, setIsDark] = useState(false);

  // Detect theme on mount and when DOM classes change
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Success Pulse Ring Animation
  useEffect(() => {
    if (!isSuccess) {
      setPulseRadius(0);
      return;
    }

    setPulseRadius(10);
    const interval = setInterval(() => {
      setPulseRadius((prev) => {
        if (prev >= Math.max(window.innerWidth, window.innerHeight) * 1.4) {
          clearInterval(interval);
          return prev;
        }
        return prev + 7;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [isSuccess]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-white via-[#F8F9FA] to-[#FFF5F5] dark:from-[#0F172A] dark:to-[#111827] transition-colors duration-500">
      {/* Focus Glow Spotlight Overlay */}
      {focusPos && (
        <div
          className="fixed inset-0 pointer-events-none transition-opacity duration-300 z-0"
          style={{
            background: `radial-gradient(circle 220px at ${focusPos.x}px ${focusPos.y}px, rgba(215, 25, 32, 0.08), transparent)`,
          }}
        />
      )}

      {/* Success Pulse Energy Ring Overlay */}
      {isSuccess && pulseRadius > 0 && (
        <>
          {/* Layer 1: Ambient Full-Screen Red Flash (Behind card) */}
          <div
            className="pointer-events-none fixed inset-0 bg-[#D71920] z-5"
            style={{
              opacity: Math.max(0, 0.22 - (pulseRadius / (Math.max(window.innerWidth, window.innerHeight) * 1.4))),
              transition: "opacity 0.1s ease-out",
            }}
          />

          {/* Layer 2: Main Expanding Glow Halo (Behind card) */}
          <div
            className="pointer-events-none fixed top-1/2 left-1/2 rounded-full border border-[#D71920]/20 -translate-x-1/2 -translate-y-1/2 z-15"
            style={{
              width: `${pulseRadius * 1.8}px`,
              height: `${pulseRadius * 1.8}px`,
              boxShadow: "0 0 140px 45px rgba(215, 25, 32, 0.4), inset 0 0 90px 25px rgba(215, 25, 32, 0.25)",
              opacity: Math.max(0, 1 - (pulseRadius / (Math.max(window.innerWidth, window.innerHeight) * 1.4))),
              filter: "blur(6px)",
            }}
          />

          {/* Layer 3: Soft Expanding Radial Inner Glow (Behind card) */}
          <div
            className="pointer-events-none fixed top-1/2 left-1/2 rounded-full -translate-x-1/2 -translate-y-1/2 z-10"
            style={{
              width: `${pulseRadius * 2.2}px`,
              height: `${pulseRadius * 2.2}px`,
              background: `radial-gradient(circle, rgba(215, 25, 32, 0.35) 0%, rgba(215, 25, 32, 0.1) 50%, transparent 75%)`,
              opacity: Math.max(0, 0.85 - (pulseRadius / (Math.max(window.innerWidth, window.innerHeight) * 1.4))),
              filter: "blur(20px)",
            }}
          />

          {/* Layer 4: Secondary Delayed Expanding Glow Halo (Behind card) */}
          {pulseRadius > 160 && (
            <div
              className="pointer-events-none fixed top-1/2 left-1/2 rounded-full border border-[#D71920]/10 -translate-x-1/2 -translate-y-1/2 z-12"
              style={{
                width: `${(pulseRadius - 160) * 1.8}px`,
                height: `${(pulseRadius - 160) * 1.8}px`,
                boxShadow: "0 0 100px 30px rgba(215, 25, 32, 0.25), inset 0 0 65px 15px rgba(215, 25, 32, 0.15)",
                opacity: Math.max(0, 1 - ((pulseRadius - 160) / (Math.max(window.innerWidth, window.innerHeight) * 1.4))),
                filter: "blur(8px)",
              }}
            />
          )}
        </>
      )}

      {/* Auth Card container wrapper */}
      <div className="relative z-30 w-full h-full flex items-center justify-center px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
