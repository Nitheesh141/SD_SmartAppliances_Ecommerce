"use client";

import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
// import { announcements } from "../LandingPage/data/announcements";
import { navLinks, footerColumns, socialLinks } from "../LandingPage/data/navigation";
import { Heart, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function WishlistPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 font-sans">
      {/* <AnnouncementBar announcements={announcements} /> */}
      <Header navLinks={navLinks} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center flex flex-col items-center justify-center">
        <div className="max-w-md">
          <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-6 text-neutral-400">
            <Heart size={28} />
          </div>
          <h1 className="text-2xl font-black text-[#1C1C1C] mb-2">
            Your Wishlist is Empty
          </h1>
          <p className="text-sm text-neutral-500 leading-relaxed mb-8">
            Keep track of appliances you love! Add items to your wishlist while shopping and they will appear here.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-[#D71920] hover:bg-[#b8141a] text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
          >
            Explore Appliances <ArrowRight size={16} />
          </Link>
        </div>
      </main>

      <Footer footerColumns={footerColumns} socialLinks={socialLinks} />
    </div>
  );
}
