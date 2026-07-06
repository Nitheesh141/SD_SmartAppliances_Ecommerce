"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";
import AnnouncementBar from "../../components/layout/AnnouncementBar";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import HeroSection from "../../components/sections/HeroSection";
import TrustBadgesSection from "../../components/sections/TrustBadgesSection";
import CategorySection from "../../components/sections/CategorySection";
import BestSellerSection from "../../components/sections/BestSellerSection";
import WhyChooseUsSection from "../../components/sections/WhyChooseUsSection";
import TimelineSection from "../../components/sections/TimelineSection";
import CommercialSection from "../../components/sections/CommercialSection";
import TestimonialSection from "../../components/sections/TestimonialSection";
import NewsletterSection from "../../components/sections/NewsletterSection";

import { banners } from "./data/banners";
import { categories } from "./data/categories";
import { featuredProducts } from "./data/products";
import { features } from "./data/features";
import { timelineItems } from "./data/timeline";
import { testimonials } from "./data/testimonials";
import { trustBadges } from "./data/trustBadges";
import { announcements } from "./data/announcements";
import { navLinks, footerColumns, socialLinks, commercialSectionData } from "./data/navigation";
import KitchenBackground from "../../components/animations/KitchenBackground";

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();

  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [featuredItems, setFeaturedItems] = useState<any[]>(featuredProducts);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        // Fetch bestseller products from specialized endpoint
        const bestSellerResponse = await fetch("http://localhost:5000/api/products/bestsellers");
        if (bestSellerResponse.ok) {
          const bsData = await bestSellerResponse.json();
          if (bsData.success && bsData.products && bsData.products.length > 0) {
            setBestSellers(bsData.products);
          }
        }

        // Fetch featured products from filtering
        const featuredResponse = await fetch("http://localhost:5000/api/products?isFeatured=true");
        if (featuredResponse.ok) {
          const featData = await featuredResponse.json();
          const apiProducts = featData.products || [];
          const apiFeatured = apiProducts.map((p: any) => {
            // Parse specs safely if they are stored as JSON/string
            let parsedSpecs = [];
            if (p.specs) {
              if (typeof p.specs === "string") {
                try {
                  parsedSpecs = JSON.parse(p.specs);
                } catch {
                  parsedSpecs = [];
                }
              } else if (Array.isArray(p.specs)) {
                parsedSpecs = p.specs;
              }
            }
            return {
              ...p,
              startingPrice: p.startingPrice || p.price,
              primaryCTA: {
                label: p.primaryCTALabel || "Buy Now",
                href: `/product/${p.id}`
              },
              secondaryCTA: {
                label: p.secondaryCTALabel || "Compare Specs",
                href: `/product/${p.id}`
              },
              specs: parsedSpecs
            };
          });

          if (apiFeatured.length > 0) {
            setFeaturedItems(apiFeatured);
          }
        }
      } catch (error) {
        console.warn("Backend API offline, falling back to static product data.", error);
      }
    };
    loadProducts();
  }, []);

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

        {/* 4. Best Selling Products */}
        <BestSellerSection products={bestSellers} />

        {/* 5. Why Choose SD SMART */}
        <WhyChooseUsSection features={features} />



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