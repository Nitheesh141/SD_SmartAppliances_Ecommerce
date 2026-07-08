"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/providers/CartProvider";
import Header from "@/components/layout/Header";
import Footer from "../../components/layout/Footer";
import { navLinks, footerColumns, socialLinks } from "../LandingPage/data/navigation";
import ProductCard from "@/components/cards/ProductCard";
import { useDynamicProducts } from "@/hooks/useDynamicProducts";
import ShopSidebar from "@/components/layout/ShopSidebar";
import { matchProduct } from "../../utils/search";
import {
  SlidersHorizontal, ArrowUpDown, Filter, ShieldCheck, X, ChevronDown, ArrowLeft, Search, Flame, Star, ShoppingCart, ArrowUpLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

const categoriesList = [
  { id: "all", label: "All Appliances" },
  { id: "pressure-cookers", label: "Pressure Cookers" },
  { id: "non-stick", label: "Non-Stick Cookware" },
  { id: "gas-stoves", label: "LPG Stoves" },
  { id: "wet-grinders", label: "Wet Grinders" },
  { id: "commercial", label: "Commercial Wet Grinders" },
];

const sortOptions = [
  { value: "default", label: "Default Sort" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "bestseller", label: "Bestseller List" },
  { value: "featured", label: "Featured Showcase" },
];

export default function ShopPage() {
  const allProducts = useDynamicProducts();
  const router = useRouter();

  // Safe Cart Count retrieval
  let cartCount = 0;
  try {
    const cartContext = useCart();
    cartCount = cartContext.cartCount;
  } catch (e) {
    // fallback
  }

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [maxPrice, setMaxPrice] = useState<number>(50000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState("default");

  // Mobile filter toggle
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState<"category" | "price" | "availability">("category");

  // Mobile search page overlay
  const [showMobileSearchPage, setShowMobileSearchPage] = useState(false);
  const [mobileSearchInput, setMobileSearchInput] = useState("");

  // Sort dropdown open state
  const [isSortOpen, setIsSortOpen] = useState(false);

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

  // Set dynamic price limits based on loaded products
  useEffect(() => {
    if (allProducts.length > 0) {
      const prices = allProducts.map(p => p.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      setPriceLimits({ min, max });
      setMaxPrice(max);
    }
  }, [allProducts]);

  // Synchronize category selection when search query changes
  useEffect(() => {
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      // Avoid matching generic terms
      if (q === "grinder" || q === "grinders" || q === "smart" || q === "appliance") return;

      let matchedCat = "all";
      if (q.includes("cooker")) matchedCat = "pressure-cookers";
      else if (q.includes("non-stick") || q.includes("cookware") || q.includes("tawa") || q.includes("pan") || q.includes("kadai")) matchedCat = "non-stick";
      else if (q.includes("stove") || q.includes("gas") || q.includes("lpg")) matchedCat = "gas-stoves";
      else if (q.includes("wet grinder") || q.includes("wet-grinder")) matchedCat = "wet-grinders";
      else if (q.includes("commercial")) matchedCat = "commercial";
      else {
        // Find matching category in the list
        const found = categoriesList.find(cat => cat.id !== "all" && (cat.label.toLowerCase().includes(q) || q.includes(cat.label.toLowerCase())));
        if (found) matchedCat = found.id;
      }

      if (matchedCat !== "all") {
        setSelectedCategory(matchedCat);
      }
    }
  }, [searchQuery]);

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
      {/* Desktop Header */}
      <div className="hidden md:block">
        <Header navLinks={navLinks} />
      </div>

      {/* Mobile Search Header */}
      <div className="md:hidden sticky top-0 z-40 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-neutral-900/60 px-4 py-2.5 flex items-center gap-3">
        {/* Back Button */}
        <button
          onClick={() => router.push("/")}
          className="p-1 text-slate-700 dark:text-neutral-350 hover:text-[#D71920]"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Search Input Bar */}
        <div 
          onClick={() => {
            setShowMobileSearchPage(true);
            setMobileSearchInput(searchQuery);
          }}
          className="flex-grow relative cursor-pointer"
        >
          <input
            type="text"
            readOnly
            value={searchQuery}
            placeholder="Search smart appliances..."
            className="w-full pl-9 pr-8 py-2 text-xs font-semibold border border-slate-200 dark:border-neutral-800 rounded-xl bg-slate-50 dark:bg-neutral-900 text-slate-800 dark:text-neutral-100 focus:outline-none cursor-pointer animate-pulse-once"
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          {searchQuery && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSearchQuery("");
                setMobileSearchInput("");
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#D71920]"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Cart Icon */}
        <Link href="/cart" className="relative p-1 text-slate-700 dark:text-neutral-350 hover:text-[#D71920]">
          <ShoppingCart size={20} />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-[#D71920] text-white text-[9px] font-black rounded-full h-4 w-4 flex items-center justify-center border border-white dark:border-slate-950">
              {cartCount}
            </span>
          )}
        </Link>
      </div>

      {/* Mobile Horizontal Chips Filters Row */}
      <div className="md:hidden overflow-x-auto flex items-center gap-2 py-3 px-4 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-neutral-900/60 sticky top-[53px] z-30 scrollbar-none">
        {/* Sort & Filter Chip */}
        <button
          onClick={() => setShowMobileFilters(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-neutral-800 rounded-xl text-xs font-bold bg-white dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 hover:bg-slate-50 shrink-0 cursor-pointer"
        >
          <SlidersHorizontal size={13} />
          <span>Sort & Filter</span>
        </button>

        {/* Latest Trends (Featured) Chip */}
        <button
          onClick={() => setSortBy(prev => prev === "featured" ? "default" : "featured")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-colors",
            sortBy === "featured"
              ? "bg-red-50 border-red-200 text-[#D71920] dark:bg-red-950/20 dark:border-red-900 dark:text-red-400"
              : "border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 hover:bg-slate-50"
          )}
        >
          <Flame size={13} className={sortBy === "featured" ? "text-red-500 fill-red-500 animate-pulse" : "text-slate-400"} />
          <span>Latest Trends</span>
        </button>

        {/* Top Rated Chip */}
        <button
          onClick={() => setSortBy(prev => prev === "rating" ? "default" : "rating")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-colors",
            sortBy === "rating"
              ? "bg-red-50 border-red-200 text-[#D71920] dark:bg-red-950/20 dark:border-red-900 dark:text-red-400"
              : "border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 hover:bg-slate-50"
          )}
        >
          <Star size={13} className={sortBy === "rating" ? "text-amber-500 fill-amber-500" : "text-slate-400"} />
          <span>Top Rated</span>
        </button>

        {/* Price Sort Chip */}
        <button
          onClick={() => setSortBy(prev => prev === "price-low" ? "price-high" : prev === "price-high" ? "default" : "price-low")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-colors",
            sortBy === "price-low" || sortBy === "price-high"
              ? "bg-red-50 border-red-200 text-[#D71920] dark:bg-red-950/20 dark:border-red-900 dark:text-red-400"
              : "border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 hover:bg-slate-50"
          )}
        >
          <span>
            {sortBy === "price-low" ? "Price: Low to High" : sortBy === "price-high" ? "Price: High to Low" : "Price"}
          </span>
          <ChevronDown size={13} className={cn("text-slate-400 transition-transform duration-200", sortBy === "price-high" ? "rotate-180" : "")} />
        </button>
      </div>

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

            {/* Horizontal Tool Header (Filters Toggle on Mobile, Sorting) - Desktop Only */}
            <div className="hidden md:flex items-center justify-between gap-4 p-4 border border-slate-150 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-neutral-900/30">

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
                  <div className="relative">
                    {/* Custom Styled Trigger Button */}
                    <button
                      type="button"
                      onClick={() => setIsSortOpen(!isSortOpen)}
                      className="flex items-center justify-between gap-4 pl-3 pr-8 py-2 text-xs border border-slate-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 focus:outline-none focus:ring-4 focus:ring-[#D71920]/15 focus:border-[#D71920] cursor-pointer text-slate-800 dark:text-neutral-200 font-bold shadow-sm min-w-[150px] text-left transition-all relative"
                    >
                      <span>{sortOptions.find(opt => opt.value === sortBy)?.label || "Default Sort"}</span>
                      <ChevronDown size={12} className={cn("absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 transition-transform duration-200", isSortOpen ? "rotate-180" : "")} />
                    </button>

                    {/* Custom Dropdown Overlay */}
                    {isSortOpen && (
                      <>
                        {/* Invisible click backdrop */}
                        <div 
                          className="fixed inset-0 z-40 cursor-default" 
                          onClick={() => setIsSortOpen(false)}
                        />
                        
                        {/* Dropdown Options List */}
                        <div className="absolute right-0 mt-1.5 w-[180px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                          {sortOptions.map((option) => {
                            const isSelected = option.value === sortBy;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                  setSortBy(option.value);
                                  setIsSortOpen(false);
                                }}
                                className={cn(
                                  "w-full text-left px-4 py-2 text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer",
                                  isSelected
                                    ? "bg-red-50 dark:bg-red-950/20 text-[#D71920] dark:text-red-400"
                                    : "text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-850 hover:text-slate-900 dark:hover:text-white"
                                )}
                              >
                                <span>{option.label}</span>
                                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#D71920] dark:bg-red-400" />}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

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
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
                {sortedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

          </div>
        </main>
      </div>

      <Footer footerColumns={footerColumns} socialLinks={socialLinks} />

      {/* Full Screen Flipkart-like Mobile Filters Page Overlay (Placed at root level) */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-[999] bg-white dark:bg-slate-950 flex flex-col w-screen h-[100dvh] lg:hidden overflow-hidden animate-in fade-in duration-200">
          {/* Header */}
          <div className="h-14 border-b border-slate-100 dark:border-neutral-900 flex items-center justify-between px-4 bg-white dark:bg-slate-950 shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMobileFilters(false)} className="p-1 text-slate-700 dark:text-neutral-350 hover:text-[#D71920]">
                <ArrowLeft size={20} />
              </button>
              <span className="font-extrabold text-sm uppercase tracking-wider text-slate-800 dark:text-white">Filters</span>
            </div>
            <button
              onClick={handleResetFilters}
              className="text-xs font-bold text-[#D71920] dark:text-red-400 hover:underline"
            >
              Clear All
            </button>
          </div>

          {/* Body split view */}
          <div className="flex-grow flex items-stretch min-h-0">
            {/* Left Column - Tabs List */}
            <div className="w-[35%] bg-slate-50 dark:bg-slate-900 border-r border-slate-100 dark:border-neutral-900 flex flex-col overflow-y-auto">
              {/* Category Tab */}
              <button
                onClick={() => setActiveFilterTab("category")}
                className={cn(
                  "py-4 px-3 text-left text-xs font-bold transition-all relative border-b border-slate-100/50 dark:border-neutral-900/30",
                  activeFilterTab === "category"
                    ? "bg-white dark:bg-neutral-900 text-[#D71920] dark:text-red-400 border-l-4 border-l-[#D71920]"
                    : "text-slate-600 dark:text-neutral-450"
                )}
              >
                Category
              </button>
              {/* Price Tab */}
              <button
                onClick={() => setActiveFilterTab("price")}
                className={cn(
                  "py-4 px-3 text-left text-xs font-bold transition-all relative border-b border-slate-100/50 dark:border-neutral-900/30",
                  activeFilterTab === "price"
                    ? "bg-white dark:bg-neutral-900 text-[#D71920] dark:text-red-400 border-l-4 border-l-[#D71920]"
                    : "text-slate-600 dark:text-neutral-450"
                )}
              >
                Price Range
              </button>
              {/* Availability Tab */}
              <button
                onClick={() => setActiveFilterTab("availability")}
                className={cn(
                  "py-4 px-3 text-left text-xs font-bold transition-all relative border-b border-slate-100/50 dark:border-neutral-900/30",
                  activeFilterTab === "availability"
                    ? "bg-white dark:bg-neutral-900 text-[#D71920] dark:text-red-400 border-l-4 border-l-[#D71920]"
                    : "text-slate-600 dark:text-neutral-450"
                )}
              >
                Availability
              </button>
            </div>

            {/* Right Column - Tab Content */}
            <div className="w-[65%] bg-white dark:bg-neutral-900 overflow-y-auto p-4 text-left">
              {/* Category Content */}
              {activeFilterTab === "category" && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black tracking-wider uppercase text-neutral-400 mb-3">Select Category</p>
                  {categoriesList.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={cn(
                          "w-full text-left px-3 py-3 text-xs font-bold rounded-xl flex items-center justify-between border transition-all cursor-pointer",
                          isSelected
                            ? "bg-red-50/50 border-[#D71920]/20 text-[#D71920] dark:bg-red-950/15 dark:border-red-900/40 dark:text-red-400"
                            : "bg-transparent border-slate-100 dark:border-neutral-800 text-slate-700 dark:text-neutral-350 hover:bg-slate-50"
                        )}
                      >
                         <span>{cat.label}</span>
                         {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#D71920] dark:bg-red-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Price Content */}
              {activeFilterTab === "price" && (
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black tracking-wider uppercase text-neutral-400 mb-1">Max Price Limit</p>
                    <p className="text-sm font-extrabold text-slate-800 dark:text-white">₹{maxPrice.toLocaleString("en-IN")}</p>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="range"
                      min={priceLimits.min}
                      max={priceLimits.max}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-100 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#D71920]"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono font-bold">
                      <span>Min: ₹{priceLimits.min.toLocaleString("en-IN")}</span>
                      <span>Max: ₹{priceLimits.max.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Availability Content */}
              {activeFilterTab === "availability" && (
                <div className="space-y-4">
                  <p className="text-[10px] font-black tracking-wider uppercase text-neutral-400">Stock Availability</p>
                  <label className="flex items-center gap-3 p-3 border border-slate-100 dark:border-neutral-800 rounded-xl cursor-pointer hover:bg-slate-50 bg-white dark:bg-neutral-900 transition-colors">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="rounded text-[#D71920] focus:ring-[#D71920] border-slate-300 dark:border-neutral-800 h-4 w-4 shrink-0"
                    />
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-800 dark:text-white">In Stock Only</span>
                      <span className="text-[10px] text-slate-400">Hide unavailable models</span>
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Sticky Footer */}
          <div 
            className="border-t border-slate-100 dark:border-neutral-900/60 flex items-center bg-white dark:bg-slate-950 shrink-0 px-4 py-3 gap-3"
            style={{ paddingBottom: 'calc(max(12px, env(safe-area-inset-bottom)))' }}
          >
            <button
              onClick={() => setShowMobileFilters(false)}
              className="flex-1 py-3 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-350 rounded-xl text-xs font-extrabold cursor-pointer hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => setShowMobileFilters(false)}
              className="flex-1.5 py-3 bg-[#D71920] hover:bg-[#b8141a] text-white rounded-xl text-xs font-extrabold cursor-pointer transition-colors shadow-md shadow-red-600/10 flex items-center justify-center gap-1.5"
            >
              <span>Apply</span>
              <span className="px-1.5 py-0.5 text-[10px] font-black bg-white/20 rounded-md">
                {filteredProducts.length}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Full Screen Flipkart-like Search Page Overlay */}
      {showMobileSearchPage && (
        <div className="fixed inset-0 z-[1000] bg-white dark:bg-slate-950 flex flex-col w-screen h-[100dvh] lg:hidden overflow-hidden animate-in fade-in duration-200">
          {/* Header */}
          <div className="h-14 border-b border-slate-100 dark:border-neutral-900/60 flex items-center gap-3 px-4 bg-white dark:bg-slate-950 shrink-0">
            {/* Back Button */}
            <button
              onClick={() => setShowMobileSearchPage(false)}
              className="p-1 text-slate-700 dark:text-neutral-350 hover:text-[#D71920]"
            >
              <ArrowLeft size={20} />
            </button>

            {/* Search Input */}
            <div className="flex-grow relative">
              <input
                type="text"
                autoFocus
                value={mobileSearchInput}
                onChange={(e) => setMobileSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setSearchQuery(mobileSearchInput);
                    setShowMobileSearchPage(false);
                  }
                }}
                placeholder="Search pressure cookers, wet grinders..."
                className="w-full pl-9 pr-8 py-2 text-xs font-semibold border border-slate-200 dark:border-neutral-800 rounded-xl bg-slate-50 dark:bg-neutral-900 text-slate-800 dark:text-neutral-100 focus:outline-none focus:border-[#D71920] focus:ring-1 focus:ring-[#D71920]"
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              {mobileSearchInput && (
                <button
                  onClick={() => setMobileSearchInput("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#D71920]"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Suggestions or Popular Categories */}
          <div className="flex-grow overflow-y-auto bg-white dark:bg-slate-950">
            {mobileSearchInput.trim() === "" ? (
              <div className="p-5 space-y-6">
                {/* Popular categories quick tags */}
                <div>
                  <p className="text-[10px] font-black tracking-wider uppercase text-neutral-450 dark:text-neutral-400 mb-3">Popular Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {categoriesList.filter(c => c.id !== "all").map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setSearchQuery("");
                          setMobileSearchInput("");
                          setShowMobileSearchPage(false);
                        }}
                        className="px-3.5 py-2 border border-slate-100 dark:border-neutral-800 rounded-xl text-xs font-bold text-slate-700 dark:text-neutral-350 hover:bg-slate-50 dark:hover:bg-neutral-900 cursor-pointer bg-slate-50/50 dark:bg-neutral-900/20"
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-neutral-900/60 pt-4 text-xs text-neutral-400 text-left leading-relaxed">
                  Type product keywords (e.g., "grinder", "cooker", "non-stick") to filter categories and search results instantly.
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-neutral-900/40">
                {(() => {
                  const q = mobileSearchInput.toLowerCase().trim();
                  
                  const categorySuggestions: any[] = [];
                  const productSuggestions: any[] = [];

                  // Match categories
                  categoriesList.forEach((cat) => {
                    if (cat.id !== "all" && cat.label.toLowerCase().includes(q)) {
                      categorySuggestions.push({
                        type: "category",
                        id: cat.id,
                        label: cat.label,
                        display: cat.label,
                        subtitle: "in Categories",
                      });
                    }
                  });

                  // Match products
                  allProducts.forEach((prod) => {
                    if (
                      prod.name.toLowerCase().includes(q) ||
                      prod.categoryLabel.toLowerCase().includes(q)
                    ) {
                      productSuggestions.push({
                        type: "product",
                        id: prod.id,
                        label: prod.name,
                        display: prod.name,
                        subtitle: `in ${prod.categoryLabel}`,
                        image: prod.image,
                        product: prod,
                      });
                    }
                  });

                  const suggestionsList = [...categorySuggestions, ...productSuggestions].slice(0, 10);

                  if (suggestionsList.length === 0) {
                    return (
                      <div className="p-8 text-center text-xs text-neutral-400 font-semibold">
                        No suggestions found. Press enter to search raw text.
                      </div>
                    );
                  }

                  return suggestionsList.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (suggestion.type === "category") {
                          setSelectedCategory(suggestion.id);
                          setSearchQuery("");
                          setMobileSearchInput("");
                        } else {
                          setSearchQuery(suggestion.label);
                          if (suggestion.product && suggestion.product.category) {
                            setSelectedCategory(suggestion.product.category);
                          }
                        }
                        setShowMobileSearchPage(false);
                      }}
                      className="w-full text-left px-4 py-3.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-neutral-900/30 transition-colors cursor-pointer border-b border-slate-50/50 dark:border-neutral-900/20"
                    >
                      {/* Left Icon or Thumbnail */}
                      {suggestion.type === "product" && suggestion.image ? (
                        <div className="w-10 h-10 bg-slate-50 dark:bg-neutral-900 rounded-lg border border-slate-100 dark:border-neutral-800 flex items-center justify-center p-1 shrink-0">
                          <img
                            src={suggestion.image}
                            alt={suggestion.label}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/sd-smart-ecommerce/SD-logo.png";
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-slate-50 dark:bg-neutral-900 rounded-lg flex items-center justify-center text-slate-400 shrink-0 border border-slate-100 dark:border-neutral-800">
                          <Search size={16} />
                        </div>
                      )}

                      {/* Middle Info */}
                      <div className="flex-grow min-w-0 text-left">
                        <p className="text-xs font-bold text-slate-700 dark:text-neutral-350 truncate">
                          {suggestion.display}
                        </p>
                        <p className="text-[10px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-wide mt-0.5">
                          {suggestion.subtitle}
                        </p>
                      </div>

                      {/* Right Indicator */}
                      <ArrowUpLeft size={16} className="text-slate-400 rotate-90 shrink-0" />
                    </button>
                  ));
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
