"use client";

import { useAuth } from "@/providers/AuthProvider";
import Link from "next/link";
import { Headphones } from "lucide-react";
import AnnouncementBar from "../../components/layout/AnnouncementBar";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import HeroSection from "../../components/sections/HeroSection";
import TrustBadgesSection from "../../components/sections/TrustBadgesSection";
import CategorySection from "../../components/sections/CategorySection";
import WhyChooseUsSection from "../../components/sections/WhyChooseUsSection";
import CommercialSection from "../../components/sections/CommercialSection";
import TestimonialSection from "../../components/sections/TestimonialSection";
import NewsletterSection from "../../components/sections/NewsletterSection";

import { useEffect, useState } from "react";
import { banners } from "./data/banners";
import { categories } from "./data/categories";
import { features } from "./data/features";
import { testimonials } from "./data/testimonials";
import { trustBadges } from "./data/trustBadges";
import { announcements } from "./data/announcements";
import { navLinks, footerColumns, socialLinks, commercialSectionData } from "./data/navigation";
import KitchenBackground from "../../components/animations/KitchenBackground";

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();
  const [threshold, setThreshold] = useState<number | null>(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/settings")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings && data.settings.freeShippingThreshold) {
          setThreshold(Number(data.settings.freeShippingThreshold));
        }
      })
      .catch(err => console.error("Failed to fetch settings on landing page:", err));
  }, []);

  const dynamicTrustBadges = trustBadges.map((badge) => {
    if (badge.id === "badge-2" && threshold !== null) {
      return {
        ...badge,
        subtitle: `On all orders above ₹${threshold.toLocaleString('en-IN')}`
      };
    }
    return badge;
  });

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 relative">
      <KitchenBackground />
      {/* ── Layout ──────────────────────────────────────────── */}
      <AnnouncementBar announcements={announcements} />
      <Header navLinks={navLinks} isAuthenticated={isAuthenticated} userProfile={user} />

      {/* ── Page Content ────────────────────────────────────── */}
      <main className="flex-1">
        {/* 1. Hero Carousel */}
        <HeroSection banners={banners} />

        {/* 2. Trust Badges */}
        <TrustBadgesSection trustBadges={dynamicTrustBadges} />

        {/* 3. Shop by Category */}
        <CategorySection categories={categories} />

        {/* 5. Why Choose SD SMART */}
        <WhyChooseUsSection features={features} />

        {/* 9. Commercial Kitchen Solutions */}
        <CommercialSection data={commercialSectionData} />

        {/* 10. Testimonials */}
        {/* <TestimonialSection testimonials={testimonials} /> */}

        {/* 11. Newsletter */}
        <NewsletterSection />
      </main>

      {/* ── Footer ──────────────────────────────────────────── */}
      <Footer footerColumns={footerColumns} socialLinks={socialLinks} />
      {/* Floating Service Ticket FAB */}
      <div className="fixed bottom-6 right-6 z-45">
        <Link
          href="/service-request"
          className="flex items-center gap-2 px-5 py-3.5 bg-[#D71920] hover:bg-[#b8141a] hover:text-white text-white text-xs font-black uppercase tracking-wider rounded-full shadow-[0_8px_30px_rgba(215,25,32,0.35)] hover:shadow-[0_8px_30px_rgba(215,25,32,0.55)] active:scale-95 transition-all duration-300 group border border-white/10"
        >
          <Headphones size={15} className="group-hover:scale-110 transition-transform" />
          <span>File Service Ticket</span>
        </Link>
      </div>
    </div>
  );
}