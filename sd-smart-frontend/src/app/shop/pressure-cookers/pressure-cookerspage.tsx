"use client";

import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { announcements } from "../../LandingPage/data/announcements";
import { navLinks, footerColumns, socialLinks } from "../../LandingPage/data/navigation";
import ProductCard from "@/components/cards/ProductCard";
import { useDynamicProducts } from "@/hooks/useDynamicProducts";

export default function PressureCookersPage() {
  const products = useDynamicProducts("pressure-cookers");

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 font-sans">
      <AnnouncementBar announcements={announcements} />
      <Header navLinks={navLinks} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-left w-full">
        <p className="text-xs font-bold text-[#D71920] uppercase tracking-widest mb-2">Shop Range</p>
        <h1 className="text-4xl font-black text-[#1C1C1C] leading-tight mb-8">
          Pressure Cookers
        </h1>
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-neutral-500">No products available in this category yet.</p>
        )}
      </main>

      <Footer footerColumns={footerColumns} socialLinks={socialLinks} />
    </div>
  );
}
