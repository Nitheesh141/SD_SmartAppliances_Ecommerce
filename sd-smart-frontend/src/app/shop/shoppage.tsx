"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "../../components/layout/Footer";
import { navLinks, footerColumns, socialLinks } from "../LandingPage/data/navigation";
import ProductCard from "@/components/cards/ProductCard";
import { useDynamicProducts } from "@/hooks/useDynamicProducts";
import ShopSidebar from "@/components/layout/ShopSidebar";
import { matchProduct } from "../../utils/search";
import {
  SlidersHorizontal, ArrowUpDown, Filter, ShieldCheck, X
} from "lucide-react";
import { cn } from "@/lib/utils";

const categoriesList = [
  { id: "all", label: "All Appliances" },
  { id: "pressure-cookers", label: "Pressure Cookers" },
  { id: "non-stick", label: "Non-Stick Cookware" },
  { id: "mixer-grinders", label: "Mixer Grinders" },
  { id: "gas-stoves", label: "LPG Stoves" },
  { id: "wet-grinders", label: "Wet Grinders" },
  { id: "commercial", label: "Commercial Wet Grinders" },
];

export default function ShopPage() {
  const allProducts = useDynamicProducts();

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [maxPrice, setMaxPrice] = useState<number>(50000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState("default");

  // Mobile filter toggle
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Dynamic Price Bounds
  const [priceLimits, setPriceLimits] = useState({ min: 0, max: 50000 });

  // 1. Sync URL Query Parameters on Load (Client Side)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const categoryParam = params.get("category");
      if (categoryParam) {
        const isValidCat = categoriesList.some(cat => cat.id === categoryParam);
        if (isValidCat) {
          setSelectedCategory(categoryParam);
        }
      }
      const searchParam = params.get("search");
      if (searchParam) {
        setSearchQuery(searchParam);
      }
    }
  }, []);

  // 2. Set dynamic price limits based on loaded products
  useEffect(() => {
    if (allProducts.length > 0) {
      const prices = allProducts.map(p => p.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      setPriceLimits({ min, max });
      setMaxPrice(max);
    }
  }, [allProducts]);

  // 3. Handle resetting all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setMaxPrice(priceLimits.max);
    setInStockOnly(false);
    setSortBy("default");

    // Clear URL query parameters
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/shop");
    }
  };

  // 4. Filtering Logic
  const filteredProducts = allProducts.filter((product) => {
    // Category Filter
    if (selectedCategory !== "all" && product.category !== selectedCategory) {
      return false;
    }

    // Search Query Filter
    if (searchQuery.trim() !== "") {
      if (!matchProduct(product, searchQuery)) {
        return false;
      }
    }

    // Price Filter
    if (product.price > maxPrice) {
      return false;
    }

    // Availability Filter
    if (inStockOnly && (!product.inStock || product.availableStock === 0)) {
      return false;
    }

    return true;
  });

  // 5. Sorting Logic
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "rating":
        return b.rating - a.rating;
      case "bestseller":
        return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
      case "featured":
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-800 dark:text-neutral-200 font-sans transition-colors duration-300">
      <Header navLinks={navLinks} />

      {/* Main layout container with flex row */}
      <div className="flex-grow flex flex-col lg:flex-row w-full items-stretch">

        {/* Desktop Sidebar Filters - Attached completely to the left */}
        <div className="hidden lg:block w-80 flex-shrink-0 border-r border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-950 sticky top-[68px] h-[calc(100vh-68px)] overflow-y-auto p-8">
          <ShopSidebar
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            maxPrice={maxPrice}
            setMaxPrice={setMaxPrice}
            inStockOnly={inStockOnly}
            setInStockOnly={setInStockOnly}
            priceLimits={priceLimits}
            handleResetFilters={handleResetFilters}
            categoriesList={categoriesList}
          />
        </div>

        {/* Product showcase main column */}
        <main className="flex-grow px-4 sm:px-6 lg:px-8 xl:px-12 py-10 w-full text-left min-w-0">
          <div className="space-y-6">

            {/* Horizontal Tool Header (Filters Toggle on Mobile, Sorting) */}
            <div className="flex items-center justify-between gap-4 p-4 border border-slate-150 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-neutral-900/30">

              {/* Product Counter */}
              <p className="text-xs font-bold text-slate-500 dark:text-neutral-400">
                Showing {sortedProducts.length} {sortedProducts.length === 1 ? "Product" : "Products"}
              </p>

              {/* Action Toolbar */}
              <div className="flex items-center gap-3">
                {/* Mobile Filter Toggle Trigger */}
                <button
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className="lg:hidden px-3 py-1.5 border border-slate-200 dark:border-neutral-805 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-white dark:bg-neutral-900 text-slate-600 dark:text-neutral-300 hover:bg-slate-50 cursor-pointer"
                >
                  <SlidersHorizontal size={12} />
                  <span>Filters</span>
                </button>

                {/* Sort Selector */}
                <div className="flex items-center gap-1.5">
                  <ArrowUpDown size={12} className="text-slate-400 hidden sm:block" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-2 py-1.5 text-xs border border-slate-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900 focus:outline-none focus:ring-1 focus:ring-[#D71920] cursor-pointer text-slate-800 dark:text-neutral-200 font-semibold"
                  >
                    <option value="default">Default Sort</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Top Rated</option>
                    <option value="bestseller">Bestseller List</option>
                    <option value="featured">Featured Showcase</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Mobile Filters Slide-in Drawer Component */}
            {showMobileFilters && (
              <>
                {/* Blur Backdrop */}
                <div
                  onClick={() => setShowMobileFilters(false)}
                  className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
                />

                {/* Left Drawer */}
                <div className="fixed inset-y-0 left-0 z-50 w-72 sm:w-80 h-full bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 p-6 overflow-y-auto space-y-6 lg:hidden text-left animate-in slide-in-from-left duration-300">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                    <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#D71920] flex items-center gap-1.5">
                      <Filter size={16} />
                      <span>Filters</span>
                    </h3>
                    <button
                      onClick={() => setShowMobileFilters(false)}
                      className="p-1.5 border border-slate-200 dark:border-neutral-800 rounded-lg hover:text-[#D71920] cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <ShopSidebar
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    maxPrice={maxPrice}
                    setMaxPrice={setMaxPrice}
                    inStockOnly={inStockOnly}
                    setInStockOnly={setInStockOnly}
                    priceLimits={priceLimits}
                    handleResetFilters={handleResetFilters}
                    categoriesList={categoriesList}
                  />

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                    <button
                      onClick={() => setShowMobileFilters(false)}
                      className="w-full py-2.5 bg-[#D71920] hover:bg-[#b8141a] text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Product Display Cards Grid */}
            {sortedProducts.length === 0 ? (
              <div className="py-24 text-center border border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl">
                <SlidersHorizontal className="w-16 h-16 text-slate-300 dark:text-neutral-700 mx-auto mb-4" />
                <h3 className="text-lg font-bold">No Products Found</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  We couldn't find any smart appliances matching your filters or search keywords. Try clearing filters to browse.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-4 px-4 py-2 bg-[#D71920] text-white rounded-lg text-xs font-bold hover:bg-[#b8141a] transition-all cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {sortedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

          </div>
        </main>
      </div>

      <Footer footerColumns={footerColumns} socialLinks={socialLinks} />
    </div>
  );
}
