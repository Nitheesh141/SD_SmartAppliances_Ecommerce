"use client";

import { useAuth } from "@/providers/AuthProvider";
import AnnouncementBar from "../../components/layout/AnnouncementBar";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import HeroSection from "../../components/sections/HeroSection";
import TrustBadgesSection from "../../components/sections/TrustBadgesSection";
import CategorySection from "../../components/sections/CategorySection";
import BestSellerSection from "../../components/sections/BestSellerSection";
import WhyChooseUsSection from "../../components/sections/WhyChooseUsSection";
import FeaturedProductSection from "../../components/sections/FeaturedProductSection";
import TimelineSection from "../../components/sections/TimelineSection";
import CommercialSection from "../../components/sections/CommercialSection";
import TestimonialSection from "../../components/sections/TestimonialSection";
import NewsletterSection from "../../components/sections/NewsletterSection";

import { banners } from "./data/banners";
import { categories } from "./data/categories";
import { bestSellingProducts, featuredProducts } from "./data/products";
import { features } from "./data/features";
import { timelineItems } from "./data/timeline";
import { testimonials } from "./data/testimonials";
import { trustBadges } from "./data/trustBadges";
import { announcements } from "./data/announcements";
import { navLinks, footerColumns, socialLinks, commercialSectionData } from "./data/navigation";

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950">
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

        {/* 4. Best Selling Products */}
        <BestSellerSection products={bestSellingProducts} />

        {/* 5. Why Choose SD SMART */}
        <WhyChooseUsSection features={features} />

        {/* 6. Featured: Pressure Cooker */}
        <FeaturedProductSection product={featuredProducts[0]} />

        {/* 7. Featured: Wet Grinder (gray bg, image right) */}
        <div className="bg-[#F5F5F5] dark:bg-slate-900/40">
          <FeaturedProductSection product={featuredProducts[1]} />
        </div>

        {/* 8. Company Timeline */}
        <TimelineSection items={timelineItems} />

        {/* 9. Commercial Kitchen Solutions */}
        <CommercialSection data={commercialSectionData} />

        {/* 10. Testimonials */}
        <TestimonialSection testimonials={testimonials} />

        {/* 11. Newsletter */}
        <NewsletterSection />
      </main>

      {/* ── Footer ──────────────────────────────────────────── */}
      <Footer footerColumns={footerColumns} socialLinks={socialLinks} />
    </div>
  );
}