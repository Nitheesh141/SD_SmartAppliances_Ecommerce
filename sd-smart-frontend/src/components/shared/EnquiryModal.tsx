"use client";

import React, { useEffect, useState } from "react";
import { X, Phone, Mail, MessageSquare } from "lucide-react";

interface EnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EnquiryModal({ isOpen, onClose }: EnquiryModalProps) {
  const [settings, setSettings] = useState({
    seller_phone: "+91 80 4455 6677",
    seller_email: "billing@sdsmartappliances.com"
  });

  // Handle escape key press to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Fetch settings dynamically from the existing billing seller configurations
  useEffect(() => {
    if (isOpen) {
      const fetchSettings = async () => {
        try {
          const token = localStorage.getItem("authToken");
          const headers: any = {};
          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
          }
          const res = await fetch("http://localhost:5000/api/settings", { headers });
          const data = await res.json();
          if (data.success && data.settings) {
            setSettings({
              seller_phone: data.settings.seller_phone || "+91 80 4455 6677",
              seller_email: data.settings.seller_email || "billing@sdsmartappliances.com"
            });
          }
        } catch (err) {
          console.error("Failed to fetch settings in EnquiryModal:", err);
        }
      };
      fetchSettings();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur and transition */}
      <div
        className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 text-left align-middle shadow-2xl transition-all duration-300 border border-neutral-100 dark:border-slate-800 scale-100 animate-in fade-in-0 zoom-in-95">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:text-neutral-500 dark:hover:text-neutral-300 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-2xl text-[#D71920]">
            <MessageSquare size={24} />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-neutral-950 dark:text-white leading-tight">
              Enquiry for Price
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Bulk quotations and corporate queries
            </p>
          </div>
        </div>

        {/* Modal Content */}
        <div className="space-y-4">
          <p className="text-sm font-medium leading-relaxed text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-slate-900/50 p-4 rounded-xl border border-neutral-100 dark:border-slate-800">
            Please contact our sales team for distributor pricing and bulk order quotations.
          </p>

          <div className="space-y-3">
            {/* Sales Contact Number (from Seller Invoice Phone) */}
            {settings.seller_phone && (
              <a
                href={`tel:${settings.seller_phone}`}
                className="flex items-center gap-4 p-4 rounded-xl border border-neutral-100 dark:border-slate-850 hover:bg-neutral-50 dark:hover:bg-slate-850 hover:border-neutral-200 dark:hover:border-slate-700 transition-all group"
              >
                <div className="w-10 h-10 bg-red-50 dark:bg-red-950/30 rounded-xl flex items-center justify-center text-[#D71920] shrink-0">
                  <Phone size={18} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Call Us
                  </h4>
                  <p className="text-sm font-extrabold text-neutral-950 dark:text-white mt-0.5 group-hover:text-[#D71920] transition-colors">
                    {settings.seller_phone}
                  </p>
                </div>
              </a>
            )}

            {/* Support Email (from Seller Invoice Email) */}
            {settings.seller_email && (
              <a
                href={`mailto:${settings.seller_email}`}
                className="flex items-center gap-4 p-4 rounded-xl border border-neutral-100 dark:border-slate-850 hover:bg-neutral-50 dark:hover:bg-slate-850 hover:border-neutral-200 dark:hover:border-slate-700 transition-all group"
              >
                <div className="w-10 h-10 bg-red-50 dark:bg-red-950/30 rounded-xl flex items-center justify-center text-[#D71920] shrink-0">
                  <Mail size={18} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Email Us
                  </h4>
                  <p className="text-sm font-extrabold text-neutral-950 dark:text-white mt-0.5 group-hover:text-[#D71920] transition-colors">
                    {settings.seller_email}
                  </p>
                </div>
              </a>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center py-3 bg-[#D71920] hover:bg-[#b8141a] text-white text-sm font-semibold rounded-xl transition-colors duration-200 cursor-pointer"
          >
            Okay
          </button>
        </div>
      </div>
    </div>
  );
}
