"use client";
import { ENV } from "@/config/env";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";
import {
  ShieldCheck, UploadCloud, Trash2, Loader2, ArrowLeft,
  Calendar, Check, AlertCircle, FileText, ImageIcon
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { navLinks, footerColumns, socialLinks } from "../LandingPage/data/navigation";
import { warrantyService } from "@/services/warrantyService";
import { productService } from "@/services/productService";
import { cn } from "@/lib/utils";

// Category drop-down options mapping
const PRODUCT_CATEGORIES = [
  { id: "pressure-cookers", label: "Pressure Cooker" },
  { id: "wet-grinders", label: "Wet Grinder" },
  { id: "gas-stoves", label: "Gas Stove" },
  { id: "other", label: "Other" }
];

interface UploadedFile {
  fileUrl: string;
  fileType: "PURCHASE_INVOICE" | "WARRANTY_CARD" | "PRODUCT_IMAGE";
  fileName: string;
}

export default function WarrantyRegistrationPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  // General States
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<any | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Available Products fetched from backend
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);

  // Form Fields
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAltPhone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    productCategory: "pressure-cookers",
    productName: "",
    modelNumber: "",
    serialNumber: "",
    skuCode: "",
    productCapacity: "",
    purchaseDate: "",
    invoiceNumber: "",
    dealerName: "",
    placeOfPurchase: ""
  });

  const [attachments, setAttachments] = useState<UploadedFile[]>([]);

  // Pre-fill logged-in user data and fetch address/products
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData((prev) => ({
        ...prev,
        customerName: `${user.firstName} ${user.lastName}`.trim(),
        customerEmail: user.email || "",
        customerPhone: user.phoneNumber || ""
      }));

      // Fetch user default address from backend
      const fetchUserAddress = async () => {
        try {
          const token = localStorage.getItem("authToken");
          if (token) {
            const res = await fetch(`${ENV.API_BASE_URL}/addresses`, {
              headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
              const data = await res.json();
              if (data.success && Array.isArray(data.addresses) && data.addresses.length > 0) {
                const defaultAddr = data.addresses.find((a: any) => a.isDefault) || data.addresses[0];
                setFormData((prev) => ({
                  ...prev,
                  addressLine1: defaultAddr.addressLine1 || "",
                  addressLine2: defaultAddr.addressLine2 || "",
                  city: defaultAddr.city || "",
                  state: defaultAddr.state || "",
                  pincode: defaultAddr.pincode || ""
                }));
              }
            }
          }
        } catch (err) {
          console.error("Failed to load user address in warranty registration:", err);
        }
      };
      fetchUserAddress();
    }
  }, [isAuthenticated, user]);

  // Fetch product listings on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await productService.getProducts();
        if (res.success && res.data?.products) {
          setAvailableProducts(res.data.products);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
      }
    };
    fetchProducts();
  }, []);

  // Expiry Calculations
  const [warrantyStartDate, setWarrantyStartDate] = useState<string>("");
  const [warrantyExpiryDate, setWarrantyExpiryDate] = useState<string>("");

  useEffect(() => {
    if (formData.purchaseDate) {
      const date = new Date(formData.purchaseDate);
      if (!isNaN(date.getTime())) {
        const startFormatted = date.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        });
        setWarrantyStartDate(startFormatted);

        const expiry = new Date(date);
        expiry.setFullYear(expiry.getFullYear() + 5);
        const expiryFormatted = expiry.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        });
        setWarrantyExpiryDate(expiryFormatted);
      }
    } else {
      setWarrantyStartDate("");
      setWarrantyExpiryDate("");
    }
  }, [formData.purchaseDate]);

  // Upload file handler
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "PURCHASE_INVOICE" | "WARRANTY_CARD" | "PRODUCT_IMAGE"
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB limit
    if (file.size > maxSizeBytes) {
      toast.error("File size exceeds 5MB limit.");
      return;
    }

    setUploading(true);
    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      const response = await fetch(`${ENV.API_BASE_URL}/upload`, {
        method: "POST",
        body: uploadData
      });

      const result = await response.json();
      if (result.success && result.urls && result.urls.length > 0) {
        const fileUrl = result.urls[0];
        const newAttachment: UploadedFile = {
          fileUrl,
          fileType: type,
          fileName: file.name
        };

        // Remove old attachment of the same type if it is a single-upload type
        setAttachments((prev) => {
          const filtered = prev.filter((att) => att.fileType !== type);
          return [...filtered, newAttachment];
        });

        toast.success(`${type.replace("_", " ")} uploaded successfully.`);
      } else {
        throw new Error(result.message || "Upload response failed");
      }
    } catch (error: any) {
      console.error("File upload failed:", error);
      toast.error(error.message || "Failed to upload file.");
    } finally {
      setUploading(false);
    }
  };

  // Remove file handler
  const handleRemoveFile = (type: "PURCHASE_INVOICE" | "WARRANTY_CARD" | "PRODUCT_IMAGE") => {
    setAttachments((prev) => prev.filter((att) => att.fileType !== type));
    toast.info("Attachment removed.");
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verify uploads
    const hasInvoice = attachments.some((att) => att.fileType === "PURCHASE_INVOICE");
    const hasWarrantyCard = attachments.some((att) => att.fileType === "WARRANTY_CARD");

    if (!hasInvoice || !hasWarrantyCard) {
      toast.error("Please upload both the Purchase Invoice and the Warranty Card.");
      return;
    }

    if (!termsAccepted) {
      toast.error("Please agree to the warranty terms.");
      return;
    }

    setSubmitting(true);

    try {
      const categoryLabel = PRODUCT_CATEGORIES.find(
        (c) => c.id === formData.productCategory
      )?.label || "Appliance";

      // Autogenerate unique serial number and default model details
      const uniqueSerial = `SN-AUTO-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const submitData = {
        ...formData,
        productCategory: categoryLabel,
        serialNumber: uniqueSerial,
        modelNumber: formData.modelNumber || "AUTO",
        skuCode: formData.skuCode || "",
        attachments
      };

      const res = await warrantyService.createWarrantyRegistration(submitData);

      if (res.success) {
        setRegistrationSuccess(res.data);
        toast.success("Warranty registration completed successfully!");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        toast.error(res.message || "Failed to register warranty");
      }
    } catch (error: any) {
      console.error("Submission failed:", error);
      toast.error(error.message || "Error submitting warranty registration");
    } finally {
      setSubmitting(false);
    }
  };

  const getAttachmentName = (type: "PURCHASE_INVOICE" | "WARRANTY_CARD" | "PRODUCT_IMAGE") => {
    return attachments.find((att) => att.fileType === type)?.fileName || "";
  };

  const filteredProducts = availableProducts.filter(
    (p) => p.category === formData.productCategory
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans">
      <Header navLinks={navLinks} />

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 py-12 text-left">
        {/* Page Header */}
        <div className="mb-10 text-center md:text-left">
          <span className="inline-flex items-center px-3 py-1 text-xs font-semibold tracking-wider text-red-800 bg-red-100 rounded-full mb-3 uppercase dark:bg-red-950/40 dark:text-red-300">
            SUPPORT
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-100 leading-tight mb-3">
            Warranty Registration
          </h1>
          <p className="text-sm md:text-base text-slate-500 max-w-2xl leading-relaxed dark:text-slate-400">
            Register your newly purchased SD SMART appliance to activate and track your warranty online. Please keep your purchase invoice and warranty card ready.
          </p>
        </div>

        {registrationSuccess ? (
          /* SUCCESS FLOW BLOCK */
          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-8 md:p-12 shadow-xl animate-in fade-in zoom-in-95 duration-300 text-center max-w-2xl mx-auto dark:bg-slate-900/60 dark:border-slate-800">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 dark:bg-green-950/30 dark:text-green-400 animate-bounce">
              <Check className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2 dark:text-slate-100">
              Warranty Registered Successfully
            </h2>
            <p className="text-sm text-slate-500 mb-8 dark:text-slate-400">
              Your warranty has been activated and linked to your appliance.
            </p>

            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 text-left mb-8 dark:bg-slate-950/40 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Registration Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b pb-2.5 border-slate-200/50 dark:border-slate-800">
                  <span className="text-slate-400">Registration ID:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{registrationSuccess.registrationId}</span>
                </div>
                <div className="flex justify-between border-b pb-2.5 border-slate-200/50 dark:border-slate-800">
                  <span className="text-slate-400">Product Name:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{registrationSuccess.productName}</span>
                </div>
                <div className="flex justify-between border-b pb-2.5 border-slate-200/50 dark:border-slate-800">
                  <span className="text-slate-400">Start Date:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {new Date(registrationSuccess.warrantyStartDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Expiry Date:</span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    {new Date(registrationSuccess.warrantyExpiryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/support"
                className="px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-sm transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-850"
              >
                Go to Help Center
              </Link>
              <Link
                href="/service-request"
                className="px-6 py-3 bg-[#D71920] hover:bg-[#b8141a] text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-[#D71920]/20"
              >
                Raise Service Request
              </Link>
            </div>
          </div>
        ) : (
          /* INPUT FORM WORKFLOW */
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Card 1: Customer Info */}
            <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 sm:p-8 shadow-sm dark:bg-slate-900/40 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 border-b pb-3 dark:text-slate-100 dark:border-slate-800 font-heading">
                Customer Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#D71920] dark:bg-slate-950/40 dark:border-slate-800 dark:text-slate-100"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#D71920] dark:bg-slate-950/40 dark:border-slate-800 dark:text-slate-100"
                    placeholder="name@email.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#D71920] dark:bg-slate-950/40 dark:border-slate-800 dark:text-slate-100"
                    placeholder="10-digit mobile number"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Alternate Contact (Optional)</label>
                  <input
                    type="tel"
                    value={formData.customerAltPhone}
                    onChange={(e) => setFormData({ ...formData, customerAltPhone: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#D71920] dark:bg-slate-950/40 dark:border-slate-800 dark:text-slate-100"
                    placeholder="Backup contact number"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Address Line 1 *</label>
                  <input
                    type="text"
                    required
                    value={formData.addressLine1}
                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#D71920] dark:bg-slate-950/40 dark:border-slate-800 dark:text-slate-100"
                    placeholder="Door No, Street Name, Locality"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Address Line 2 (Optional)</label>
                  <input
                    type="text"
                    value={formData.addressLine2}
                    onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#D71920] dark:bg-slate-950/40 dark:border-slate-800 dark:text-slate-100"
                    placeholder="Apartment, Suite, Unit, etc."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#D71920] dark:bg-slate-950/40 dark:border-slate-800 dark:text-slate-100"
                    placeholder="Enter city"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">State *</label>
                    <input
                      type="text"
                      required
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#D71920] dark:bg-slate-950/40 dark:border-slate-800 dark:text-slate-100"
                      placeholder="e.g. Tamil Nadu"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Pincode *</label>
                    <input
                      type="text"
                      required
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#D71920] dark:bg-slate-950/40 dark:border-slate-800 dark:text-slate-100"
                      placeholder="600001"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Product Info */}
            <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 sm:p-8 shadow-sm dark:bg-slate-900/40 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 border-b pb-3 dark:text-slate-100 dark:border-slate-800 font-heading">
                Product Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Product Category *</label>
                  <select
                    value={formData.productCategory}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        productCategory: e.target.value,
                        productName: "",
                        skuCode: "",
                        modelNumber: "AUTO",
                        productCapacity: ""
                      });
                    }}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#D71920] dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 cursor-pointer font-medium"
                  >
                    {PRODUCT_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Product Name *</label>
                  <select
                    required
                    value={formData.productName}
                    onChange={(e) => {
                      const name = e.target.value;
                      const matched = filteredProducts.find(p => p.name === name);
                      
                      // Auto-extract capacity from specs if present
                      let extractedCapacity = "";
                      if (matched?.specs && Array.isArray(matched.specs)) {
                        const capSpec = matched.specs.find((s: any) => s.label?.toLowerCase() === "capacity");
                        if (capSpec) extractedCapacity = capSpec.value;
                      }
                      if (!extractedCapacity && matched?.variantDetails) {
                        try {
                          const details = typeof matched.variantDetails === 'string' ? JSON.parse(matched.variantDetails) : matched.variantDetails;
                          if (Array.isArray(details) && details.length > 0) {
                            extractedCapacity = details[0].capacity || "";
                          }
                        } catch (err) {}
                      }

                      setFormData({
                        ...formData,
                        productName: name,
                        skuCode: matched?.sku || "",
                        modelNumber: matched?.modelNumber || "AUTO",
                        productCapacity: extractedCapacity || formData.productCapacity
                      });
                    }}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#D71920] dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 cursor-pointer font-medium"
                  >
                    <option value="">Select a Product</option>
                    {filteredProducts.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                    {filteredProducts.length === 0 && (
                      <option value="Other Appliance">Other Appliance</option>
                    )}
                  </select>
              </div>
            </div>
          </div>

            {/* Card 3: Purchase Info */}
            <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 sm:p-8 shadow-sm dark:bg-slate-900/40 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 border-b pb-3 dark:text-slate-100 dark:border-slate-800 font-heading">
                Purchase Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Purchase Date *</label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      max={new Date().toISOString().split("T")[0]}
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#D71920] dark:bg-slate-950/40 dark:border-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Invoice Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#D71920] dark:bg-slate-950/40 dark:border-slate-800 dark:text-slate-100"
                    placeholder="e.g. INV-2026-902"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Dealer / Distributor Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.dealerName}
                    onChange={(e) => setFormData({ ...formData, dealerName: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#D71920] dark:bg-slate-950/40 dark:border-slate-800 dark:text-slate-100"
                    placeholder="Enter vendor store name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Place of Purchase *</label>
                  <input
                    type="text"
                    required
                    value={formData.placeOfPurchase}
                    onChange={(e) => setFormData({ ...formData, placeOfPurchase: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#D71920] dark:bg-slate-950/40 dark:border-slate-800 dark:text-slate-100"
                    placeholder="e.g. Chennai, Online, etc."
                  />
                </div>
              </div>

              {/* Warranty Auto-Calculated Details Card */}
              {warrantyStartDate && (
                <div className="bg-red-50/50 border border-red-100 rounded-2xl p-5 dark:bg-red-950/10 dark:border-red-900/30">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-red-800 mb-3 dark:text-red-400 flex items-center gap-1.5">
                    <ShieldCheck size={14} /> Auto-Calculated Warranty Status
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <p className="text-slate-400 mb-1">Start Date</p>
                      <p className="font-bold text-slate-900 dark:text-slate-100">{warrantyStartDate}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 mb-1">Expiry Date</p>
                      <p className="font-bold text-slate-900 dark:text-slate-100">{warrantyExpiryDate}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 mb-1">Warranty Duration</p>
                      <p className="font-bold text-red-600 dark:text-red-400">5 Years (Standard)</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Card 4: Document Uploads */}
            <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 sm:p-8 shadow-sm dark:bg-slate-900/40 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 border-b pb-3 dark:text-slate-100 dark:border-slate-800 font-heading">
                Required Documents
              </h2>

              <div className="space-y-6">
                {/* Upload Item 1: Purchase Invoice */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Purchase Invoice * (JPG, PNG, PDF)</label>
                  {getAttachmentName("PURCHASE_INVOICE") ? (
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-4 dark:bg-slate-950/40 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-red-500" />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs sm:max-w-md">
                          {getAttachmentName("PURCHASE_INVOICE")}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile("PURCHASE_INVOICE")}
                        className="p-1 text-slate-400 hover:text-red-500 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative group border-2 border-dashed border-slate-200 hover:border-[#D71920] rounded-2xl p-6 transition-all bg-slate-50/50 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-red-900/40 dark:bg-slate-950/20 dark:hover:bg-slate-950/40">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileUpload(e, "PURCHASE_INVOICE")}
                        disabled={uploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="text-center">
                        <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-[#D71920] mx-auto mb-2 transition-colors" />
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {uploading ? "Uploading..." : "Click or drag to upload Purchase Invoice"}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">Maximum file size: 5MB</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload Item 2: Warranty Card */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Warranty Card * (JPG, PNG, PDF)</label>
                  {getAttachmentName("WARRANTY_CARD") ? (
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-4 dark:bg-slate-950/40 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-red-500" />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs sm:max-w-md">
                          {getAttachmentName("WARRANTY_CARD")}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile("WARRANTY_CARD")}
                        className="p-1 text-slate-400 hover:text-red-500 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative group border-2 border-dashed border-slate-200 hover:border-[#D71920] rounded-2xl p-6 transition-all bg-slate-50/50 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-red-900/40 dark:bg-slate-950/20 dark:hover:bg-slate-950/40">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileUpload(e, "WARRANTY_CARD")}
                        disabled={uploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="text-center">
                        <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-[#D71920] mx-auto mb-2 transition-colors" />
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {uploading ? "Uploading..." : "Click or drag to upload Warranty Card"}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">Maximum file size: 5MB</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload Item 3: Product Image (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Product Image (Optional)</label>
                  {getAttachmentName("PRODUCT_IMAGE") ? (
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-4 dark:bg-slate-950/40 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-emerald-500" />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs sm:max-w-md">
                          {getAttachmentName("PRODUCT_IMAGE")}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile("PRODUCT_IMAGE")}
                        className="p-1 text-slate-400 hover:text-red-500 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative group border-2 border-dashed border-slate-200 hover:border-[#D71920] rounded-2xl p-6 transition-all bg-slate-50/50 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-red-900/40 dark:bg-slate-950/20 dark:hover:bg-slate-950/40">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "PRODUCT_IMAGE")}
                        disabled={uploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="text-center">
                        <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-[#D71920] mx-auto mb-2 transition-colors" />
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {uploading ? "Uploading..." : "Click or drag to upload Product Photo"}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">Maximum file size: 5MB</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Terms and Submission */}
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer text-left select-none group">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 accent-[#D71920] w-4 h-4 cursor-pointer"
                />
                <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-semibold group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                  I confirm that all information provided is accurate and I agree to the warranty terms and conditions.
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting || uploading || !termsAccepted}
                className="w-full py-4 bg-[#D71920] hover:bg-[#b8141a] text-white font-extrabold rounded-xl transition-all shadow-lg hover:shadow-xl shadow-[#D71920]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registering Warranty...
                  </>
                ) : (
                  "Register Warranty"
                )}
              </button>
            </div>
          </form>
        )}
      </main>

      <Footer footerColumns={footerColumns} socialLinks={socialLinks} />
    </div>
  );
}
