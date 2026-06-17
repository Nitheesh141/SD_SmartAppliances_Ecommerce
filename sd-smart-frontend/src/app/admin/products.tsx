"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";
import { 
  Plus, Edit2, Trash2, Package, Loader2, RefreshCw, Layers
} from "lucide-react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { cn } from "@/lib/utils";

interface ProductType {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  image: string;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice: number;
  discountPercent: number;
  warranty: string;
  capacity?: string | null;
  badge?: string | null;
  href: string;
  inStock: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  modelNumber?: string | null;
  productId?: string | null;
  availableStock?: number;
  stockIn?: number;
  stockOut?: number;
}

export default function AdminProductsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteLoading, setIsDeleteLoading] = useState<string | null>(null);
  
  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Inventory Modal State
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);
  const [tempAvailableStock, setTempAvailableStock] = useState<number>(0);
  const [tempStockIn, setTempStockIn] = useState<number>(0);
  const [tempStockOut, setTempStockOut] = useState<number>(0);
  const [stockInQty, setStockInQty] = useState<string>("");
  const [stockOutQty, setStockOutQty] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load theme from localStorage on client side mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("admin-theme") as "light" | "dark" || "dark";
    setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("admin-theme", nextTheme);
  };

  const handleOpenInventory = (product: ProductType) => {
    setSelectedProduct(product);
    setTempAvailableStock(product.availableStock || 0);
    setTempStockIn(product.stockIn || 0);
    setTempStockOut(product.stockOut || 0);
    setStockInQty("");
    setStockOutQty("");
    setValidationError(null);
  };

  const handleStockIn = () => {
    const qty = parseInt(stockInQty, 10);
    if (isNaN(qty) || qty <= 0) {
      setValidationError("Stock In quantity must be greater than zero.");
      return;
    }
    setTempAvailableStock(prev => prev + qty);
    setTempStockIn(prev => prev + qty);
    setStockInQty("");
    setValidationError(null);
  };

  const handleStockOut = () => {
    const qty = parseInt(stockOutQty, 10);
    if (isNaN(qty) || qty <= 0) {
      setValidationError("Stock Out quantity must be greater than zero.");
      return;
    }
    if (qty > tempAvailableStock) {
      setValidationError("Stock Out quantity cannot exceed Available Stock.");
      return;
    }
    setTempAvailableStock(prev => prev - qty);
    setTempStockOut(prev => prev + qty);
    setStockOutQty("");
    setValidationError(null);
  };

  const handleSaveInventory = async () => {
    if (!selectedProduct) return;
    setIsSaving(true);
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch(`http://localhost:5000/api/products/${selectedProduct.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          availableStock: tempAvailableStock,
          stockIn: tempStockIn,
          stockOut: tempStockOut,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to update inventory");
      }

      toast.success("Inventory updated successfully");
      setSelectedProduct(null);
      fetchProducts();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to save inventory");
    } finally {
      setIsSaving(false);
    }
  };

  // Route protection
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user || (user.role !== "admin" && user.role !== "superadmin")) {
        toast.error("Access Denied. Admins only.");
        router.push("/auth/login");
      } else {
        fetchProducts();
      }
    }
  }, [isAuthenticated, user, authLoading, router]);

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/products");
      if (!response.ok) throw new Error("Failed to load products");
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    setIsDeleteLoading(id);
    const token = localStorage.getItem("authToken");

    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Delete failed");
      }

      toast.success("Product deleted successfully");
      fetchProducts();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to delete product");
    } finally {
      setIsDeleteLoading(null);
    }
  };

  const isDark = theme === "dark";

  if (authLoading || (loading && products.length === 0)) {
    return (
      <div className={cn(
        "min-h-screen flex flex-col items-center justify-center font-sans",
        isDark ? "bg-[#0d0d0d] text-white" : "bg-[#fafafa] text-slate-950"
      )}>
        <Loader2 className="w-10 h-10 text-[#D71920] animate-spin" />
        <p className={cn("mt-4 font-sans text-sm", isDark ? "text-neutral-400" : "text-neutral-500")}>
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
      {/* Shared Sidebar Component */}
      <AdminSidebar currentPath="/admin/products" theme={theme} toggleTheme={toggleTheme} />

      {/* Main Panel Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        
        {/* Dynamic Inner Dashboard Page Header */}
        <header className={cn(
          "px-6 py-6 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors duration-300",
          isDark ? "border-neutral-800 bg-[#0d0d0d]/80" : "border-neutral-200 bg-white"
        )}>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#D71920] uppercase tracking-wider mb-1">
              <Layers size={14} />
              <span>Smart Catalog</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Appliance Management</h1>
            <p className={cn("text-xs mt-0.5", isDark ? "text-neutral-500" : "text-neutral-400")}>
              Add, update, or remove smart appliances across customer category catalogs.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={fetchProducts}
              className={cn(
                "p-2.5 border rounded-lg transition-all cursor-pointer",
                isDark 
                  ? "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800" 
                  : "bg-white border-neutral-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              )}
              title="Reload Products"
            >
              <RefreshCw size={18} className={loading ? "animate-spin text-[#D71920]" : ""} />
            </button>
            <button
              onClick={() => router.push("/admin/manage-product")}
              className="px-4 py-2.5 bg-[#D71920] hover:bg-[#B91520] rounded-lg text-sm font-bold text-white transition-all flex items-center gap-2 shadow-lg shadow-[#D71920]/20 hover:shadow-[#D71920]/30 cursor-pointer"
            >
              <Plus size={18} />
              <span>Add New Appliance</span>
            </button>
          </div>
        </header>

        {/* Dashboard Grid & List */}
        <main className="flex-grow p-6">
          <div className={cn(
            "border rounded-2xl overflow-hidden shadow-xl backdrop-blur-md transition-all",
            isDark ? "bg-neutral-950/60 border-neutral-800/80" : "bg-white border-neutral-200"
          )}>
            {products.length === 0 ? (
              <div className="py-24 text-center">
                <Package className={cn("w-16 h-16 mx-auto mb-4", isDark ? "text-neutral-800" : "text-neutral-300")} />
                <p className="text-lg font-bold">No products found</p>
                <p className={cn("text-sm mt-1", isDark ? "text-neutral-500" : "text-neutral-400")}>
                  Get started by creating a new appliance above.
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
                      <th className="py-4 px-6">Product Info</th>
                      <th className="py-4 px-6">Category</th>
                      <th className="py-4 px-6">Price (INR)</th>
                      <th className="py-4 px-6 text-center">Status Flags</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={cn(
                    "divide-y transition-colors",
                    isDark ? "divide-neutral-900" : "divide-neutral-100"
                  )}>
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        onClick={() => handleOpenInventory(product)}
                        className={cn(
                          "group transition-all cursor-pointer",
                          isDark ? "hover:bg-neutral-900/10" : "hover:bg-slate-50/50"
                        )}
                      >
                        {/* Product details */}
                        <td className="py-4 px-6 flex items-center gap-4 text-left">
                          <div className={cn(
                            "w-14 h-14 rounded-lg overflow-hidden border flex items-center justify-center flex-shrink-0 transition-colors bg-white",
                            isDark ? "border-neutral-800 group-hover:border-neutral-700 bg-neutral-900" : "border-neutral-200 group-hover:border-neutral-300"
                          )}>
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/sd-smart-ecommerce/SD-logo.png";
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <h3 className={cn("font-bold truncate max-w-[200px] sm:max-w-[300px]", isDark ? "text-neutral-100" : "text-slate-800")}>
                              {product.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              {product.badge && (
                                <span className="px-2 py-0.5 bg-[#D71920]/10 border border-[#D71920]/20 text-[#D71920] rounded text-[10px] font-bold uppercase tracking-wider">
                                  {product.badge}
                                </span>
                              )}
                              <span className={cn("text-xs", isDark ? "text-neutral-500" : "text-slate-400")}>
                                {product.warranty} Warranty
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-4 px-6">
                          <span className={cn(
                            "px-2.5 py-1 border rounded-full text-xs font-semibold",
                            isDark 
                              ? "bg-neutral-900 border-neutral-800 text-neutral-300" 
                              : "bg-slate-100 border-slate-200 text-slate-700"
                          )}>
                            {product.categoryLabel}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="py-4 px-6 font-sans">
                          <p className={cn("font-bold", isDark ? "text-neutral-100" : "text-slate-800")}>
                            ₹{product.price.toLocaleString("en-IN")}
                          </p>
                          <p className={cn("text-xs line-through", isDark ? "text-neutral-500" : "text-slate-400")}>
                            ₹{product.originalPrice.toLocaleString("en-IN")}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {product.inStock ? (
                              <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded text-[10px] font-bold uppercase tracking-wider">
                                In Stock
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded text-[10px] font-bold uppercase tracking-wider">
                                Out of Stock
                              </span>
                            )}

                            {product.isBestSeller && (
                              <span className="px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 rounded text-[10px] font-bold uppercase tracking-wider" title="Best Seller">
                                Best Seller
                              </span>
                            )}

                            {product.isFeatured && (
                              <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded text-[10px] font-bold uppercase tracking-wider" title="Featured Showcase">
                                Featured
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/admin/manage-product?id=${product.id}`);
                              }}
                              className={cn(
                                "p-2 border rounded-lg transition-all cursor-pointer",
                                isDark
                                  ? "bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 hover:bg-neutral-800"
                                  : "bg-white border-neutral-200 text-slate-600 hover:text-[#D71920] hover:border-neutral-300 hover:bg-slate-50"
                              )}
                              title="Edit Appliance"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(product.id);
                              }}
                              disabled={isDeleteLoading === product.id}
                              className={cn(
                                "p-2 border rounded-lg transition-all cursor-pointer disabled:opacity-50",
                                isDark
                                  ? "bg-neutral-900 border-neutral-800 text-red-500 hover:text-white hover:border-red-900 hover:bg-red-950/20"
                                  : "bg-white border-neutral-200 text-red-500 hover:text-white hover:border-red-600 hover:bg-red-500"
                              )}
                              title="Delete Appliance"
                            >
                              {isDeleteLoading === product.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 size={14} />
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
          </div>
        </main>
      </div>

      {/* Inventory Management Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={cn(
            "w-full max-w-lg rounded-2xl border p-6 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200",
            isDark ? "bg-neutral-950 border-neutral-800 text-white" : "bg-white border-neutral-200 text-slate-900"
          )}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">Inventory Management</h2>
                <p className={cn("text-xs mt-1", isDark ? "text-neutral-400" : "text-slate-500")}>
                  Manage stock levels for your smart appliance.
                </p>
              </div>
            </div>

            {/* Product Metadata Info */}
            <div className={cn(
              "p-4 rounded-xl border mb-6 text-sm",
              isDark ? "bg-neutral-900/40 border-neutral-800" : "bg-slate-50 border-slate-100"
            )}>
              <div className="grid grid-cols-2 gap-y-2">
                <div>
                  <span className={cn("text-xs font-semibold block uppercase tracking-wider", isDark ? "text-neutral-500" : "text-slate-400")}>Product Name</span>
                  <span className="font-bold">{selectedProduct.name}</span>
                </div>
                <div>
                  <span className={cn("text-xs font-semibold block uppercase tracking-wider", isDark ? "text-neutral-500" : "text-slate-400")}>Category</span>
                  <span className="font-semibold">{selectedProduct.categoryLabel}</span>
                </div>
                <div>
                  <span className={cn("text-xs font-semibold block uppercase tracking-wider", isDark ? "text-neutral-500" : "text-slate-400")}>Product ID</span>
                  <span className="font-mono text-xs">{selectedProduct.productId || "N/A"}</span>
                </div>
                <div>
                  <span className={cn("text-xs font-semibold block uppercase tracking-wider", isDark ? "text-neutral-500" : "text-slate-400")}>Model Number</span>
                  <span className="font-mono text-xs">{selectedProduct.modelNumber || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className={cn(
                "p-3 rounded-xl border text-center",
                isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-slate-50 border-slate-150"
              )}>
                <span className={cn("text-[10px] font-bold block uppercase tracking-wider mb-1", isDark ? "text-neutral-500" : "text-slate-400")}>Available Stock</span>
                <span className="text-xl font-extrabold text-[#D71920]">{tempAvailableStock}</span>
              </div>
              <div className={cn(
                "p-3 rounded-xl border text-center",
                isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-slate-50 border-slate-150"
              )}>
                <span className={cn("text-[10px] font-bold block uppercase tracking-wider mb-1", isDark ? "text-neutral-500" : "text-slate-400")}>Stock In</span>
                <span className="text-xl font-extrabold text-green-600 dark:text-green-400">{tempStockIn}</span>
              </div>
              <div className={cn(
                "p-3 rounded-xl border text-center",
                isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-slate-50 border-slate-150"
              )}>
                <span className={cn("text-[10px] font-bold block uppercase tracking-wider mb-1", isDark ? "text-neutral-500" : "text-slate-400")}>Stock Out</span>
                <span className="text-xl font-extrabold text-orange-600 dark:text-orange-400">{tempStockOut}</span>
              </div>
            </div>

            {/* Stock Adjustments Inputs */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Stock In Section */}
              <div className="flex flex-col">
                <label className={cn("text-xs font-bold uppercase tracking-wider mb-1.5", isDark ? "text-neutral-400" : "text-slate-600")}>Stock In Qty</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={stockInQty}
                    onChange={(e) => setStockInQty(e.target.value)}
                    placeholder="Qty"
                    className={cn(
                      "w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all",
                      isDark 
                        ? "bg-neutral-900 border-neutral-800 text-white focus:border-[#D71920]" 
                        : "bg-white border-slate-200 text-slate-900 focus:border-[#D71920]"
                    )}
                  />
                  <button
                    onClick={handleStockIn}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer"
                  >
                    Stock In
                  </button>
                </div>
              </div>

              {/* Stock Out Section */}
              <div className="flex flex-col">
                <label className={cn("text-xs font-bold uppercase tracking-wider mb-1.5", isDark ? "text-neutral-400" : "text-slate-600")}>Stock Out Qty</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={stockOutQty}
                    onChange={(e) => setStockOutQty(e.target.value)}
                    placeholder="Qty"
                    className={cn(
                      "w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all",
                      isDark 
                        ? "bg-neutral-900 border-neutral-800 text-white focus:border-[#D71920]" 
                        : "bg-white border-slate-200 text-slate-900 focus:border-[#D71920]"
                    )}
                  />
                  <button
                    onClick={handleStockOut}
                    className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer"
                  >
                    Stock Out
                  </button>
                </div>
              </div>
            </div>

            {/* Validation Error Messages */}
            {validationError && (
              <div className="p-3 mb-6 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs font-medium text-center">
                {validationError}
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 border-t pt-4 border-neutral-200 dark:border-neutral-800">
              <button
                onClick={() => setSelectedProduct(null)}
                className={cn(
                  "px-4 py-2 border rounded-lg text-sm font-bold transition-all cursor-pointer",
                  isDark
                    ? "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800"
                    : "bg-white border-neutral-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveInventory}
                disabled={isSaving}
                className="px-4 py-2 bg-[#D71920] hover:bg-[#B91520] rounded-lg text-sm font-bold text-white transition-all flex items-center gap-2 shadow-lg shadow-[#D71920]/20 hover:shadow-[#D71920]/30 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
