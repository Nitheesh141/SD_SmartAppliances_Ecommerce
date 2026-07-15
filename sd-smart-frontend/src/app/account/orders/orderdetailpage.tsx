"use client";
import { ENV } from "@/config/env";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { navLinks, footerColumns, socialLinks } from "../../LandingPage/data/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { Order } from "@/types/api";
import { cn } from "@/lib/utils";
import { 
  ArrowLeft, Package, MapPin, FileText, CheckCircle2, Clock, 
  AlertCircle, ShieldCheck, Printer, Truck, Loader2
} from "lucide-react";

export default function OrderDetailPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();
  const isInvoiceView = searchParams ? searchParams.get("invoice") === "true" : false;
  
  // Extract order ID/Number from path: /account/orders/ORD-xxx
  const orderId = pathname.split("/").pop() || "";
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  const [sellerSettings, setSellerSettings] = useState({
    seller_name: "SD Smart Appliances Pvt. Ltd.",
    seller_address_line1: "Plot No. 42, B2B Industrial Area",
    seller_address_line2: "Phase II, Bangalore, Karnataka - 560001",
    seller_gstin: "29AAAAA1111A1Z1",
    seller_email: "billing@sdsmartappliances.com",
    seller_phone: "+91 80 4455 6677",
    seller_signature: ""
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchOrderDetails = async (isBackground = false) => {
      if (!orderId || !isAuthenticated) return;
      if (!isBackground) setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch(`${ENV.API_BASE_URL}/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.order) {
          setOrder(data.order);
        } else {
          if (!isBackground) setError(data.message || "Failed to load order details");
        }
      } catch (err) {
        console.error("Order details fetch error:", err);
        if (!isBackground) setError("Unable to connect to the server.");
      } finally {
        if (!isBackground) setLoading(false);
      }
    };

    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch(`${ENV.API_BASE_URL}/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.settings) {
          setSellerSettings(data.settings);
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      }
    };

    if (orderId && isAuthenticated) {
      fetchOrderDetails(false);
      fetchSettings();

      const interval = setInterval(() => {
        const activeEl = document.activeElement;
        const isInputFocused = activeEl && (
          ["INPUT", "TEXTAREA", "SELECT"].includes(activeEl.tagName.toUpperCase()) ||
          activeEl.getAttribute("contenteditable") === "true"
        );
        if (!isInputFocused) {
          fetchOrderDetails(true);
        }
      }, 20000);

      return () => clearInterval(interval);
    }
  }, [orderId, isAuthenticated]);

  const handleCancelOrder = async () => {
    if (!order || !window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${ENV.API_BASE_URL}/orders/${order.id}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        alert("Order cancelled successfully");
        if (data.order) {
          setOrder(data.order);
        }
      } else {
        alert(data.message || "Failed to cancel order");
      }
    } catch (err) {
      console.error(err);
      alert("Error cancelling order");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-slate-950 font-sans">
        <Header navLinks={navLinks} />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-[#D71920] animate-spin" />
            <p className="mt-4 text-sm font-semibold text-neutral-500 tracking-wider">Loading order details...</p>
          </div>
        </main>
        <Footer footerColumns={footerColumns} socialLinks={socialLinks} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-slate-950 font-sans">
        <Header navLinks={navLinks} />
        <main className="flex-1 max-w-3xl mx-auto px-4 py-20 text-center space-y-6">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">Order Details Not Found</h2>
          <p className="text-neutral-500">{error || "The requested order could not be located."}</p>
          <button 
            onClick={() => router.push("/account?tab=orders")}
            className="inline-flex items-center gap-2 bg-[#1C1C1C] hover:bg-black text-white px-6 py-3 rounded-xl font-bold transition-all text-sm"
          >
            <ArrowLeft size={16} /> Back to My Orders
          </button>
        </main>
        <Footer footerColumns={footerColumns} socialLinks={socialLinks} />
      </div>
    );
  }

  const getStatusLabel = (status: string) => {
    const mapping: Record<string, string> = {
      PENDING_APPROVAL: "Pending Admin Approval",
      APPROVED: "Approved",
      PROCESSING: "Processing",
      PACKED: "Packed",
      SHIPPED: "Shipped",
      IN_TRANSIT: "In Transit",
      OUT_FOR_DELIVERY: "Out for Delivery",
      DELIVERED: "Delivered",
      REJECTED: "Rejected",
      CANCELLED: "Cancelled"
    };
    return mapping[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING_APPROVAL": return "text-amber-500 bg-amber-50 border-amber-200 dark:bg-amber-950/10 dark:border-amber-900/30";
      case "APPROVED": return "text-blue-500 bg-blue-50 border-blue-200 dark:bg-blue-950/10 dark:border-blue-900/30";
      case "PROCESSING": return "text-indigo-500 bg-indigo-55 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/10 dark:border-indigo-900/30";
      case "PACKED": return "text-purple-500 bg-purple-50 border-purple-200 dark:bg-purple-950/10 dark:border-purple-900/30";
      case "SHIPPED": return "text-sky-500 bg-sky-50 border-sky-200 dark:bg-sky-950/10 dark:border-sky-900/30";
      case "IN_TRANSIT": return "text-teal-500 bg-teal-55 bg-teal-50 border-teal-200 dark:bg-teal-950/10 dark:border-teal-900/30";
      case "OUT_FOR_DELIVERY": return "text-cyan-500 bg-cyan-50 border-cyan-200 dark:bg-cyan-950/10 dark:border-cyan-900/30";
      case "DELIVERED": return "text-green-500 bg-green-50 border-green-200 dark:bg-green-950/10 dark:border-green-900/30";
      case "REJECTED": return "text-red-500 bg-red-50 border-red-200 dark:bg-red-950/10 dark:border-red-900/30";
      case "CANCELLED": return "text-gray-500 bg-gray-50 border-gray-200 dark:bg-gray-950/10 dark:border-gray-900/30";
      default: return "text-neutral-500 bg-neutral-50 border-neutral-200";
    }
  };

  // Check which tracking stages are completed for visual timeline
  const trackingStages = [
    { label: "Submitted", status: "PENDING_APPROVAL" },
    { label: "Approved", status: "APPROVED" },
    { label: "Processing", status: "PROCESSING" },
    { label: "Shipped", status: "SHIPPED" },
    { label: "Delivered", status: "DELIVERED" }
  ];

  const currentStatusIndex = trackingStages.findIndex(s => {
    if (order.status === "REJECTED" || order.status === "CANCELLED") return false;
    if (order.status === "PACKED") return s.status === "PROCESSING";
    if (["IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(order.status)) return s.status === "SHIPPED";
    return s.status === order.status;
  });

  if (isInvoiceView && order && order.invoice && order.status !== "REJECTED") {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex flex-col items-center py-8 px-4 print:p-0 print:bg-white font-sans selection:bg-[#D71920]/30 selection:text-white">
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #invoice-print-area, #invoice-print-area * {
              visibility: visible;
            }
            #invoice-print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white !important;
              color: black !important;
            }
          }
        `}</style>
        
        {/* Floating Print Bar */}
        <div className="w-full max-w-[850px] flex justify-between items-center mb-4 bg-neutral-100 border border-neutral-250 rounded-xl px-4 py-3 print:hidden">
          <span className="font-extrabold text-xs text-neutral-600 uppercase tracking-wider flex items-center gap-1.5">
            <FileText size={16} className="text-[#D71920]" />
            Official Tax Invoice
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-900 font-bold text-xs text-white rounded-lg transition-colors cursor-pointer"
            >
              <Printer size={14} /> Print / Save PDF
            </button>
            <button
              onClick={() => {
                if (window.opener) {
                  window.close();
                } else {
                  router.push(`/account?tab=orders`);
                }
              }}
              className="px-3 py-1.5 bg-neutral-200 hover:bg-neutral-350 text-neutral-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Close View
            </button>
          </div>
        </div>

        {/* PRINT AREA */}
        <div id="invoice-print-area" className="w-full max-w-[850px] p-8 md:p-12 bg-white text-neutral-900 border border-neutral-200 rounded-2xl shadow-sm font-mono text-xs space-y-8">
          
          {/* BRANDING & LOGO */}
          <div className="flex justify-between items-start border-b-2 border-neutral-900 pb-6">
            <div className="flex items-center gap-4">
              <img
                src="/SD-logo.png"
                alt="SD Smart Appliances"
                className="h-16 w-auto object-contain"
              />
              <div>
                <h2 className="text-lg font-black text-neutral-950 uppercase tracking-tight">
                  {sellerSettings.seller_name}
                </h2>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-block px-3 py-1 bg-neutral-900 text-white font-bold uppercase tracking-wider text-[10px]">
                TAX INVOICE
              </div>
              <p className="text-neutral-500 font-bold mt-2">Invoice #: {order.invoice.invoiceNumber}</p>
              <p className="text-neutral-55 text-neutral-500">Date: {new Date(order.invoice.invoiceDate).toLocaleDateString('en-IN')}</p>
            </div>
          </div>

          {/* COMPANY & DISTRIBUTOR DETAILS */}
          <div className="grid grid-cols-2 gap-8 text-neutral-800">
            <div className="space-y-1">
              <p className="font-bold text-neutral-900 border-b border-neutral-200 pb-1 uppercase tracking-wider text-[10px]">
                SOLD BY (Seller)
              </p>
              <p className="font-bold text-neutral-900">{sellerSettings.seller_name}</p>
              <p>{sellerSettings.seller_address_line1}</p>
              <p>{sellerSettings.seller_address_line2}</p>
              <p>GSTIN: {sellerSettings.seller_gstin}</p>
              <p>Email: {sellerSettings.seller_email}</p>
              <p>Phone: {sellerSettings.seller_phone}</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-neutral-900 border-b border-neutral-200 pb-1 uppercase tracking-wider text-[10px]">
                BILL TO (Distributor)
              </p>
              <p className="font-bold text-neutral-900">{order.address?.fullName}</p>
              {order.address?.companyName && <p className="font-semibold">{order.address.companyName}</p>}
              <p>Distributor Code: DIST-{order.userId.substring(0, 8).toUpperCase()}</p>
              <p>{order.address?.addressLine1}</p>
              {order.address?.addressLine2 && <p>{order.address.addressLine2}</p>}
              <p>{order.address?.city}, {order.address?.state} - {order.address?.pincode}</p>
              <p>GSTIN: {order.address?.gstin || "N/A"}</p>
              <p>Phone: {order.address?.mobileNumber}</p>
            </div>
          </div>

          {/* ORDER DETAILS */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-neutral-50 border border-neutral-250 rounded-xl text-[11px]">
            <div>
              <span className="text-neutral-500 block">Order Number</span>
              <span className="font-bold">{order.orderNumber}</span>
            </div>
            <div>
              <span className="text-neutral-500 block">Order Date</span>
              <span className="font-bold">{new Date(order.createdAt).toLocaleDateString('en-IN')}</span>
            </div>
            <div>
              <span className="text-neutral-500 block">Payment Method</span>
              <span className="font-bold">{order.paymentMethod}</span>
            </div>
            <div>
              <span className="text-neutral-500 block">Payment Status</span>
              <span className={`font-bold uppercase ${
                order.paymentStatus === "PAID" ? "text-green-700" :
                order.paymentStatus === "REFUNDED" ? "text-amber-600" :
                order.paymentStatus === "UNPAID" ? "text-red-700" : "text-neutral-600"
              }`}>
                {order.paymentStatus || "PENDING"}
              </span>
            </div>
          </div>

          {/* PRODUCT TABLE */}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-neutral-950 font-bold uppercase tracking-wider text-[10px] text-neutral-700">
                <th className="py-2">Item Details</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Unit Price</th>
                <th className="py-2 text-right">GST %</th>
                <th className="py-2 text-right">GST Amt</th>
                <th className="py-2 text-right font-black">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {order.items.map((item) => {
                const hsnCode = item.product?.category === "pressure-cookers" ? "73239300" : "85166000";

                return (
                  <tr key={item.id} className="py-3">
                    <td className="py-3">
                      <p className="font-bold text-neutral-950">{item.product?.name}</p>
                      <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                        SKU: {item.product?.sku || "N/A"} | HSN: {hsnCode}
                      </p>
                    </td>
                    <td className="py-3 text-right">{item.quantity}</td>
                    <td className="py-3 text-right">₹{item.unitPrice.toLocaleString()}</td>
                    <td className="py-3 text-right">18%</td>
                    <td className="py-3 text-right">₹{((item.unitPrice * item.quantity) * 18/118).toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                    <td className="py-3 text-right font-bold">₹{(item.unitPrice * item.quantity).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* INVOICE SUMMARY */}
          <div className="flex justify-end pt-4">
            <div className="w-[320px] space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-neutral-500">Taxable Value:</span>
                <span>₹{(order.subtotal).toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">CGST (9%):</span>
                <span>₹{order.cgst.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">SGST (9%):</span>
                <span>₹{order.sgst.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600 font-bold">
                  <span>Distributor Discount:</span>
                  <span>-₹{order.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-neutral-500">Delivery/Shipping:</span>
                <span>{order.deliveryCharges === 0 ? "Free" : `₹${order.deliveryCharges.toLocaleString()}`}</span>
              </div>
              <div className="flex justify-between border-t border-neutral-900 pt-2 text-base font-black text-neutral-950">
                <span>Grand Total:</span>
                <span>₹{order.grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* BOTTOM VERIFICATION AND SIGNATURE */}
          <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-dashed border-neutral-300 gap-8">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 border border-neutral-350 rounded flex items-center justify-center bg-white flex-shrink-0 relative overflow-hidden p-1 shadow-sm">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`http://localhost:3000/account/orders/${order.id}?invoice=true`)}`}
                  alt="Verification QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <p className="font-bold flex items-center gap-1 text-[10px] text-green-700 uppercase">
                  <ShieldCheck size={14} /> GST COMPLIANT VERIFIED
                </p>
                <p className="text-[9px] text-neutral-500 mt-0.5">Scan or click link to verify:</p>
                <a
                  href={`/account/orders/${order.id}?invoice=true`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[9px] text-[#D71920] hover:underline block font-mono font-semibold"
                >
                  Verify Online Link
                </a>
              </div>
            </div>
            
            <div className="text-center md:text-right border border-neutral-200 bg-neutral-50 p-4 rounded-xl w-[200px]">
              <p className="text-[10px] text-neutral-400 uppercase">Authorized Signature</p>
              <div className="h-10 flex items-center justify-center mt-2">
                {sellerSettings.seller_signature ? (
                  <img src={sellerSettings.seller_signature} alt="Authorized Signature" className="h-10 object-contain mx-auto filter mix-blend-multiply" />
                ) : (
                  <span className="font-serif italic text-sm text-neutral-500">{sellerSettings.seller_name}</span>
                )}
              </div>
              <p className="text-[9px] text-neutral-400 border-t border-neutral-200 pt-1 mt-2">Digitally Signed Document</p>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-slate-950 font-sans">
      <Header navLinks={navLinks} />

      <main className="flex-1 w-full max-w-[1400px] xl:max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 py-12 text-left">
        {/* Back navigation */}
        <button 
          onClick={() => router.push("/account?tab=orders")}
          className="inline-flex items-center gap-2 text-neutral-500 hover:text-[#D71920] font-bold text-xs uppercase tracking-wider mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to My Orders
        </button>

        {/* Top Header Card */}
        <div className="bg-white dark:bg-slate-900 shadow-md rounded-2xl p-6 md:p-8 border border-neutral-100 dark:border-slate-800 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{order.orderNumber}</h1>
              <span className={cn("px-2.5 py-0.5 border rounded-md text-xs font-bold uppercase tracking-wider", getStatusColor(order.status))}>
                {getStatusLabel(order.status)}
              </span>
            </div>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
              Order Date: {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {order.invoice && order.status !== "REJECTED" && (
              <button
                onClick={() => setInvoiceModalOpen(true)}
                className="flex items-center gap-2 px-5 py-3 bg-[#D71920] hover:bg-[#B91520] text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-red-500/10 cursor-pointer"
              >
                <FileText size={16} /> View & Print Invoice
              </button>
            )}
            {["PENDING_APPROVAL", "APPROVED", "PROCESSING", "PACKED"].includes(order.status) && (
              <button
                onClick={handleCancelOrder}
                className="flex items-center gap-2 px-5 py-3 bg-neutral-800 hover:bg-neutral-900 text-white rounded-xl text-sm font-bold transition-all shadow-md cursor-pointer"
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>

        {/* GRID LAYOUT: Left (Status timeline / details) & Right (totals summary) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT 2 COLUMNS */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* GRAPHICAL TIMELINE */}
            {order.status !== "REJECTED" && order.status !== "CANCELLED" && (
              <section className="bg-white dark:bg-slate-900 shadow-md rounded-2xl p-6 md:p-8 border border-neutral-100 dark:border-slate-800">
                <h2 className="text-base font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                  <Truck className="text-[#D71920]" size={18} /> Delivery Timeline
                </h2>
                
                <div className="relative flex justify-between items-center w-full max-w-2xl mx-auto pt-4 pb-2">
                  {/* Progress Line Background */}
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-neutral-100 dark:bg-slate-800 z-0"></div>
                  
                  {/* Progress Line Active Fill */}
                  <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-green-500 z-0 transition-all duration-750"
                    style={{ width: `${currentStatusIndex >= 0 ? (currentStatusIndex / (trackingStages.length - 1)) * 100 : 0}%` }}
                  ></div>

                  {trackingStages.map((stage, idx) => {
                    const isDone = currentStatusIndex >= idx;
                    const isActive = currentStatusIndex === idx;
                    return (
                      <div key={stage.label} className="relative z-10 flex flex-col items-center">
                        <div className={cn(
                          "w-8 h-8 rounded-full border-4 flex items-center justify-center text-xs font-bold transition-all",
                          isDone 
                            ? "bg-green-500 border-green-200 text-white dark:border-green-950" 
                            : "bg-white dark:bg-slate-900 border-neutral-200 dark:border-slate-800 text-neutral-400"
                        )}>
                          {isDone ? <CheckCircle2 size={14} /> : idx + 1}
                        </div>
                        <span className={cn(
                          "text-[10px] font-extrabold uppercase tracking-wider mt-2.5",
                          isActive ? "text-[#D71920]" : isDone ? "text-green-600" : "text-neutral-400"
                        )}>
                          {stage.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* STATUS LOGS HISTORICAL REMARKS */}
            <section className="bg-white dark:bg-slate-900 shadow-md rounded-2xl p-6 md:p-8 border border-neutral-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-6">Tracking Log Details</h2>
              <div className="relative pl-6 border-l-2 border-neutral-100 dark:border-slate-800 space-y-8">
                {order.statusHistory && order.statusHistory.length > 0 ? (
                  order.statusHistory.map((history) => (
                    <div key={history.id} className="relative">
                      {/* Circle indicator on vertical line */}
                      <span className="absolute -left-[32px] top-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 bg-[#D71920]"></span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-slate-800 dark:text-white">{getStatusLabel(history.status)}</p>
                          <span className="text-[10px] text-neutral-400 font-medium">
                            {new Date(history.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {history.remarks && (
                          <p className="text-xs text-neutral-500 mt-1 leading-relaxed bg-neutral-50 dark:bg-slate-950 p-3 rounded-xl border border-neutral-100 dark:border-slate-850 w-fit max-w-xl font-medium">
                            {history.remarks}
                          </p>
                        )}
                        <p className="text-[10px] text-neutral-400 mt-1">Updated by: {history.updatedBy}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-neutral-500">No tracking logs recorded yet.</p>
                )}
              </div>
            </section>

            {/* CHECKLIST ITEMS */}
            <section className="bg-white dark:bg-slate-900 shadow-md rounded-2xl p-6 md:p-8 border border-neutral-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                <Package className="text-[#D71920]" size={18} /> Products Ordered
              </h2>
              
              <div className="divide-y divide-neutral-100 dark:divide-slate-800">
                {order.items.map((item) => (
                  <div key={item.id} className="py-4 flex justify-between gap-4 items-start md:items-center">
                    <div className="flex gap-4">
                      {item.product?.image ? (
                        <img 
                          src={item.product.image} 
                          alt={item.product.name} 
                          className="w-16 h-16 rounded-xl border border-neutral-100 object-contain p-1 bg-white"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-neutral-100 rounded-xl flex items-center justify-center">
                          <Package className="text-neutral-400" size={24} />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{item.product?.name || "Product Item"}</p>
                        <p className="text-[11px] text-neutral-400 mt-0.5">Model: {item.product?.modelNumber || "N/A"} | SKU: {item.product?.sku || "N/A"}</p>
                        <p className="text-[11px] text-[#D71920] font-bold mt-1">₹{item.unitPrice.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800 dark:text-white">Qty: {item.quantity}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* RIGHT COLUMN (SUMMARY) */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* SHIPPING DESTINATION */}
            <section className="bg-white dark:bg-slate-900 shadow-md rounded-2xl p-6 border border-neutral-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <MapPin className="text-[#D71920]" size={16} /> Delivery Address
              </h2>
              {order.address ? (
                <div className="text-xs space-y-1 text-neutral-600 dark:text-neutral-400">
                  <p className="font-bold text-neutral-800 dark:text-white text-sm">{order.address.fullName}</p>
                  {order.address.companyName && <p className="font-semibold text-neutral-700 dark:text-neutral-300">{order.address.companyName}</p>}
                  <p>{order.address.addressLine1}</p>
                  {order.address.addressLine2 && <p>{order.address.addressLine2}</p>}
                  <p>{order.address.city}, {order.address.state} - {order.address.pincode}</p>
                  <p className="font-semibold text-neutral-700 mt-2">Mobile: {order.address.mobileNumber}</p>
                </div>
              ) : (
                <p className="text-xs text-neutral-500">No delivery address found.</p>
              )}
            </section>

            {/* ORDER VALUE OVERVIEW */}
            <section className="bg-white dark:bg-slate-900 shadow-md rounded-2xl p-6 border border-neutral-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-6">Payment Summary</h2>
              
              <div className="space-y-3.5 text-xs text-neutral-600 dark:text-neutral-400">
                <div className="flex justify-between items-center">
                  <span>Payment Method</span>
                  <span className="font-bold text-neutral-800 dark:text-white">{order.paymentMethod}</span>
                </div>
                {order.poNumber && (
                  <div className="flex justify-between items-center">
                    <span>PO Reference</span>
                    <span className="font-bold text-neutral-800 dark:text-white">{order.poNumber}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2.5 border-t border-neutral-100 dark:border-slate-800">
                  <span>Subtotal</span>
                  <span className="font-bold text-neutral-800 dark:text-white">₹{order.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>CGST (9%)</span>
                  <span>₹{order.cgst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>SGST (9%)</span>
                  <span>₹{order.sgst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Delivery Charges</span>
                  <span>{order.deliveryCharges === 0 ? <span className="text-green-600 font-bold">FREE</span> : `₹${order.deliveryCharges}`}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between items-center text-green-600 font-bold">
                    <span>Discounts</span>
                    <span>-₹{order.discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                
                <div className="border-t border-neutral-100 dark:border-slate-800 border-dashed pt-4 flex justify-between items-end text-neutral-800 dark:text-white">
                  <span className="font-bold text-sm">Grand Total</span>
                  <span className="text-xl font-black text-[#D71920]">₹{order.grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
              </div>
            </section>

          </div>

        </div>
      </main>

      <Footer footerColumns={footerColumns} socialLinks={socialLinks} />

      {/* ── INVOICE VIEW PREVIEW MODAL ── */}
      {invoiceModalOpen && order.invoice && order.status !== "REJECTED" && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-sm flex justify-center items-start py-8 px-4 print:p-0 print:bg-white text-left">
          <style jsx global>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #invoice-print-area, #invoice-print-area * {
                visibility: visible;
              }
              #invoice-print-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                background: white !important;
                color: black !important;
              }
            }
          `}</style>
          
          <div className="w-full max-w-[850px] bg-white text-neutral-900 border border-neutral-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col print:border-none print:shadow-none print:rounded-none">
            {/* Modal Controls */}
            <div className="flex justify-between items-center px-6 py-4 bg-neutral-100 border-b border-neutral-200 print:hidden">
              <span className="font-bold text-sm text-neutral-600 flex items-center gap-1.5">
                <FileText size={18} className="text-[#D71920]" />
                Tax Invoice Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-900 font-bold text-xs text-white rounded-lg transition-colors cursor-pointer"
                >
                  <Printer size={14} />
                  Print / Save PDF
                </button>
                <button
                  onClick={() => setInvoiceModalOpen(false)}
                  className="px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 font-bold text-xs text-neutral-700 rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* PRINT AREA */}
            <div id="invoice-print-area" className="p-8 md:p-12 space-y-8 bg-white text-neutral-900 font-mono text-xs">
              
              <div className="flex justify-between items-start border-b-2 border-neutral-900 pb-6">
                <div className="flex items-center gap-4">
                  <img
                    src="/SD-logo.png"
                    alt="SD Smart Appliances"
                    className="h-16 w-auto object-contain"
                  />
                  <div>
                    <h2 className="text-lg font-black text-neutral-950 uppercase tracking-tight">
                      {sellerSettings.seller_name}
                    </h2>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-block px-3 py-1 bg-neutral-900 text-white font-bold uppercase tracking-wider text-[10px]">
                    TAX INVOICE
                  </div>
                  <p className="text-neutral-500 font-bold mt-2">Invoice #: {order.invoice.invoiceNumber}</p>
                  <p className="text-neutral-55 text-neutral-500">Date: {new Date(order.invoice.invoiceDate).toLocaleDateString('en-IN')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 text-neutral-800">
                <div className="space-y-1">
                  <p className="font-bold text-neutral-900 border-b border-neutral-200 pb-1 uppercase tracking-wider text-[10px]">
                    SOLD BY (Seller)
                  </p>
                  <p className="font-bold text-neutral-900">{sellerSettings.seller_name}</p>
                  <p>{sellerSettings.seller_address_line1}</p>
                  <p>{sellerSettings.seller_address_line2}</p>
                  <p>GSTIN: {sellerSettings.seller_gstin}</p>
                  <p>Email: {sellerSettings.seller_email}</p>
                  <p>Phone: {sellerSettings.seller_phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-neutral-900 border-b border-neutral-200 pb-1 uppercase tracking-wider text-[10px]">
                    BILL TO (Distributor)
                  </p>
                  {order.address ? (
                    <>
                      <p className="font-bold text-neutral-900">{order.address.fullName}</p>
                      {order.address.companyName && <p className="font-semibold">{order.address.companyName}</p>}
                      <p>Distributor Code: DIST-{order.userId.substring(0, 8).toUpperCase()}</p>
                      <p>{order.address.addressLine1}</p>
                      {order.address.addressLine2 && <p>{order.address.addressLine2}</p>}
                      <p>{order.address.city}, {order.address.state} - {order.address.pincode}</p>
                      <p>GSTIN: {order.address.gstin || "N/A"}</p>
                      <p>Phone: {order.address.mobileNumber}</p>
                    </>
                  ) : (
                    <p>No address details</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 p-4 bg-neutral-50 border border-neutral-200 rounded-xl text-[11px]">
                <div>
                  <span className="text-neutral-500 block">Order Number</span>
                  <span className="font-bold">{order.orderNumber}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Order Date</span>
                  <span className="font-bold">{new Date(order.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Payment Method</span>
                  <span className="font-bold">{order.paymentMethod}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Payment Status</span>
                  <span className={`font-bold uppercase ${
                    order.paymentStatus === "PAID" ? "text-green-700" :
                    order.paymentStatus === "REFUNDED" ? "text-amber-600" :
                    order.paymentStatus === "UNPAID" ? "text-red-700" : "text-neutral-600"
                  }`}>
                    {order.paymentStatus || "PENDING"}
                  </span>
                </div>
              </div>

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-neutral-950 font-bold uppercase tracking-wider text-[10px] text-neutral-700">
                    <th className="py-2">Item Details</th>
                    <th className="py-2 text-right">Qty</th>
                    <th className="py-2 text-right">Unit Price</th>
                    <th className="py-2 text-right">GST %</th>
                    <th className="py-2 text-right">GST Amt</th>
                    <th className="py-2 text-right font-black">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {order.items.map((item) => {
                    const hsnCode = item.product?.category === "pressure-cookers" ? "73239300" : "85166000";

                    return (
                      <tr key={item.id} className="py-3">
                        <td className="py-3">
                          <p className="font-bold text-neutral-950">{item.product?.name}</p>
                          <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                            SKU: {item.product?.sku || "N/A"} | HSN: {hsnCode}
                          </p>
                        </td>
                        <td className="py-3 text-right">{item.quantity}</td>
                        <td className="py-3 text-right">₹{item.unitPrice.toLocaleString()}</td>
                        <td className="py-3 text-right">18%</td>
                        <td className="py-3 text-right">₹{((item.unitPrice * item.quantity) * 18/118).toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                        <td className="py-3 text-right font-bold">₹{(item.unitPrice * item.quantity).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="flex justify-end pt-4">
                <div className="w-[320px] space-y-2 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Taxable Value:</span>
                    <span>₹{(order.subtotal).toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">CGST (9%):</span>
                    <span>₹{order.cgst.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">SGST (9%):</span>
                    <span>₹{order.sgst.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-green-600 font-bold">
                      <span>Distributor Discount:</span>
                      <span>-₹{order.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Delivery/Shipping:</span>
                    <span>{order.deliveryCharges === 0 ? "Free" : `₹${order.deliveryCharges.toLocaleString()}`}</span>
                  </div>
                  <div className="flex justify-between border-t border-neutral-900 pt-2 text-base font-black text-neutral-950">
                    <span>Grand Total:</span>
                    <span>₹{order.grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-dashed border-neutral-300 gap-8">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 border border-neutral-350 rounded flex items-center justify-center bg-white flex-shrink-0 relative overflow-hidden p-1 shadow-sm">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`http://localhost:3000/account/orders/${order.id}?invoice=true`)}`}
                      alt="Verification QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <p className="font-bold flex items-center gap-1 text-[10px] text-green-700 uppercase">
                      <ShieldCheck size={14} /> GST COMPLIANT VERIFIED
                    </p>
                    <p className="text-[9px] text-neutral-500 mt-0.5">Scan or click link to verify:</p>
                    <a
                      href={`/account/orders/${order.id}?invoice=true`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] text-[#D71920] hover:underline block font-mono font-semibold"
                    >
                      Verify Online Link
                    </a>
                  </div>
                </div>
                
                <div className="text-center md:text-right border border-neutral-200 bg-neutral-50 p-4 rounded-xl w-[200px]">
                  <p className="text-[10px] text-neutral-400 uppercase">Authorized Signature</p>
                  <div className="h-10 flex items-center justify-center mt-2">
                    {sellerSettings.seller_signature ? (
                      <img src={sellerSettings.seller_signature} alt="Authorized Signature" className="h-10 object-contain mx-auto filter mix-blend-multiply" />
                    ) : (
                      <span className="font-serif italic text-sm text-neutral-500">{sellerSettings.seller_name}</span>
                    )}
                  </div>
                  <p className="text-[9px] text-neutral-400 border-t border-neutral-200 pt-1 mt-2">Digitally Signed Document</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
