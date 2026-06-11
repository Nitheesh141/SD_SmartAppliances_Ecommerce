"use client";

import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { announcements } from "../LandingPage/data/announcements";
import { navLinks, footerColumns, socialLinks } from "../LandingPage/data/navigation";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 font-sans">
      <AnnouncementBar announcements={announcements} />
      <Header navLinks={navLinks} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-left">
        <div className="max-w-3xl">
          <p className="text-xs font-bold text-[#D71920] uppercase tracking-widest mb-2">Our Company</p>
          <h1 className="text-4xl md:text-5xl font-black text-[#1C1C1C] leading-tight mb-6">
            About SD SMART
          </h1>
          <p className="text-lg text-neutral-600 leading-relaxed mb-6">
            SD SMART Appliances has been a pioneer in kitchen innovation, delivering high-performance, heavy-duty, and smart solutions built specifically for contemporary households.
          </p>
          <p className="text-base text-neutral-500 leading-relaxed mb-8">
            Every appliance we craft is a testament to rigorous engineering, premium materials, and user-centric design. From ultra-silent operations to IoT-enabled automation, we focus on what makes kitchen chores effortless and enjoyable.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-neutral-100">
            <div>
              <p className="text-3xl font-black text-[#D71920]">25+</p>
              <p className="text-xs font-semibold text-neutral-500 uppercase mt-1">Years of Innovation</p>
            </div>
            <div>
              <p className="text-3xl font-black text-[#D71920]">2M+</p>
              <p className="text-xs font-semibold text-neutral-500 uppercase mt-1">Happy Kitchens</p>
            </div>
            <div>
              <p className="text-3xl font-black text-[#D71920]">100%</p>
              <p className="text-xs font-semibold text-neutral-500 uppercase mt-1">Assured Quality</p>
            </div>
          </div>
        </div>
      </main>

      <Footer footerColumns={footerColumns} socialLinks={socialLinks} />
    </div>
  );
}
