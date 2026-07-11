"use client";

import { useState, useEffect, useMemo } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { navLinks, footerColumns, socialLinks } from "../LandingPage/data/navigation";
import { useCart } from "@/providers/CartProvider";
import { useAuth } from "@/providers/AuthProvider";
import { checkoutService } from "@/services/checkoutService";
import { Address, CreateAddressRequest, Order } from "@/types/api";
import { cn } from "@/lib/utils";
import { CheckCircle2, Building2, MapPin, CreditCard, Banknote, ShieldCheck, Plus, ArrowRight, Loader2, Truck, Package, Tag, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, isLoading: isCartLoading, clearCart } = useCart();
  const { isAuthenticated, loading: isAuthLoading, user } = useAuth();

  const inStockCartItems = useMemo(() => {
    return cartItems.filter(item => item.product?.inStock && (item.product?.availableStock ?? 0) > 0);
  }, [cartItems]);

  const cartItemsKey = JSON.stringify(
    inStockCartItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity
    }))
  );

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");

  const [step, setStep] = useState<"checkout" | "success">("checkout");
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const [isFetchingAddresses, setIsFetchingAddresses] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  const [couponCode, setCouponCode] = useState<string>("");
  const [promoCodeInput, setPromoCodeInput] = useState<string>("");
  const [couponError, setCouponError] = useState<string>("");
  const [couponSuccess, setCouponSuccess] = useState<string>("");
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
      .catch(err => console.error("Failed to load settings in checkoutpage:", err));
  }, []);

  const [newAddress, setNewAddress] = useState<CreateAddressRequest>({
    fullName: "",
    emailAddress: "",
    mobileNumber: "",
    companyName: "",
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false
  });

  const [addressError, setAddressError] = useState("");

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setIsFetchingAddresses(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        router.push("/auth/login?redirect=/checkout");
        return;
      }
      const response = await checkoutService.getAddresses();
      if (response.success && response.data?.addresses) {
        setAddresses(response.data.addresses);
        const defaultAddr = response.data.addresses.find(a => a.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        } else if (response.data.addresses.length > 0) {
          setSelectedAddressId(response.data.addresses[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
    } finally {
      setIsFetchingAddresses(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError("");

    if (!newAddress.fullName || !newAddress.mobileNumber || !newAddress.addressLine1 || !newAddress.city || !newAddress.state || !newAddress.pincode) {
      setAddressError("Please fill all mandatory fields.");
      return;
    }

    if (newAddress.mobileNumber.length !== 10) {
      setAddressError("Mobile Number must be exactly 10 digits.");
      toast.error("Mobile Number must be exactly 10 digits.");
      return;
    }

    try {
      if (editingAddressId) {
        const response = await checkoutService.updateAddress(editingAddressId, newAddress);
        if (response.success && response.data?.address) {
          setAddresses(addresses.map(a => a.id === editingAddressId ? response.data!.address : a));
          setSelectedAddressId(response.data.address.id);
          setShowAddAddress(false);
          setEditingAddressId(null);
          setNewAddress({
            fullName: "", emailAddress: "", mobileNumber: "", companyName: "", addressLine1: "",
            addressLine2: "", landmark: "", city: "", state: "", pincode: "", isDefault: false
          });
        } else {
          setAddressError(response.message || "Failed to update address");
        }
      } else {
        const response = await checkoutService.createAddress(newAddress);
        if (response.success && response.data?.address) {
          setAddresses([response.data.address, ...addresses]);
          setSelectedAddressId(response.data.address.id);
          setShowAddAddress(false);
          setNewAddress({
            fullName: "", emailAddress: "", mobileNumber: "", companyName: "", addressLine1: "",
            addressLine2: "", landmark: "", city: "", state: "", pincode: "", isDefault: false
          });
        } else {
          setAddressError(response.message || "Failed to save address");
        }
      }
    } catch (error) {
      setAddressError("An error occurred while saving the address.");
    }
  };

  useEffect(() => {
    if (inStockCartItems.length === 0) {
      setCalculationResult(null);
      return;
    }

    const calculatePricing = async () => {
      setCalculating(true);
      try {
        const token = localStorage.getItem("authToken");
        const bodyItems = inStockCartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }));
        
        const response = await fetch("http://localhost:5000/api/offers/calculate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ items: bodyItems, couponCode: couponCode || undefined })
        });
        
        if (response.ok) {
          const data = await response.json();
          setCalculationResult(data);
          
          if (couponCode) {
            const couponOffer = data.appliedOffers?.find((o: any) => o.code?.toLowerCase() === couponCode.toLowerCase());
            if (couponOffer) {
              setCouponSuccess("Promo code applied successfully.");
              setCouponError("");
            } else {
              setCouponError("This promo code is not applicable to the items in your cart.");
              setCouponSuccess("");
              setCouponCode("");
            }
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          setCouponError(errData.message || "Invalid promo code.");
          setCouponSuccess("");
          setCouponCode("");
        }
      } catch (err) {
        console.error("Failed to calculate checkout pricing:", err);
      } finally {
        setCalculating(false);
      }
    };

    calculatePricing();
  }, [cartItemsKey, couponCode]);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCodeInput.trim()) return;
    setCouponCode(promoCodeInput.trim());
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setPromoCodeInput("");
    setCouponSuccess("");
    setCouponError("");
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      alert("Please select a delivery address.");
      return;
    }

    const activeAddress = addresses.find(a => a.id === selectedAddressId);
    if (activeAddress) {
      const { city, state, pincode, addressLine1, fullName, mobileNumber } = activeAddress;
      const isInvalid = (val: string | null | undefined) => !val || val.trim() === "" || val.trim().toUpperCase() === "N/A";
      if (isInvalid(fullName) || isInvalid(mobileNumber) || isInvalid(addressLine1) || isInvalid(city) || isInvalid(state) || isInvalid(pincode)) {
        alert("The selected address is incomplete. Please edit this address and fill in all required fields (Full Name, Phone, Address, City, State, and Pincode) before placing the order.");
        return;
      }
    }
    if (!paymentMethod) {
      alert("Please select a payment method.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await checkoutService.createOrder({
        addressId: selectedAddressId,
        paymentMethod,
        couponCode: couponCode || undefined
      });

      if (response.success && response.data?.order) {
        setCompletedOrder(response.data.order);
        setStep("success");
        // Clear cart context state since backend cleared it
        await clearCart();
      } else {
        alert(response.message || "Failed to place order. Please try again.");
      }
    } catch (error) {
      console.error("Order placement error:", error);
      alert("An error occurred while placing the order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const cartCount = calculationResult
    ? calculationResult.items.reduce((acc: number, item: any) => acc + item.quantity, 0)
    : inStockCartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = inStockCartItems.reduce((acc, item) => acc + ((item.product?.price || 0) * item.quantity), 0);
  const cgst = subtotal * 0.09;
  const sgst = subtotal * 0.09;
  const deliveryCharges = subtotal >= dbThreshold ? 0 : 200;
  const grandTotal = subtotal + cgst + sgst + deliveryCharges;

  // Smart delivery info from pricing engine
  const deliveryInfo = calculationResult?.deliveryInfo;
  const effectiveDeliveryCharges = calculationResult ? calculationResult.summary.deliveryCharges : deliveryCharges;
  const isFreeDelivery = effectiveDeliveryCharges === 0;
  const amountNeeded = deliveryInfo ? deliveryInfo.amountNeededForFreeDelivery : Math.max(0, dbThreshold - subtotal);
  const FREE_THRESHOLD = deliveryInfo?.freeDeliveryThreshold ?? dbThreshold;
  const progressPct = Math.min(100, ((FREE_THRESHOLD - amountNeeded) / FREE_THRESHOLD) * 100);
  const freeShippingProductIds: string[] = deliveryInfo?.freeShippingProductIds ?? [];

  if (isAuthLoading || isCartLoading || isFetchingAddresses) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 font-sans">
        <Header navLinks={navLinks} />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-neutral-500 font-semibold text-sm animate-pulse">Loading checkout...</p>
        </main>
        <Footer footerColumns={footerColumns} socialLinks={socialLinks} />
      </div>
    );
  }

  const isDistributor = user && (user.role?.toUpperCase() === "DISTRIBUTOR" || user.role === "distributor");

  // Guard: Block unapproved distributors from checkout
  const isUnapprovedDistributor = isDistributor && user.approvalStatus?.toUpperCase() !== "APPROVED";

  if (isUnapprovedDistributor) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans">
        <Header navLinks={navLinks} />
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
          <div className="w-20 h-20 bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 rounded-full flex items-center justify-center mb-6 shrink-0 animate-fade-in">
            <AlertTriangle size={40} />
          </div>
          <h1 className="text-3xl font-black text-[#1C1C1C] dark:text-white mb-3 text-center">Checkout Blocked</h1>
          
          <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-sm text-center">
            <p className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed">
              {user.approvalStatus?.toUpperCase() === "REJECTED" 
                ? "Your distributor application has been rejected. Please contact support."
                : "Your distributor account is currently under review. Please wait for admin approval before placing orders."
              }
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/distributor/dashboard" 
                className="w-full sm:w-auto bg-[#D71920] hover:bg-[#B91520] text-white text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-md shadow-[#D71920]/10 cursor-pointer"
              >
                Go to Dashboard
              </Link>
              <Link 
                href="/" 
                className="w-full sm:w-auto bg-neutral-100 hover:bg-neutral-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-neutral-700 dark:text-neutral-300 text-sm font-bold px-6 py-3 rounded-xl transition-all cursor-pointer"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </main>
        <Footer footerColumns={footerColumns} socialLinks={socialLinks} />
      </div>
    );
  }

  if (step === "success" && completedOrder) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 font-sans">
        <Header navLinks={navLinks} />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-20">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-3xl font-black text-[#1C1C1C] mb-2 text-center">Order Request Submitted!</h1>
          <p className="text-neutral-500 mb-8 text-center max-w-md">
            Your order request has been submitted and is pending approval by the admin. You can monitor the approval and tracking status below or in your account dashboard.
          </p>

          <div className="bg-neutral-50 rounded-2xl p-6 sm:p-8 w-full max-w-md mb-8 border border-neutral-100 text-center">
            <div className="text-sm text-neutral-500 font-medium mb-1">Order ID</div>
            <div className="text-xl font-bold text-[#1C1C1C] mb-6">{completedOrder.orderNumber}</div>

            <div className="flex justify-between items-center py-3 border-t border-neutral-200">
              <span className="text-sm text-neutral-500 font-medium">Payment Method</span>
              <span className="text-sm font-bold text-[#1C1C1C]">{completedOrder.paymentMethod}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-t border-neutral-200">
              <span className="text-sm text-neutral-500 font-medium">Grand Total</span>
              <span className="text-lg font-black text-[#D71920]">₹{completedOrder.grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <Link href="/account?tab=orders" className="flex-1 text-center bg-white border border-neutral-200 hover:bg-neutral-50 text-[#1C1C1C] px-6 py-3.5 rounded-xl font-semibold transition-colors">
              View Orders
            </Link>
            <Link href="/shop" className="flex-1 text-center bg-[#D71920] hover:bg-[#b8141a] text-white px-6 py-3.5 rounded-xl font-semibold transition-colors">
              Continue Shopping
            </Link>
          </div>
        </main>
        <Footer footerColumns={footerColumns} socialLinks={socialLinks} />
      </div>
    );
  }

  if (inStockCartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 font-sans">
        <Header navLinks={navLinks} />
        <main className="flex-1 flex flex-col items-center justify-center py-20 text-center px-4">
          <h1 className="text-2xl font-black text-[#1C1C1C] mb-4">Your Cart has no In-Stock items</h1>
          <Link href="/shop" className="text-[#D71920] font-semibold hover:underline">Return to Shop</Link>
        </main>
        <Footer footerColumns={footerColumns} socialLinks={socialLinks} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 font-sans">
      <Header navLinks={navLinks} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <h1 className="text-3xl font-black text-[#1C1C1C] mb-8 border-b border-neutral-100 pb-4">Checkout</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* LEFT SECTION (65%) */}
          <div className="flex-1 lg:w-[65%] space-y-8">

            {/* DELIVERY ADDRESS */}
            <section>
              <h2 className="text-xl font-bold text-[#1C1C1C] mb-4 flex items-center gap-2">
                <MapPin className="text-[#D71920]" size={20} />
                Delivery Address
              </h2>

              {!showAddAddress ? (
                <div className="space-y-4">
                  {addresses.length === 0 ? (
                    <div className="p-6 text-center border-2 border-dashed border-neutral-200 rounded-2xl">
                      <p className="text-neutral-500 mb-4">No saved addresses found.</p>
                      <button
                        onClick={() => setShowAddAddress(true)}
                        className="inline-flex items-center gap-2 bg-[#1C1C1C] hover:bg-black text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                      >
                        <Plus size={16} /> Add New Address
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map(addr => (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={cn(
                            "p-5 rounded-2xl border-2 transition-all cursor-pointer relative",
                            selectedAddressId === addr.id
                              ? "border-[#D71920] bg-red-50/30"
                              : "border-neutral-200 hover:border-neutral-300 bg-white"
                          )}
                        >
                          {selectedAddressId === addr.id && (
                            <div className="absolute top-4 right-4 text-[#D71920]">
                              <CheckCircle2 size={20} fill="currentColor" className="text-white" />
                            </div>
                          )}
                          <div className="absolute top-4 right-12">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setNewAddress({
                                  fullName: addr.fullName,
                                  emailAddress: addr.emailAddress || "",
                                  mobileNumber: addr.mobileNumber,
                                  companyName: addr.companyName || "",
                                  addressLine1: addr.addressLine1,
                                  addressLine2: addr.addressLine2 || "",
                                  landmark: addr.landmark || "",
                                  city: addr.city,
                                  state: addr.state,
                                  pincode: addr.pincode,
                                  isDefault: addr.isDefault
                                });
                                setEditingAddressId(addr.id);
                                setShowAddAddress(true);
                              }}
                              className="text-xs font-bold text-neutral-500 hover:text-[#D71920] transition-colors"
                            >
                              EDIT
                            </button>
                          </div>
                          <p className="font-bold text-[#1C1C1C] mb-1 pr-8">{addr.fullName}</p>
                          {addr.companyName && <p className="text-sm font-medium text-neutral-600 flex items-center gap-1.5 mb-2"><Building2 size={12} /> {addr.companyName}</p>}
                          <p className="text-sm text-neutral-500 leading-relaxed">
                            {addr.addressLine1} {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}<br />
                            {addr.city}, {addr.state} {addr.pincode}
                          </p>
                          <div className="text-sm font-medium text-neutral-700 mt-3 pt-3 border-t border-neutral-100 flex flex-col gap-1">
                            <span>Mobile: {addr.mobileNumber}</span>
                            {addr.emailAddress && <span>Email: {addr.emailAddress}</span>}
                          </div>
                        </div>
                      ))}
                      <div
                        onClick={() => setShowAddAddress(true)}
                        className="p-5 rounded-2xl border-2 border-dashed border-neutral-200 hover:border-neutral-300 bg-neutral-50 hover:bg-neutral-100 transition-all cursor-pointer flex flex-col items-center justify-center text-neutral-500 hover:text-[#1C1C1C] min-h-[160px]"
                      >
                        <Plus size={24} className="mb-2" />
                        <span className="font-bold text-sm">Add New Address</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSaveAddress} className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6">
                  <h3 className="font-bold text-lg mb-4 text-[#1C1C1C]">{editingAddressId ? "Edit Address" : "Add New Address"}</h3>
                  {addressError && <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 rounded-lg">{addressError}</div>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Full Name *</label>
                      <input type="text" required value={newAddress.fullName} onChange={e => setNewAddress({ ...newAddress, fullName: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-[#D71920] focus:ring-1 focus:ring-[#D71920] outline-none transition-all text-sm font-medium" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Email Address (Optional)</label>
                      <input type="email" value={newAddress.emailAddress || ""} onChange={e => setNewAddress({ ...newAddress, emailAddress: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-[#D71920] focus:ring-1 focus:ring-[#D71920] outline-none transition-all text-sm font-medium" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Mobile Number *</label>
                      <input type="tel" required value={newAddress.mobileNumber} onChange={e => setNewAddress({ ...newAddress, mobileNumber: e.target.value.replace(/\D/g, "").slice(0, 10) })} className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-[#D71920] focus:ring-1 focus:ring-[#D71920] outline-none transition-all text-sm font-medium" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Company Name (Optional)</label>
                      <input type="text" value={newAddress.companyName} onChange={e => setNewAddress({ ...newAddress, companyName: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-[#D71920] focus:ring-1 focus:ring-[#D71920] outline-none transition-all text-sm font-medium" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Address Line 1 *</label>
                      <input type="text" required value={newAddress.addressLine1} onChange={e => setNewAddress({ ...newAddress, addressLine1: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-[#D71920] focus:ring-1 focus:ring-[#D71920] outline-none transition-all text-sm font-medium" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Address Line 2</label>
                      <input type="text" value={newAddress.addressLine2} onChange={e => setNewAddress({ ...newAddress, addressLine2: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-[#D71920] focus:ring-1 focus:ring-[#D71920] outline-none transition-all text-sm font-medium" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">City *</label>
                      <input type="text" required value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-[#D71920] focus:ring-1 focus:ring-[#D71920] outline-none transition-all text-sm font-medium" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">State *</label>
                      <input type="text" required value={newAddress.state} onChange={e => setNewAddress({ ...newAddress, state: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-[#D71920] focus:ring-1 focus:ring-[#D71920] outline-none transition-all text-sm font-medium" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Pincode *</label>
                      <input type="text" required value={newAddress.pincode} onChange={e => setNewAddress({ ...newAddress, pincode: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-[#D71920] focus:ring-1 focus:ring-[#D71920] outline-none transition-all text-sm font-medium" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Landmark</label>
                      <input type="text" value={newAddress.landmark} onChange={e => setNewAddress({ ...newAddress, landmark: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-[#D71920] focus:ring-1 focus:ring-[#D71920] outline-none transition-all text-sm font-medium" />
                    </div>
                    <div className="md:col-span-2 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={newAddress.isDefault} onChange={e => setNewAddress({ ...newAddress, isDefault: e.target.checked })} className="w-4 h-4 text-[#D71920] border-neutral-300 rounded focus:ring-[#D71920]" />
                        <span className="text-sm font-medium text-neutral-700">Set as default address</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="submit" className="bg-[#1C1C1C] hover:bg-black text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors">
                      {editingAddressId ? "Update Address" : "Save Address"}
                    </button>
                    <button type="button" onClick={() => {
                      setShowAddAddress(false);
                      setEditingAddressId(null);
                      setNewAddress({
                        fullName: "", emailAddress: "", mobileNumber: "", companyName: "", addressLine1: "",
                        addressLine2: "", landmark: "", city: "", state: "", pincode: "", isDefault: false
                      });
                    }} className="bg-white border border-neutral-200 hover:bg-neutral-50 text-[#1C1C1C] px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </section>

            <hr className="border-neutral-100" />

            {/* PAYMENT METHOD */}
            <section>
              <h2 className="text-xl font-bold text-[#1C1C1C] mb-4 flex items-center gap-2">
                <CreditCard className="text-[#D71920]" size={20} />
                Select Payment Method
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: "GPay", label: "Google Pay (GPay)", icon: <Banknote size={20} /> },
                  { id: "Paytm", label: "Paytm", icon: <Banknote size={20} /> },
                  { id: "Net Banking", label: "Net Banking", icon: <Building2 size={20} /> },
                  { id: "Cash on Delivery", label: "Cash On Delivery", icon: <Banknote size={20} /> },
                ].map((method) => {
                  const isDisabled = method.id !== "Cash on Delivery";
                  return (
                    <div
                      key={method.id}
                      onClick={() => {
                        if (!isDisabled) setPaymentMethod(method.id);
                      }}
                      className={cn(
                        "flex items-center p-4 rounded-xl border-2 transition-all",
                        isDisabled 
                          ? "opacity-50 cursor-not-allowed bg-neutral-50 border-neutral-200" 
                          : "cursor-pointer",
                        paymentMethod === method.id
                          ? "border-[#D71920] bg-red-50/30"
                          : (!isDisabled ? "border-neutral-200 hover:border-neutral-300 bg-white" : "")
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4 transition-colors",
                        paymentMethod === method.id ? "border-[#D71920]" : "border-neutral-300"
                      )}>
                        {paymentMethod === method.id && <div className="w-2.5 h-2.5 bg-[#D71920] rounded-full" />}
                      </div>
                      <div className="text-neutral-500 mr-3">{method.icon}</div>
                      <div className="flex flex-col">
                        <span className="font-bold text-[#1C1C1C]">{method.label}</span>
                        {isDisabled && <span className="text-[10px] font-bold text-[#D71920] uppercase tracking-wider">Currently Unavailable</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>


          </div>

          {/* RIGHT SECTION (35%) */}
          <div className="lg:w-[35%]">
            <div className="sticky top-28 bg-white rounded-2xl p-6 border border-neutral-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h2 className="text-lg font-bold text-[#1C1C1C] mb-6">
                {isDistributor ? "Order Placement Request" : "Order Summary"}
              </h2>

              {!isDistributor && (
                <>
                  {/* Coupon Code Input Panel */}
                  <div className="mt-6 mb-6 p-4 bg-slate-55 rounded-2xl border border-neutral-200 space-y-3">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-500 block">Promo Code & Coupons</span>
                    
                    {couponSuccess ? (
                      <div className="flex items-center justify-between bg-green-50/60 border border-green-150 rounded-xl p-3 text-xs text-green-800">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                          <div>
                            <span className="font-extrabold uppercase">{couponCode}</span>
                            <p className="text-[10px] text-green-700">{couponSuccess}</p>
                          </div>
                        </div>
                        <button onClick={handleRemoveCoupon} className="text-xs font-bold text-red-650 hover:underline cursor-pointer">
                          Remove
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleApplyCoupon} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter Coupon Code"
                          value={promoCodeInput}
                          onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                          className="flex-grow px-3.5 py-2 text-xs border border-neutral-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-[#D71920]"
                        />
                        <button
                          type="submit"
                          disabled={calculating || !promoCodeInput.trim()}
                          className="px-4 py-2 bg-[#D71920] hover:bg-[#b8141a] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Apply
                        </button>
                      </form>
                    )}
                    {couponError && <p className="text-[10px] font-bold text-[#D71920]">{couponError}</p>}
                  </div>
                  {/* ── SMART DELIVERY BANNER ── */}
                  <div className={`mb-5 rounded-2xl border overflow-hidden ${
                    isFreeDelivery
                      ? "border-green-200 bg-gradient-to-br from-green-50 to-emerald-50"
                      : "border-orange-100 bg-gradient-to-br from-orange-50/60 to-amber-50/40"
                  }`}>
                    <div className="px-4 pt-3.5 pb-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Truck size={16} className={isFreeDelivery ? "text-green-600" : "text-orange-500"} />
                          <span className={`text-xs font-extrabold uppercase tracking-wider ${
                            isFreeDelivery ? "text-green-700" : "text-orange-600"
                          }`}>
                            {isFreeDelivery ? "Free Delivery Unlocked! 🎉" : "Free Delivery"}
                          </span>
                        </div>
                        {!isFreeDelivery && (
                          <span className="text-[10px] font-bold text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full">
                            Add ₹{amountNeeded.toLocaleString('en-IN')} more
                          </span>
                        )}
                      </div>

                      {/* Progress bar */}
                      {!isFreeDelivery && (
                        <>
                          <div className="w-full h-1.5 bg-orange-100 rounded-full overflow-hidden mb-1.5">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-400 transition-all duration-700"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-orange-600 font-medium">
                            Spend ₹{amountNeeded.toLocaleString('en-IN')} more to get
                            {" "}<strong className="font-extrabold">FREE delivery</strong>
                            {" "}(on orders above ₹{FREE_THRESHOLD.toLocaleString('en-IN')})
                          </p>
                        </>
                      )}
                      {isFreeDelivery && deliveryInfo?.freeDeliveryReason && (
                        <p className="text-[11px] text-green-600 font-medium">{deliveryInfo.freeDeliveryReason}</p>
                      )}
                    </div>

                    {/* Per-item free shipping tags */}
                    {freeShippingProductIds.length > 0 && (
                      <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                        {inStockCartItems
                          .filter(item => freeShippingProductIds.includes(item.productId))
                          .map(item => (
                            <span key={item.productId} className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-full">
                              <Tag size={9} />
                              {item.product?.name?.split(' ').slice(0, 3).join(' ')} — Free Shipping
                            </span>
                          ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3.5 mb-6 text-sm">
                    <div className="flex justify-between items-center text-neutral-600 font-medium">
                      <span>Total Products</span>
                      <span className="font-bold text-[#1C1C1C] bg-neutral-100 px-2 py-0.5 rounded-md">{inStockCartItems.length}</span>
                    </div>
                    <div className="flex justify-between items-center text-neutral-600 font-medium">
                      <span>Total Quantity</span>
                      <span className="font-bold text-[#1C1C1C]">{cartCount} units</span>
                    </div>
                    <div className="flex justify-between items-center text-neutral-600 font-medium pt-2">
                      <span>Subtotal</span>
                      <span className="font-bold text-[#1C1C1C]">
                        ₹{(calculationResult ? calculationResult.summary.originalSubtotal : subtotal).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-neutral-500">
                      <span>CGST (9%)</span>
                      <span>
                        ₹{(calculationResult ? calculationResult.summary.cgst : cgst).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-neutral-500">
                      <span>SGST (9%)</span>
                      <span>
                        ₹{(calculationResult ? calculationResult.summary.sgst : sgst).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5 text-neutral-500">
                        <Truck size={13} className={isFreeDelivery ? "text-green-500" : "text-neutral-400"} />
                        <span>Delivery Charges</span>
                      </div>
                      <span>
                        {isFreeDelivery
                          ? <span className="text-green-600 font-bold flex items-center gap-1">FREE <CheckCircle2 size={12} className="text-green-500" /></span>
                          : `₹${effectiveDeliveryCharges}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[#22c55e] font-medium">
                      <span>Total Discounts</span>
                      <span className="font-bold">
                        -₹{(calculationResult ? calculationResult.summary.totalDiscounts : 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-neutral-100 border-dashed pt-4 mb-6">
                    <div className="flex justify-between items-end">
                      <span className="font-bold text-[#1C1C1C] text-base">Grand Total</span>
                      <span className="text-2xl font-black text-[#D71920] tracking-tight">
                        ₹{(calculationResult ? calculationResult.summary.grandTotal : grandTotal).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-450 mt-1 text-right">Inclusive of all taxes</p>
                  </div>

                  {calculationResult?.appliedOffers && calculationResult.appliedOffers.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-neutral-100 border-dashed space-y-2">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-405">Applied Campaigns & Offers</p>
                      <div className="flex flex-col gap-1.5">
                        {calculationResult.appliedOffers.map((offer: any) => (
                          <div key={offer.offerId} className="flex items-center justify-between gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100/50">
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                              <span>{offer.name} {offer.code ? `(${offer.code})` : ''}</span>
                            </div>
                            {offer.discountAmount && offer.discountAmount > 0 ? (
                              <span className="text-emerald-700 shrink-0 font-extrabold">-₹{offer.discountAmount.toLocaleString('en-IN')}</span>
                            ) : offer.freeShipping ? (
                              <span className="text-emerald-700 shrink-0 font-extrabold">Free Shipping</span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <button
                onClick={handlePlaceOrder}
                disabled={!selectedAddressId || !paymentMethod || isSubmitting}
                className="w-full relative group overflow-hidden bg-[#1C1C1C] disabled:bg-neutral-300 hover:bg-black text-white py-4 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg shadow-black/10 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : (isDistributor ? "Submit Order Request" : "Proceed To Place Order")}
                </span>
                {!isSubmitting && !(!selectedAddressId || !paymentMethod) && (
                  <>
                    <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                    <div className="absolute inset-0 h-full w-0 bg-[#D71920] transition-all duration-300 ease-out group-hover:w-full z-0"></div>
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-500 font-medium">
                <ShieldCheck size={14} className="text-green-600" />
                <span>Secure Checkout Guaranteed</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer footerColumns={footerColumns} socialLinks={socialLinks} />
    </div>
  );
}
