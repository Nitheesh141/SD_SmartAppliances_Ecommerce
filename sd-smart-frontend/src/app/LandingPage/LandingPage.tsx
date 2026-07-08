"use client";

import { useAuth } from "@/providers/AuthProvider";
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
        <TrustBadgesSection trustBadges={trustBadges} />

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
    </div>
  );
}