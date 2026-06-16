"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number; // delay in milliseconds
  duration?: number; // duration in milliseconds
  direction?: "up" | "down" | "left" | "right" | "fade";
  className?: string;
  threshold?: number;
}

export default function ScrollReveal({
  children,
  delay = 0,
  duration = 800,
  direction = "up",
  className,
  threshold = 0.05,
}: ScrollRevealProps) {
  const [hasRevealed, setHasRevealed] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Respect reduced motion preferences
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setHasRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasRevealed(true);
          if (elementRef.current) {
            observer.unobserve(elementRef.current);
          }
        }
      },
      {
        threshold,
        rootMargin: "0px 0px -50px 0px", // triggers slightly before entering to feel responsive
      }
    );

    const el = elementRef.current;
    if (el) {
      observer.observe(el);
    }

    return () => {
      if (el) {
        observer.unobserve(el);
      }
    };
  }, [threshold]);

  const getDirectionStyles = () => {
    if (hasRevealed) return { transform: "translate(0, 0)", opacity: 1 };

    switch (direction) {
      case "up":
        return { transform: "translateY(40px)", opacity: 0 };
      case "down":
        return { transform: "translateY(-40px)", opacity: 0 };
      case "left":
        return { transform: "translateX(40px)", opacity: 0 };
      case "right":
        return { transform: "translateX(-40px)", opacity: 0 };
      case "fade":
      default:
        return { transform: "none", opacity: 0 };
    }
  };

  return (
    <div
      ref={elementRef}
      className={cn("will-change-transform", className)}
      style={{
        ...getDirectionStyles(),
        transitionProperty: "transform, opacity",
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)", // Premium spring-like ease-out
      }}
    >
      {children}
    </div>
  );
}
