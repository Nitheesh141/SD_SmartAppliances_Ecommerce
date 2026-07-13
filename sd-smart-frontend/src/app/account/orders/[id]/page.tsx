"use client";
import { ENV } from "@/config/env";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { navLinks, footerColumns, socialLinks } from "@/app/LandingPage/data/navigation";
import { checkoutService } from "@/services/checkoutService";
import { Order } from "@/types/api";
import { 
  ArrowLeft, Package, User, MapPin, CreditCard, Receipt, 
  Download, Clock, Calendar, CheckCircle2, AlertTriangle, 
  XCircle, FileText, Printer, ShieldCheck 
} from "lucide-react";

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = params.id as string;
  const isInvoiceView = searchParams ? searchParams.get("invoice") === "true" : false;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
  
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
    const fetchOrder = async (isBackground = false) => {
      if (!isBackground) setLoading(true);
      try {
        const res = await checkoutService.getOrder(orderId);
        if (res.success && res.data?.order) {
          setOrder(res.data.order);
        }
      } catch (err) {
        console.error("Failed to fetch order:", err);
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
        console.error("Failed to fetch invoice settings:", err);
      }
    };
    
    if (orderId) {
      fetchOrder(false);
      fetchSettings();

      const interval = setInterval(() => {
        const activeEl = document.activeElement;
        const isInputFocused = activeEl && (
          ["INPUT", "TEXTAREA", "SELECT"].includes(activeEl.tagName.toUpperCase()) ||
          activeEl.getAttribute("contenteditable") === "true"
        );
        if (!isInputFocused) {
          fetchOrder(true);
        }
      }, 20000);

      return () => clearInterval(interval);
    }
  }, [orderId]);


  const handlePrint = () => {
    window.print();
  };

  const handleCancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${ENV.API_BASE_URL}/orders/${orderId}/cancel`, {
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
          <button onClick={() => router.push("/account?tab=orders")} className="text-[#D71920] hover:underline flex items-center gap-2">
            <ArrowLeft size={16} /> Back to My Orders
          </button>
        </main>
        <Footer footerColumns={footerColumns} socialLinks={socialLinks} />
      </div>
    );
  }

  const getStatusLabel = (status: string) => {
    const mapping: Record<string, string> = {
      PENDING_APPROVAL: "Pending Approval",
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
      case "PENDING_APPROVAL": return "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/30";
      case "APPROVED": return "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/30";
      case "PROCESSING": return "text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-900/30";
      case "PACKED": return "text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-900/30";
      case "SHIPPED": return "text-sky-600 bg-sky-50 border-sky-200 dark:bg-sky-950/20 dark:border-sky-900/30";
      case "IN_TRANSIT": return "text-teal-600 bg-teal-50 border-teal-200 dark:bg-teal-950/20 dark:border-teal-900/30";
      case "OUT_FOR_DELIVERY": return "text-cyan-600 bg-cyan-50 border-cyan-200 dark:bg-cyan-950/20 dark:border-cyan-900/30";
      case "DELIVERED": return "text-green-600 bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900/30";
      case "REJECTED": return "text-red-600 bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/30";
      case "CANCELLED": return "text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800/30";
      default: return "text-neutral-600 bg-neutral-50 border-neutral-200 dark:bg-slate-900 dark:border-slate-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING_APPROVAL": return <Clock size={16} className="text-amber-500" />;
      case "APPROVED": return <CheckCircle2 size={16} className="text-blue-500" />;
      case "REJECTED": return <XCircle size={16} className="text-red-500" />;
      case "CANCELLED": return <XCircle size={16} className="text-gray-500" />;
      default: return <Package size={16} className="text-indigo-500" />;
    }
  };

  // Timeline representation
  const mainStages = ["PENDING_APPROVAL", "APPROVED", "PROCESSING", "SHIPPED", "DELIVERED"];
  const currentStageIndex = mainStages.indexOf(order.status) !== -1 
    ? mainStages.indexOf(order.status) 
    : (order.status === "PACKED" ? 2 : order.status === "IN_TRANSIT" || order.status === "OUT_FOR_DELIVERY" ? 3 : 0);

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
              onClick={handlePrint}
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
        <div id="invoice-print-area" ref={invoiceRef} className="w-full max-w-[850px] p-8 md:p-12 bg-white text-neutral-900 border border-neutral-200 rounded-2xl shadow-sm font-mono text-xs space-y-8">
          
          {/* BRANDING & LOGO */}
          <div className="flex justify-between items-start border-b-2 border-neutral-900 pb-6">
            <div className="flex items-center gap-4">
              <img
                src="/sd-smart-ecommerce/SD-logo.png"
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
              <p className="text-neutral-500">Date: {new Date(order.invoice.invoiceDate).toLocaleDateString('en-IN')}</p>
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
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`http://localhost:3000/sd-smart-ecommerce/account/orders/${order.id}?invoice=true`)}`}
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
                  href={`/sd-smart-ecommerce/account/orders/${order.id}?invoice=true`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[9px] text-[#D71920] hover:underline block font-mono font-semibold font-bold"
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
      
      <main className="flex-1 w-full max-w-[1248px] mx-auto px-4 py-8 lg:py-12">
        {/* ACTION BUTTONS & HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <button 
            onClick={() => router.push("/account?tab=orders")} 
            className="flex items-center gap-2 text-sm font-bold text-neutral-600 dark:text-neutral-400 hover:text-[#D71920] transition-colors self-start"
          >
            <ArrowLeft size={16} /> Back to Orders
          </button>
          
          <div className="flex flex-wrap items-center gap-3">
            {order.status === "REJECTED" ? (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-500 font-bold uppercase">
                Order Rejected
              </span>
            ) : order.invoice ? (
              <button 
                onClick={() => setInvoiceModalOpen(true)}
                className="flex items-center gap-2 bg-[#D71920] hover:bg-[#B91520] px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-colors w-fit cursor-pointer"
              >
                <FileText size={16} />
                View & Print Invoice
              </button>
            ) : (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 text-neutral-500">
                Invoice will be generated on approval
              </span>
            )}

            {["PENDING_APPROVAL", "APPROVED", "PROCESSING", "PACKED"].includes(order.status) && (
              <button
                onClick={handleCancelOrder}
                className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-900 dark:bg-slate-800 dark:hover:bg-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-colors w-fit cursor-pointer"
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>

        <h1 className="text-2xl lg:text-3xl font-black text-[#1C1C1C] dark:text-white mb-8">Order Details</h1>

        {/* ORDER OVERVIEW ALERT IF CANCELLED OR REJECTED */}
        {(order.status === "CANCELLED" || order.status === "REJECTED") && (
          <div className="p-4 mb-8 border rounded-2xl flex items-start gap-3 bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400">
            <AlertTriangle className="flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-base">
                Order {order.status === "CANCELLED" ? "Cancelled" : "Rejected"}
              </h4>
              <p className="text-sm mt-1">
                Remarks: {order.rejectionReason || "No details provided."}
              </p>
            </div>
          </div>
        )}

        {/* ORDER PROGRESS BAR TIMELINE */}
        {order.status !== "CANCELLED" && order.status !== "REJECTED" && (
          <div className="bg-white dark:bg-slate-900 shadow-sm border border-neutral-200 dark:border-slate-800 rounded-2xl p-6 lg:p-8 mb-8">
            <h2 className="text-base font-bold text-neutral-800 dark:text-white mb-6 flex items-center gap-2">
              <Clock size={18} className="text-[#D71920]" />
              Fulfillment Status
            </h2>
            <div className="relative">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-neutral-100 dark:bg-slate-800 -translate-y-1/2 rounded-full hidden sm:block"></div>
              <div className="relative flex flex-col sm:flex-row justify-between gap-6 sm:gap-0">
                {mainStages.map((stage, index) => {
                  const isCompleted = index <= currentStageIndex;
                  const isCurrent = stage === order.status || (stage === "PROCESSING" && (order.status === "PACKED")) || (stage === "SHIPPED" && (order.status === "IN_TRANSIT" || order.status === "OUT_FOR_DELIVERY"));
                  
                  return (
                    <div key={stage} className="flex sm:flex-col items-center gap-4 sm:gap-2 relative z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                        isCompleted 
                          ? "bg-[#D71920] border-[#D71920] text-white" 
                          : "bg-white dark:bg-slate-900 border-neutral-200 dark:border-slate-700 text-neutral-400"
                      }`}>
                        {isCompleted ? "✓" : "○"}
                      </div>
                      <span className={`text-xs font-bold ${isCurrent ? "text-[#D71920]" : isCompleted ? "text-neutral-800 dark:text-white" : "text-neutral-400"}`}>
                        {getStatusLabel(stage)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

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
                    <span className="text-neutral-500 font-medium">Order Number:</span>
                    <span className="font-bold text-neutral-800 dark:text-white">{order.orderNumber}</span>
                  </div>
                  {order.invoice && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500 font-medium">Invoice Number:</span>
                      <span className="font-bold text-neutral-800 dark:text-white">{order.invoice.invoiceNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-neutral-500 font-medium">Order Date:</span>
                    <span className="font-bold text-neutral-800 dark:text-white">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500 font-medium">Status:</span>
                    <span className={`px-2 py-0.5 border text-[10px] font-bold uppercase tracking-wider rounded-md ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* DISTRIBUTOR INFORMATION */}
              <div className="bg-white dark:bg-slate-900 shadow-sm border border-neutral-200 dark:border-slate-800 rounded-2xl p-6">
                <h3 className="font-bold text-neutral-800 dark:text-white mb-4 flex items-center gap-2 border-b border-neutral-100 dark:border-slate-800 pb-3">
                  <User size={18} className="text-[#D71920]" /> Distributor Details
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500 font-medium">Distributor:</span>
                    <span className="font-bold text-neutral-800 dark:text-white">{order.address?.fullName || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500 font-medium">Distributor Code:</span>
                    <span className="font-bold text-neutral-800 dark:text-white">
                      DIST-{order.userId.substring(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500 font-medium">Mobile Number:</span>
                    <span className="font-bold text-neutral-800 dark:text-white">{order.address?.mobileNumber || "N/A"}</span>
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
                  {order.address.companyName && <p className="font-semibold text-neutral-700 dark:text-neutral-300">{order.address.companyName}</p>}
                  <p>Mobile: {order.address.mobileNumber}</p>
                  <p>{order.address.addressLine1}</p>
                  {order.address.addressLine2 && <p>{order.address.addressLine2}</p>}
                  {order.address.landmark && <p>Landmark: {order.address.landmark}</p>}
                  <p>{order.address.city}, {order.address.state} - {order.address.pincode}</p>
                </div>
              ) : (
                <p className="text-sm text-neutral-500">Address details not available.</p>
              )}
            </div>

            {/* STATUS TIMELINE DETAIL LOG */}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <div className="bg-white dark:bg-slate-900 shadow-sm border border-neutral-200 dark:border-slate-800 rounded-2xl p-6">
                <h3 className="font-bold text-neutral-800 dark:text-white mb-6 flex items-center gap-2 border-b border-neutral-100 dark:border-slate-800 pb-3">
                  <Clock size={18} className="text-[#D71920]" /> Order History Log
                </h3>
                
                <div className="relative pl-6 border-l-2 border-neutral-200 dark:border-slate-800 space-y-6">
                  {order.statusHistory.map((hist) => (
                    <div key={hist.id} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-slate-950 border-2 border-[#D71920]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#D71920]"></span>
                      </span>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-sm font-black text-neutral-800 dark:text-white">
                          {getStatusLabel(hist.status)}
                        </span>
                        <span className="text-xs text-neutral-500 flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(hist.updatedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                        {hist.remarks}
                      </p>
                      
                      <span className="inline-block text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">
                        Updated by {hist.updatedBy}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                      <img src={item.product?.image || "/placeholder.jpg"} alt={item.product?.name} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-neutral-800 dark:text-white text-base">{item.product?.name || "Product Name"}</h4>
                        <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">{item.product?.categoryLabel || item.product?.category || "Category"}</p>
                        <div className="flex flex-wrap gap-4 mt-3">
                          <p className="text-sm">
                            <span className="text-neutral-500">Model:</span>{" "}
                            <span className="font-bold text-neutral-800 dark:text-white">{item.product?.modelNumber || "N/A"}</span>
                          </p>
                          <p className="text-sm">
                            <span className="text-neutral-500">SKU:</span>{" "}
                            <span className="font-bold text-[#D71920] font-mono">{item.product?.sku || "N/A"}</span>
                          </p>
                          {item.product?.variantDetails && Object.keys(item.product.variantDetails).length > 0 && (
                            <div className="w-full text-xs text-neutral-500 mt-1">
                              Attributes:{" "}
                              {Object.entries(item.product.variantDetails).map(([k, v]) => `${k}: ${v}`).join(" | ")}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4 sm:mt-0 bg-neutral-50 dark:bg-slate-800 p-3 rounded-xl border border-neutral-100 dark:border-slate-700">
                        <div className="text-sm">
                          <span className="text-neutral-500">Price:</span> <span className="font-bold">₹{item.unitPrice.toLocaleString()}</span> &nbsp;|&nbsp; <span className="text-neutral-500">Qty:</span> <span className="font-bold">{item.quantity}</span>
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
                <Receipt size={20} className="text-[#D71920]" /> Order Cost Summary
              </h3>
              
              <div className="space-y-4 text-sm mb-6">
                <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400 font-medium">
                  <span>Subtotal</span>
                  <span className="font-bold text-neutral-800 dark:text-white">₹{order.subtotal.toLocaleString()}</span>
                </div>
                
                <div className="pt-3 border-t border-dashed border-neutral-200 dark:border-slate-700">
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Taxes</p>
                  <div className="space-y-2 pl-2">
                    <div className="flex justify-between items-center text-neutral-500">
                      <span>CGST (9%)</span>
                      <span className="font-medium text-neutral-800 dark:text-white">₹{order.cgst.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-neutral-500">
                      <span>SGST (9%)</span>
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
                  <span>Distributor Discount</span>
                  <span className="font-bold text-green-600">-₹{order.discount.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400 font-medium">
                  <span>Logistics/Shipping</span>
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
                <CreditCard size={18} className="text-[#D71920]" /> Payment Details
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider mb-1">Payment Method</p>
                  <p className="font-bold text-neutral-800 dark:text-white">{order.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider mb-1">Approval Stage</p>
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </div>
                </div>
                {order.poNumber && (
                  <div>
                    <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider mb-1">Purchase Order (PO) #</p>
                    <p className="font-bold text-neutral-800 dark:text-white">{order.poNumber}</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* ── GST INVOICE MODAL (Flipkart/Amazon Invoice Layout) ── */}
      {invoiceModalOpen && order.invoice && order.status !== "REJECTED" && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-sm flex justify-center items-start py-8 px-4 print:p-0 print:bg-white">
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
            {/* Modal Controls (Hidden in Print) */}
            <div className="flex justify-between items-center px-6 py-4 bg-neutral-100 border-b border-neutral-200 print:hidden">
              <span className="font-bold text-sm text-neutral-600 flex items-center gap-1.5">
                <FileText size={18} className="text-[#D71920]" />
                Distributor Invoice Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-900 font-bold text-xs text-white rounded-lg transition-colors"
                >
                  <Printer size={14} />
                  Print / Save PDF
                </button>
                <button
                  onClick={() => setInvoiceModalOpen(false)}
                  className="px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 font-bold text-xs text-neutral-700 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            {/* PRINT AREA */}
            <div id="invoice-print-area" ref={invoiceRef} className="p-8 md:p-12 space-y-8 bg-white text-neutral-900 font-mono text-xs">
              
              {/* BRANDING & LOGO */}
              <div className="flex justify-between items-start border-b-2 border-neutral-900 pb-6">
                <div className="flex items-center gap-4">
                  <img
                    src="/sd-smart-ecommerce/SD-logo.png"
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
                  <p className="text-neutral-500">Date: {new Date(order.invoice.invoiceDate).toLocaleDateString('en-IN')}</p>
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
                  {order.items.map((item, idx) => {
                    const basePrice = item.unitPrice / 1.18; // 18% inclusive tax base
                    const totalTax = item.unitPrice * item.quantity * 0.18;
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
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`http://localhost:3000/sd-smart-ecommerce/account/orders/${order.id}?invoice=true`)}`}
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
                      href={`/sd-smart-ecommerce/account/orders/${order.id}?invoice=true`}
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

      <Footer footerColumns={footerColumns} socialLinks={socialLinks} />
    </div>
  );
}
