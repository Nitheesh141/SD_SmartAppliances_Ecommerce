"use client";
import { ENV } from "@/config/env";
import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";
import { 
  Loader2, Layers, TrendingUp, TrendingDown, Calendar as CalendarIcon, Filter, 
  ChevronLeft, ChevronRight, Shield, ArrowLeftRight, IndianRupee, Headphones,
  MessageSquare, RefreshCw, Calendar, Mail, Phone, Clock, FileText, CheckCircle, AlertCircle
} from "lucide-react";
import SalesSidebar from "@/components/layout/SalesSidebar";
import { cn } from "@/lib/utils";

interface StatsType {
  assignedDistributorsCount: number;
  ordersThisMonthCount: number;
  salesValueThisMonth: number;
  unitsSoldThisMonth: number;
  assignedEnquiriesCount: number;
  activeEnquiriesCount: number;
  quotationSentCount: number;
  convertedOrdersCount: number;
  closedEnquiriesCount: number;
  currentTarget?: {
    targetType: string;
    targetValue: number;
    month: number;
    year: number;
  } | null;
  achievement: number;
  progressPercent: number;
  remainingTarget: number;
  remarks: string;
}

export default function SalesDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [stats, setStats] = useState<StatsType>({
    assignedDistributorsCount: 0,
    ordersThisMonthCount: 0,
    salesValueThisMonth: 0,
    unitsSoldThisMonth: 0,
    assignedEnquiriesCount: 0,
    activeEnquiriesCount: 0,
    quotationSentCount: 0,
    convertedOrdersCount: 0,
    closedEnquiriesCount: 0,
    currentTarget: null,
    achievement: 0,
    progressPercent: 0,
    remainingTarget: 0,
    remarks: ""
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentEnquiries, setRecentEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReminder, setShowReminder] = useState(false);

  // Performance Month/Year Filter
  const [mgmtMonth, setMgmtMonth] = useState<number>(new Date().getMonth() + 1);
  const [mgmtYear, setMgmtYear] = useState<number>(new Date().getFullYear());
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

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
  const fetchDashboardData = async (isBackground = false, selectedMonth = mgmtMonth, selectedYear = mgmtYear) => {
    if (!isBackground) setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const res = await fetch(
        `${ENV.API_BASE_URL}/sales-persons/dashboard-stats?month=${selectedMonth}&year=${selectedYear}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

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

  // Check daily activity reminder on mount/auth change
  useEffect(() => {
    const checkReminder = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;
        const res = await fetch(`${ENV.API_BASE_URL}/sales-activities/reminder`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setShowReminder(data.showReminder);
          }
        }
      } catch (err) {
        console.error("Reminder check failed:", err);
      }
    };
    if (isAuthenticated && user?.role === "SALESPERSON") {
      checkReminder();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "SALESPERSON") {
      fetchDashboardData(false, mgmtMonth, mgmtYear);
      
      const interval = setInterval(() => {
        fetchDashboardData(true, mgmtMonth, mgmtYear);
      }, 25000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user, mgmtMonth, mgmtYear]);

  // Years option range (current year - 1 up to current + 3)
  const yearOptions = useMemo(() => {
    const startY = new Date().getFullYear() - 1;
    return Array.from({ length: 5 }, (_, i) => startY + i);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "New":
        return "bg-blue-500/10 text-blue-500 border border-blue-500/20";
      case "Assigned":
        return "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20";
      case "Contacted":
        return "bg-purple-500/10 text-purple-500 border border-purple-500/20";
      case "Quotation Sent":
        return "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20";
      case "Negotiation":
        return "bg-orange-500/10 text-orange-500 border border-orange-500/20";
      case "Converted to Order":
        return "bg-green-500/10 text-green-500 border border-green-500/20";
      case "Closed":
        return "bg-neutral-500/10 text-neutral-500 border border-neutral-500/20";
      default:
        return "bg-neutral-500/10 text-neutral-500 border border-neutral-500/20";
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-neutral-50 text-slate-900 transition-colors duration-300 font-sans">
      {/* Sidebar */}
      <SalesSidebar currentPath="/sales/dashboard" />

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 md:p-8 overflow-y-auto text-left">
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
            onClick={() => fetchDashboardData(false, mgmtMonth, mgmtYear)}
            disabled={loading}
            className="flex items-center justify-center p-3 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-slate-700 transition-all cursor-pointer w-fit self-end"
          >
            <RefreshCw size={18} className={cn(loading && "animate-spin")} />
          </button>
        </div>

        {showReminder && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-center justify-between mb-6 animate-pulse">
            <div className="flex items-center gap-3 text-amber-800">
              <AlertCircle size={22} className="text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-xs sm:text-sm font-extrabold uppercase tracking-wide">Daily Activity Pending</p>
                <p className="text-xs font-semibold text-amber-700 mt-0.5">
                  Reminder: You have not submitted your daily activity report for today. Please submit it before ending your shift.
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/sales/daily-activity")}
              className="px-4 py-2 bg-[#D71920] hover:bg-[#B91520] text-white font-extrabold uppercase tracking-wider text-[10px] sm:text-xs rounded-xl shadow-md cursor-pointer whitespace-nowrap ml-4 transition-colors"
            >
              Submit Report
            </button>
          </div>
        )}

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
              <div className="p-6 rounded-2xl border bg-white border-neutral-200 transition-all hover:scale-[1.02] duration-300 cursor-pointer" onClick={() => router.push("/sales/distributor-enquiries")}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-500/10 text-yellow-600 rounded-xl">
                    <MessageSquare size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase text-neutral-500">Enquiries</span>
                </div>
                <h3 className="text-3xl font-black leading-none">{stats.assignedEnquiriesCount}</h3>
                <p className="text-xs font-bold text-neutral-500 uppercase mt-2">Assigned Enquiries</p>
              </div>
            </div>

            {/* Dynamic Enquiry Metrics Widgets Block */}
            <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm text-left">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="text-[#D71920]" size={18} />
                <h3 className="font-black uppercase tracking-wider text-sm text-[#D71920]">
                  Distributor Price Enquiries
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                  <div className="text-[9px] font-black text-neutral-500 uppercase">Assigned Enquiries</div>
                  <div className="text-2xl font-black mt-1 text-slate-800">{stats.assignedEnquiriesCount}</div>
                </div>
                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                  <div className="text-[9px] font-black text-neutral-500 uppercase">Active Enquiries</div>
                  <div className="text-2xl font-black mt-1 text-blue-600">{stats.activeEnquiriesCount}</div>
                </div>
                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                  <div className="text-[9px] font-black text-neutral-500 uppercase">Quotation Sent</div>
                  <div className="text-2xl font-black mt-1 text-purple-600">{stats.quotationSentCount}</div>
                </div>
                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                  <div className="text-[9px] font-black text-neutral-500 uppercase">Converted Orders</div>
                  <div className="text-2xl font-black mt-1 text-green-600">{stats.convertedOrdersCount}</div>
                </div>
                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                  <div className="text-[9px] font-black text-neutral-500 uppercase">Closed Enquiries</div>
                  <div className="text-2xl font-black mt-1 text-neutral-400">{stats.closedEnquiriesCount}</div>
                </div>
              </div>
            </div>

            {/* Performance Summary Card */}
            <div className="p-6 rounded-2xl bg-white text-slate-900 border border-neutral-200 shadow-sm text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-200/60 pb-4 mb-6 gap-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-[#D71920]" size={20} />
                  <h3 className="font-black uppercase tracking-wider text-sm text-[#D71920]">
                    Monthly Performance Summary ({new Date(mgmtYear, mgmtMonth - 1, 1).toLocaleString("default", { month: "short", year: "numeric" })})
                  </h3>
                </div>

                {/* Date Dropdowns */}
                <div className="flex items-center gap-2 z-30">
                  <Calendar size={14} className="text-neutral-400" />
                  
                  {/* Custom Month Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMonthDropdownOpen(!isMonthDropdownOpen);
                        setIsYearDropdownOpen(false);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs outline-none font-bold flex items-center gap-1.5 justify-between min-w-[110px] text-slate-800"
                    >
                      <span>{new Date(2026, mgmtMonth - 1, 1).toLocaleString("default", { month: "long" })}</span>
                      <span className="text-[9px] text-neutral-400">▼</span>
                    </button>
                    {isMonthDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsMonthDropdownOpen(false)} />
                        <div className="absolute right-0 mt-1 w-36 rounded-xl border border-neutral-200 bg-white shadow-xl z-50 py-1 max-h-60 overflow-y-auto sidebar-scrollbar animate-fade-in text-slate-700">
                          {Array.from({ length: 12 }, (_, i) => {
                            const m = i + 1;
                            const isSelected = mgmtMonth === m;
                            return (
                              <button
                                key={m}
                                type="button"
                                onClick={() => {
                                  setMgmtMonth(m);
                                  setIsMonthDropdownOpen(false);
                                  fetchDashboardData(false, m, mgmtYear);
                                }}
                                className={cn(
                                  "w-full text-left px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer",
                                  isSelected 
                                    ? "bg-[#D71920]/10 text-[#D71920]" 
                                    : "hover:bg-neutral-50 text-slate-700"
                                )}
                              >
                                {new Date(2026, i, 1).toLocaleString("default", { month: "long" })}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Custom Year Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsYearDropdownOpen(!isYearDropdownOpen);
                        setIsMonthDropdownOpen(false);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs outline-none font-bold flex items-center gap-1.5 justify-between min-w-[85px] text-slate-800"
                    >
                      <span>{mgmtYear}</span>
                      <span className="text-[9px] text-neutral-400">▼</span>
                    </button>
                    {isYearDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsYearDropdownOpen(false)} />
                        <div className="absolute right-0 mt-1 w-24 rounded-xl border border-neutral-200 bg-white shadow-xl z-50 py-1 max-h-40 overflow-y-auto sidebar-scrollbar animate-fade-in text-slate-700">
                          {yearOptions.map((y) => {
                            const isSelected = mgmtYear === y;
                            return (
                              <button
                                key={y}
                                type="button"
                                onClick={() => {
                                  setMgmtYear(y);
                                  setIsYearDropdownOpen(false);
                                  fetchDashboardData(false, mgmtMonth, y);
                                }}
                                className={cn(
                                  "w-full text-left px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer",
                                  isSelected 
                                    ? "bg-[#D71920]/10 text-[#D71920]" 
                                    : "hover:bg-neutral-50 text-slate-700"
                                )}
                              >
                                {y}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Performance Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4 mb-6">
                <div>
                  <div className="text-neutral-400 font-bold uppercase text-[10px] tracking-wider">Assigned Distributors</div>
                  <div className="text-2xl font-black mt-1 text-slate-900">{stats.assignedDistributorsCount}</div>
                </div>

                <div>
                  <div className="text-neutral-400 font-bold uppercase text-[10px] tracking-wider">Orders This Month</div>
                  <div className="text-2xl font-black mt-1 text-slate-900">{stats.ordersThisMonthCount}</div>
                </div>

                <div>
                  <div className="text-neutral-400 font-bold uppercase text-[10px] tracking-wider">Revenue Achieved</div>
                  <div className="text-2xl font-black mt-1 text-[#D71920]">
                    ₹{stats.salesValueThisMonth.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div>
                  <div className="text-neutral-400 font-bold uppercase text-[10px] tracking-wider">Units Sold</div>
                  <div className="text-2xl font-black mt-1 text-slate-900">{stats.unitsSoldThisMonth} Units</div>
                </div>

                <div>
                  <div className="text-neutral-400 font-bold uppercase text-[10px] tracking-wider">Target Value</div>
                  <div className="text-2xl font-black mt-1 text-slate-900">
                    {stats.currentTarget && stats.currentTarget.targetValue > 0 
                      ? stats.currentTarget.targetType === "REVENUE" 
                        ? `₹${stats.currentTarget.targetValue.toLocaleString("en-IN")}`
                        : `${stats.currentTarget.targetValue.toLocaleString("en-IN")} Units`
                      : "Not Set"}
                  </div>
                </div>

                <div>
                  <div className="text-neutral-400 font-bold uppercase text-[10px] tracking-wider">Remaining Target</div>
                  <div className="text-2xl font-black mt-1 text-slate-900">
                    {stats.currentTarget && stats.currentTarget.targetValue > 0
                      ? stats.currentTarget.targetType === "REVENUE"
                        ? `₹${stats.remainingTarget.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : `${stats.remainingTarget.toLocaleString("en-IN")} Units`
                      : "N/A"}
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="text-neutral-400 font-bold uppercase text-[10px] tracking-wider">Admin Remarks</div>
                  <div className="text-xs font-semibold text-slate-600 mt-1.5 italic leading-relaxed">
                    {stats.remarks ? `"${stats.remarks}"` : "No observations or remarks recorded by Administrator."}
                  </div>
                </div>
              </div>

              {/* Progress track */}
              <div className="border-t pt-5">
                <div className="flex items-center justify-between text-xs font-black uppercase mb-2">
                  <span className="text-neutral-500">Sales Target Progress</span>
                  <span className="text-[#D71920]">{stats.progressPercent}%</span>
                </div>
                <div className="w-full h-3 rounded-full bg-neutral-100 overflow-hidden border">
                  <div 
                    className="h-full bg-[#D71920] rounded-full transition-all duration-500" 
                    style={{ width: `${stats.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Recents Lists Split Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Column 1: Recent Orders */}
              <div className="p-6 rounded-2xl border text-left bg-white border-neutral-200">
                <div className="flex items-center gap-2 mb-6 border-b border-neutral-200 pb-3">
                  <ArrowLeftRight size={18} className="text-[#D71920]" />
                  <h3 className="font-extrabold uppercase text-sm tracking-wider">
                    Recent Distributor Orders
                  </h3>
                </div>

                {recentOrders.length === 0 ? (
                  <div className="text-center py-12 text-neutral-500 italic text-xs">
                    No orders submitted yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="p-4 rounded-xl border flex items-center justify-between gap-4 text-xs font-semibold bg-neutral-50 border-neutral-200">
                        <div>
                          <div className="font-bold text-neutral-850">
                            {order.user.companyName || `${order.user.firstName} ${order.user.lastName}`}
                          </div>
                          <div className="text-neutral-500 text-[10px] mt-0.5">
                            Order ID: <span className="font-mono">{order.orderId}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-extrabold text-slate-800">
                            ₹{order.grandTotal.toLocaleString("en-IN")}
                          </div>
                          <div className="text-[10px] text-neutral-400 font-bold uppercase mt-0.5">
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
                  <MessageSquare size={18} className="text-[#D71920]" />
                  <h3 className="font-extrabold uppercase text-sm tracking-wider">
                    Recent Distributor Enquiries
                  </h3>
                </div>

                {recentEnquiries.length === 0 ? (
                  <div className="text-center py-12 text-neutral-500 italic text-xs">
                    No enquiries assigned to you yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentEnquiries.map((enquiry) => {
                      const distName = enquiry.distributor.companyName || `${enquiry.distributor.firstName} ${enquiry.distributor.lastName}`;
                      return (
                        <div key={enquiry.id} className="p-4 rounded-xl border flex flex-col gap-2.5 text-xs font-semibold bg-neutral-50 border-neutral-200">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="font-bold text-neutral-800">{distName}</div>
                              <div className="text-[#D71920] text-[10px] font-black uppercase mt-0.5">
                                Product: {enquiry.product.name} (Qty: {enquiry.quantity})
                              </div>
                            </div>
                            
                            <span className={cn(
                              "text-[9px] font-black uppercase px-2 py-0.5 rounded-full inline-block",
                              getStatusBadge(enquiry.status)
                            )}>
                              {enquiry.status}
                            </span>
                          </div>

                          {enquiry.message && (
                            <div className="text-neutral-500 text-[11px] font-medium border-t border-neutral-200 pt-2">
                              <p><span className="font-bold">Message:</span> &ldquo;{enquiry.message}&rdquo;</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
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
