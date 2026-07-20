"use client";
import { ENV } from "@/config/env";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";
import {
  Plus, Edit2, Trash2, Package, Loader2, RefreshCw, Search,
  ChevronLeft, ChevronRight, X, Sparkles, Check, AlertCircle, IndianRupee, Eye
} from "lucide-react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { cn } from "@/lib/utils";

interface ProductType {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  image: string;
  modelNumber: string | null;
  sku: string | null;
  productId: string | null;
  price: number;
  itemCode?: string | null;
}

interface DistributorPricingType {
  id: string;
  productId: string;
  skuCode: string;
  basePrice: number;
  marginPercentage: number;
  marginAmount: number;
  netPrice: number;
  gstPercentage: number;
  gstAmount: number;
  dealerPrice: number;
  mrp: number;
  packageQuantity: string;
  scheme: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  product: {
    name: string;
    category: string;
    categoryLabel: string;
    image: string;
    modelNumber: string | null;
    sku: string | null;
    itemCode?: string | null;
  };
}

export default function AdminDistributorPricingPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // Core Pricing data state
  const [pricings, setPricings] = useState<DistributorPricingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  // Filter and search
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Product master catalog for creation dropdown
  const [allProducts, setAllProducts] = useState<ProductType[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedPricingId, setSelectedPricingId] = useState<string | null>(null);

  // Form State
  const [formProductId, setFormProductId] = useState("");
  const [selectedProductDetails, setSelectedProductDetails] = useState<ProductType | null>(null);
  const [formBasePrice, setFormBasePrice] = useState("");
  const [formMarginPercentage, setFormMarginPercentage] = useState("");
  const [formGstPercentage, setFormGstPercentage] = useState("");
  const [formMrp, setFormMrp] = useState("");
  const [formPackageQuantity, setFormPackageQuantity] = useState("");
  const [formScheme, setFormScheme] = useState("");
  const [formStatus, setFormStatus] = useState("ACTIVE");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);
  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // reset to page 1 on new search
    }, 450);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load theme from localStorage on client side mount
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("admin-theme") as "light" | "dark" || "dark";
    setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("admin-theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Route protection
  useEffect(() => {
    if (!authLoading) {
      const role = user?.role?.toUpperCase();
      if (!isAuthenticated || !user || (role !== "ADMIN" && role !== "SUPERADMIN" && user.role !== "admin" && user.role !== "superadmin")) {
        toast.error("Access Denied. Admins only.");
        router.push("/auth/login");
      } else {
        fetchPricings();
        fetchCatalogProducts();
      }
    }
  }, [isAuthenticated, user, authLoading, router, page, debouncedSearch]);

  // Fetch Distributor Pricing list
  const fetchPricings = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    const token = localStorage.getItem("authToken");
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: debouncedSearch,
      });

      const response = await fetch(`${ENV.API_BASE_URL}/distributor-pricing?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to load distributor pricing");
      const data = await response.json();
      if (data.success) {
        setPricings(data.pricings || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error: any) {
      console.error(error);
      if (!isBackground) toast.error(error.message || "Failed to fetch distributor pricing");
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // Fetch Product Catalog (for selection dropdown)
  const fetchCatalogProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await fetch(`${ENV.API_BASE_URL}/products`);
      if (!response.ok) throw new Error("Failed to load catalog products");
      const data = await response.json();
      setAllProducts(data.products || []);
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to load product catalog for dropdown");
    } finally {
      setLoadingProducts(false);
    }
  };

  // Handle select product dropdown change
  const handleProductSelectChange = (productId: string) => {
    setFormProductId(productId);
    const foundProduct = allProducts.find(p => p.id === productId) || null;
    setSelectedProductDetails(foundProduct);
  };

  // Live Pricing calculations
  const calculations = useMemo(() => {
    const base = parseFloat(formBasePrice) || 0;
    const marginPercent = parseFloat(formMarginPercentage) || 0;
    const gstPercent = parseFloat(formGstPercentage) || 0;

    const marginAmount = Math.round(base * (marginPercent / 100) * 100) / 100;
    const netPrice = Math.round((base + marginAmount) * 100) / 100;
    const gstAmount = Math.round(netPrice * (gstPercent / 100) * 100) / 100;
    const dealerPrice = Math.round((netPrice + gstAmount) * 100) / 100;

    return {
      marginAmount,
      netPrice,
      gstAmount,
      dealerPrice,
    };
  }, [formBasePrice, formMarginPercentage, formGstPercentage]);

  // Open Create Modal
  const openCreateModal = () => {
    setModalMode("create");
    setSelectedPricingId(null);
    setFormProductId("");
    setSelectedProductDetails(null);
    setFormBasePrice("");
    setFormMarginPercentage("");
    setFormGstPercentage("");
    setFormMrp("");
    setFormPackageQuantity("");
    setFormScheme("");
    setFormStatus("ACTIVE");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (pricing: DistributorPricingType) => {
    setModalMode("edit");
    setSelectedPricingId(pricing.id);
    setFormProductId(pricing.productId);

    // Map matched product details
    const foundProduct = allProducts.find(p => p.id === pricing.productId) || {
      id: pricing.productId,
      name: pricing.product.name,
      category: pricing.product.category,
      categoryLabel: pricing.product.categoryLabel,
      image: pricing.product.image,
      modelNumber: pricing.product.modelNumber,
      sku: pricing.skuCode,
      productId: pricing.productId,
      price: pricing.basePrice
    } as ProductType;

    setSelectedProductDetails(foundProduct);
    setFormBasePrice(String(pricing.basePrice));
    setFormMarginPercentage(String(pricing.marginPercentage));
    setFormGstPercentage(String(pricing.gstPercentage));
    setFormMrp(String(pricing.mrp));
    setFormPackageQuantity(pricing.packageQuantity);
    setFormScheme(pricing.scheme);
    setFormStatus(pricing.status);
    setIsModalOpen(true);
  };

  // Handle Save (Create / Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProductId) {
      toast.error("Please select a product");
      return;
    }
    if (!formBasePrice || isNaN(parseFloat(formBasePrice)) || parseFloat(formBasePrice) <= 0) {
      toast.error("Please enter a valid base price");
      return;
    }
    if (formMarginPercentage === "" || isNaN(parseFloat(formMarginPercentage)) || parseFloat(formMarginPercentage) < 0) {
      toast.error("Please enter a valid margin percentage");
      return;
    }
    if (formGstPercentage === "" || isNaN(parseFloat(formGstPercentage)) || parseFloat(formGstPercentage) < 0) {
      toast.error("Please enter a valid GST percentage");
      return;
    }
    if (!formMrp || isNaN(parseFloat(formMrp)) || parseFloat(formMrp) <= 0) {
      toast.error("Please enter a valid MRP");
      return;
    }
    if (!formPackageQuantity.trim()) {
      toast.error("Please enter package quantity");
      return;
    }
    if (!formScheme.trim()) {
      toast.error("Please enter scheme terms");
      return;
    }

    setIsSaving(true);
    const token = localStorage.getItem("authToken");

    const payload = {
      productId: formProductId,
      basePrice: parseFloat(formBasePrice),
      marginPercentage: parseFloat(formMarginPercentage),
      marginAmount: calculations.marginAmount,
      netPrice: calculations.netPrice,
      gstPercentage: parseFloat(formGstPercentage),
      gstAmount: calculations.gstAmount,
      dealerPrice: calculations.dealerPrice,
      mrp: parseFloat(formMrp),
      packageQuantity: formPackageQuantity.trim(),
      scheme: formScheme.trim(),
      status: formStatus,
    };

    try {
      let url = `${ENV.API_BASE_URL}/distributor-pricing`;
      let method = "POST";

      if (modalMode === "edit" && selectedPricingId) {
        url = `${ENV.API_BASE_URL}/distributor-pricing/${selectedPricingId}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to save distributor pricing");
      }

      toast.success(data.message || "Distributor pricing saved successfully!");
      setIsModalOpen(false);
      fetchPricings();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to save pricing");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this distributor pricing record?")) return;

    setIsDeleteLoading(id);
    const token = localStorage.getItem("authToken");

    try {
      const response = await fetch(`${ENV.API_BASE_URL}/distributor-pricing/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Delete failed");
      }

      toast.success("Pricing record deleted successfully");
      fetchPricings();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to delete pricing record");
    } finally {
      setIsDeleteLoading(null);
    }
  };

  const isDark = theme === "dark";

  if (authLoading || !mounted || (loading && pricings.length === 0)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-sans bg-neutral-50 dark:bg-[#080808] text-slate-900 dark:text-white transition-colors duration-300">
        <Loader2 className="w-10 h-10 text-[#D71920] animate-spin" />
        <p className="mt-4 font-sans text-sm text-neutral-500 dark:text-neutral-400">
          Verifying security credentials...
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen flex flex-col lg:flex-row transition-colors duration-300 font-sans selection:bg-[#D71920]/30 selection:text-white",
      isDark ? "dark bg-[#0d0d0d] text-white" : "bg-[#fafafa] text-slate-900"
    )}>
      {/* Sidebar Component */}
      <AdminSidebar currentPath="/admin/distributor-pricing" theme={theme} toggleTheme={toggleTheme} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">

        {/* Header */}
        <header className={cn(
          "px-6 py-6 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors duration-300",
          isDark ? "border-neutral-800 bg-[#0d0d0d]/80" : "border-neutral-200 bg-white"
        )}>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#D71920] uppercase tracking-wider mb-1">
              <IndianRupee size={14} />
              <span>B2B Pricing Matrix</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Distributor Pricing Management</h1>
            <p className={cn("text-xs mt-0.5", isDark ? "text-neutral-500" : "text-neutral-400")}>
              Set up special dealer prices, margins, taxations, and schemes for registered distributors.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchPricings(false)}
              className={cn(
                "p-2.5 border rounded-lg transition-all cursor-pointer",
                isDark
                  ? "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800"
                  : "bg-white border-neutral-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              )}
              title="Reload Pricings"
            >
              <RefreshCw size={18} className={loading ? "animate-spin text-[#D71920]" : ""} />
            </button>
            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 bg-[#D71920] hover:bg-[#B91520] rounded-lg text-sm font-bold text-white transition-all flex items-center gap-2 shadow-lg shadow-[#D71920]/20 hover:shadow-[#D71920]/30 cursor-pointer"
            >
              <Plus size={18} />
              <span>Create Distributor Price</span>
            </button>
          </div>
        </header>

        {/* Dashboard Catalog List */}
        <main className="flex-grow p-6">
          <div className={cn(
            "border rounded-2xl overflow-hidden shadow-xl backdrop-blur-md transition-all",
            isDark ? "bg-neutral-950/60 border-neutral-800/80" : "bg-white border-neutral-200"
          )}>
            {/* Filter Search Bar */}
            <div className={cn(
              "p-4 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-4",
              isDark ? "border-neutral-800/50 bg-neutral-900/10" : "border-slate-100 bg-slate-50/40"
            )}>
              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, SKU, or category..."
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 text-xs font-semibold border rounded-xl bg-white dark:bg-neutral-900 focus:outline-none focus:ring-4 text-slate-800 dark:text-neutral-100 shadow-sm transition-colors placeholder-neutral-400 dark:placeholder-neutral-500",
                    isDark
                      ? "border-neutral-800 focus:ring-[#D71920]/20 focus:border-[#D71920]"
                      : "border-slate-200 focus:ring-[#D71920]/15 focus:border-[#D71920]"
                  )}
                />
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D71920]" />
              </div>

              <div className={cn("text-xs font-bold", isDark ? "text-neutral-500" : "text-slate-400")}>
                Showing {pricings.length} of {total} configured products
              </div>
            </div>

            {pricings.length === 0 ? (
              <div className="py-24 text-center">
                <Package className={cn("w-16 h-16 mx-auto mb-4", isDark ? "text-neutral-800" : "text-neutral-300")} />
                <p className="text-lg font-bold">No distributor pricings found</p>
                <p className={cn("text-sm mt-1", isDark ? "text-neutral-500" : "text-neutral-400")}>
                  {debouncedSearch ? "Try refining your search query." : "Get started by adding distributor rates for catalog appliances."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={cn(
                      "border-b text-xs font-bold uppercase tracking-wider transition-colors",
                      isDark ? "border-neutral-800 bg-neutral-900/30 text-neutral-400" : "border-neutral-200 bg-neutral-50/70 text-slate-500"
                    )}>
                      <th className="py-4 px-6">Product details</th>
                      <th className="py-4 px-6">Base & MRP</th>
                      <th className="py-4 px-6">Margin & Tax</th>
                      <th className="py-4 px-6">Dealer Price</th>
                      <th className="py-4 px-6">Package & Scheme</th>
                      <th className="py-4 px-6 text-center">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={cn(
                    "divide-y transition-colors text-sm",
                    isDark ? "divide-neutral-900" : "divide-neutral-100"
                  )}>
                    {pricings.map((pricing) => (
                      <tr
                        key={pricing.id}
                        onClick={() => openEditModal(pricing)}
                        className={cn(
                          "group transition-all cursor-pointer",
                          isDark ? "hover:bg-neutral-900/10" : "hover:bg-slate-50/50"
                        )}
                      >
                        {/* Info */}
                        <td className="py-4 px-6 flex items-center gap-4 text-left">
                          <div className={cn(
                            "w-12 h-12 rounded-lg overflow-hidden border flex items-center justify-center flex-shrink-0 transition-colors bg-white",
                            isDark ? "border-neutral-800 bg-neutral-900" : "border-neutral-200"
                          )}>
                            <img
                              src={pricing.product.image}
                              alt={pricing.product.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/SD-logo.png";
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <h3 className={cn("font-bold truncate max-w-[180px] sm:max-w-[240px]", isDark ? "text-neutral-100" : "text-slate-800")}>
                              {pricing.product.name}
                            </h3>
                            <div className="flex gap-2 items-center mt-1">
                              <span className={cn(
                                "px-1.5 py-0.5 border rounded text-[10px] font-bold tracking-wide uppercase",
                                isDark ? "bg-neutral-900 border-neutral-800 text-neutral-400" : "bg-slate-100 border-slate-200 text-slate-500"
                              )}>
                                {pricing.product.categoryLabel}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-neutral-400">
                                SKU: {pricing.skuCode}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Prices */}
                        <td className="py-4 px-6 font-semibold">
                          <div className={isDark ? "text-neutral-200" : "text-slate-800"}>Base: ₹{pricing.basePrice}</div>
                          <div className="text-xs text-neutral-450 dark:text-neutral-500">MRP: ₹{pricing.mrp}</div>
                        </td>

                        {/* Margin & GST */}
                        <td className="py-4 px-6 text-xs text-neutral-500">
                          <div>Margin: <span className="font-bold text-emerald-600 dark:text-emerald-400">{pricing.marginPercentage}%</span> (₹{pricing.marginAmount})</div>
                          <div className="mt-0.5">GST: <span className="font-semibold text-indigo-500">{pricing.gstPercentage}%</span> (₹{pricing.gstAmount})</div>
                        </td>

                        {/* Dealer Price */}
                        <td className="py-4 px-6">
                          <span className="font-extrabold text-[#D71920] text-base">
                            ₹{pricing.dealerPrice}
                          </span>
                          <span className="block text-[10px] text-neutral-400">GST Included</span>
                        </td>

                        {/* Package / Scheme */}
                        <td className="py-4 px-6 text-xs text-neutral-500">
                          <div>Qty: <span className="font-semibold text-slate-800 dark:text-neutral-200">{pricing.packageQuantity}</span></div>
                          <div className="mt-0.5 text-emerald-600 font-bold">{pricing.scheme}</div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6 text-center">
                          {pricing.status === "ACTIVE" ? (
                            <span className="px-2.5 py-0.5 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                              Active
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-neutral-500/10 border border-neutral-500/20 text-neutral-450 rounded-full text-[10px] font-bold uppercase tracking-wider">
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(pricing);
                              }}
                              className={cn(
                                "p-2 border rounded-lg transition-all cursor-pointer",
                                isDark
                                  ? "bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800"
                                  : "bg-white border-neutral-200 text-slate-600 hover:text-[#D71920] hover:bg-slate-50"
                              )}
                              title="Edit pricing info"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(pricing.id);
                              }}
                              disabled={isDeleteLoading === pricing.id}
                              className={cn(
                                "p-2 border rounded-lg transition-all cursor-pointer disabled:opacity-50",
                                isDark
                                  ? "bg-neutral-900 border-neutral-800 text-red-500 hover:text-white hover:bg-red-950/20"
                                  : "bg-white border-neutral-200 text-red-500 hover:text-white hover:bg-red-500"
                              )}
                              title="Delete pricing record"
                            >
                              {isDeleteLoading === pricing.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 size={13} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination component */}
            {totalPages > 1 && (
              <div className={cn(
                "p-4 border-t flex items-center justify-between gap-4",
                isDark ? "border-neutral-800 bg-neutral-900/10" : "border-slate-100 bg-slate-50/20"
              )}>
                <button
                  disabled={page === 1}
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  className={cn(
                    "px-3 py-1.5 border rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all disabled:opacity-50 select-none cursor-pointer",
                    isDark
                      ? "border-neutral-850 hover:bg-neutral-900 text-neutral-300 disabled:hover:bg-transparent"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700 disabled:hover:bg-transparent"
                  )}
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </button>

                <div className="text-xs font-bold text-neutral-500">
                  Page {page} of {totalPages}
                </div>

                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  className={cn(
                    "px-3 py-1.5 border rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all disabled:opacity-50 select-none cursor-pointer",
                    isDark
                      ? "border-neutral-850 hover:bg-neutral-900 text-neutral-300 disabled:hover:bg-transparent"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700 disabled:hover:bg-transparent"
                  )}
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* CREATE & EDIT MODAL DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className={cn(
            "w-full max-w-4xl rounded-2xl border p-6 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200 my-8 text-left",
            isDark ? "bg-neutral-950 border-neutral-850 text-white" : "bg-white border-neutral-200 text-slate-900"
          )}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">
                  {modalMode === "create" ? "Configure Distributor Pricing" : "Edit Distributor Pricing Info"}
                </h2>
                <p className={cn("text-xs mt-1", isDark ? "text-neutral-400" : "text-slate-500")}>
                  Set up wholesale pricing properties, margins, GST details, package units, and promotional schemes.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className={cn(
                  "p-1.5 border rounded-lg transition-colors cursor-pointer",
                  isDark ? "border-neutral-800 hover:bg-neutral-900" : "border-slate-200 hover:bg-slate-50"
                )}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* ── LEFT INPUTS: Form Settings ──────────────────── */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Select Product */}
                  <div className="flex flex-col">
                    <label className={cn("text-xs font-bold uppercase tracking-wider mb-1.5", isDark ? "text-neutral-400" : "text-slate-600")}>
                      Select Product *
                    </label>
                    {modalMode === "create" ? (
                      <select
                        value={formProductId}
                        onChange={(e) => handleProductSelectChange(e.target.value)}
                        className={cn(
                          "w-full px-3.5 py-2.5 text-xs font-semibold border rounded-xl bg-white dark:bg-neutral-900 focus:outline-none focus:ring-4 transition-all shadow-sm cursor-pointer",
                          isDark
                            ? "border-neutral-800 focus:ring-[#D71920]/20 focus:border-[#D71920] text-white"
                            : "border-slate-200 focus:ring-[#D71920]/15 focus:border-[#D71920] text-slate-900"
                        )}
                        required
                      >
                        <option value="">-- Choose Appliance from Catalog --</option>
                        {allProducts
                          .filter(p => !pricings.some(pr => pr.productId === p.id))
                          .map((prod) => (
                            <option key={prod.id} value={prod.id}>
                              {prod.name} ({prod.categoryLabel} - {prod.modelNumber || "No Model"})
                            </option>
                          ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        disabled
                        value={selectedProductDetails?.name || ""}
                        className={cn(
                          "w-full px-3.5 py-2.5 text-xs font-semibold border rounded-xl cursor-not-allowed select-none bg-neutral-900/10 dark:bg-neutral-900/40",
                          isDark ? "border-neutral-850 text-neutral-400" : "border-slate-200 text-slate-400"
                        )}
                      />
                    )}
                  </div>

                  {/* Read-Only Product Profile */}
                  {selectedProductDetails && (
                    <div className={cn(
                      "p-3 rounded-xl border flex items-center gap-3 text-xs",
                      isDark ? "bg-neutral-900/30 border-neutral-850" : "bg-slate-50/50 border-slate-150"
                    )}>
                      <div className="w-12 h-12 rounded border bg-white flex items-center justify-center p-1 flex-shrink-0">
                        <img src={selectedProductDetails.image} className="w-full h-full object-contain" alt="" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 dark:text-neutral-200 truncate">{selectedProductDetails.name}</div>
                        <div className="text-neutral-500 mt-0.5 flex flex-wrap gap-x-2">
                          <span>Category: <b>{selectedProductDetails.categoryLabel}</b></span>
                          <span>·</span>
                          <span>Model: <b>{selectedProductDetails.modelNumber || "N/A"}</b></span>
                          <span>·</span>
                          <span>SKU: <b className="font-mono">{selectedProductDetails.sku || selectedProductDetails.productId || "N/A"}</b></span>
                          <span>·</span>
                          <span>Item Code: <b className="font-mono">{selectedProductDetails.itemCode || "N/A"}</b></span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Base Price & Margin Percentage */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className={cn("text-xs font-bold uppercase tracking-wider mb-1.5", isDark ? "text-neutral-400" : "text-slate-600")}>
                        Base Price (₹) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formBasePrice}
                        onChange={(e) => setFormBasePrice(e.target.value)}
                        placeholder="e.g. 634"
                        className={cn(
                          "w-full px-3.5 py-2.5 text-xs font-semibold border rounded-xl bg-white dark:bg-neutral-900 focus:outline-none focus:ring-4 transition-all shadow-sm",
                          isDark
                            ? "border-neutral-800 focus:ring-[#D71920]/20 focus:border-[#D71920] text-white"
                            : "border-slate-200 focus:ring-[#D71920]/15 focus:border-[#D71920] text-slate-900"
                        )}
                        required
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className={cn("text-xs font-bold uppercase tracking-wider mb-1.5", isDark ? "text-neutral-400" : "text-slate-600")}>
                        Margin Percentage (%) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formMarginPercentage}
                        onChange={(e) => setFormMarginPercentage(e.target.value)}
                        placeholder="e.g. 15"
                        className={cn(
                          "w-full px-3.5 py-2.5 text-xs font-semibold border rounded-xl bg-white dark:bg-neutral-900 focus:outline-none focus:ring-4 transition-all shadow-sm",
                          isDark
                            ? "border-neutral-800 focus:ring-[#D71920]/20 focus:border-[#D71920] text-white"
                            : "border-slate-200 focus:ring-[#D71920]/15 focus:border-[#D71920] text-slate-900"
                        )}
                        required
                      />
                    </div>
                  </div>

                  {/* GST % & MRP */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className={cn("text-xs font-bold uppercase tracking-wider mb-1.5", isDark ? "text-neutral-400" : "text-slate-600")}>
                        GST Percentage (%) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formGstPercentage}
                        onChange={(e) => setFormGstPercentage(e.target.value)}
                        placeholder="e.g. 5"
                        className={cn(
                          "w-full px-3.5 py-2.5 text-xs font-semibold border rounded-xl bg-white dark:bg-neutral-900 focus:outline-none focus:ring-4 transition-all shadow-sm",
                          isDark
                            ? "border-neutral-800 focus:ring-[#D71920]/20 focus:border-[#D71920] text-white"
                            : "border-slate-200 focus:ring-[#D71920]/15 focus:border-[#D71920] text-slate-900"
                        )}
                        required
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className={cn("text-xs font-bold uppercase tracking-wider mb-1.5", isDark ? "text-neutral-400" : "text-slate-600")}>
                        MRP (₹) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formMrp}
                        onChange={(e) => setFormMrp(e.target.value)}
                        placeholder="e.g. 1699"
                        className={cn(
                          "w-full px-3.5 py-2.5 text-xs font-semibold border rounded-xl bg-white dark:bg-neutral-900 focus:outline-none focus:ring-4 transition-all shadow-sm",
                          isDark
                            ? "border-neutral-800 focus:ring-[#D71920]/20 focus:border-[#D71920] text-white"
                            : "border-slate-200 focus:ring-[#D71920]/15 focus:border-[#D71920] text-slate-900"
                        )}
                        required
                      />
                    </div>
                  </div>

                  {/* Package & Scheme */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className={cn("text-xs font-bold uppercase tracking-wider mb-1.5", isDark ? "text-neutral-400" : "text-slate-600")}>
                        Package Quantity (PKG) *
                      </label>
                      <input
                        type="text"
                        value={formPackageQuantity}
                        onChange={(e) => setFormPackageQuantity(e.target.value)}
                        placeholder="e.g. 18 Nos"
                        className={cn(
                          "w-full px-3.5 py-2.5 text-xs font-semibold border rounded-xl bg-white dark:bg-neutral-900 focus:outline-none focus:ring-4 transition-all shadow-sm",
                          isDark
                            ? "border-neutral-800 focus:ring-[#D71920]/20 focus:border-[#D71920] text-white"
                            : "border-slate-200 focus:ring-[#D71920]/15 focus:border-[#D71920] text-slate-900"
                        )}
                        required
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className={cn("text-xs font-bold uppercase tracking-wider mb-1.5", isDark ? "text-neutral-400" : "text-slate-600")}>
                        Scheme Terms *
                      </label>
                      <input
                        type="text"
                        value={formScheme}
                        onChange={(e) => setFormScheme(e.target.value)}
                        placeholder="e.g. 50 + 1 Same Free"
                        className={cn(
                          "w-full px-3.5 py-2.5 text-xs font-semibold border rounded-xl bg-white dark:bg-neutral-900 focus:outline-none focus:ring-4 transition-all shadow-sm",
                          isDark
                            ? "border-neutral-800 focus:ring-[#D71920]/20 focus:border-[#D71920] text-white"
                            : "border-slate-200 focus:ring-[#D71920]/15 focus:border-[#D71920] text-slate-900"
                        )}
                        required
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex flex-col">
                    <label className={cn("text-xs font-bold uppercase tracking-wider mb-1.5", isDark ? "text-neutral-400" : "text-slate-600")}>
                      Pricing Status
                    </label>
                    <div className="flex items-center gap-4 mt-1">
                      <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                        <input
                          type="radio"
                          name="status"
                          value="ACTIVE"
                          checked={formStatus === "ACTIVE"}
                          onChange={() => setFormStatus("ACTIVE")}
                          className="accent-[#D71920] w-4 h-4 cursor-pointer"
                        />
                        <span>Active</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                        <input
                          type="radio"
                          name="status"
                          value="INACTIVE"
                          checked={formStatus === "INACTIVE"}
                          onChange={() => setFormStatus("INACTIVE")}
                          className="accent-[#D71920] w-4 h-4 cursor-pointer"
                        />
                        <span>Inactive</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* ── RIGHT PREVIEW: Pricing Card Summary ──────────── */}
                <div className="lg:col-span-5 flex flex-col justify-between">
                  <div className={cn(
                    "p-6 rounded-2xl border flex flex-col gap-4 shadow-md bg-gradient-to-br",
                    isDark
                      ? "from-neutral-950 to-neutral-900/60 border-neutral-850"
                      : "from-slate-50 to-white border-slate-200"
                  )}>
                    <div className="flex items-center gap-2 border-b pb-3 mb-1 border-slate-100 dark:border-neutral-800/80">
                      <Sparkles size={16} className="text-[#D71920]" />
                      <h4 className="font-extrabold uppercase text-xs tracking-wider text-neutral-400 dark:text-neutral-500">
                        Pricing Summary Card
                      </h4>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between border-b border-dashed pb-1.5 border-slate-100 dark:border-neutral-900">
                        <span className="text-neutral-400">Selected Product:</span>
                        <span className="font-bold text-right truncate max-w-[160px]">
                          {selectedProductDetails?.name || "--"}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-neutral-400">SKU Code:</span>
                        <span className="font-mono font-bold">
                          {selectedProductDetails?.sku || selectedProductDetails?.productId || "--"}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-neutral-400">Item Code:</span>
                        <span className="font-mono font-bold">
                          {selectedProductDetails?.itemCode || "--"}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-neutral-400">Base Price:</span>
                        <span className="font-semibold text-slate-800 dark:text-white">
                          ₹{formBasePrice || "0"}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-neutral-400">Margin:</span>
                        <span className="font-semibold text-slate-850 dark:text-neutral-200">
                          {formMarginPercentage || "0"}%
                        </span>
                      </div>

                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                        <span>Margin Amount:</span>
                        <span className="font-bold">
                          ₹{calculations.marginAmount}
                        </span>
                      </div>

                      <div className="flex justify-between font-bold text-slate-800 dark:text-neutral-250 border-t pt-2 border-slate-100 dark:border-neutral-900">
                        <span>Net Price:</span>
                        <span>₹{calculations.netPrice}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-neutral-400">GST:</span>
                        <span className="font-semibold text-indigo-500">
                          {formGstPercentage || "0"}%
                        </span>
                      </div>

                      <div className="flex justify-between text-indigo-600 dark:text-indigo-400">
                        <span>GST Amount:</span>
                        <span className="font-bold">
                          + ₹{calculations.gstAmount}
                        </span>
                      </div>

                      <div className="flex justify-between font-extrabold text-slate-900 dark:text-white border-t border-b py-3 border-slate-100 dark:border-neutral-900 items-center">
                        <span className="text-xs uppercase tracking-wider text-[#D71920]">Dealer Price:</span>
                        <span className="text-lg text-[#D71920]">
                          ₹{calculations.dealerPrice}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-neutral-400">MRP Value:</span>
                        <span className="font-semibold">
                          ₹{formMrp || "0"}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-neutral-400">Package Quantity:</span>
                        <span className="font-bold">
                          {formPackageQuantity || "--"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 text-emerald-600 dark:text-emerald-450">
                        <span>Active Scheme:</span>
                        <span className="font-black text-right max-w-[150px] truncate">
                          {formScheme || "--"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className={cn(
                        "flex-1 py-3 text-sm font-bold rounded-xl border transition-all cursor-pointer select-none text-center",
                        isDark
                          ? "border-neutral-800 hover:bg-neutral-900 text-neutral-400 hover:text-white"
                          : "border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800"
                      )}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 py-3 text-sm font-extrabold text-white bg-[#D71920] hover:bg-[#B91520] rounded-xl shadow-lg shadow-[#D71920]/20 hover:shadow-[#D71920]/30 transition-all select-none cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4.5 h-4.5 animate-spin" />
                          <span>Saving rates...</span>
                        </>
                      ) : (
                        <span>Save</span>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
