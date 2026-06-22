"use client";

import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
// import { announcements } from "../LandingPage/data/announcements";
import { navLinks, footerColumns, socialLinks } from "../LandingPage/data/navigation";
import { ShoppingBag, ArrowRight, Trash2, Minus, Plus, ShieldCheck, Check } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/providers/CartProvider";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function CartPage() {
  const { cartItems, cartTotal, cartCount, updateQuantity, removeFromCart, isLoading } = useCart();
  const [excludedItems, setExcludedItems] = useState<Set<string>>(new Set());

  const toggleExclude = (id: string) => {
    setExcludedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const includedItems = cartItems.filter(item => !excludedItems.has(item.id));
  const calculatedCartCount = includedItems.reduce((acc, item) => acc + item.quantity, 0);
  const calculatedCartTotal = includedItems.reduce((acc, item) => acc + ((item.product?.price || 0) * item.quantity), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 font-sans">
        <Header navLinks={navLinks} />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-neutral-500 font-semibold text-sm animate-pulse">Loading cart...</p>
        </main>
        <Footer footerColumns={footerColumns} socialLinks={socialLinks} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 font-sans">
      {/* <AnnouncementBar announcements={announcements} /> */}
      <Header navLinks={navLinks} />

      <main className={cn("flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full", cartItems.length === 0 && "text-center flex flex-col items-center justify-center")}>
        {cartItems.length === 0 ? (
          <div className="max-w-md">
            <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-6 text-neutral-400">
              <ShoppingBag size={28} />
            </div>
            <h1 className="text-2xl font-black text-[#1C1C1C] mb-2">
              Your Cart is Empty
            </h1>
            <p className="text-sm text-neutral-500 leading-relaxed mb-8">
              You haven't added any SD SMART appliances to your cart yet. Explore our range and find the perfect upgrade for your kitchen.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-[#D71920] hover:bg-[#b8141a] text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
            >
              Start Shopping <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* LEFT SECTION (70%) */}
            <div className="flex-1 lg:w-[70%] space-y-4">
              <h1 className="text-2xl font-black text-[#1C1C1C] mb-6 border-b border-neutral-100 pb-4">
                Your Cart ({cartCount} {cartCount === 1 ? 'item' : 'items'})
              </h1>
              <div className="space-y-4">
                {cartItems.map((item) => {
                  const product = item.product || {};
                  return (
                    <div key={item.id} className="flex gap-4 p-4 border border-neutral-100 rounded-2xl bg-white hover:border-neutral-200 transition-colors shadow-sm">
                      {/* Product Image */}
                      <div className="w-24 h-24 sm:w-32 sm:h-32 bg-neutral-50 rounded-xl flex items-center justify-center p-2 flex-shrink-0">
                        <img 
                          src={product.image || product.images?.[0] || "/sd-smart-ecommerce/SD-logo.png"} 
                          alt={product.name || "Product"} 
                          className="w-full h-full object-contain mix-blend-multiply" 
                        />
                      </div>
                      
                      {/* Product Details */}
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <p className="text-[10px] font-bold text-[#D71920] uppercase tracking-widest mb-1">
                            {product.categoryLabel || product.category || "Appliance"}
                          </p>
                          <Link href={`/shop/${product.id || '#'}`} className="hover:text-[#D71920] transition-colors">
                            <h3 className="text-sm sm:text-base font-bold text-[#1C1C1C] leading-snug line-clamp-2">
                              {product.name || "Unknown Product"}
                            </h3>
                          </Link>

                          {/* Features / Specifications */}
                          {product.variantDetails && typeof product.variantDetails === 'object' && Object.keys(product.variantDetails).length > 0 && (
                            <div className="mt-2.5 flex flex-wrap gap-2">
                              {Object.entries(product.variantDetails).slice(0, 3).map(([key, value], index) => (
                                <span key={index} className="inline-flex items-center px-2 py-1 rounded bg-neutral-50 border border-neutral-100 text-[10px] font-semibold text-neutral-500">
                                  {key}: {String(value)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-end justify-between mt-4 gap-3">
                          <div className="flex flex-col">
                            <span className="text-xs text-neutral-500 font-medium mb-0.5">Price</span>
                            <span className="font-bold text-[#1C1C1C] text-base">₹{(product.price || 0).toLocaleString('en-IN')}</span>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            {/* Quantity Selector */}
                            <div className="flex items-center border border-neutral-200 rounded-xl bg-neutral-50 overflow-hidden h-9">
                              <button 
                                onClick={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : undefined} 
                                disabled={item.quantity <= 1}
                                className={cn(
                                  "w-8 h-full flex items-center justify-center transition-colors",
                                  item.quantity <= 1 ? "text-neutral-300 cursor-not-allowed bg-neutral-100" : "text-neutral-500 hover:bg-neutral-200 hover:text-[#1C1C1C]"
                                )}
                              >
                                <Minus size={14} />
                              </button>
                              <input 
                                type="number" 
                                value={item.quantity} 
                                onChange={(e) => { 
                                  const val = parseInt(e.target.value); 
                                  if (!isNaN(val) && val > 0) {
                                    updateQuantity(item.id, val); 
                                  }
                                }} 
                                onBlur={(e) => {
                                  const val = parseInt(e.target.value);
                                  if (isNaN(val) || val <= 0) {
                                    updateQuantity(item.id, 1);
                                  }
                                }}
                                min="1"
                                className="w-10 h-full text-center bg-transparent text-sm font-bold focus:outline-none appearance-none" 
                              />
                              <button 
                                onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                                className="w-8 h-full flex items-center justify-center text-neutral-500 hover:bg-neutral-200 hover:text-[#1C1C1C] transition-colors"
                              >
                                <Plus size={14} />
                              </button>
                            </div>

                            {/* Subtotal & Remove */}
                            <div className="flex items-center gap-3 ml-2 sm:ml-4 border-l border-neutral-100 pl-3 sm:pl-4">
                              <div className="flex flex-col hidden sm:flex">
                                <span className="text-[10px] text-neutral-400 font-medium uppercase">Subtotal</span>
                                <span className="font-bold text-[#1C1C1C]">₹{((product.price || 0) * item.quantity).toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => toggleExclude(item.id)}
                                  className={cn(
                                    "w-5 h-5 flex items-center justify-center rounded border transition-colors cursor-pointer",
                                    !excludedItems.has(item.id) 
                                      ? "bg-[#D71920] border-[#D71920] text-white" 
                                      : "bg-white border-neutral-300 text-transparent hover:border-[#D71920]"
                                  )}
                                  title={!excludedItems.has(item.id) ? "Included in order summary" : "Excluded from order summary"}
                                >
                                  <Check size={12} strokeWidth={3} className={cn("transition-opacity", !excludedItems.has(item.id) ? "opacity-100" : "opacity-0")} />
                                </button>
                                <button 
                                  onClick={() => removeFromCart(item.id)} 
                                  className="w-9 h-9 flex items-center justify-center rounded-xl text-neutral-400 hover:text-[#D71920] hover:bg-red-50 transition-colors" 
                                  title="Remove item"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT SECTION (30%) */}
            <div className="lg:w-[30%]">
              <div className="sticky top-28 bg-white rounded-2xl p-6 border border-neutral-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h2 className="text-lg font-bold text-[#1C1C1C] mb-6">Order Summary</h2>
                
                <div className="space-y-3.5 mb-6 text-sm">
                  <div className="flex justify-between items-center text-neutral-600 font-medium">
                    <span>Total Products</span>
                    <span className="font-bold text-[#1C1C1C] bg-neutral-100 px-2 py-0.5 rounded-md">{includedItems.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-neutral-600 font-medium">
                    <span>Total Quantity</span>
                    <span className="font-bold text-[#1C1C1C]">{calculatedCartCount} units</span>
                  </div>
                  <div className="flex justify-between items-center text-neutral-600 font-medium pt-2">
                    <span>Subtotal</span>
                    <span className="font-bold text-[#1C1C1C]">₹{calculatedCartTotal.toLocaleString('en-IN')}</span>
                  </div>
                  {/* Mock discount for visual completeness, could be dynamic later */}
                  <div className="flex justify-between items-center text-[#22c55e] font-medium">
                    <span>Discount</span>
                    <span className="font-bold">-₹0</span>
                  </div>
                </div>

                <div className="border-t border-neutral-100 border-dashed pt-4 mb-6">
                  <div className="flex justify-between items-end">
                    <span className="font-bold text-[#1C1C1C] text-base">Grand Total</span>
                    <span className="text-2xl font-black text-[#D71920] tracking-tight">₹{calculatedCartTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1 text-right">Inclusive of all taxes</p>
                </div>

                <Link href="/checkout" className="w-full relative group overflow-hidden bg-[#1C1C1C] hover:bg-black text-white py-4 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg shadow-black/10 flex items-center justify-center gap-2 cursor-pointer">
                  <span className="relative z-10">Proceed to Checkout</span>
                  <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 h-full w-0 bg-[#D71920] transition-all duration-300 ease-out group-hover:w-full z-0"></div>
                </Link>
                
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-500 font-medium">
                  <ShieldCheck size={14} className="text-green-600" />
                  <span>Secure Checkout Guaranteed</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer footerColumns={footerColumns} socialLinks={socialLinks} />
    </div>
  );
}
