"use client";
import { ENV } from "@/config/env";

import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
// import { announcements } from "../LandingPage/data/announcements";
import { navLinks, footerColumns, socialLinks } from "../LandingPage/data/navigation";
import { Phone, Mail, MapPin, Send } from "lucide-react";
import { useState, useEffect } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    phone: "+91 80000 00000",
    email: "support@sdsmart.in"
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${ENV.API_BASE_URL}/settings`);
        const data = await res.json();
        if (data.success && data.settings) {
          setContactInfo({
            phone: data.settings.seller_phone || "+91 80000 00000",
            email: data.settings.seller_email || "support@sdsmart.in"
          });
        }
      } catch (err) {
        console.warn("Failed to fetch settings in contact page:", err);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 font-sans">
      {/* <AnnouncementBar announcements={announcements} /> */}
      <Header navLinks={navLinks} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-left">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Info Column */}
          <div>
            <p className="text-xs font-bold text-[#D71920] uppercase tracking-widest mb-2">Get In Touch</p>
            <h1 className="text-4xl font-black text-[#1C1C1C] leading-tight mb-6">
              Contact SD SMART
            </h1>
            <p className="text-neutral-500 leading-relaxed mb-8 max-w-md">
              Have questions about our products, warranty, or need assistance? Reach out to our customer care or visit our headquarters.
            </p>

            <div className="flex flex-col gap-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0 text-[#D71920]">
                  <Phone size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#1C1C1C]">Call Us</h4>
                  <p className="text-sm text-neutral-500 mt-0.5">{contactInfo.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0 text-[#D71920]">
                  <Mail size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#1C1C1C]">Email Us</h4>
                  <p className="text-sm text-neutral-500 mt-0.5">{contactInfo.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0 text-[#D71920]">
                  <MapPin size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#1C1C1C]">Visit Us</h4>
                  <p className="text-sm text-neutral-500 mt-0.5 leading-relaxed">
                    SD SMART Appliances Pvt. Ltd., Industrial Area, Coimbatore, Tamil Nadu – 641 001
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div className="bg-neutral-50 rounded-2xl p-8 border border-neutral-100">
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                  <Send size={20} />
                </div>
                <h3 className="text-lg font-bold text-[#1C1C1C]">Message Sent!</h3>
                <p className="text-sm text-neutral-500 mt-2">Thank you for reaching out. We will get back to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                  <label className="block text-xs font-bold text-neutral-600 uppercase mb-2">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 text-sm bg-white border border-neutral-200 rounded-xl outline-none focus:border-[#D71920]"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-600 uppercase mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 text-sm bg-white border border-neutral-200 rounded-xl outline-none focus:border-[#D71920]"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-600 uppercase mb-2">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 text-sm bg-white border border-neutral-200 rounded-xl outline-none focus:border-[#D71920] resize-none"
                    placeholder="Describe your query..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#D71920] hover:bg-[#b8141a] text-white py-3 rounded-xl font-semibold text-sm transition-colors mt-2 cursor-pointer"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer footerColumns={footerColumns} socialLinks={socialLinks} />
    </div>
  );
}
