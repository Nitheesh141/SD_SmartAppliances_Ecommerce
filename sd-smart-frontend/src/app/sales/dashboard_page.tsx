"use client";
import { ENV } from "@/config/env";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";
import { 
  Loader2, RefreshCw, LayoutDashboard, Shield, Headphones, 
  ArrowLeftRight, IndianRupee, Clock
} from "lucide-react";
import SalesSidebar from "@/components/layout/SalesSidebar";
import { cn } from "@/lib/utils";

interface StatsType {
  assignedDistributorsCount: number;
  ordersThisMonthCount: number;
  salesValueThisMonth: number;
  pendingEnquiriesCount: number;
}

export default function SalesDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [stats, setStats] = useState<StatsType>({
    assignedDistributorsCount: 0,
    ordersThisMonthCount: 0,
    salesValueThisMonth: 0,
    pendingEnquiriesCount: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentEnquiries, setRecentEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Route protection
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user || user.role !== "SALESPERSON") {
        toast.error("Access Denied. Sales Persons only.");
        router.push("/auth/login");
      }
    }
  }, [isAuthenticated, user, authLoading, router]);

  // Fetch Dashboard Stats
  const fetchDashboardData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const res = await fetch(`${ENV.API_BASE_URL}/sales-persons/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setRecentOrders(data.recentOrders || []);
        setRecentEnquiries(data.recentEnquiries || []);
      } else {
        if (!isBackground) toast.error(data.message || "Failed to load dashboard data");
      }
    } catch (err) {
      console.error("Dashboard stats fetch error:", err);
      if (!isBackground) toast.error("Failed to load dashboard metrics");
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === "SALESPERSON") {
      fetchDashboardData(false);
      
      const interval = setInterval(() => {
        fetchDashboardData(true);
      }, 25000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-neutral-50 text-slate-900 transition-colors duration-300 font-sans">
      {/* Sidebar */}
      <SalesSidebar currentPath="/sales/dashboard" />

      {/* Main Content Area */}
      <main className="flex-1 px-6 lg:pl-72 py-8 overflow-y-auto text-left">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 mb-8 border-neutral-200">
          <div>
            <span className="text-xs font-bold text-[#D71920] uppercase tracking-widest">
              Performance Overview
            </span>
            <h1 className="text-3xl font-black tracking-tight text-[#1C1C1C] uppercase mt-0.5">
              Sales Dashboard
            </h1>
            <p className="text-xs font-bold text-neutral-500 uppercase mt-0.5">
              Welcome back, {user?.name}! Track orders, distributor progress, and follow-ups.
            </p>
          </div>
          
          <button
            onClick={() => fetchDashboardData(false)}
            disabled={loading}
            className="flex items-center justify-center p-3 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-slate-700 transition-all cursor-pointer w-fit self-end"
          >
            <RefreshCw size={18} className={cn(loading && "animate-spin")} />
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-[#D71920]" size={36} />
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
              Loading Performance Stats...
            </p>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Distributors */}
              <div className="p-6 rounded-2xl border bg-white border-neutral-200 transition-all hover:scale-[1.02] duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-red-500/10 text-[#D71920] rounded-xl">
                    <Shield size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase text-neutral-500">Distributors</span>
                </div>
                <h3 className="text-3xl font-black leading-none">{stats.assignedDistributorsCount}</h3>
                <p className="text-xs font-bold text-neutral-500 uppercase mt-2">Assigned Distributors</p>
              </div>

              {/* Card 2: Orders */}
              <div className="p-6 rounded-2xl border bg-white border-neutral-200 transition-all hover:scale-[1.02] duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-red-500/10 text-[#D71920] rounded-xl">
                    <ArrowLeftRight size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase text-neutral-500">Volume</span>
                </div>
                <h3 className="text-3xl font-black leading-none">{stats.ordersThisMonthCount}</h3>
                <p className="text-xs font-bold text-neutral-500 uppercase mt-2">Orders This Month</p>
              </div>

              {/* Card 3: Sales Value */}
              <div className="p-6 rounded-2xl border bg-white border-neutral-200 transition-all hover:scale-[1.02] duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-500/10 text-green-500 rounded-xl">
                    <IndianRupee size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase text-neutral-500">Revenue</span>
                </div>
                <h3 className="text-3xl font-black leading-none">
                  ₹{stats.salesValueThisMonth.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </h3>
                <p className="text-xs font-bold text-neutral-500 uppercase mt-2">Sales Value (Month)</p>
              </div>

              {/* Card 4: Enquiries */}
              <div className="p-6 rounded-2xl border bg-white border-neutral-200 transition-all hover:scale-[1.02] duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-xl">
                    <Headphones size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase text-neutral-500">Action Required</span>
                </div>
                <h3 className="text-3xl font-black leading-none">{stats.pendingEnquiriesCount}</h3>
                <p className="text-xs font-bold text-neutral-500 uppercase mt-2">Pending Enquiries</p>
              </div>
            </div>

            {/* Recent Activity Section */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Column 1: Recent Orders */}
              <div className="p-6 rounded-2xl border text-left bg-white border-neutral-200">
                <div className="flex items-center gap-2 mb-6 border-b border-neutral-200 pb-3">
                  <ArrowLeftRight size={18} className="text-[#D71920]" />
                  <h3 className="font-extrabold uppercase text-sm tracking-wider">
                    Recent Orders by Assigned Distributors
                  </h3>
                </div>

                {recentOrders.length === 0 ? (
                  <div className="text-center py-12 text-neutral-500 italic text-xs">
                    No orders placed yet by your assigned distributors
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="p-4 rounded-xl border flex items-center justify-between gap-4 text-xs font-semibold bg-neutral-50 border-neutral-200">
                        <div>
                          <div className="font-bold text-neutral-800">
                            {order.user?.companyName || `${order.user?.firstName} ${order.user?.lastName}`}
                          </div>
                          <div className="text-neutral-500 text-[10px] mt-0.5 font-mono">
                            {order.orderNumber} &bull; {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-neutral-800">
                            ₹{order.grandTotal.toLocaleString("en-IN")}
                          </div>
                          <div className={cn(
                            "text-[10px] font-bold uppercase mt-1 px-2 py-0.5 rounded-full inline-block",
                            order.status === "DELIVERED"
                              ? "bg-green-500/10 text-green-500"
                              : order.status === "CANCELLED" || order.status === "REJECTED"
                                ? "bg-red-500/10 text-red-500"
                                : "bg-[#D71920]/10 text-[#D71920]"
                          )}>
                            {order.status.replace("_", " ")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Column 2: Recent Enquiries */}
              <div className="p-6 rounded-2xl border text-left bg-white border-neutral-200">
                <div className="flex items-center gap-2 mb-6 border-b border-neutral-200 pb-3">
                  <Headphones size={18} className="text-[#D71920]" />
                  <h3 className="font-extrabold uppercase text-sm tracking-wider">
                    Recent Enquiries Status Update
                  </h3>
                </div>

                {recentEnquiries.length === 0 ? (
                  <div className="text-center py-12 text-neutral-500 italic text-xs">
                    No enquiries assigned to you yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentEnquiries.map((enquiry) => (
                      <div key={enquiry.id} className="p-4 rounded-xl border flex flex-col gap-2.5 text-xs font-semibold bg-neutral-50 border-neutral-200">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="font-bold text-neutral-800">{enquiry.name}</div>
                            <div className="text-neutral-500 text-[10px] mt-0.5">
                              {enquiry.email} &bull; {enquiry.phone}
                            </div>
                          </div>
                          
                          <span className={cn(
                            "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-block",
                            enquiry.status === "CLOSED"
                              ? "bg-green-500/10 text-green-500"
                              : enquiry.status === "QUOTATION_SENT"
                                ? "bg-blue-500/10 text-blue-500"
                                : enquiry.status === "CONTACTED"
                                  ? "bg-orange-500/10 text-orange-500"
                                  : "bg-red-500/10 text-red-500"
                          )}>
                            {enquiry.status}
                          </span>
                        </div>

                        <div className="text-neutral-500 text-[11px] font-medium border-t border-neutral-200 pt-2 flex flex-col gap-1">
                          <p><span className="font-bold">Message:</span> &ldquo;{enquiry.message}&rdquo;</p>
                          {enquiry.remarks && (
                            <p className="text-neutral-600">
                              <span className="font-bold">Remark:</span> {enquiry.remarks}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
