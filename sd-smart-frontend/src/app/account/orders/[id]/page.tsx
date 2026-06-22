"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { navLinks, footerColumns, socialLinks } from "@/app/LandingPage/data/navigation";
import { checkoutService } from "@/services/checkoutService";
import { Order } from "@/types/api";
import { ArrowLeft, Package, User, MapPin, CreditCard, Receipt, Download, Clock } from "lucide-react";

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await checkoutService.getOrder(orderId);
        if (res.success && res.data?.order) {
          setOrder(res.data.order);
        } else {
          // Handle error, maybe redirect back
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-slate-950 font-sans">
        <Header navLinks={navLinks} />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#D71920]/25 border-t-[#D71920] rounded-full animate-spin"></div>
        </main>
        <Footer footerColumns={footerColumns} socialLinks={socialLinks} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-slate-950 font-sans">
        <Header navLinks={navLinks} />
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold text-neutral-800 dark:text-white mb-4">Order Not Found</h1>
          <button onClick={() => router.push("/account")} className="text-[#D71920] hover:underline flex items-center gap-2">
            <ArrowLeft size={16} /> Back to Account
          </button>
        </main>
        <Footer footerColumns={footerColumns} socialLinks={socialLinks} />
      </div>
    );
  }

  const orderStatuses = ["Pending", "Confirmed", "Packed", "Shipped", "Delivered"];
  const currentStatusIndex = Math.max(0, orderStatuses.indexOf(order.status) !== -1 ? orderStatuses.indexOf(order.status) : 0);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-slate-950 font-sans">
      <Header navLinks={navLinks} />
      
      <main className="flex-1 w-full max-w-[1248px] mx-auto px-4 py-8 lg:py-12">
        {/* ACTION BUTTONS & HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <button 
            onClick={() => router.push("/account")} 
            className="flex items-center gap-2 text-sm font-bold text-neutral-600 dark:text-neutral-400 hover:text-[#D71920] transition-colors self-start"
          >
            <ArrowLeft size={16} /> Back to Orders
          </button>
          
          <button className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 hover:bg-neutral-50 dark:hover:bg-slate-800 px-4 py-2 rounded-xl text-sm font-bold text-[#1C1C1C] dark:text-white shadow-sm transition-colors w-fit">
            <Download size={16} />
            Download Invoice
          </button>
        </div>

        <h1 className="text-2xl lg:text-3xl font-black text-[#1C1C1C] dark:text-white mb-8">Order Details</h1>

        {/* ORDER TIMELINE */}
        <div className="bg-white dark:bg-slate-900 shadow-sm border border-neutral-200 dark:border-slate-800 rounded-2xl p-6 lg:p-8 mb-8">
          <h2 className="text-lg font-bold text-neutral-800 dark:text-white mb-6 flex items-center gap-2">
            <Clock size={20} className="text-[#D71920]" />
            Order Timeline
          </h2>
          <div className="relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-neutral-100 dark:bg-slate-800 -translate-y-1/2 rounded-full hidden sm:block"></div>
            <div className="relative flex flex-col sm:flex-row justify-between gap-6 sm:gap-0">
              {orderStatuses.map((status, index) => {
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                
                return (
                  <div key={status} className="flex sm:flex-col items-center gap-4 sm:gap-2 relative z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                      isCompleted ? "bg-[#D71920] border-[#D71920] text-white" : "bg-white dark:bg-slate-900 border-neutral-200 dark:border-slate-700 text-neutral-400"
                    }`}>
                      {isCompleted ? "✓" : "○"}
                    </div>
                    <span className={`text-sm font-bold ${isCurrent ? "text-[#D71920]" : isCompleted ? "text-neutral-800 dark:text-white" : "text-neutral-400"}`}>
                      {status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* LEFT COLUMN: DETAILS & PRODUCTS */}
          <div className="flex-1 lg:w-[65%] space-y-8">
            
            {/* GRID FOR ORDER / CUSTOMER / ADDRESS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* ORDER INFORMATION */}
              <div className="bg-white dark:bg-slate-900 shadow-sm border border-neutral-200 dark:border-slate-800 rounded-2xl p-6">
                <h3 className="font-bold text-neutral-800 dark:text-white mb-4 flex items-center gap-2 border-b border-neutral-100 dark:border-slate-800 pb-3">
                  <Package size={18} className="text-[#D71920]" /> Order Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500 font-medium">Order ID:</span>
                    <span className="font-bold text-neutral-800 dark:text-white">{order.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500 font-medium">Order Date:</span>
                    <span className="font-bold text-neutral-800 dark:text-white">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500 font-medium">Order Status:</span>
                    <span className="font-bold text-[#D71920] uppercase tracking-wider">{order.status}</span>
                  </div>
                </div>
              </div>

              {/* CUSTOMER INFORMATION */}
              <div className="bg-white dark:bg-slate-900 shadow-sm border border-neutral-200 dark:border-slate-800 rounded-2xl p-6">
                <h3 className="font-bold text-neutral-800 dark:text-white mb-4 flex items-center gap-2 border-b border-neutral-100 dark:border-slate-800 pb-3">
                  <User size={18} className="text-[#D71920]" /> Customer Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500 font-medium">Customer Name:</span>
                    <span className="font-bold text-neutral-800 dark:text-white">{order.address?.fullName || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500 font-medium">Mobile Number:</span>
                    <span className="font-bold text-neutral-800 dark:text-white">{order.address?.mobileNumber || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500 font-medium">Email Address:</span>
                    <span className="font-bold text-neutral-800 dark:text-white">{order.address?.emailAddress || "N/A"}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* DELIVERY ADDRESS */}
            <div className="bg-white dark:bg-slate-900 shadow-sm border border-neutral-200 dark:border-slate-800 rounded-2xl p-6">
              <h3 className="font-bold text-neutral-800 dark:text-white mb-4 flex items-center gap-2 border-b border-neutral-100 dark:border-slate-800 pb-3">
                <MapPin size={18} className="text-[#D71920]" /> Delivery Address
              </h3>
              {order.address ? (
                <div className="text-sm space-y-1 text-neutral-600 dark:text-neutral-400">
                  <p className="font-bold text-neutral-800 dark:text-white text-base mb-2">{order.address.fullName}</p>
                  <p>Mobile Number: {order.address.mobileNumber}</p>
                  <p>{order.address.addressLine1}</p>
                  {order.address.addressLine2 && <p>{order.address.addressLine2}</p>}
                  <p>{order.address.city}, {order.address.state}</p>
                  <p>Pincode: {order.address.pincode}</p>
                </div>
              ) : (
                <p className="text-sm text-neutral-500">Address details not available.</p>
              )}
            </div>

            {/* ORDERED PRODUCTS */}
            <div className="bg-white dark:bg-slate-900 shadow-sm border border-neutral-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-neutral-100 dark:border-slate-800">
                <h3 className="font-bold text-neutral-800 dark:text-white flex items-center gap-2">
                  <Package size={18} className="text-[#D71920]" /> Ordered Products
                </h3>
              </div>
              <div className="divide-y divide-neutral-100 dark:divide-slate-800">
                {order.items.map((item) => (
                  <div key={item.id} className="p-6 flex flex-col sm:flex-row gap-6">
                    <div className="w-24 h-24 bg-neutral-100 dark:bg-slate-800 rounded-xl flex-shrink-0 p-2 border border-neutral-200 dark:border-slate-700">
                      <img src={item.product?.image || item.product?.images?.[0] || "/placeholder.jpg"} alt={item.product?.name} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-neutral-800 dark:text-white text-base">{item.product?.name || "Product Name"}</h4>
                        <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">{item.product?.categoryLabel || item.product?.category || "Category"}</p>
                        <div className="flex flex-wrap gap-4 mt-3">
                          <p className="text-sm"><span className="text-neutral-500">Model Name:</span> <span className="font-bold text-neutral-800 dark:text-white">{item.product?.modelNumber || item.product?.name || "N/A"}</span></p>
                          <p className="text-sm"><span className="text-neutral-500">SKU:</span> <span className="font-bold text-neutral-800 dark:text-white">{item.product?.sku || "N/A"}</span></p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4 sm:mt-0 bg-neutral-50 dark:bg-slate-800 p-3 rounded-xl border border-neutral-100 dark:border-slate-700">
                        <div className="text-sm">
                          <span className="text-neutral-500">Unit Price:</span> <span className="font-bold">₹{item.unitPrice.toLocaleString()}</span> &nbsp;|&nbsp; <span className="text-neutral-500">Qty:</span> <span className="font-bold">{item.quantity}</span>
                        </div>
                        <div className="text-base font-black text-[#1C1C1C] dark:text-white">
                          Total: ₹{(item.unitPrice * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: PRICING & PAYMENT */}
          <div className="lg:w-[35%] space-y-8 sticky top-28 self-start">
            
            {/* PRICING SUMMARY */}
            <div className="bg-white dark:bg-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-200 dark:border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-neutral-800 dark:text-white mb-6 flex items-center gap-2">
                <Receipt size={20} className="text-[#D71920]" /> Pricing Summary
              </h3>
              
              <div className="space-y-4 text-sm mb-6">
                <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400 font-medium">
                  <span>Subtotal</span>
                  <span className="font-bold text-neutral-800 dark:text-white">₹{order.subtotal.toLocaleString()}</span>
                </div>
                
                <div className="pt-3 border-t border-dashed border-neutral-200 dark:border-slate-700">
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Tax Breakdown</p>
                  <div className="space-y-2 pl-2">
                    <div className="flex justify-between items-center text-neutral-500">
                      <span>CGST</span>
                      <span className="font-medium text-neutral-800 dark:text-white">₹{order.cgst.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-neutral-500">
                      <span>SGST</span>
                      <span className="font-medium text-neutral-800 dark:text-white">₹{order.sgst.toLocaleString()}</span>
                    </div>
                    {order.igst > 0 && (
                      <div className="flex justify-between items-center text-neutral-500">
                        <span>IGST</span>
                        <span className="font-medium text-neutral-800 dark:text-white">₹{order.igst.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-dashed border-neutral-200 dark:border-slate-700 flex justify-between items-center text-neutral-600 dark:text-neutral-400 font-medium">
                  <span>Discount</span>
                  <span className="font-bold text-green-600">-₹{order.discount.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400 font-medium">
                  <span>Delivery Charges</span>
                  {order.deliveryCharges === 0 ? (
                    <span className="font-bold text-green-600">Free</span>
                  ) : (
                    <span className="font-bold text-neutral-800 dark:text-white">₹{order.deliveryCharges.toLocaleString()}</span>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-base font-bold text-neutral-800 dark:text-white">Grand Total</span>
                <span className="text-2xl font-black text-[#D71920]">₹{order.grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* PAYMENT INFORMATION */}
            <div className="bg-white dark:bg-slate-900 shadow-sm border border-neutral-200 dark:border-slate-800 rounded-2xl p-6">
              <h3 className="font-bold text-neutral-800 dark:text-white mb-4 flex items-center gap-2 border-b border-neutral-100 dark:border-slate-800 pb-3">
                <CreditCard size={18} className="text-[#D71920]" /> Payment Information
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider mb-1">Payment Method</p>
                  <p className="font-bold text-neutral-800 dark:text-white">{order.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider mb-1">Payment Status</p>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                    Paid
                  </div>
                </div>
                {order.poNumber && (
                  <div>
                    <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider mb-1">PO Number</p>
                    <p className="font-bold text-neutral-800 dark:text-white">{order.poNumber}</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </main>

      <Footer footerColumns={footerColumns} socialLinks={socialLinks} />
    </div>
  );
}
