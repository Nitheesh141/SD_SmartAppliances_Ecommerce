"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { 
  Building, User, Mail, Phone, FileText, MapPin, 
  ShoppingBag, Clock, AlertTriangle, CheckCircle2, XCircle, LogOut, ArrowRight, Loader2
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface OrderType {
  id: string;
  orderNumber: string;
  createdAt: string;
  grandTotal: number;
  status: string;
  paymentStatus: string;
}

export default function DistributerDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Redirect if not authenticated or not a distributor
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user) {
        router.push("/auth/login");
        return;
      }
      const role = user.role?.toUpperCase();
      if (role !== "DISTRIBUTOR" && user.role !== "distributor") {
        toast.error("Access denied. Distributor account required.");
        router.push("/");
      }
    }
  }, [isAuthenticated, user, authLoading, router]);

  // Fetch distributor orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      setLoadingOrders(true);
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        const response = await fetch("http://localhost:5000/api/orders", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setOrders(data.orders || []);
          }
        }
      } catch (err) {
        console.error("Error fetching distributor orders:", err);
      } finally {
        setLoadingOrders(false);
      }
    };

    if (isAuthenticated && user) {
      fetchOrders();
    }
  }, [isAuthenticated, user]);

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
    toast.success("Logged out successfully");
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 font-sans">
        <Loader2 className="w-12 h-12 text-[#D71920] animate-spin" />
        <p className="mt-4 text-sm text-neutral-500 font-semibold tracking-wider">Loading Dashboard...</p>
      </div>
    );
  }

  const approvalStatus = user.approvalStatus?.toUpperCase() || "PENDING";
  const isApproved = approvalStatus === "APPROVED";
  const isRejected = approvalStatus === "REJECTED";
  const isPending = approvalStatus === "PENDING";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-[#1C1C1C] dark:text-white font-sans flex flex-col">
      {/* Premium Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-neutral-200 dark:border-slate-800 py-4 px-6 sm:px-8 sticky top-0 z-40 backdrop-blur-md bg-white/95 dark:bg-slate-900/95 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <img
                src="/sd-smart-ecommerce/SD-logo.png"
                alt="SD Smart Appliances"
                className="h-9 w-auto object-contain cursor-pointer"
              />
            </Link>
            <span className="h-5 w-[1px] bg-neutral-200 dark:bg-slate-700"></span>
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#D71920]">
              Distributor Portal
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/shop" className="text-sm font-semibold hover:text-[#D71920] transition-colors text-neutral-600 dark:text-neutral-300">
              Browse Products
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-neutral-100 hover:bg-red-50 text-neutral-700 hover:text-[#D71920] dark:bg-slate-800 dark:hover:bg-red-950/30 dark:text-neutral-300 transition-all cursor-pointer"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8 space-y-6">
        {/* Welcome Section */}
        <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors duration-300">
          <div>
            <span className="text-xs font-extrabold text-[#D71920] uppercase tracking-widest bg-red-500/10 px-2.5 py-1 rounded-full">
              Authorized Partner
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-3">
              {user.companyName || "Distributor Partner"}
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
              Manage your wholesale orders, billing information, and partnership status.
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 p-4 rounded-xl self-start md:self-auto">
            <div className="w-12 h-12 rounded-lg bg-[#D71920]/10 flex items-center justify-center text-[#D71920]">
              <Building size={24} />
            </div>
            <div>
              <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Account ID</p>
              <p className="font-mono text-sm font-bold text-neutral-700 dark:text-neutral-300 truncate max-w-[150px]">{user.id}</p>
            </div>
          </div>
        </div>

        {/* Status Notification Banner */}
        {isPending && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 flex items-start gap-4 text-amber-800 dark:text-amber-300 animate-pulse-slow">
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-base">Account Under Review</h3>
              <p className="text-sm text-amber-800/80 dark:text-amber-300/80 mt-1 leading-relaxed">
                Your distributor account is currently under review. Please wait for admin approval before placing orders.
              </p>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 flex items-start gap-4 text-red-800 dark:text-red-300">
            <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-base">Application Rejected</h3>
              <p className="text-sm text-red-800/80 dark:text-red-300/80 mt-1 leading-relaxed">
                Your distributor application has been rejected. Please contact support.
              </p>
            </div>
          </div>
        )}

        {isApproved && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 flex items-start gap-4 text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-base">Account Approved & Active</h3>
              <p className="text-sm text-emerald-800/80 dark:text-emerald-300/80 mt-1 leading-relaxed">
                Your account is fully approved! You can now place bulk wholesale orders, view pricing, and access dynamically generated invoices containing your business name and GSTIN.
              </p>
            </div>
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Business Profile Details (Left Column, spans 1) */}
          <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-6 transition-colors duration-300">
            <h2 className="text-lg font-extrabold flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-slate-800">
              <Building size={18} className="text-[#D71920]" />
              <span>Business Profile</span>
            </h2>
            
            <div className="space-y-4">
              {/* Contact Person */}
              <div className="flex items-start gap-3">
                <User className="text-neutral-400 mt-0.5 shrink-0" size={16} />
                <div>
                  <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Contact Person</p>
                  <p className="text-sm font-bold mt-0.5 text-neutral-700 dark:text-neutral-300">{user.name}</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-3">
                <Mail className="text-neutral-400 mt-0.5 shrink-0" size={16} />
                <div className="min-w-0">
                  <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Email Address</p>
                  <p className="text-sm font-bold mt-0.5 text-neutral-700 dark:text-neutral-300 truncate">{user.email}</p>
                </div>
              </div>

              {/* Mobile */}
              <div className="flex items-start gap-3">
                <Phone className="text-neutral-400 mt-0.5 shrink-0" size={16} />
                <div>
                  <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Mobile Number</p>
                  <p className="text-sm font-bold mt-0.5 text-neutral-700 dark:text-neutral-300">{user.phoneNumber || "N/A"}</p>
                </div>
              </div>

              {/* GST Number */}
              <div className="flex items-start gap-3">
                <FileText className="text-neutral-400 mt-0.5 shrink-0" size={16} />
                <div>
                  <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">GSTIN</p>
                  <p className="text-sm font-mono font-bold mt-0.5 text-neutral-700 dark:text-neutral-300">
                    {user.gstin || <span className="text-neutral-400 italic">Not Provided</span>}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-start gap-3">
                <Clock className="text-neutral-400 mt-0.5 shrink-0" size={16} />
                <div>
                  <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Approval Status</p>
                  <span className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1.5 ${
                    isApproved ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" :
                    isRejected ? "bg-red-500/15 text-red-600 dark:text-red-400" :
                    "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  }`}>
                    {approvalStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Action Link */}
            <Link 
              href="/account" 
              className="mt-2 text-center text-xs font-bold text-[#D71920] hover:text-[#B91520] flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-[#D71920]/30 hover:border-[#D71920] hover:bg-red-500/5 transition-all cursor-pointer"
            >
              <span>Manage Profile & Addresses</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          {/* Wholesale Orders History (Right Column, spans 2) */}
          <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-6 lg:col-span-2 transition-colors duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-slate-800">
              <h2 className="text-lg font-extrabold flex items-center gap-2">
                <ShoppingBag size={18} className="text-[#D71920]" />
                <span>Recent Wholesale Orders</span>
              </h2>
              {isApproved && (
                <Link 
                  href="/shop" 
                  className="text-xs font-bold text-[#D71920] hover:text-[#B91520] flex items-center gap-1"
                >
                  <span>Place New Order</span>
                  <ArrowRight size={12} />
                </Link>
              )}
            </div>

            {loadingOrders ? (
              <div className="py-12 flex flex-col items-center justify-center text-neutral-400">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400 mb-2" />
                <p className="text-xs font-medium">Fetching orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-12 px-6 border-2 border-dashed border-neutral-100 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-slate-800 flex items-center justify-center text-neutral-400 dark:text-neutral-500 mb-3">
                  <ShoppingBag size={20} />
                </div>
                <h3 className="text-sm font-bold">No orders placed yet</h3>
                <p className="text-xs text-neutral-400 mt-1 max-w-[280px]">
                  {isApproved 
                    ? "Start browsing our premium range of appliances and place your first wholesale order."
                    : "Once your account is approved, you'll be able to place bulk orders and download invoices."
                  }
                </p>
                {isApproved && (
                  <Link 
                    href="/shop" 
                    className="mt-4 bg-[#D71920] hover:bg-[#B91520] text-white text-xs font-bold px-4 py-2 rounded-lg shadow-md shadow-[#D71920]/10 transition-colors cursor-pointer"
                  >
                    Browse Catalog
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-100 dark:border-slate-800 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-2">Order Details</th>
                      <th className="py-3 px-2">Date Placed</th>
                      <th className="py-3 px-2 text-right">Order Total</th>
                      <th className="py-3 px-2 text-center">Status</th>
                      <th className="py-3 px-2 text-right">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-slate-800 text-sm">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-neutral-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-2">
                          <Link href={`/account/orders/${order.id}`} className="font-bold text-[#D71920] hover:underline">
                            {order.orderNumber}
                          </Link>
                          <p className="text-xs text-neutral-400 mt-0.5">Payment: {order.paymentStatus}</p>
                        </td>
                        <td className="py-4 px-2 text-neutral-600 dark:text-neutral-400">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric"
                          })}
                        </td>
                        <td className="py-4 px-2 font-bold text-right">
                          ₹{order.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-2 text-center">
                          <span className={`inline-block text-[9px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full ${
                            order.status === "DELIVERED" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                            order.status === "REJECTED" || order.status === "CANCELLED" ? "bg-red-500/10 text-red-600 dark:text-red-400" :
                            "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          }`}>
                            {order.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-right">
                          <Link 
                            href={`http://localhost:5000/api/orders/${order.id}/invoice`}
                            target="_blank"
                            className="inline-block text-xs font-bold text-[#D71920] hover:underline"
                          >
                            PDF Invoice
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </main>
      
      {/* Footer */}
      <footer className="py-6 px-8 border-t border-neutral-200 dark:border-slate-800 text-center text-xs text-neutral-500 dark:text-neutral-500 transition-colors duration-300">
        <p>© 2026 SD Smart Appliances. All rights reserved. Wholesale & Distribution Network.</p>
      </footer>
    </div>
  );
}
