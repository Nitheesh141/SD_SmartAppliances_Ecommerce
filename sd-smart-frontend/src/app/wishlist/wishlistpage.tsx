"use client";

import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
// import { announcements } from "../LandingPage/data/announcements";
import { navLinks, footerColumns, socialLinks } from "../LandingPage/data/navigation";
import { Heart, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useWishlist } from "@/providers/WishlistProvider";
import ProductCard from "@/components/cards/ProductCard";

export default function WishlistPage() {
  const { wishlistItems, isLoading } = useWishlist();

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 font-sans">
      {/* <AnnouncementBar announcements={announcements} /> */}
      <Header navLinks={navLinks} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-neutral-500 font-semibold animate-pulse">Loading wishlist...</p>
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center mt-12">
            <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-6 text-neutral-400">
              <Heart size={28} />
            </div>
            <h1 className="text-2xl font-black text-[#1C1C1C] mb-2">
              Your Wishlist is Empty
            </h1>
            <p className="text-sm text-neutral-500 leading-relaxed mb-8 max-w-md mx-auto">
              Keep track of appliances you love! Add items to your wishlist while shopping and they will appear here.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-[#D71920] hover:bg-[#b8141a] text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
            >
              Explore Appliances <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-black text-[#1C1C1C] mb-2">My Wishlist</h1>
              <p className="text-neutral-500">You have {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {wishlistItems.map((item) => (
                <ProductCard key={item.id} product={item.product as any} />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer footerColumns={footerColumns} socialLinks={socialLinks} />
    </div>
  );
}
