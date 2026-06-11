"use client";

import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { announcements } from "../LandingPage/data/announcements";
import { navLinks, footerColumns, socialLinks } from "../LandingPage/data/navigation";
import { User, Package, Settings, LogOut } from "lucide-react";

export default function AccountPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 font-sans">
      <AnnouncementBar announcements={announcements} />
      <Header navLinks={navLinks} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-left w-full">
        <h1 className="text-3xl font-black text-[#1C1C1C] mb-8">My Account</h1>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1 flex flex-col gap-1 border-r border-neutral-150 pr-4">
            <button className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 text-[#D71920] font-semibold text-sm cursor-pointer text-left w-full">
              <User size={18} />
              Profile Details
            </button>
            <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-600 hover:bg-neutral-50 font-semibold text-sm cursor-pointer text-left w-full">
              <Package size={18} />
              My Orders
            </button>
            <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-600 hover:bg-neutral-50 font-semibold text-sm cursor-pointer text-left w-full">
              <Settings size={18} />
              Account Settings
            </button>
            <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-600 hover:bg-neutral-50 font-semibold text-sm cursor-pointer text-left w-full mt-4 border-t border-neutral-100 pt-4">
              <LogOut size={18} className="text-red-500" />
              Logout
            </button>
          </div>

          {/* Details Content */}
          <div className="lg:col-span-3 bg-neutral-50 rounded-2xl p-8 border border-neutral-100 max-w-2xl">
            <h3 className="text-lg font-bold text-[#1C1C1C] mb-6">Profile Details</h3>
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-600 uppercase mb-2">First Name</label>
                  <input
                    type="text"
                    disabled
                    value="Guest"
                    className="w-full px-4 py-3 text-sm bg-white border border-neutral-200 rounded-xl outline-none text-neutral-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-600 uppercase mb-2">Last Name</label>
                  <input
                    type="text"
                    disabled
                    value="User"
                    className="w-full px-4 py-3 text-sm bg-white border border-neutral-200 rounded-xl outline-none text-neutral-500 cursor-not-allowed"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-600 uppercase mb-2">Email Address</label>
                <input
                  type="email"
                  disabled
                  value="guest.user@sdsmart.in"
                  className="w-full px-4 py-3 text-sm bg-white border border-neutral-200 rounded-xl outline-none text-neutral-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer footerColumns={footerColumns} socialLinks={socialLinks} />
    </div>
  );
}
