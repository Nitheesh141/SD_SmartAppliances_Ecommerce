"use client";
import { ENV } from "@/config/env";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";
import { 
  Loader2, RefreshCw, Package, Search, Layers, CheckCircle2, AlertTriangle
} from "lucide-react";
import SalesSidebar from "@/components/layout/SalesSidebar";
import { cn } from "@/lib/utils";
import { matchProduct } from "../../utils/search";

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
  sku?: string | null;
  availableStock?: number;
}

export default function SalesProductsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Route protection
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user || user.role !== "SALESPERSON") {
        toast.error("Access Denied. Sales Persons only.");
        router.push("/auth/login");
      }
    }
  }, [isAuthenticated, user, authLoading, router]);

  // Fetch products
  const fetchProducts = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/products`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
      } else {
        if (!isBackground) toast.error(data.message || "Failed to fetch products");
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      if (!isBackground) toast.error("Failed to load product list");
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === "SALESPERSON") {
      fetchProducts(false);
    }
  }, [isAuthenticated, user]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => matchProduct(product, searchQuery));
  }, [products, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-neutral-50 text-slate-900 transition-colors duration-300 font-sans">
      {/* Sidebar */}
      <SalesSidebar currentPath="/sales/products" />

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 md:p-8 overflow-y-auto text-left">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 mb-8 border-neutral-200">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#1C1C1C] uppercase">
              Product Catalog & Stock
            </h1>
            <p className="text-xs font-bold text-neutral-500 uppercase mt-1">
              Browse products, view prices, specifications, and current inventory levels
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by product name, SKU, model number, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none text-sm transition-all bg-white border-neutral-200 text-slate-900 focus:border-[#D71920]"
            />
          </div>
          
          <button
            onClick={() => fetchProducts(false)}
            disabled={loading}
            className="flex items-center justify-center p-3 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-slate-705 transition-all cursor-pointer"
          >
            <RefreshCw size={18} className={cn(loading && "animate-spin")} />
          </button>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-[#D71920]" size={36} />
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
              Fetching Catalog...
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-neutral-200 bg-white p-6">
            <Package size={48} className="mx-auto mb-4 text-neutral-450" />
            <h3 className="font-bold text-lg">No Products Found</h3>
            <p className="text-sm text-neutral-550 mt-1">
              Try adjusting your filters or contact the inventory administrator.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
            {filteredProducts.map((p) => {
              const stock = p.availableStock || 0;
              const hasStock = p.inStock && stock > 0;
              return (
                <div key={p.id} className="p-5 rounded-2xl border bg-white border-neutral-200 flex flex-col gap-4 text-xs font-semibold justify-between transition-all hover:scale-[1.01] duration-300">
                  <div className="space-y-3">
                    {/* Image and badges */}
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-neutral-50 flex items-center justify-center border border-neutral-150">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="object-contain max-h-full max-w-full" />
                      ) : (
                        <Package size={36} className="text-neutral-400" />
                      )}
                      
                      {p.badge && (
                        <span className="absolute top-2.5 left-2.5 bg-red-600 text-white font-black uppercase text-[8px] px-2 py-0.5 rounded-full tracking-wider">
                          {p.badge}
                        </span>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-neutral-500">
                      <Layers size={10} />
                      <span>{p.categoryLabel}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-black text-[#1C1C1C] uppercase leading-tight line-clamp-2">
                      {p.name}
                    </h3>

                    {/* Catalog parameters */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-500 font-medium">
                      <div>
                        <span>Model Number:</span>
                        <p className="font-extrabold text-neutral-800 mt-0.5">{p.modelNumber || "N/A"}</p>
                      </div>
                      <div>
                        <span>SKU Code:</span>
                        <p className="font-mono font-bold text-neutral-800 mt-0.5">{p.sku || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Stock and Pricing */}
                  <div className="border-t border-neutral-200/50 pt-4 mt-2 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[9px] font-black text-neutral-500 uppercase tracking-wider">Pricing</span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-sm font-black text-[#D71920]">₹{p.price.toLocaleString("en-IN")}</span>
                        {p.discountPercent > 0 && (
                          <span className="text-[10px] line-through text-neutral-400">₹{p.originalPrice.toLocaleString("en-IN")}</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] font-black text-neutral-500 uppercase tracking-wider block">Inventory</span>
                      <div className="flex items-center justify-end gap-1.5 mt-1">
                        {hasStock ? (
                          <>
                            <CheckCircle2 size={13} className="text-green-500" />
                            <span className="text-green-600 font-extrabold">{stock} units in Stock</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={13} className="text-red-500" />
                            <span className="text-red-600 font-extrabold">Out of Stock</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
