"use client";
import { ENV } from "@/config/env";
import React, { useEffect, useState } from "react";
import { X, Phone, Mail, MessageSquare, Loader2 } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";

interface EnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: string;
  productName?: string;
}

export default function EnquiryModal({ isOpen, onClose, productId, productName }: EnquiryModalProps) {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    seller_phone: "+91 80 4455 6677",
    seller_email: "billing@sdsmartappliances.com"
  });

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isDistributor = user && (user.role?.toUpperCase() === "DISTRIBUTOR" || user.role === "distributor");

  // Prepopulate form if user is authenticated
  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || `${user.firstName} ${user.lastName}` || "");
      setEmail(user.email || "");
      setPhone(user.phoneNumber || "");
      if (isDistributor) {
        setMessage(`I would like to enquire about pricing and distributor discounts for ${productName || "this product"}.`);
      } else {
        setMessage("I would like to enquire about pricing and distributor discounts for your products.");
      }
    } else if (isOpen) {
      setName("");
      setEmail("");
      setPhone("");
      setMessage("I would like to enquire about pricing for bulk appliances.");
    }
    setQuantity(1);
    setSubmitted(false);
  }, [isOpen, user, isDistributor, productName]);

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

  // Fetch settings dynamically
  useEffect(() => {
    if (isOpen) {
      const fetchSettings = async () => {
        try {
          const token = localStorage.getItem("authToken");
          const headers: any = {};
          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
          }
          const res = await fetch(`${ENV.API_BASE_URL}/settings`, { headers });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem("authToken");
      const headers: any = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      let url = `${ENV.API_BASE_URL}/sales-persons/public/enquiry`;
      let body: any = {
        name,
        email,
        phone,
        message,
        userId: user?.id || undefined
      };

      if (isDistributor && productId) {
        url = `${ENV.API_BASE_URL}/distributor-enquiries/create`;
        body = {
          productId,
          quantity,
          message
        };
      }

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        toast.success("Price enquiry submitted successfully!");
      } else {
        toast.error(data.message || "Failed to submit enquiry");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while submitting your enquiry.");
    } finally {
      setSubmitting(false);
    }
  };

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
          className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:text-neutral-500 dark:hover:text-neutral-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
              {isDistributor ? "Distributor bulk quotation request" : "Bulk quotations and corporate queries"}
            </p>
          </div>
        </div>

        {/* Modal Content */}
        {submitted ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-12 h-12 bg-green-50 dark:bg-green-950/20 rounded-full flex items-center justify-center mx-auto text-green-600 dark:text-green-400">
              <MessageSquare size={20} />
            </div>
            <h4 className="font-extrabold text-sm dark:text-white uppercase">Enquiry Sent!</h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xs mx-auto">
              Thank you for submitting your enquiry. A sales representative has been assigned to your request and will contact you shortly.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 bg-[#D71920] hover:bg-[#b8141a] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {isDistributor ? (
              // Distributor Specific Short Form
              <>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Product</label>
                  <div className="w-full px-3.5 py-2 text-xs bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 rounded-xl text-neutral-600 dark:text-neutral-300 font-semibold select-none font-sans">
                    {productName || "Product Name"}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Quantity Required *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2 text-xs bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 rounded-xl outline-none focus:border-[#D71920] dark:text-white"
                    placeholder="Enter quantity"
                  />
                </div>
              </>
            ) : (
              // Public Standard Form
              <>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 rounded-xl outline-none focus:border-[#D71920] dark:text-white"
                    placeholder="Enter your name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 rounded-xl outline-none focus:border-[#D71920] dark:text-white"
                      placeholder="name@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Mobile *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 rounded-xl outline-none focus:border-[#D71920] dark:text-white"
                      placeholder="Phone number"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Your Message *</label>
              <textarea
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 rounded-xl outline-none focus:border-[#D71920] dark:text-white resize-none"
                placeholder="Describe your pricing request..."
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 border border-neutral-200 dark:border-slate-850 text-neutral-600 dark:text-neutral-400 text-xs font-bold rounded-xl hover:bg-neutral-50 dark:hover:bg-slate-850 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#D71920] hover:bg-[#b8141a] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-55"
              >
                {submitting && <Loader2 size={13} className="animate-spin" />}
                <span>Submit Enquiry</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
