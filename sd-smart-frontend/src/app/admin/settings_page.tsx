"use client";
import { ENV } from "@/config/env";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";
import { Loader2, Settings, UploadCloud, Shield, HelpCircle, Save, Check } from "lucide-react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { cn } from "@/lib/utils";

interface SellerSettings {
  seller_name: string;
  seller_address_line1: string;
  seller_address_line2: string;
  seller_gstin: string;
  seller_email: string;
  seller_phone: string;
  seller_signature: string;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("admin-theme") as "light" | "dark") || "dark";
    }
    return "dark";
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [settings, setSettings] = useState<SellerSettings>({
    seller_name: "",
    seller_address_line1: "",
    seller_address_line2: "",
    seller_gstin: "",
    seller_email: "",
    seller_phone: "",
    seller_signature: ""
  });

  // Load theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("admin-theme") as "light" | "dark" || "dark";
    setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("admin-theme", nextTheme);
  };

  // Route protection
  useEffect(() => {
    if (!authLoading) {
      const role = user?.role?.toUpperCase();
      if (!isAuthenticated || !user || (role !== "ADMIN" && role !== "SUPERADMIN" && user.role !== "admin" && user.role !== "superadmin")) {
        toast.error("Access Denied. Admins only.");
        router.push("/auth/login");
      }
    }
  }, [isAuthenticated, user, authLoading, router]);

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;
        
        const res = await fetch(`${ENV.API_BASE_URL}/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings(data.settings);
        } else {
          toast.error(data.message || "Failed to load settings");
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
        toast.error("Failed to connect to backend server");
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchSettings();
    }
  }, [isAuthenticated]);

  const handleInputChange = (key: keyof SellerSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Upload signature handler
  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/upload`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.success && data.urls && data.urls[0]) {
        handleInputChange("seller_signature", data.urls[0]);
        toast.success("Signature uploaded successfully");
      } else {
        toast.error(data.message || "Upload failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload signature image");
    } finally {
      setUploading(false);
    }
  };

  // Save settings
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${ENV.API_BASE_URL}/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Invoice settings updated successfully");
      } else {
        toast.error(data.message || "Failed to save settings");
      }
    } catch (err) {
      console.error(err);
      toast.error("Connection request failed");
    } finally {
      setSaving(false);
    }
  };

  const isDark = theme === "dark";

  if (authLoading || loading) {
    return (
      <div className={cn(
        "min-h-screen flex flex-col items-center justify-center font-sans",
        isDark ? "bg-[#0d0d0d] text-white" : "bg-[#fafafa] text-slate-950"
      )}>
        <Loader2 className="w-10 h-10 text-[#D71920] animate-spin" />
        <p className="mt-4 text-sm font-semibold tracking-wider text-neutral-400">Loading Seller settings...</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen flex flex-col lg:flex-row font-sans transition-colors duration-300",
      isDark ? "bg-[#0d0d0d] text-white" : "bg-[#fafafa] text-slate-950"
    )}>
      {/* Sidebar */}
      <AdminSidebar currentPath="/admin/settings" theme={theme} toggleTheme={toggleTheme} />

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10 lg:ml-64 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                <Settings className="text-[#D71920]" size={32} />
                <span>Invoice Settings</span>
              </h1>
              <p className="text-sm text-neutral-400 mt-1">Manage dynamic seller tax records and authorized signature files</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 text-neutral-500 w-fit">
              <Shield size={14} className="text-[#D71920]" />
              <span>Super Admin Level Access</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-8">
            <div className={cn(
              "rounded-2xl border p-6 md:p-8 space-y-6 shadow-sm",
              isDark ? "bg-neutral-900/40 border-neutral-850" : "bg-white border-neutral-200"
            )}>
              <h2 className="text-lg font-bold border-b border-neutral-100 dark:border-neutral-800 pb-3 flex items-center gap-2">
                <span className="h-6 w-1 bg-[#D71920] rounded-full"></span>
                Seller Details (Sold By)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Name */}
                <div className="space-y-2 text-left">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Company Name</label>
                  <input
                    type="text"
                    required
                    value={settings.seller_name}
                    onChange={(e) => handleInputChange("seller_name", e.target.value)}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#D71920]",
                      isDark ? "bg-[#0d0d0d] border-neutral-800 text-white" : "bg-[#fafafa] border-neutral-200 text-slate-950"
                    )}
                    placeholder="e.g. SD Smart Appliances Pvt. Ltd."
                  />
                </div>

                {/* GSTIN */}
                <div className="space-y-2 text-left">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">GSTIN Number</label>
                  <input
                    type="text"
                    required
                    value={settings.seller_gstin}
                    onChange={(e) => handleInputChange("seller_gstin", e.target.value)}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#D71920] font-mono",
                      isDark ? "bg-[#0d0d0d] border-neutral-800 text-white" : "bg-[#fafafa] border-neutral-200 text-slate-950"
                    )}
                    placeholder="e.g. 29AAAAA1111A1Z1"
                  />
                </div>

                {/* Address Line 1 */}
                <div className="space-y-2 text-left">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Address Line 1</label>
                  <input
                    type="text"
                    required
                    value={settings.seller_address_line1}
                    onChange={(e) => handleInputChange("seller_address_line1", e.target.value)}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#D71920]",
                      isDark ? "bg-[#0d0d0d] border-neutral-800 text-white" : "bg-[#fafafa] border-neutral-200 text-slate-950"
                    )}
                    placeholder="e.g. Plot No. 42, B2B Industrial Area"
                  />
                </div>

                {/* Address Line 2 */}
                <div className="space-y-2 text-left">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Address Line 2</label>
                  <input
                    type="text"
                    required
                    value={settings.seller_address_line2}
                    onChange={(e) => handleInputChange("seller_address_line2", e.target.value)}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#D71920]",
                      isDark ? "bg-[#0d0d0d] border-neutral-800 text-white" : "bg-[#fafafa] border-neutral-200 text-slate-950"
                    )}
                    placeholder="e.g. Phase II, Bangalore, Karnataka - 560001"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-2 text-left">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Billing Support Email</label>
                  <input
                    type="email"
                    required
                    value={settings.seller_email}
                    onChange={(e) => handleInputChange("seller_email", e.target.value)}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#D71920]",
                      isDark ? "bg-[#0d0d0d] border-neutral-800 text-white" : "bg-[#fafafa] border-neutral-200 text-slate-950"
                    )}
                    placeholder="e.g. billing@sdsmartappliances.com"
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-2 text-left">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Billing Support Phone</label>
                  <input
                    type="text"
                    required
                    value={settings.seller_phone}
                    onChange={(e) => handleInputChange("seller_phone", e.target.value)}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#D71920]",
                      isDark ? "bg-[#0d0d0d] border-neutral-800 text-white" : "bg-[#fafafa] border-neutral-200 text-slate-950"
                    )}
                    placeholder="e.g. +91 80 4455 6677"
                  />
                </div>
              </div>
            </div>

            {/* Signature Upload Panel */}
            <div className={cn(
              "rounded-2xl border p-6 md:p-8 space-y-6 shadow-sm",
              isDark ? "bg-neutral-900/40 border-neutral-850" : "bg-white border-neutral-200"
            )}>
              <h2 className="text-lg font-bold border-b border-neutral-100 dark:border-neutral-800 pb-3 flex items-center gap-2">
                <span className="h-6 w-1 bg-[#D71920] rounded-full"></span>
                Authorized Signature Upload
              </h2>

              <div className="flex flex-col md:flex-row gap-8 items-center">
                {/* Image upload box */}
                <div className="w-full md:w-1/2 space-y-4">
                  <div className={cn(
                    "border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer relative hover:border-[#D71920]/50",
                    isDark ? "border-neutral-800 bg-[#0d0d0d]" : "border-neutral-200 bg-[#fafafa]"
                  )}>
                    <input
                      type="file"
                      accept="image/*"
                      id="sig-file"
                      onChange={handleSignatureUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={uploading}
                    />
                    <UploadCloud className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
                    <p className="text-sm font-bold">
                      {uploading ? "Uploading signature..." : "Click to upload signature image"}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">PNG or JPEG format with a clear/white background</p>
                  </div>
                </div>

                {/* Preview Box */}
                <div className="w-full md:w-1/2 space-y-2 text-left">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Preview on Invoices</label>
                  <div className={cn(
                    "border rounded-2xl p-6 h-[140px] flex flex-col items-center justify-center bg-white",
                    isDark ? "border-neutral-850" : "border-neutral-200"
                  )}>
                    {settings.seller_signature ? (
                      <div className="space-y-2 text-center">
                        <img
                          src={settings.seller_signature}
                          alt="Authorized Signature"
                          className="h-14 object-contain max-w-[240px] mx-auto filter mix-blend-multiply"
                        />
                        <span className="text-[10px] font-bold text-green-600 block flex items-center gap-1 justify-center">
                          <Check size={12} /> Active Signature Applied
                        </span>
                      </div>
                    ) : (
                      <div className="text-center space-y-1">
                        <p className="text-xs italic text-neutral-400">No signature image uploaded</p>
                        <p className="text-[10px] text-neutral-500">Will default to textual fallback: "{settings.seller_name || "SD Smart Appliances"}"</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-[#D71920] hover:bg-[#B91520] disabled:bg-neutral-600 disabled:cursor-not-allowed text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-red-500/25 transition-all text-sm cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Invoice Configurations
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      </main>
    </div>
  );
}
