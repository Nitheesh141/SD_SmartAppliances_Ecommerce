"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Heart,
  ShoppingCart,
  ShieldCheck,
  Zap,
  MapPin,
  ChevronRight,
  Check,
  Share2,
  Award,
  Calendar,
  AlertCircle,
  Loader2,
  Tag,
  Star,
  ArrowLeft
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/cards/ProductCard";
import RatingStars from "@/components/shared/RatingStars";
import ProductPrice from "@/components/shared/ProductPrice";
import { navLinks, footerColumns, socialLinks } from "../LandingPage/data/navigation";
import { bestSellingProducts, featuredProducts } from "../LandingPage/data/products";
import { useProduct } from "@/hooks/useProducts";
import { useAuth } from "@/providers/AuthProvider";
import { useCart } from "@/providers/CartProvider";
import { useWishlist } from "@/providers/WishlistProvider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SpecItem {
  label: string;
  value: string;
}

export default function ProductDetailPage() {
  const router = useRouter();
  const pathname = usePathname() || "";
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { wishlistItems, addToWishlist, removeFromWishlist } = useWishlist();

  // Extract productId from pathname: /product/[id]
  const productId = pathname.split("/product/")[1] || "";

  // Fetch product from hook
  const { product: apiProduct, loading: apiLoading, error: apiError, fetchProduct } = useProduct(productId);

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Gallery states
  const [activeImage, setActiveImage] = useState<string>("");
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});
  
  // Interactive checker states
  const [pincode, setPincode] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState<{
    checked: boolean;
    valid: boolean;
    message: string;
    deliveryDate?: string;
  } | null>(null);
  
  // Similar products state
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);

  // Active specifications tab (Flipkart style specs toggle)
  const [activeTab, setActiveTab] = useState<"description" | "specs" | "reviews">("description");

  // Dynamic promotion states
  const [activeOffers, setActiveOffers] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  // Load product
  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId, fetchProduct]);

  // Fetch active offers
  useEffect(() => {
    const fetchActiveOffers = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/offers?status=ACTIVE");
        if (response.ok) {
          const data = await response.json();
          setActiveOffers(data.offers || []);
        }
      } catch (err) {
        console.error("Failed to load offers:", err);
      }
    };
    fetchActiveOffers();
  }, []);

  // Filter applicable offers for the product
  const getProductBrand = (p: any): string => {
    if (p.eyebrow) return p.eyebrow.trim().toLowerCase();
    if (p.specs && Array.isArray(p.specs)) {
      const brandSpec = p.specs.find(
        (s: any) =>
          s.label?.toLowerCase() === "brand" ||
          s.label?.toLowerCase() === "manufacturer"
      );
      if (brandSpec && brandSpec.value) return brandSpec.value.trim().toLowerCase();
    }
    return p.name.split(" ")[0].toLowerCase();
  };

  const productBrand = product ? getProductBrand(product) : "";

  const applicableOffers = product ? activeOffers.filter((offer) => {
    const config = offer.configuration || {};
    const type = offer.offerType;

    if (type === "PRODUCT_DISCOUNT") {
      return Array.isArray(config.productIds) && config.productIds.includes(product.id);
    }
    if (type === "CATEGORY_DISCOUNT") {
      return Array.isArray(config.categoryIds) && config.categoryIds.includes(product.category);
    }
    if (type === "BRAND_DISCOUNT") {
      return String(config.brandName).trim().toLowerCase() === productBrand;
    }
    if (type === "QUANTITY_DISCOUNT") {
      const pMatch = !config.productIds || config.productIds.length === 0 || config.productIds.includes(product.id);
      const cMatch = !config.categoryIds || config.categoryIds.length === 0 || config.categoryIds.includes(product.category);
      return pMatch && cMatch;
    }
    if (type === "FLAT_DISCOUNT" || type === "PERCENTAGE_DISCOUNT") {
      const pMatch = !config.applicableProducts || config.applicableProducts.length === 0 || config.applicableProducts.includes(product.id);
      const cMatch = !config.applicableCategories || config.applicableCategories.length === 0 || config.applicableCategories.includes(product.category);
      return pMatch && cMatch;
    }
    if (type === "BOGO") {
      return config.buyProductId === product.id;
    }
    if (type === "COMBO") {
      return Array.isArray(config.productIds) && config.productIds.includes(product.id);
    }
    if (type === "BUNDLE") {
      return Array.isArray(config.bundleProducts) && config.bundleProducts.includes(product.id);
    }
    if (type === "FLASH_SALE") {
      return Array.isArray(config.productIds) && config.productIds.includes(product.id);
    }
    if (type === "SEASONAL") {
      const pMatch = !config.applicableProducts || config.applicableProducts.length === 0 || config.applicableProducts.includes(product.id);
      const cMatch = !config.applicableCategories || config.applicableCategories.length === 0 || config.applicableCategories.includes(product.category);
      return pMatch && cMatch;
    }
    if (type === "FREE_SHIPPING") {
      const pMatch = !config.applicableProducts || config.applicableProducts.length === 0 || config.applicableProducts.includes(product.id);
      const cMatch = !config.applicableCategories || config.applicableCategories.length === 0 || config.applicableCategories.includes(product.category);
      return pMatch && cMatch;
    }
    if (["COUPON", "NEW_USER", "LOYALTY"].includes(type)) {
      return true;
    }
    return false;
  }) : [];

  // Dynamic Client-side pricing engine for product page
  const getCalculatedPrice = () => {
    if (!product) return { price: 0, originalPrice: 0, discountPercent: 0, appliedOffer: null };
    
    // Original price is the baseline (strikethrough price)
    const baseOriginal = Number(product.originalPrice || product.price || 0);
    // Baseline starting price before dynamic offers
    let currentPrice = Number(product.price || 0);
    
    // Sort applicable offers by priority (lower number = runs first)
    const sortedDirectOffers = [...applicableOffers]
      .filter(offer => [
        "FLASH_SALE",
        "PRODUCT_DISCOUNT",
        "CATEGORY_DISCOUNT",
        "BRAND_DISCOUNT",
        "FLAT_DISCOUNT",
        "PERCENTAGE_DISCOUNT",
        "SEASONAL"
      ].includes(offer.offerType))
      .sort((a, b) => (a.priority || 0) - (b.priority || 0));
      
    let appliedOffer = null;
    let hasAppliedNonStackable = false;
    const appliedList: any[] = [];
    
    for (const offer of sortedDirectOffers) {
      const config = offer.configuration || {};
      
      // Check stackability rules
      if (hasAppliedNonStackable) continue;
      if (appliedList.some(o => !o.stackable)) continue;
      if (!offer.stackable && appliedList.length > 0) continue;
      
      // Evaluate discount amount
      let discountAmt = 0;
      const type = offer.offerType;
      
      if (type === "PRODUCT_DISCOUNT" || type === "CATEGORY_DISCOUNT" || type === "BRAND_DISCOUNT" || type === "FLASH_SALE" || type === "SEASONAL") {
        const discType = config.discountType || "PERCENTAGE";
        const discVal = Number(config.discountValue || 0);
        const maxCap = config.maxDiscountAmount ? Number(config.maxDiscountAmount) : null;
        
        if (discType === "PERCENTAGE") {
          discountAmt = currentPrice * (discVal / 100);
          if (maxCap) discountAmt = Math.min(discountAmt, maxCap);
        } else {
          discountAmt = discVal;
        }
      } else if (type === "FLAT_DISCOUNT") {
        const minVal = config.minPurchaseValue ? Number(config.minPurchaseValue) : 0;
        if (currentPrice >= minVal) {
          discountAmt = Number(config.flatDiscountAmount || 0);
        }
      } else if (type === "PERCENTAGE_DISCOUNT") {
        const minVal = config.minPurchaseValue ? Number(config.minPurchaseValue) : 0;
        if (currentPrice >= minVal) {
          const val = Number(config.percentageValue || 0);
          const maxCap = config.maxDiscountCap ? Number(config.maxDiscountCap) : null;
          discountAmt = currentPrice * (val / 100);
          if (maxCap) discountAmt = Math.min(discountAmt, maxCap);
        }
      }
      
      if (discountAmt > 0) {
        currentPrice = Math.max(0, currentPrice - discountAmt);
        appliedList.push(offer);
        if (!offer.stackable) hasAppliedNonStackable = true;
        if (!appliedOffer) {
          appliedOffer = offer;
        }
      }
    }
    
    // If no direct offer got applied, but there's a difference between standard price and originalPrice, keep that
    if (appliedList.length === 0) {
      const standardPrice = Number(product.price || 0);
      const discountPercent = baseOriginal > standardPrice ? Math.round(((baseOriginal - standardPrice) / baseOriginal) * 100) : 0;
      return {
        price: standardPrice,
        originalPrice: baseOriginal,
        discountPercent,
        appliedOffer: null
      };
    }
    
    const finalPrice = Math.round(currentPrice);
    const discountPercent = baseOriginal > finalPrice ? Math.round(((baseOriginal - finalPrice) / baseOriginal) * 100) : 0;
    
    return {
      price: finalPrice,
      originalPrice: baseOriginal,
      discountPercent,
      appliedOffer
    };
  };

  const calculated = getCalculatedPrice();

  const flashSaleOffer = applicableOffers.find((o) => o.offerType === "FLASH_SALE");

  // Flash Sale Countdown logic
  useEffect(() => {
    if (!flashSaleOffer) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const diff = new Date(flashSaleOffer.endDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft(null);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [flashSaleOffer]);

  const getOfferDisplay = (offer: any) => {
    if (offer.description) return offer.description;
    const config = offer.configuration || {};
    
    if (offer.offerType === "PRODUCT_DISCOUNT") {
      return `Special Product Discount: Get ${config.discountType === "PERCENTAGE" ? `${config.discountValue}%` : `₹${config.discountValue}`} off instantly.`;
    }
    if (offer.offerType === "CATEGORY_DISCOUNT") {
      return `Category Sale: Get ${config.discountType === "PERCENTAGE" ? `${config.discountValue}%` : `₹${config.discountValue}`} off on selected products.`;
    }
    if (offer.offerType === "BRAND_DISCOUNT") {
      return `Brand Offer: Get ${config.discountType === "PERCENTAGE" ? `${config.discountValue}%` : `₹${config.discountValue}`} off on ${config.brandName} models.`;
    }
    if (offer.offerType === "QUANTITY_DISCOUNT") {
      const bestRule = config.rules?.[0];
      return `Bulk Discount: Save more when you buy multiple items! ${bestRule ? `Get discount on orders above ${bestRule.minQty} units.` : ""}`;
    }
    if (offer.offerType === "CART_VALUE_DISCOUNT") {
      return `Cart Deal: Spend ₹${config.minCartValue || 0} or more and get ${config.discountType === "PERCENTAGE" ? `${config.discountValue}%` : `₹${config.discountValue}`} off your order.`;
    }
    if (offer.offerType === "COUPON") {
      return `Apply coupon code "${config.couponCode || offer.code}" at checkout for ${config.couponType === "PERCENTAGE" ? `${config.discountValue}%` : `₹${config.discountValue}`} discount.`;
    }
    if (offer.offerType === "FLAT_DISCOUNT") {
      return `Flat Discount: Get ₹${config.flatDiscountAmount} discount on this product.`;
    }
    if (offer.offerType === "PERCENTAGE_DISCOUNT") {
      return `Percentage Off: Get ${config.percentageValue}% discount on this product.`;
    }
    if (offer.offerType === "BOGO") {
      return `BOGO Offer: Buy ${config.buyQty} and get ${config.getQty} free of matching item!`;
    }
    if (offer.offerType === "COMBO") {
      return `Combo Deal: Buy these matched products together and get a special promotional pricing.`;
    }
    if (offer.offerType === "BUNDLE") {
      return `Bundle Save: Get a special bundle price of ₹${config.bundlePrice} when purchased with matching bundle appliances.`;
    }
    if (offer.offerType === "FLASH_SALE") {
      return `Flash Sale Live: Get ${config.discountType === "PERCENTAGE" ? `${config.discountValue}%` : `₹${config.discountValue}`} off! Limited stocks available.`;
    }
    if (offer.offerType === "SEASONAL") {
      return `Seasonal Special: Celebrate the season with ${config.discountType === "PERCENTAGE" ? `${config.discountValue}%` : `₹${config.discountValue}`} discount.`;
    }
    if (offer.offerType === "NEW_USER") {
      return `Welcome Offer: First order gets ${config.discountType === "PERCENTAGE" ? `${config.discountValue}%` : `₹${config.discountValue}`} discount.`;
    }
    if (offer.offerType === "LOYALTY") {
      return `Loyalty Reward: Special pricing for our ${config.membershipTier || "Valued"} customers.`;
    }
    if (offer.offerType === "FREE_SHIPPING") {
      return `Free Shipping: Get free shipping on order subtotals above ₹${config.minOrderValue || 0}.`;
    }
    return offer.name || "Special promotion available.";
  };

  // Sync API product or fallback to static data if offline
  useEffect(() => {
    if (!apiLoading) {
      if (apiProduct) {
        const actualProduct = (apiProduct as any).product || apiProduct;
        setProduct(actualProduct);
        setLoading(false);
      } else if (apiError || !apiProduct) {
        // Fallback to static products from LandlingPage mock list
        const fallback = bestSellingProducts.find(p => p.id === productId) ||
                         (featuredProducts as any[]).find(p => p.id === productId);
        if (fallback) {
          // Map to match model schema
          const priceVal = fallback.price || fallback.startingPrice || 6499;
          const mappedFallback = {
            ...fallback,
            price: priceVal,
            originalPrice: fallback.originalPrice || priceVal * 1.25,
            discountPercent: fallback.discountPercent || 20,
            productDescription: fallback.productDescription || fallback.description || "Our customer-favorite smart kitchen appliance designed for reliability, efficiency, and smart integrations.",
            categoryLabel: fallback.categoryLabel || "Featured Smart",
            category: fallback.category || "pressure-cookers",
            specs: Array.isArray(fallback.specs) && fallback.specs.length > 0 
              ? fallback.specs 
              : [
                  { label: "Capacity", value: fallback.capacity || "Standard" },
                  { label: "Warranty", value: fallback.warranty || "1 Year" },
                  { label: "Color", value: "Premium Silver & Black" },
                  { label: "Material", value: "Stainless Steel & ABS Food Grade" },
                  { label: "Power Source", value: "Electric AC 230V / 50Hz" }
                ],
            variantDetails: fallback.variantDetails || {
              Capacity: fallback.capacity || "Standard",
              Warranty: fallback.warranty || "1 Year"
            }
          };
          setProduct(mappedFallback);
          setLoading(false);
        } else {
          setLoading(false);
        }
      }
    }
  }, [apiProduct, apiLoading, apiError, productId]);

  // Sync images list once product is loaded
  useEffect(() => {
    if (product) {
      const list = product.images && product.images.length > 0
        ? product.images
        : (product.image ? [product.image] : ["/sd-smart-ecommerce/SD-logo.png"]);
      setImagesList(list);
      setActiveImage(list[0]);
    }
  }, [product]);

  // Fetch similar products
  useEffect(() => {
    if (product?.category) {
      const fetchSimilar = async () => {
        setSimilarLoading(true);
        try {
          const response = await fetch(`http://localhost:5000/api/products?category=${product.category}`);
          if (response.ok) {
            const data = await response.json();
            // Filter out current product
            const filtered = (data.products || []).filter((p: any) => p.id !== product.id);
            setSimilarProducts(filtered.slice(0, 4));
          } else {
            throw new Error();
          }
        } catch {
          // Static fallback
          const filteredStatic = bestSellingProducts.filter(p => p.category === product.category && p.id !== product.id);
          setSimilarProducts(filteredStatic.slice(0, 4));
        } finally {
          setSimilarLoading(false);
        }
      };
      fetchSimilar();
    }
  }, [product]);

  // Check wishlist state
  const isWishlisted = wishlistItems.some(item => item.productId === productId);

  // Handlers
  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to manage wishlist");
      router.push("/auth/login");
      return;
    }
    try {
      if (isWishlisted) {
        await removeFromWishlist(product.id);
        toast.success("Removed from wishlist");
      } else {
        await addToWishlist(product.id);
        toast.success("Added to wishlist");
      }
    } catch {
      toast.error("Wishlist operation failed");
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to add items to cart");
      router.push("/auth/login");
      return;
    }
    try {
      await addToCart(product.id, 1);
      toast.success("Added to cart successfully!");
    } catch {
      toast.error("Failed to add to cart");
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to buy items");
      router.push("/auth/login");
      return;
    }
    try {
      // Check if already in cart or add it
      await addToCart(product.id, 1);
      router.push("/checkout");
    } catch {
      toast.error("Failed to process Buy Now request");
    }
  };

  // Image Zoom handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: "scale(1.8)"
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({});
  };

  // Pincode validation check
  const handlePincodeCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pincode)) {
      setPincodeStatus({
        checked: true,
        valid: false,
        message: "Please enter a valid 6-digit postal code"
      });
      return;
    }

    // Dynamic mock date calculator
    const deliveryDays = Number(pincode[0]) % 2 === 0 ? 3 : 5;
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' };
    const dateString = deliveryDate.toLocaleDateString('en-US', options);

    setPincodeStatus({
      checked: true,
      valid: true,
      message: `Delivery available. Usually delivers in ${deliveryDays} days.`,
      deliveryDate: dateString
    });
  };

  // Parse specifications array safely
  const parsedSpecs = (() => {
    if (!product?.specs) return [];
    if (Array.isArray(product.specs)) return product.specs;
    if (typeof product.specs === "string") {
      try {
        return JSON.parse(product.specs);
      } catch {
        return [];
      }
    }
    return [];
  })();

  // Render Loader
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-white dark:bg-slate-950 font-sans">
        <Header navLinks={navLinks} />
        <div className="flex-grow flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-[#D71920] animate-spin" />
          <p className="mt-4 text-sm font-semibold text-slate-500 tracking-wider">Loading dynamic product details...</p>
        </div>
        <Footer footerColumns={footerColumns} socialLinks={socialLinks} />
      </div>
    );
  }

  // Render Error / Product Not Found
  if (!product) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-white dark:bg-slate-950 font-sans">
        <Header navLinks={navLinks} />
        <div className="flex-grow flex flex-col items-center justify-center py-20 px-4 text-center">
          <AlertCircle className="w-16 h-16 text-[#D71920] mb-4" />
          <h2 className="text-xl font-bold">Product Not Found</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-md">
            The smart appliance ID might be invalid or deleted from the admin dashboard database.
          </p>
          <div className="mt-6 flex gap-4">
            <Link
              href="/shop"
              className="px-5 py-2.5 bg-[#D71920] text-white text-xs font-bold rounded-xl hover:bg-[#b8141a] transition-all"
            >
              Back to Shop
            </Link>
            <button
              onClick={() => router.back()}
              className="px-5 py-2.5 border border-slate-200 dark:border-neutral-800 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-900 transition-all"
            >
              Go Back
            </button>
          </div>
        </div>
        <Footer footerColumns={footerColumns} socialLinks={socialLinks} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-neutral-200 font-sans transition-colors duration-300">
      <Header navLinks={navLinks} />

      {/* Main product box */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-widest mb-6">
          <Link href="/" className="hover:text-[#D71920]">Home</Link>
          <ChevronRight size={10} className="text-slate-450" />
          <Link href="/shop" className="hover:text-[#D71920]">Shop</Link>
          <ChevronRight size={10} className="text-slate-450" />
          <span className="hover:text-[#D71920]">{product.categoryLabel}</span>
          <ChevronRight size={10} className="text-slate-450" />
          <span className="text-slate-800 dark:text-neutral-250 truncate max-w-xs">{product.name}</span>
        </div>

        {/* Dynamic PDP Layout Grid */}
        <div className="bg-white dark:bg-slate-900/60 border border-slate-150 dark:border-slate-850 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            
            {/* ── LEFT COLUMN: Gallery & Actions ──────────────── */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="lg:sticky lg:top-[88px] flex flex-col space-y-4">
                
                {/* Image panel & Thumbnail Selector */}
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Vertical Thumbnails List */}
                  {imagesList.length > 1 && (
                    <div className="flex sm:flex-col flex-row gap-2 order-last sm:order-first overflow-x-auto sm:overflow-y-auto max-h-[400px] shrink-0 scrollbar-none py-1">
                      {imagesList.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveImage(img)}
                          className={cn(
                            "w-16 h-16 rounded-xl border-2 flex items-center justify-center p-1.5 bg-white dark:bg-slate-950 shadow-sm transition-all shrink-0 hover:scale-105",
                            activeImage === img
                              ? "border-[#D71920]"
                              : "border-slate-205 dark:border-slate-800"
                          )}
                        >
                          <img src={img} alt="thumbnail" className="w-full h-full object-contain" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Main Large Image Container */}
                  <div className="flex-grow relative aspect-square border border-slate-150 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 overflow-hidden flex items-center justify-center p-4 group">
                    <div
                      className="w-full h-full overflow-hidden cursor-zoom-in flex items-center justify-center"
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                    >
                      {activeImage && (
                        <img
                          src={activeImage}
                          alt={product.name}
                          style={zoomStyle}
                          className="w-full h-full object-contain transition-transform duration-100"
                        />
                      )}
                    </div>

                    {/* Wishlist Button Overlay */}
                    <button
                      onClick={handleWishlistToggle}
                      className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all z-10"
                      aria-label="Add to Wishlist"
                    >
                      <Heart
                        size={18}
                        className={cn(
                          isWishlisted
                            ? "fill-[#D71920] text-[#D71920]"
                            : "text-slate-600 dark:text-neutral-400"
                        )}
                      />
                    </button>

                    {/* Badge Overlay */}
                    {product.badge && (
                      <span className="absolute top-4 left-4 px-3 py-1 bg-[#D71920] text-white text-[10px] font-extrabold uppercase rounded-md tracking-wider shadow">
                        {product.badge}
                      </span>
                    )}
                  </div>
                </div>

                {/* Flipkart-Style Action Buttons */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <button
                    onClick={handleAddToCart}
                    disabled={!product.inStock || product.availableStock === 0}
                    className={cn(
                      "flex items-center justify-center gap-2 py-4 px-6 text-sm font-extrabold uppercase tracking-wide rounded-xl shadow-lg transition-all transform active:scale-98 cursor-pointer select-none",
                      product.inStock && product.availableStock !== 0
                        ? "bg-[#ff9f00] hover:bg-[#e68f00] text-white"
                        : "bg-slate-200 dark:bg-neutral-800 text-slate-400 cursor-not-allowed"
                    )}
                  >
                    <ShoppingCart size={18} />
                    <span>Add to Cart</span>
                  </button>

                  <button
                    onClick={handleBuyNow}
                    disabled={!product.inStock || product.availableStock === 0}
                    className={cn(
                      "flex items-center justify-center gap-2 py-4 px-6 text-sm font-extrabold uppercase tracking-wide rounded-xl shadow-lg transition-all transform active:scale-98 cursor-pointer select-none",
                      product.inStock && product.availableStock !== 0
                        ? "bg-[#fb641b] hover:bg-[#df5615] text-white"
                        : "bg-slate-300 dark:bg-neutral-850 text-slate-500 cursor-not-allowed"
                    )}
                  >
                    <Zap size={18} className="fill-current" />
                    <span>Buy Now</span>
                  </button>
                </div>

                {/* Stock Warning details */}
                {(!product.inStock || product.availableStock === 0) ? (
                  <p className="text-center text-xs font-bold text-[#D71920] flex items-center justify-center gap-1.5 mt-2 bg-red-50 dark:bg-red-950/20 py-2 rounded-lg border border-red-200/50">
                    <AlertCircle size={14} />
                    <span>This smart appliance is currently out of stock.</span>
                  </p>
                ) : (
                  product.availableStock && product.availableStock < 5 && (
                    <p className="text-center text-xs font-bold text-orange-500 flex items-center justify-center gap-1.5 mt-2 bg-orange-50 dark:bg-orange-950/10 py-2 rounded-lg border border-orange-200/50">
                      <AlertCircle size={14} />
                      <span>Hurry! Only {product.availableStock} items left in stock.</span>
                    </p>
                  )
                )}
              </div>
            </div>

            {/* ── RIGHT COLUMN: Content Info ────────────────── */}
            <div className="lg:col-span-7 flex flex-col space-y-6">
              
              {/* Product Header Info */}
              <div className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                <span className="text-[10px] font-extrabold text-[#D71920] tracking-widest uppercase dark:text-red-400">
                  {product.categoryLabel} Appliance
                </span>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug">
                  {product.name}
                </h1>
                
                {/* Rating badge */}
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-600 dark:bg-emerald-700 text-white text-xs font-extrabold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm">
                    <span>{product.rating || 5.0}</span>
                    <Star size={11} className="fill-current" />
                  </div>
                  <span className="text-xs font-semibold text-slate-400 dark:text-neutral-400">
                    {product.reviewCount || 0} Ratings & {Math.max(1, Math.round((product.reviewCount || 0) / 8))} Reviews
                  </span>
                  <span className="text-xs font-semibold text-[#D71920] dark:text-red-400 font-mono tracking-wide uppercase bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded">
                    SKU: {product.sku || product.productId}
                  </span>
                </div>
              </div>

              {/* Flash Sale Banner */}
              {flashSaleOffer && timeLeft && (
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-600 via-[#D71920] to-orange-500 text-white rounded-xl shadow-lg border border-red-500/20 select-none animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg text-yellow-300">
                      <Zap size={20} className="fill-current" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-yellow-300">Flash Sale Live!</p>
                      <p className="text-[10px] text-white/95 font-bold">{flashSaleOffer.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-white/80">Ends in:</span>
                    <div className="flex items-center gap-1 font-mono text-sm font-black bg-black/25 px-2.5 py-1.5 rounded-lg border border-white/10">
                      <span>{String(timeLeft.hours).padStart(2, "0")}h</span>
                      <span className="text-white/40">:</span>
                      <span>{String(timeLeft.minutes).padStart(2, "0")}m</span>
                      <span className="text-white/40">:</span>
                      <span className="text-red-300">{String(timeLeft.seconds).padStart(2, "0")}s</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing Panel */}
              <div className="space-y-1.5 p-4 rounded-xl bg-slate-50/50 dark:bg-neutral-900/30 border border-slate-100 dark:border-slate-850">
                <span className="text-3xs font-extrabold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider">Special Offer Price</span>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl font-black text-[#D71920] dark:text-red-400 tracking-tight">
                    ₹{calculated.price ? calculated.price.toLocaleString("en-IN") : "0"}
                  </span>
                  {calculated.originalPrice && calculated.price && calculated.originalPrice > calculated.price && (
                    <>
                      <span className="text-sm font-semibold text-slate-400 dark:text-neutral-450 line-through">
                        ₹{calculated.originalPrice ? calculated.originalPrice.toLocaleString("en-IN") : "0"}
                      </span>
                      <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-0.5 rounded">
                        {calculated.discountPercent}% Off
                      </span>
                    </>
                  )}
                </div>
                {calculated.appliedOffer && (
                  <div className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-450 mt-1.5 flex items-center gap-1.5 uppercase tracking-wide">
                    <Check size={12} className="stroke-[3]" />
                    <span>Promo Applied: {calculated.appliedOffer.name}</span>
                  </div>
                )}
                <p className="text-3xs text-slate-450 dark:text-neutral-500 font-semibold uppercase pt-1">Inclusive of all local gst and duties</p>
              </div>

              {/* Flipkart Offers List */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
                  <Tag size={12} className="text-[#D71920] rotate-90" />
                  <span>Available Offers</span>
                </h3>
                {applicableOffers.length > 0 ? (
                  <ul className="space-y-2.5">
                    {applicableOffers.map((offer, idx) => {
                      const displayMsg = getOfferDisplay(offer);
                      const isCoupon = offer.offerType === "COUPON";
                      return (
                        <li key={offer.id || idx} className="flex items-start gap-2.5 text-xs text-slate-650 dark:text-neutral-350 bg-slate-50/45 dark:bg-neutral-900/10 p-3 rounded-xl border border-slate-100/50 dark:border-neutral-900/30">
                          <Tag size={14} className={cn("shrink-0 mt-0.5", isCoupon ? "text-[#D71920]" : "text-emerald-600")} />
                          <div className="flex-1">
                            <strong className="text-slate-800 dark:text-white">
                              {offer.offerType.replace(/_/g, " ")}:{" "}
                            </strong>
                            <span>{displayMsg}</span>
                            {offer.termsConditions && (
                              <span className="text-[#D71920] dark:text-red-400 font-bold hover:underline cursor-pointer ml-1.5" title={offer.termsConditions}>
                                T&C
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-450 dark:text-neutral-500 italic p-3 border border-dashed border-slate-200 dark:border-neutral-800 rounded-xl text-center">
                    No special promotions are currently running on this product.
                  </p>
                )}
              </div>

              {/* Variant Selector Attributes */}
              {product.variantDetails && typeof product.variantDetails === "object" && Object.keys(product.variantDetails).length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 dark:text-neutral-400">
                    Appliance Specs & Variants
                  </h3>
                  <div className="flex flex-col gap-4">
                    {Object.entries(product.variantDetails).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-4">
                        <span className="w-24 text-xs font-bold text-slate-450 dark:text-neutral-500 uppercase">{key}:</span>
                        <div className="flex gap-2">
                          <span className="px-3.5 py-1.5 text-xs font-extrabold text-[#D71920] bg-red-50 dark:bg-red-950/20 border border-[#D71920]/40 rounded-lg">
                            {String(val)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery Pincode Checker */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 dark:text-neutral-400 flex items-center gap-1">
                  <MapPin size={12} className="text-[#D71920]" />
                  <span>Delivery & PIN Checker</span>
                </h3>
                
                <form onSubmit={handlePincodeCheck} className="flex items-center max-w-sm gap-2">
                  <div className="relative flex-grow">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                      placeholder="Enter 6-digit Pincode"
                      className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#D71920]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#D71920] hover:bg-[#b8141a] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Check
                  </button>
                </form>

                {/* Display checked status info */}
                {pincodeStatus && (
                  <div className={cn(
                    "p-3 rounded-lg border text-xs max-w-sm animate-in fade-in slide-in-from-top-1 duration-200",
                    pincodeStatus.valid
                      ? "bg-emerald-50/50 border-emerald-100 text-emerald-800 dark:bg-emerald-950/10 dark:border-emerald-900/30 dark:text-emerald-400"
                      : "bg-red-50/50 border-red-100 text-red-800 dark:bg-red-950/10 dark:border-red-900/30 dark:text-red-400"
                  )}>
                    <div className="flex items-start gap-2">
                      {pincodeStatus.valid ? (
                        <Check size={14} className="shrink-0 text-emerald-600 mt-0.5" />
                      ) : (
                        <AlertCircle size={14} className="shrink-0 text-red-600 mt-0.5" />
                      )}
                      <div>
                        <p className="font-bold">{pincodeStatus.message}</p>
                        {pincodeStatus.deliveryDate && (
                          <p className="mt-1 text-slate-500 dark:text-neutral-400 text-[11px]">
                            Delivering by <span className="font-extrabold text-slate-700 dark:text-neutral-300">{pincodeStatus.deliveryDate}</span> | <span className="text-emerald-600 dark:text-emerald-450 font-bold">Free Shipping</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Warranty and Services Highlight */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-neutral-900/20 border border-slate-100/50 dark:border-slate-850">
                  <ShieldCheck size={28} className="text-[#D71920] shrink-0" />
                  <div className="text-left">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase">Warranty</p>
                    <p className="text-xs font-bold text-slate-850 dark:text-neutral-200">{product.warranty || "1 Year Warranty"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-neutral-900/20 border border-slate-100/50 dark:border-slate-850">
                  <Award size={28} className="text-[#D71920] shrink-0" />
                  <div className="text-left">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase">Quality</p>
                    <p className="text-xs font-bold text-slate-850 dark:text-neutral-200">100% Genuine Brand</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-neutral-900/20 border border-slate-100/50 dark:border-slate-850">
                  <Calendar size={28} className="text-[#D71920] shrink-0" />
                  <div className="text-left">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase">Return</p>
                    <p className="text-xs font-bold text-slate-850 dark:text-neutral-200">14-Day Free Returns</p>
                  </div>
                </div>
              </div>

              {/* ── Tabs for Description & Specs ─────────────── */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex border-b border-slate-150 dark:border-slate-850">
                  <button
                    onClick={() => setActiveTab("description")}
                    className={cn(
                      "pb-3 text-xs font-extrabold uppercase tracking-wider border-b-2 px-1 mr-8 transition-colors cursor-pointer",
                      activeTab === "description"
                        ? "border-[#D71920] text-[#D71920] dark:text-red-400"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    )}
                  >
                    Description
                  </button>
                  <button
                    onClick={() => setActiveTab("specs")}
                    className={cn(
                      "pb-3 text-xs font-extrabold uppercase tracking-wider border-b-2 px-1 mr-8 transition-colors cursor-pointer",
                      activeTab === "specs"
                        ? "border-[#D71920] text-[#D71920] dark:text-red-400"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    )}
                  >
                    Specifications
                  </button>
                </div>

                <div className="mt-4 min-h-[140px] text-xs">
                  {/* Tab 1: Description */}
                  {activeTab === "description" && (
                    <div className="space-y-3 leading-relaxed text-slate-600 dark:text-neutral-350">
                      {product.productDescription ? (
                        product.productDescription.split("\n").map((para: string, idx: number) => (
                          <p key={idx}>{para}</p>
                        ))
                      ) : (
                        <p>Experience standard, high-efficiency kitchen operation with the all-new {product.name}. Designed with modern engineering, this appliance focuses on speed, safety, and durability.</p>
                      )}
                    </div>
                  )}

                  {/* Tab 2: Specifications Table */}
                  {activeTab === "specs" && (
                    <div className="border border-slate-150 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                      {parsedSpecs.length > 0 ? (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                          {parsedSpecs.map((spec: SpecItem) => (
                            <div key={spec.label} className="grid grid-cols-1 sm:grid-cols-3 p-3.5 hover:bg-slate-50/50 dark:hover:bg-neutral-900/10 transition-colors">
                              <span className="font-extrabold text-slate-450 dark:text-neutral-500 uppercase tracking-wider sm:col-span-1">{spec.label}</span>
                              <span className="font-bold text-slate-750 dark:text-neutral-250 sm:col-span-2 mt-1 sm:mt-0">{spec.value}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-slate-400">
                          No specific technical specifications are defined for this model.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* ── SIMILAR PRODUCTS SECTION ────────────────────── */}
        <section className="mt-12 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-neutral-800 pb-3">
            <h2 className="text-lg font-black text-slate-850 dark:text-white tracking-tight uppercase">
              Similar Appliances You May Like
            </h2>
            <Link
              href={`/shop?category=${product.category}`}
              className="text-xs font-extrabold text-[#D71920] hover:text-[#b8141a] hover:underline uppercase tracking-wider flex items-center gap-0.5"
            >
              <span>View All</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          {similarLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-8 h-8 text-[#D71920] animate-spin" />
            </div>
          ) : similarProducts.length === 0 ? (
            <p className="text-center text-xs text-slate-450 py-8">
              No matching similar smart appliances found.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {similarProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>

      </main>

      <Footer footerColumns={footerColumns} socialLinks={socialLinks} />
    </div>
  );
}
