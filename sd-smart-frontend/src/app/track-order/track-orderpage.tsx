"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { navLinks, footerColumns, socialLinks } from "../LandingPage/data/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { Order } from "@/types/api";
import { cn } from "@/lib/utils";
import { 
  Search, ClipboardList, CheckCircle2, Clock, AlertCircle, 
  Loader2, ArrowRight, Truck, Calendar, MapPin, Package, FileText
} from "lucide-react";

// Wrap contents in Suspense since we use useSearchParams
function TrackOrderContent() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get("id") || "";

  const [searchQuery, setSearchQuery] = useState(initialOrderId);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch recent orders on load if authenticated
  useEffect(() => {
    const fetchRecentOrders = async () => {
      if (!isAuthenticated) return;
      setLoadingRecent(true);
      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch("http://localhost:5000/api/orders", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.orders) {
          setRecentOrders(data.orders.slice(0, 5));
        }
      } catch (err) {
        console.error("Failed to load recent orders", err);
      } finally {
        setLoadingRecent(false);
      }
    };
    
    fetchRecentOrders();
  }, [isAuthenticated]);

  // Trigger search if initial URL parameter is present
  useEffect(() => {
    if (initialOrderId && isAuthenticated) {
      handleSearch(initialOrderId);
    }
  }, [initialOrderId, isAuthenticated]);

  const handleSearch = async (targetId: string) => {
    const idToSearch = targetId || searchQuery;
    if (!idToSearch.trim()) return;

    setLoadingSearch(true);
    setErrorMsg("");
    setActiveOrder(null);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`http://localhost:5000/api/orders/${idToSearch.trim()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.order) {
        setActiveOrder(data.order);
      } else {
        setErrorMsg(data.message || "No matching order found. Please check the order number.");
      }
    } catch (err) {
      console.error("Order search error:", err);
      setErrorMsg("Failed to connect to the server.");
    } finally {
      setLoadingSearch(false);
    }
  };

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
      case "PENDING_APPROVAL": return "text-amber-500 bg-amber-50 border-amber-200 dark:bg-amber-950/10 dark:border-amber-900/30";
      case "APPROVED": return "text-blue-500 bg-blue-50 border-blue-200 dark:bg-blue-950/10 dark:border-blue-900/30";
      case "PROCESSING": return "text-indigo-500 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/10 dark:border-indigo-900/30";
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

  const trackingStages = [
    { label: "Submitted", status: "PENDING_APPROVAL" },
    { label: "Approved", status: "APPROVED" },
    { label: "Processing", status: "PROCESSING" },
    { label: "Shipped", status: "SHIPPED" },
    { label: "Delivered", status: "DELIVERED" }
  ];

  const currentStatusIndex = activeOrder ? trackingStages.findIndex(s => {
    if (activeOrder.status === "REJECTED" || activeOrder.status === "CANCELLED") return false;
    if (activeOrder.status === "PACKED") return s.status === "PROCESSING";
    if (["IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(activeOrder.status)) return s.status === "SHIPPED";
    return s.status === activeOrder.status;
  }) : -1;

  if (authLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#D71920] animate-spin" />
        <p className="mt-4 text-xs font-semibold text-neutral-500">Checking authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-6">
        <div className="w-16 h-16 bg-neutral-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto text-neutral-400 border border-neutral-100">
          <Truck size={28} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Track Your Distributor Orders</h2>
          <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
            Order tracking requires an active distributor session. Please sign in to verify your billing credentials and view logistical stages.
          </p>
        </div>
        <button
          onClick={() => router.push("/auth/login?redirect=/track-order")}
          className="w-full py-3.5 bg-[#D71920] hover:bg-[#b8141a] text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-red-500/10 cursor-pointer"
        >
          LOG IN TO TRACK ORDER
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      
      {/* Search Input block */}
      <section className="bg-white dark:bg-slate-900 shadow-md rounded-2xl p-6 md:p-8 border border-neutral-100 dark:border-slate-800 max-w-3xl">
        <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4">Search Shipment</h2>
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(""); }} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
            <input 
              type="text" 
              placeholder="Enter Order Number (e.g. ORD-17822151...)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-neutral-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white text-sm rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 outline-none transition-all placeholder-neutral-400"
            />
          </div>
          <button 
            type="submit"
            disabled={loadingSearch || !searchQuery.trim()}
            className="px-6 py-3 bg-[#1C1C1C] hover:bg-black text-white text-sm font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loadingSearch ? <Loader2 size={16} className="animate-spin" /> : "Track Order"}
          </button>
        </form>

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle size={14} className="text-[#D71920]" />
            <span>{errorMsg}</span>
          </div>
        )}
      </section>

      {/* TRACKING TIMELINE DISPLAY */}
      {activeOrder && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Timeline & Logs */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Timeline Graphic */}
            {activeOrder.status !== "REJECTED" && activeOrder.status !== "CANCELLED" && (
              <section className="bg-white dark:bg-slate-900 shadow-md rounded-2xl p-6 md:p-8 border border-neutral-100 dark:border-slate-800">
                <div className="flex justify-between items-start border-b border-neutral-100 dark:border-slate-800 pb-4 mb-6">
                  <div>
                    <h3 className="font-bold text-base text-slate-800 dark:text-white">{activeOrder.orderNumber}</h3>
                    <p className="text-[10px] text-neutral-400">Distributor shipment progress</p>
                  </div>
                  <span className={cn("px-2.5 py-0.5 border rounded-md text-[10px] font-bold uppercase tracking-wider", getStatusColor(activeOrder.status))}>
                    {getStatusLabel(activeOrder.status)}
                  </span>
                </div>

                <div className="relative flex justify-between items-center w-full max-w-2xl mx-auto pt-4 pb-2">
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-neutral-100 dark:bg-slate-800 z-0"></div>
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

            {/* Tracking logs */}
            <section className="bg-white dark:bg-slate-900 shadow-md rounded-2xl p-6 md:p-8 border border-neutral-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-6">Log details</h2>
              <div className="relative pl-6 border-l-2 border-neutral-100 dark:border-slate-800 space-y-8">
                {activeOrder.statusHistory && activeOrder.statusHistory.length > 0 ? (
                  activeOrder.statusHistory.map((history) => (
                    <div key={history.id} className="relative">
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
                  <p className="text-xs text-neutral-500">No logs found.</p>
                )}
              </div>
            </section>
          </div>

          {/* Quick breakdown right column */}
          <div className="lg:col-span-1 space-y-8">
            <section className="bg-white dark:bg-slate-900 shadow-md rounded-2xl p-6 border border-neutral-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4">Shipment Details</h2>
              <div className="text-xs space-y-4 text-neutral-600 dark:text-neutral-400">
                <div>
                  <span className="text-neutral-400 block mb-1">Destination</span>
                  {activeOrder.address ? (
                    <>
                      <p className="font-bold text-neutral-800 dark:text-white">{activeOrder.address.fullName}</p>
                      <p>{activeOrder.address.city}, {activeOrder.address.state} - {activeOrder.address.pincode}</p>
                    </>
                  ) : (
                    <p className="text-neutral-500">No delivery address found</p>
                  )}
                </div>
                <div>
                  <span className="text-neutral-400 block mb-1">Billing Details</span>
                  <p className="font-bold text-neutral-800 dark:text-white">₹{activeOrder.grandTotal.toLocaleString('en-IN')}</p>
                  <p>{activeOrder.items.length} unique products ordered</p>
                </div>
                <button 
                  onClick={() => router.push(`/account/orders/${activeOrder.id}`)}
                  className="w-full py-2.5 border border-neutral-200 dark:border-slate-800 hover:bg-neutral-50 dark:hover:bg-slate-850 text-neutral-800 dark:text-white font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                >
                  View Details in Account
                </button>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* RECENT ORDERS SIDE LOG */}
      {!activeOrder && (
        <section className="bg-white dark:bg-slate-900 shadow-md rounded-2xl p-6 md:p-8 border border-neutral-100 dark:border-slate-800 max-w-3xl">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <ClipboardList className="text-[#D71920]" size={16} /> Recent Order History
          </h2>
          
          {loadingRecent ? (
            <div className="py-6 flex justify-center">
              <Loader2 className="w-6 h-6 text-[#D71920] animate-spin" />
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="text-xs text-neutral-500 py-4">No recent orders located.</p>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-slate-850">
              {recentOrders.map((ord) => (
                <div 
                  key={ord.id}
                  onClick={() => {
                    setSearchQuery(ord.orderNumber);
                    handleSearch(ord.orderNumber);
                  }}
                  className="py-3 flex justify-between items-center hover:bg-neutral-50/50 dark:hover:bg-slate-850/50 px-2 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800 dark:text-white">{ord.orderNumber}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">{new Date(ord.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn("px-2 py-0.5 border rounded-md text-[9px] font-bold uppercase tracking-wider", getStatusColor(ord.status))}>
                      {getStatusLabel(ord.status)}
                    </span>
                    <ArrowRight size={14} className="text-neutral-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-slate-950 font-sans">
      <Header navLinks={navLinks} />

      <main className="flex-1 max-w-[1400px] xl:max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 py-16 text-left w-full">
        <p className="text-xs font-bold text-[#D71920] uppercase tracking-widest mb-2">Support</p>
        <h1 className="text-4xl font-black text-[#1C1C1C] dark:text-white leading-tight mb-4">
          Track Shipment
        </h1>
        <p className="text-neutral-500 max-w-xl leading-relaxed text-sm mb-10">
          Enter your unique distributor Order Number to monitor approval states and logistics steps in real-time.
        </p>

        <Suspense fallback={
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 text-[#D71920] animate-spin" />
          </div>
        }>
          <TrackOrderContent />
        </Suspense>
      </main>

      <Footer footerColumns={footerColumns} socialLinks={socialLinks} />
    </div>
  );
}
