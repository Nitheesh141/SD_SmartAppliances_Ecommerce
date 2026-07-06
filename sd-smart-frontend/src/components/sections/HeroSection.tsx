"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Banner } from "../../app/LandingPage/types";

interface HeroSectionProps {
  banners: Banner[];
}

export default function HeroSection({ banners }: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Touch swipe support coordinates
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  // Autoplay functionality with 6 seconds auto-slide
  useEffect(() => {
    autoPlayTimerRef.current = setInterval(() => {
      handleNext();
    }, 6000);
    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    };
  }, [currentSlide]);

  // Touch Swipe handlers
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  const banner = banners[currentSlide];

  return (
    <div
      className="relative h-[calc(100vh-64px)] min-h-[480px] sm:min-h-[600px] md:min-h-[700px] w-full overflow-hidden bg-slate-950 font-sans"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full flex items-center"
        >
          {/* Background Image with optimized zooms / parallax per slide */}
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            {banner.image ? (
              <motion.div
                className="w-full h-full relative"
                initial={
                  currentSlide === 0
                    ? { scale: 1 }
                    : currentSlide === 1
                      ? { x: 0, scale: 1.05 }
                      : { scale: 1.08 }
                }
                animate={
                  currentSlide === 0
                    ? { scale: 1.08 }
                    : currentSlide === 1
                      ? { x: -15, scale: 1.05 }
                      : { scale: 1 }
                }
                transition={{
                  duration: 4,
                  ease: currentSlide === 1 ? "linear" : "easeOut",
                }}
              >
                <Image
                  src={banner.image}
                  alt={banner.heading}
                  fill
                  priority
                  className="object-cover pointer-events-none"
                  sizes="100vw"
                  quality={95}
                />
              </motion.div>
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-r ${banner.bgColor}`} />
            )}
          </div>

          {/* Gradient Overlay: Left side only for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent z-10 pointer-events-none" />

          {/* Left-Aligned Text Content aligned left, product aligned right */}
          <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative z-20 text-left">
            <div className="max-w-xl md:max-w-2xl">

              {/* Badge */}
              <motion.span
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
                className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold bg-[#E30613]/10 border border-[#E30613]/30 text-[#E30613] mb-4 sm:mb-6 select-none"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#E30613] animate-pulse" />
                {banner.badge}
              </motion.span>

              {/* Heading: Slide Specific Animations */}
              {currentSlide === 0 && (
                <h1 className="text-3xl sm:text-5xl md:text-6xl md:text-[68px] font-black tracking-tight leading-[1.08] mb-4 sm:mb-6 text-white">
                  {banner.heading.split(". ").map((line, idx) => (
                    <motion.span
                      key={idx}
                      className="block"
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.8, delay: 0.2 + idx * 0.15, ease: "easeOut" }}
                    >
                      {line}{idx === 0 ? "." : ""}
                    </motion.span>
                  ))}
                </h1>
              )}

              {currentSlide === 1 && (
                <h1 className="text-3xl sm:text-5xl md:text-6xl md:text-[68px] font-black tracking-tight leading-[1.08] mb-4 sm:mb-6 text-white overflow-hidden">
                  {banner.heading.split(". ").map((line, idx) => (
                    <span key={idx} className="block overflow-hidden py-1">
                      <motion.span
                        className="block"
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 + idx * 0.2, ease: "easeOut" }}
                      >
                        {line}{idx === 0 ? "." : ""}
                      </motion.span>
                    </span>
                  ))}
                </h1>
              )}

              {currentSlide === 2 && (
                <motion.h1
                  initial={{ opacity: 0, x: -100 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 45, damping: 12, delay: 0.2 }}
                  className="text-3xl sm:text-5xl md:text-6xl md:text-[68px] font-black tracking-tight leading-[1.08] mb-4 sm:mb-6 text-white block"
                >
                  {banner.heading}
                </motion.h1>
              )}

              {/* Description / Subheading */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: currentSlide === 2 ? 1.0 : 0.8,
                  delay: currentSlide === 2 ? 0.5 : 0.45,
                  ease: "easeOut"
                }}
                className="text-xs sm:text-base md:text-lg text-white/85 leading-relaxed mb-6 sm:mb-8 max-w-[480px] md:max-w-[520px]"
              >
                {banner.subheading}
              </motion.p>

              {/* Action Buttons with Sequential Animate & Slide-up */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <motion.div
                  initial={currentSlide === 1 ? { opacity: 0 } : { opacity: 0, y: 30 }}
                  animate={currentSlide === 1 ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.7,
                    delay: currentSlide === 1 ? 0.7 : 0.6,
                    ease: "easeOut"
                  }}
                >
                  <Link
                    href={banner.primaryCTA.href}
                    className="inline-flex items-center gap-2 bg-[#E30613] hover:bg-[#C40510] text-white px-5 py-2.5 sm:px-7 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 shadow-lg shadow-red-600/10 cursor-pointer select-none"
                    style={{ transitionProperty: "all" }}
                  >
                    {banner.primaryCTA.label}
                    <ArrowRight size={16} />
                  </Link>
                </motion.div>

                <motion.div
                  initial={currentSlide === 1 ? { opacity: 0 } : { opacity: 0, y: 30 }}
                  animate={currentSlide === 1 ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.7,
                    delay: currentSlide === 1 ? 0.95 : 0.75,
                    ease: "easeOut"
                  }}
                >
                  <Link
                    href={banner.secondaryCTA.href}
                    className="inline-flex items-center gap-2 bg-[#4A4A4A]/40 hover:bg-[#4A4A4A]/70 text-white border border-white/20 hover:border-white/40 px-5 py-2.5 sm:px-7 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 cursor-pointer select-none"
                  >
                    {banner.secondaryCTA.label}
                  </Link>
                </motion.div>
              </div>

            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Nav Arrow: Left */}
      <button
        onClick={handlePrev}
        className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-20 h-11 w-11 sm:h-12 sm:w-12 rounded-full border border-white/25 bg-black/20 hover:bg-[#E30613] hover:border-transparent text-white flex items-center justify-center backdrop-blur-sm transition-all duration-300 opacity-80 hover:opacity-100 cursor-pointer"
        aria-label="Previous slide"
      >
        <ChevronLeft size={20} />
      </button>

      {/* Nav Arrow: Right */}
      <button
        onClick={handleNext}
        className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 h-11 w-11 sm:h-12 sm:w-12 rounded-full border border-white/25 bg-black/20 hover:bg-[#E30613] hover:border-transparent text-white flex items-center justify-center backdrop-blur-sm transition-all duration-300 opacity-80 hover:opacity-100 cursor-pointer"
        aria-label="Next slide"
      >
        <ChevronRight size={20} />
      </button>

      {/* Slide Indicators: Modern animated pagination */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className="relative h-2 rounded-full cursor-pointer focus:outline-none"
            style={{ width: index === currentSlide ? "24px" : "8px", transition: "width 0.3s ease" }}
            aria-label={`Go to slide ${index + 1}`}
          >
            <span
              className={`absolute inset-0 rounded-full transition-all duration-300 ${index === currentSlide ? "bg-[#E30613] w-full" : "bg-white/40 hover:bg-white/70 w-full"
                }`}
            />
            {index === currentSlide && (
              <motion.span
                className="absolute inset-0 rounded-full bg-white/25"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 4, ease: "linear" }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
