"use client";

import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { navLinks, footerColumns, socialLinks } from "../LandingPage/data/navigation";
import { useCart } from "@/providers/CartProvider";
import { checkoutService } from "@/services/checkoutService";
import { Address, CreateAddressRequest, Order } from "@/types/api";
import { cn } from "@/lib/utils";
import { CheckCircle2, Building2, MapPin, CreditCard, Banknote, ShieldCheck, Plus, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, isLoading: isCartLoading, clearCart } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [poNumber, setPoNumber] = useState<string>("");

  const [step, setStep] = useState<"checkout" | "success">("checkout");
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const [isFetchingAddresses, setIsFetchingAddresses] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

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

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      alert("Please select a delivery address.");
      return;
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
        poNumber: poNumber.trim() || undefined
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

  // Calculations
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce((acc, item) => acc + ((item.product?.price || 0) * item.quantity), 0);
  const cgst = subtotal * 0.09;
  const sgst = subtotal * 0.09;
  const deliveryCharges = subtotal > 10000 ? 0 : 200;
  const grandTotal = subtotal + cgst + sgst + deliveryCharges;

  if (isCartLoading || isFetchingAddresses) {
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

  if (step === "success" && completedOrder) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 font-sans">
        <Header navLinks={navLinks} />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-20">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-3xl font-black text-[#1C1C1C] mb-2 text-center">Order Placed Successfully!</h1>
          <p className="text-neutral-500 mb-8 text-center max-w-md">
            Thank you for your purchase. Your order has been confirmed and will be shipped shortly.
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
            <Link href="/account" className="flex-1 text-center bg-white border border-neutral-200 hover:bg-neutral-50 text-[#1C1C1C] px-6 py-3.5 rounded-xl font-semibold transition-colors">
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

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 font-sans">
        <Header navLinks={navLinks} />
        <main className="flex-1 flex flex-col items-center justify-center py-20 text-center px-4">
          <h1 className="text-2xl font-black text-[#1C1C1C] mb-4">Your Cart is Empty</h1>
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
                      <input type="tel" required value={newAddress.mobileNumber} onChange={e => setNewAddress({ ...newAddress, mobileNumber: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-[#D71920] focus:ring-1 focus:ring-[#D71920] outline-none transition-all text-sm font-medium" />
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

            <hr className="border-neutral-100" />

            {/* B2B: PURCHASE ORDER */}
            <section>
              <h2 className="text-xl font-bold text-[#1C1C1C] mb-2 flex items-center gap-2">
                Purchase Order Reference
              </h2>
              <p className="text-sm text-neutral-500 mb-4">Optional: Provide your internal PO Number for this order.</p>

              <div>
                <input
                  type="text"
                  placeholder="e.g. PO-2026-0841"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  className="w-full max-w-md px-4 py-3 rounded-xl border border-neutral-200 focus:border-[#D71920] focus:ring-1 focus:ring-[#D71920] outline-none transition-all text-sm font-medium placeholder:font-normal placeholder:text-neutral-400"
                />
              </div>
            </section>

          </div>

          {/* RIGHT SECTION (35%) */}
          <div className="lg:w-[35%]">
            <div className="sticky top-28 bg-white rounded-2xl p-6 border border-neutral-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h2 className="text-lg font-bold text-[#1C1C1C] mb-6">Order Summary</h2>

              <div className="space-y-3.5 mb-6 text-sm">
                <div className="flex justify-between items-center text-neutral-600 font-medium">
                  <span>Total Products</span>
                  <span className="font-bold text-[#1C1C1C] bg-neutral-100 px-2 py-0.5 rounded-md">{cartItems.length}</span>
                </div>
                <div className="flex justify-between items-center text-neutral-600 font-medium">
                  <span>Total Quantity</span>
                  <span className="font-bold text-[#1C1C1C]">{cartCount} units</span>
                </div>
                <div className="flex justify-between items-center text-neutral-600 font-medium pt-2">
                  <span>Subtotal</span>
                  <span className="font-bold text-[#1C1C1C]">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-neutral-500">
                  <span>CGST (9%)</span>
                  <span>₹{cgst.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between items-center text-neutral-500">
                  <span>SGST (9%)</span>
                  <span>₹{sgst.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between items-center text-neutral-500">
                  <span>Delivery Charges</span>
                  <span>{deliveryCharges === 0 ? <span className="text-green-600 font-bold">Free</span> : `₹${deliveryCharges}`}</span>
                </div>
                <div className="flex justify-between items-center text-[#22c55e] font-medium">
                  <span>Discount</span>
                  <span className="font-bold">-₹0</span>
                </div>
              </div>

              <div className="border-t border-neutral-100 border-dashed pt-4 mb-6">
                <div className="flex justify-between items-end">
                  <span className="font-bold text-[#1C1C1C] text-base">Grand Total</span>
                  <span className="text-2xl font-black text-[#D71920] tracking-tight">₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
                <p className="text-[10px] text-neutral-400 mt-1 text-right">Inclusive of all taxes</p>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={!selectedAddressId || !paymentMethod || isSubmitting}
                className="w-full relative group overflow-hidden bg-[#1C1C1C] disabled:bg-neutral-300 hover:bg-black text-white py-4 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg shadow-black/10 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : "Proceed To Place Order"}
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
