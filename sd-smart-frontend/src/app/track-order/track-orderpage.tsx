"use client";

import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
// import { announcements } from "../LandingPage/data/announcements";
import { navLinks, footerColumns, socialLinks } from "../LandingPage/data/navigation";

export default function TrackOrderPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 font-sans">
      {/* <AnnouncementBar announcements={announcements} /> */}
      <Header navLinks={navLinks} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-left w-full">
        <p className="text-xs font-bold text-[#D71920] uppercase tracking-widest mb-2">Support</p>
        <h1 className="text-4xl font-black text-[#1C1C1C] leading-tight mb-6">
          Track Your Order
        </h1>
        <p className="text-neutral-500 max-w-xl leading-relaxed">
          Check the status of your shipment. Enter your order ID and billing email below to track your delivery.
        </p>
      </main>

      <Footer footerColumns={footerColumns} socialLinks={socialLinks} />
    </div>
  );
}
