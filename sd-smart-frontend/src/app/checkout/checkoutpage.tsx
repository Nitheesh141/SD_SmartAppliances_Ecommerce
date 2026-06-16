"use client";

import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
// import { announcements } from "../LandingPage/data/announcements";
import { navLinks, footerColumns, socialLinks } from "../LandingPage/data/navigation";
import { CreditCard, ShoppingBag, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 font-sans">
      {/* <AnnouncementBar announcements={announcements} /> */}
      <Header navLinks={navLinks} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-left w-full">
        <h1 className="text-3xl font-black text-[#1C1C1C] mb-8">Checkout</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipping/Billing Columns */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-100">
              <h3 className="text-lg font-bold text-[#1C1C1C] mb-4 flex items-center gap-2">
                <CreditCard size={18} className="text-[#D71920]" />
                Shipping Details
              </h3>
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="First Name"
                    className="w-full px-4 py-3 text-sm bg-white border border-neutral-200 rounded-xl outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    className="w-full px-4 py-3 text-sm bg-white border border-neutral-200 rounded-xl outline-none"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Address Line 1"
                  className="w-full px-4 py-3 text-sm bg-white border border-neutral-200 rounded-xl outline-none"
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="City"
                    className="w-full px-4 py-3 text-sm bg-white border border-neutral-200 rounded-xl outline-none"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    className="w-full px-4 py-3 text-sm bg-white border border-neutral-200 rounded-xl outline-none"
                  />
                  <input
                    type="text"
                    placeholder="PIN Code"
                    className="w-full px-4 py-3 text-sm bg-white border border-neutral-200 rounded-xl outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cart Summary Column */}
          <div className="lg:col-span-1">
            <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-100 sticky top-20">
              <h3 className="text-lg font-bold text-[#1C1C1C] mb-4 flex items-center gap-2">
                <ShoppingBag size={18} className="text-[#D71920]" />
                Order Summary
              </h3>
              <div className="border-t border-neutral-200/60 my-4 pt-4 flex flex-col gap-3">
                <div className="flex justify-between text-sm text-neutral-500">
                  <span>Subtotal</span>
                  <span>₹0</span>
                </div>
                <div className="flex justify-between text-sm text-neutral-500">
                  <span>Shipping</span>
                  <span className="text-green-600 font-semibold">FREE</span>
                </div>
                <div className="border-t border-neutral-200/60 my-2 pt-2 flex justify-between font-bold text-[#1C1C1C] text-base">
                  <span>Total</span>
                  <span>₹0</span>
                </div>
              </div>
              <button
                disabled
                className="w-full bg-neutral-300 text-neutral-500 py-3 rounded-xl font-semibold text-sm transition-colors mt-4 cursor-not-allowed flex items-center justify-center gap-2"
              >
                Place Order (Cart is Empty)
              </button>
              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-neutral-400">
                <ShieldCheck size={14} />
                <span>100% Safe & Secure Payments</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer footerColumns={footerColumns} socialLinks={socialLinks} />
    </div>
  );
}
