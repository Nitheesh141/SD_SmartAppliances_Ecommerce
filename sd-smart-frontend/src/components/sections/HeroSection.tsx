"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Banner } from "../../app/LandingPage/types";

interface HeroSectionProps {
  banners: Banner[];
}

export default function HeroSection({ banners }: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 6000); // 6s auto-rotate
    return () => clearInterval(timer);
  }, [currentSlide, banners.length]);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  return (
    <div className="relative h-[700px] md:h-[720px] w-full overflow-hidden bg-slate-950 font-sans">
      {/* Slides */}
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out flex items-center ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
        >
          {/* Background image / gradient */}
          {banner.image ? (
            <>
              <Image
                src={banner.image}
                alt={banner.heading}
                fill
                priority={index === 0}
                className="object-cover pointer-events-none"
                sizes="100vw"
              />
              {/* Dark overlay for readability */}
              <div className="absolute inset-0 bg-black/45 z-10" />
            </>
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-r ${banner.bgColor} z-10`} />
          )}

          {/* Left-Aligned Content Container */}
          <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 text-left flex flex-col items-start text-white relative z-20">
            {banner.badge && (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-red-950/40 backdrop-blur-md border border-red-500/20 text-[#ef4444] mb-6 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D71920]" />
                {banner.badge}
              </span>
            )}
            <h1 className="text-4xl sm:text-6xl md:text-[68px] font-extrabold tracking-tight leading-[1.1] mb-6 text-white max-w-xl md:max-w-2xl">
              {banner.heading}
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-white/80 leading-relaxed mb-8 max-w-[480px] md:max-w-[520px]">
              {banner.subheading}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href={banner.primaryCTA.href}
                className="inline-flex items-center gap-2 bg-[#D71920] hover:bg-[#b8141a] text-white px-7 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg shadow-red-600/10 cursor-pointer select-none"
              >
                {banner.primaryCTA.label}
                <ArrowRight size={16} />
              </Link>
              <Link
                href={banner.secondaryCTA.href}
                className="inline-flex items-center gap-2 bg-black/40 hover:bg-black/60 text-white border border-white/20 hover:border-white/40 px-7 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 cursor-pointer select-none"
              >
                {banner.secondaryCTA.label}
              </Link>
            </div>
          </div>
        </div>
      ))}

      {/* Nav Arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full border border-white/30 bg-black/15 hover:bg-[#D71920] hover:border-transparent text-white flex items-center justify-center backdrop-blur-sm transition-all duration-300 cursor-pointer"
        aria-label="Previous slide"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-20 text-white/60 hover:text-white transition-all duration-300 cursor-pointer p-4"
        aria-label="Next slide"
      >
        <ChevronRight size={24} />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${index === currentSlide ? "w-5 bg-[#D71920]" : "w-1.5 bg-white/50 hover:bg-white/85"
              }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
