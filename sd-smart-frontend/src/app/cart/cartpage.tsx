"use client";

import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
// import { announcements } from "../LandingPage/data/announcements";
import { navLinks, footerColumns, socialLinks } from "../LandingPage/data/navigation";
import { ShoppingBag, ArrowRight, Trash2, Minus, Plus, ShieldCheck, Check, Truck, Tag, CheckCircle2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/providers/CartProvider";
import { useAuth } from "@/providers/AuthProvider";
import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo, useRef } from "react";

export default function CartPage() {
  const { cartItems, cartTotal, cartCount, updateQuantity, removeFromCart, isLoading } = useCart();
  const { user } = useAuth();
  const isDistributor = user && (user.role?.toUpperCase() === "DISTRIBUTOR" || user.role === "distributor");
  const [excludedItems, setExcludedItems] = useState<Set<string>>(new Set());
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);
  const [dbThreshold, setDbThreshold] = useState<number>(10000);

  useEffect(() => {
    fetch("http://localhost:5000/api/settings")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings && data.settings.freeShippingThreshold) {
          setDbThreshold(Number(data.settings.freeShippingThreshold));
        }
      })
      .catch(err => console.error("Failed to load settings in cartpage:", err));
  }, []);

  const isItemOutOfStock = (item: any) => {
    const product = item.product || {};
    return !product.inStock || (product.availableStock !== undefined && product.availableStock <= 0);
  };

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

  // Memoized so the array reference is stable — prevents useEffect infinite loop
  const includedItems = useMemo(
    () => cartItems.filter(item => !excludedItems.has(item.id) && !isItemOutOfStock(item)),
    [cartItems, excludedItems]
  );
  const calculatedCartCount = calculationResult
    ? calculationResult.items.reduce((acc: number, item: any) => acc + item.quantity, 0)
    : includedItems.reduce((acc, item) => acc + item.quantity, 0);
  const calculatedCartTotal = includedItems.reduce((acc, item) => acc + ((item.product?.price || 0) * item.quantity), 0);

  // Stable string key — useEffect only fires when actual cart content changes
  const cartKey = useMemo(
    () => includedItems.map(i => `${i.productId}:${i.quantity}`).join(','),
    [includedItems]
  );

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (includedItems.length === 0) {
      setCalculationResult(null);
      setCalculating(false);
      return;
    }

    let cancelled = false;

    // Debounce: wait 300ms after last change before firing the API call
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      setCalculating(true);
      try {
        const token = localStorage.getItem("authToken");
        const bodyItems = includedItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }));
        
        const response = await fetch("http://localhost:5000/api/offers/calculate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ items: bodyItems })
        });
        
        if (response.ok && !cancelled) {
          const data = await response.json();
          setCalculationResult(data);
        }
      } catch (err) {
        if (!cancelled) console.error("Failed to calculate cart pricing:", err);
      } finally {
        if (!cancelled) setCalculating(false);
      }
    }, 300);

    // Cleanup: ignore stale responses and clear pending timer
    return () => {
      cancelled = true;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  // cartKey is the stable primitive that represents the cart contents
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartKey]);

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
                  const isOutOfStock = isItemOutOfStock(item);
                  const matchedCalcItem = calculationResult?.items?.find((ci: any) => ci.productId === product.id);
                  const isDiscounted = matchedCalcItem && matchedCalcItem.unitPrice < matchedCalcItem.originalPrice;
                  return (
                    <div key={item.id} className="flex gap-4 p-4 border border-neutral-200 rounded-2xl bg-white hover:border-neutral-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 shadow-sm relative group">
                      {/* Clickable Area for Redirect */}
                      <Link href={`/product/${product.id || '#'}`} className="absolute inset-0 z-0 cursor-pointer" />

                      {/* Product Image */}
                      <Link href={`/product/${product.id || '#'}`} className="w-24 h-24 sm:w-32 sm:h-32 bg-neutral-50 rounded-xl flex items-center justify-center p-2 flex-shrink-0 relative z-10 hover:opacity-90 transition-opacity">
                        <img 
                          src={product.image || product.images?.[0] || "/sd-smart-ecommerce/SD-logo.png"} 
                          alt={product.name || "Product"} 
                          className="w-full h-full object-contain mix-blend-multiply" 
                        />
                      </Link>
                      
                      {/* Product Details */}
                      <div className="flex-1 flex flex-col justify-between py-1 relative z-10 pointer-events-none">
                        <div>
                          <p className="text-[10px] font-bold text-[#D71920] uppercase tracking-widest mb-1">
                            {product.categoryLabel || product.category || "Appliance"}
                          </p>
                          <Link href={`/product/${product.id || '#'}`} className="hover:text-[#D71920] transition-colors pointer-events-auto">
                            <h3 className="text-sm sm:text-base font-bold text-[#1C1C1C] leading-snug line-clamp-2">
                              {product.name || "Unknown Product"}
                            </h3>
                          </Link>

                          {isOutOfStock && (
                            <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded bg-red-55 border border-red-150 text-[10px] font-extrabold text-[#D71920] w-fit">
                              Out of Stock
                            </span>
                          )}

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

                          {/* Dynamic Item Level Applied Offers */}
                          {(() => {
                            if (!isOutOfStock && matchedCalcItem?.appliedOffers && matchedCalcItem.appliedOffers.length > 0) {
                              return (
                                <div className="mt-2.5 flex flex-col gap-1.5">
                                  {matchedCalcItem.appliedOffers.map((o: any, oIdx: number) => (
                                    <div key={oIdx} className="flex flex-col gap-0.5">
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-emerald-50 border border-emerald-150 text-[10px] font-extrabold text-emerald-700 w-fit">
                                        {o.name}: -₹{o.discountAmount.toLocaleString('en-IN')}
                                      </span>
                                      {o.bogoDescription && (
                                        <p className="text-[10px] text-emerald-600 font-bold ml-1">
                                          ✓ {o.bogoDescription}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-end justify-between mt-4 gap-3 pointer-events-auto">
                          <div className="flex flex-col">
                            <span className="text-xs text-neutral-500 font-medium mb-0.5">Price</span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-[#1C1C1C] text-base">
                                ₹{(matchedCalcItem ? matchedCalcItem.unitPrice : (product.price || 0)).toLocaleString('en-IN')}
                              </span>
                              {isDiscounted && !isOutOfStock && (
                                <>
                                  <span className="text-xs text-neutral-400 line-through">
                                    ₹{matchedCalcItem.originalPrice.toLocaleString('en-IN')}
                                  </span>
                                  <span className="text-[10px] font-extrabold text-[#388e3c] bg-green-50 dark:bg-green-950/20 px-1.5 py-0.5 rounded border border-green-150 shrink-0">
                                    {Math.round(((matchedCalcItem.originalPrice - matchedCalcItem.unitPrice) / matchedCalcItem.originalPrice) * 100)}% OFF
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            {/* Quantity Selector */}
                            <div className={cn(
                              "flex items-center border border-neutral-200 rounded-xl bg-neutral-50 overflow-hidden h-9",
                              isOutOfStock && "opacity-40 pointer-events-none"
                            )}>
                              <button 
                                onClick={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : undefined} 
                                disabled={item.quantity <= 1 || isOutOfStock}
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
                                disabled={isOutOfStock}
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
                                disabled={isOutOfStock}
                                className="w-8 h-full flex items-center justify-center text-neutral-500 hover:bg-neutral-200 hover:text-[#1C1C1C] transition-colors"
                              >
                                <Plus size={14} />
                              </button>
                            </div>

                            {/* Actions / Remove */}
                            <div className="flex items-center gap-3 ml-2 sm:ml-4">
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => !isOutOfStock && toggleExclude(item.id)}
                                  disabled={isOutOfStock}
                                  className={cn(
                                    "w-5 h-5 flex items-center justify-center rounded border transition-colors",
                                    isOutOfStock 
                                      ? "bg-neutral-100 border-neutral-200 text-transparent cursor-not-allowed" 
                                      : !excludedItems.has(item.id) 
                                        ? "bg-[#D71920] border-[#D71920] text-white cursor-pointer" 
                                        : "bg-white border-neutral-300 text-transparent hover:border-[#D71920] cursor-pointer"
                                  )}
                                  title={isOutOfStock ? "Out of stock items cannot be included" : (!excludedItems.has(item.id) ? "Included in order summary" : "Excluded from order summary")}
                                >
                                  <Check size={12} strokeWidth={3} className={cn("transition-opacity", (!excludedItems.has(item.id) && !isOutOfStock) ? "opacity-100" : "opacity-0")} />
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
                <h2 className="text-lg font-bold text-[#1C1C1C] mb-4">
                  {isDistributor ? "Order Request Summary" : "Order Summary"}
                </h2>

                {/* Smart Delivery Banner */}
                {!isDistributor && (() => {
                  const deliveryInfo = calculationResult?.deliveryInfo;
                  const effectiveDC = calculationResult ? calculationResult.summary.deliveryCharges : (calculatedCartTotal >= dbThreshold ? 0 : 200);
                  const isFree = effectiveDC === 0;
                  const needed = deliveryInfo ? deliveryInfo.amountNeededForFreeDelivery : Math.max(0, dbThreshold - calculatedCartTotal);
                  const threshold = deliveryInfo?.freeDeliveryThreshold ?? dbThreshold;
                  const progress = Math.min(100, ((threshold - needed) / threshold) * 100);
                  const fsProductIds: string[] = deliveryInfo?.freeShippingProductIds ?? [];
                  return (
                    <div className={`mb-5 rounded-2xl border overflow-hidden ${
                      isFree
                        ? "border-green-200 bg-gradient-to-br from-green-50 to-emerald-50"
                        : "border-orange-100 bg-gradient-to-br from-orange-50/60 to-amber-50/40"
                    }`}>
                      <div className="px-4 pt-3.5 pb-2">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Truck size={15} className={isFree ? "text-green-600" : "text-orange-500"} />
                            <span className={`text-xs font-extrabold uppercase tracking-wider ${
                              isFree ? "text-green-700" : "text-orange-600"
                            }`}>
                              {isFree ? "Free Delivery! 🎉" : "Free Delivery"}
                            </span>
                          </div>
                          {!isFree && (
                            <span className="text-[10px] font-bold text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full">
                              +₹{needed.toLocaleString('en-IN')} away
                            </span>
                          )}
                        </div>
                        {!isFree && (
                          <>
                            <div className="w-full h-1.5 bg-orange-100 rounded-full overflow-hidden mb-1.5">
                              <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-400 transition-all duration-700" style={{ width: `${progress}%` }} />
                            </div>
                            <p className="text-[11px] text-orange-600 font-medium">
                              Add <strong>₹{needed.toLocaleString('en-IN')}</strong> more for <strong>FREE delivery</strong> (above ₹{threshold.toLocaleString('en-IN')})
                            </p>
                          </>
                        )}
                        {isFree && deliveryInfo?.freeDeliveryReason && (
                          <p className="text-[11px] text-green-600 font-medium">{deliveryInfo.freeDeliveryReason}</p>
                        )}
                      </div>
                      {fsProductIds.length > 0 && (
                        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                          {includedItems
                            .filter(item => fsProductIds.includes(item.productId))
                            .map(item => (
                              <span key={item.productId} className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-full">
                                <Tag size={9} />
                                {item.product?.name?.split(' ').slice(0, 3).join(' ')} — Free Ship
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
                
                <div className="space-y-3.5 mb-6 text-sm">
                  <div className="flex justify-between items-center text-neutral-600 font-medium">
                    <span>Total Products</span>
                    <span className="font-bold text-[#1C1C1C] bg-neutral-100 px-2 py-0.5 rounded-md">{includedItems.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-neutral-600 font-medium">
                    <span>Total Quantity</span>
                    <span className="font-bold text-[#1C1C1C]">{calculatedCartCount} units</span>
                  </div>
                  {!isDistributor && (
                    <>
                      <div className="flex justify-between items-center text-neutral-600 font-medium pt-2">
                        <span>Subtotal</span>
                        <span className="font-bold text-[#1C1C1C]">
                          ₹{(calculationResult ? calculationResult.summary.originalSubtotal : calculatedCartTotal).toLocaleString('en-IN')}
                        </span>
                      </div>
                      {calculationResult && calculationResult.summary.totalDiscounts > 0 && (
                        <div className="flex justify-between items-center text-[#22c55e] font-medium">
                          <span>Total Savings</span>
                          <span className="font-bold">-₹{calculationResult.summary.totalDiscounts.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      {(() => {
                        const effectiveDC = calculationResult ? calculationResult.summary.deliveryCharges : (calculatedCartTotal >= dbThreshold ? 0 : 200);
                        const isFree = effectiveDC === 0;
                        return (
                          <div className={`flex justify-between items-center font-medium ${ isFree ? 'text-green-600' : 'text-neutral-600' }`}>
                            <div className="flex items-center gap-1.5">
                              <Truck size={13} className={isFree ? "text-green-500" : "text-neutral-400"} />
                              <span>Delivery Charges</span>
                            </div>
                            <span className="font-bold">
                              {isFree
                                ? <span className="flex items-center gap-1">FREE <CheckCircle2 size={12} className="text-green-500" /></span>
                                : `₹${effectiveDC.toLocaleString('en-IN')}`}
                            </span>
                          </div>
                        );
                      })()}
                      {calculationResult && (calculationResult.summary.cgst + calculationResult.summary.sgst) > 0 && (
                        <div className="flex justify-between items-center text-neutral-500 text-xs">
                          <span>GST (18%)</span>
                          <span className="font-semibold text-neutral-700">₹{(calculationResult.summary.cgst + calculationResult.summary.sgst).toLocaleString('en-IN')}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {!isDistributor && (
                  <div className="border-t border-neutral-100 border-dashed pt-4 mb-6">
                    <div className="flex justify-between items-end">
                      <span className="font-bold text-[#1C1C1C] text-base">Grand Total</span>
                      <span className="text-2xl font-black text-[#D71920] tracking-tight">
                        ₹{(calculationResult ? calculationResult.summary.grandTotal : calculatedCartTotal).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-1 text-right">Inclusive of all taxes</p>
                  </div>
                )}

                {!isDistributor && calculationResult?.appliedOffers && calculationResult.appliedOffers.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-neutral-100 border-dashed space-y-2">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">Applied Campaigns & Offers</p>
                    <div className="flex flex-col gap-1.5">
                      {calculationResult.appliedOffers.map((offer: any) => (
                        <div key={offer.offerId} className="flex items-center justify-between gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50/60 p-2 rounded-xl border border-emerald-100/50">
                          <Check size={12} className="text-emerald-600 shrink-0" />
                          <span>{offer.name} {offer.code ? `(${offer.code})` : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {user && (user.role?.toUpperCase() === "DISTRIBUTOR" || user.role === "distributor") && user.approvalStatus?.toUpperCase() !== "APPROVED" ? (
                  <div className="space-y-3 w-full">
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs text-amber-800 dark:text-amber-300 font-medium leading-relaxed text-left flex items-start gap-2">
                      <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        {user.approvalStatus?.toUpperCase() === "REJECTED" 
                          ? "Your distributor application has been rejected. Please contact support."
                          : "Your distributor account is currently under review. Please wait for admin approval before placing orders."
                        }
                      </span>
                    </div>
                    <button disabled className="w-full bg-neutral-200 dark:bg-slate-800 text-neutral-400 dark:text-slate-500 py-4 rounded-xl font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2">
                      <span>Checkout Disabled</span>
                    </button>
                  </div>
                ) : (
                  <Link href="/checkout" className="w-full relative group overflow-hidden bg-[#1C1C1C] hover:bg-black text-white py-4 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg shadow-black/10 flex items-center justify-center gap-2 cursor-pointer">
                    <span className="relative z-10">Proceed to Checkout</span>
                    <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                    <div className="absolute inset-0 h-full w-0 bg-[#D71920] transition-all duration-300 ease-out group-hover:w-full z-0"></div>
                  </Link>
                )}
                
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
