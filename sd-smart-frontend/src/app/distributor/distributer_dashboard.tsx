"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { 
  Building, User, Mail, Phone, FileText, MapPin, 
  ShoppingBag, Clock, AlertTriangle, CheckCircle2, XCircle, LogOut, ArrowRight, Loader2,
  Bell, ChevronDown, Menu, X, Home, Compass, ClipboardList, Briefcase, FileCode, HelpCircle, Settings,
  ShoppingCart, Package, Headphones, Download, RefreshCw, Layers, Megaphone
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
  invoice?: {
    id: string;
    invoiceNumber: string;
  } | null;
}

const mockupOrdersList: OrderType[] = [
  {
    id: "ord-1",
    orderNumber: "ORD-1782537323722-563",
    createdAt: "2026-06-27T10:00:00.000Z",
    grandTotal: 56830.57,
    status: "DELIVERED",
    paymentStatus: "PAID"
  },
  {
    id: "ord-2",
    orderNumber: "ORD-1782487823114-298",
    createdAt: "2026-06-25T11:30:00.000Z",
    grandTotal: 32400.00,
    status: "PROCESSING",
    paymentStatus: "PAID"
  },
  {
    id: "ord-3",
    orderNumber: "ORD-1782391198765-220",
    createdAt: "2026-06-23T15:45:00.000Z",
    grandTotal: 18750.00,
    status: "SHIPPED",
    paymentStatus: "PAID"
  },
  {
    id: "ord-4",
    orderNumber: "ORD-1782304456123-118",
    createdAt: "2026-06-21T09:15:00.000Z",
    grandTotal: 14600.00,
    status: "PENDING",
    paymentStatus: "UNPAID"
  },
  {
    id: "ord-5",
    orderNumber: "ORD-178220998766-072",
    createdAt: "2026-06-20T16:20:00.000Z",
    grandTotal: 24900.00,
    status: "DELIVERED",
    paymentStatus: "PAID"
  }
];

export default function DistributerDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [prevNotificationsLength, setPrevNotificationsLength] = useState(0);

  // Dynamic Notifications List matching verification status & order status
  const ordersForNotifications = orders.length > 0 ? orders : mockupOrdersList;
  const notificationsList = [
    {
      id: "verify-status",
      title: "Account Verified & Active",
      message: `Your distributor account for ${user?.companyName || "santy traders"} is verified & active.`,
      time: "Just now",
      type: "success",
      read: false
    },
    ...ordersForNotifications.slice(0, 4).map((order) => {
      let remarks = "";
      if (order.status === "DELIVERED") {
        remarks = `Order ${order.orderNumber} has been successfully delivered.`;
      } else if (order.status === "SHIPPED") {
        remarks = `Order ${order.orderNumber} has been shipped and is in transit.`;
      } else if (order.status === "PROCESSING") {
        remarks = `Order ${order.orderNumber} is being processed and packed.`;
      } else {
        remarks = `Order ${order.orderNumber} is pending admin approval.`;
      }
      return {
        id: order.id,
        title: `Order Status: ${order.status.replace("_", " ")}`,
        message: remarks,
        time: new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        type: "info",
        read: false
      };
    })
  ];

  // Sync unread notification count
  useEffect(() => {
    const currentLength = notificationsList.length;
    if (currentLength > prevNotificationsLength) {
      const diff = currentLength - prevNotificationsLength;
      setUnreadCount(prev => prev + diff);
      setPrevNotificationsLength(currentLength);
    } else if (currentLength < prevNotificationsLength) {
      setPrevNotificationsLength(currentLength);
    }
  }, [notificationsList.length, prevNotificationsLength]);

  // Click outside to close notifications dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const container = document.getElementById("notifications-menu-container");
      if (container && !container.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

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
  const fetchOrders = async (isBackground = false) => {
    if (!user) return;
    if (!isBackground) setLoadingOrders(true);
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
      if (!isBackground) setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchOrders(false);

      const interval = setInterval(() => {
        const activeEl = document.activeElement;
        const isInputFocused = activeEl && (
          ["INPUT", "TEXTAREA", "SELECT"].includes(activeEl.tagName.toUpperCase()) ||
          activeEl.getAttribute("contenteditable") === "true"
        );
        if (!isInputFocused) {
          fetchOrders(true);
        }
      }, 20000);

      return () => clearInterval(interval);
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

  // Calculate stats from real orders if available, otherwise display mockup values
  const hasRealOrders = orders.length > 0;
  const totalOrdersCount = hasRealOrders ? orders.length : 35;
  
  const pendingOrdersCount = hasRealOrders 
    ? orders.filter(o => ["PENDING_APPROVAL", "APPROVED", "PROCESSING", "PACKED", "SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(o.status)).length 
    : 8;

  const completedOrdersCount = hasRealOrders 
    ? orders.filter(o => o.status === "DELIVERED").length 
    : 27;

  const invoicesCount = hasRealOrders 
    ? orders.filter(o => o.invoice || o.status === "DELIVERED" || o.status === "APPROVED").length 
    : 12;

  const recentOrders = hasRealOrders ? orders.slice(0, 5) : mockupOrdersList;

  // Sidebar component definition for reusability
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-neutral-100 dark:border-slate-800 text-left">
      {/* Brand Logo Header */}
      <div className="p-6 border-b border-neutral-100 dark:border-slate-800 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/sd-smart-ecommerce/SD-logo.png"
            alt="SD Smart Appliances"
            className="h-10 w-auto object-contain mix-blend-multiply dark:mix-blend-normal"
          />
        </Link>
        <button 
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 dark:hover:bg-slate-800"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <Link
          href="/distributor/dashboard"
          className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-bold bg-red-500/10 text-[#D71920] dark:bg-red-500/20 dark:text-red-400 transition-all"
          onClick={() => setSidebarOpen(false)}
        >
          <Home size={18} />
          <span>Dashboard</span>
        </Link>
        <Link
          href="/shop"
          className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-bold text-neutral-600 hover:text-[#D71920] dark:text-neutral-400 dark:hover:text-red-400 hover:bg-neutral-50 dark:hover:bg-slate-800/50 transition-all"
          onClick={() => setSidebarOpen(false)}
        >
          <Compass size={18} />
          <span>Browse Products</span>
        </Link>
        <Link
          href="/account?tab=orders"
          className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-bold text-neutral-600 hover:text-[#D71920] dark:text-neutral-400 dark:hover:text-red-400 hover:bg-neutral-50 dark:hover:bg-slate-800/50 transition-all"
          onClick={() => setSidebarOpen(false)}
        >
          <ClipboardList size={18} />
          <span>My Orders</span>
        </Link>

        <Link
          href="/account?tab=orders"
          className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-bold text-neutral-600 hover:text-[#D71920] dark:text-neutral-400 dark:hover:text-red-400 hover:bg-neutral-50 dark:hover:bg-slate-800/50 transition-all"
          onClick={() => setSidebarOpen(false)}
        >
          <FileText size={18} />
          <span>Invoices</span>
        </Link>
        <Link
          href="/account?tab=profile"
          className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-bold text-neutral-600 hover:text-[#D71920] dark:text-neutral-400 dark:hover:text-red-400 hover:bg-neutral-50 dark:hover:bg-slate-800/50 transition-all"
          onClick={() => setSidebarOpen(false)}
        >
          <User size={18} />
          <span>My Profile</span>
        </Link>
        <Link
          href="/service-request"
          className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-bold text-neutral-600 hover:text-[#D71920] dark:text-neutral-400 dark:hover:text-red-400 hover:bg-neutral-50 dark:hover:bg-slate-800/50 transition-all"
          onClick={() => setSidebarOpen(false)}
        >
          <Headphones size={18} />
          <span>Service Requests</span>
        </Link>

        <Link
          href="/support"
          className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-bold text-neutral-600 hover:text-[#D71920] dark:text-neutral-400 dark:hover:text-red-400 hover:bg-neutral-50 dark:hover:bg-slate-800/50 transition-all"
          onClick={() => setSidebarOpen(false)}
        >
          <HelpCircle size={18} />
          <span>Help & Support</span>
        </Link>
        <Link
          href="/account"
          className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-bold text-neutral-600 hover:text-[#D71920] dark:text-neutral-400 dark:hover:text-red-400 hover:bg-neutral-50 dark:hover:bg-slate-800/50 transition-all"
          onClick={() => setSidebarOpen(false)}
        >
          <Settings size={18} />
          <span>Settings</span>
        </Link>
      </nav>

      {/* Logout Footer */}
      <div className="p-4 border-t border-neutral-100 dark:border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3.5 w-full px-4 py-3 rounded-xl text-sm font-bold text-neutral-600 hover:text-[#D71920] dark:text-neutral-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all text-left cursor-pointer"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-[#1C1C1C] dark:text-white font-sans flex transition-colors duration-300">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 flex-shrink-0 z-40">
        <SidebarContent />
      </aside>

      {/* Sidebar - Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          ></div>
          {/* Drawer Panel */}
          <div className="relative w-64 max-w-sm h-full shadow-2xl animate-in slide-in-from-left duration-200">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Right Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-neutral-100 dark:border-slate-800 py-3.5 px-6 sm:px-8 sticky top-0 z-30 backdrop-blur-md bg-white/95 dark:bg-slate-900/95 shadow-sm transition-colors duration-300">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            
            {/* Left Header - Title & Toggle */}
            <div className="flex items-center gap-3.5">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl text-neutral-500 hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors"
                aria-label="Open sidebar"
              >
                <Menu size={20} />
              </button>
              <h1 className="text-sm sm:text-base font-extrabold uppercase tracking-widest text-[#D71920]">
                Distributor Portal
              </h1>
            </div>

            {/* Right Header - Notifications & User Info */}
            <div className="flex items-center gap-4 sm:gap-6 relative">
              
              {/* Notification icon & dropdown popover */}
              <div className="relative" id="notifications-menu-container">
                <button 
                  onClick={() => {
                    setNotificationsOpen(!notificationsOpen);
                    if (!notificationsOpen) {
                      setUnreadCount(0);
                    }
                  }}
                  className={`relative p-2 rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-white transition-colors hover:bg-neutral-50 dark:hover:bg-slate-800 ${notificationsOpen ? "text-[#D71920] bg-red-500/5 dark:bg-red-500/10" : ""}`}
                  aria-label="Toggle notifications"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4.5 h-4.5 bg-[#D71920] border-2 border-white dark:border-slate-900 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2.5 w-80 bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl shadow-xl py-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                    <div className="px-4 pb-2 border-b border-neutral-100 dark:border-slate-800 flex justify-between items-center">
                      <span className="text-xs font-black uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                        Notifications
                      </span>
                      <span className="text-[10px] font-extrabold text-[#D71920] bg-red-500/5 px-2.5 py-0.5 rounded-full border border-red-500/10">
                        {notificationsList.length} New
                      </span>
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-neutral-100 dark:divide-slate-800">
                      {notificationsList.map((notif) => (
                        <div key={notif.id} className="p-4 hover:bg-neutral-50/50 dark:hover:bg-slate-800/30 transition-colors flex gap-3">
                          <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${notif.type === "success" ? "bg-emerald-500" : "bg-[#D71920]"}`} />
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                              {notif.title}
                            </p>
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-450 leading-relaxed font-semibold">
                              {notif.message}
                            </p>
                            <span className="text-[9px] text-neutral-400 font-extrabold block pt-1 uppercase tracking-wide">
                              {notif.time}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User Widget (Without Chevron) */}
              <div className="flex items-center gap-3 py-1 pl-1 pr-4 rounded-xl border border-neutral-100 dark:border-slate-800 bg-neutral-50/50 dark:bg-slate-900/50">
                <div className="w-8 h-8 rounded-lg bg-neutral-800 dark:bg-slate-700 text-white text-xs font-black flex items-center justify-center uppercase shadow-sm">
                  {user?.name ? user.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2) : "D"}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 line-clamp-1">
                    {user?.name || "Subramaniyan Santhosh"}
                  </p>
                  <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-extrabold">
                    Distributor
                  </p>
                </div>
              </div>
            </div>

          </div>
        </header>

        {/* Dashboard Content Panel */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8 space-y-6">
          
          {/* Welcome section */}
          <div className="text-left">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
              Welcome back, {user.name || "Subramaniyan Santhosh"}!
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
              Here's what's happening with your business today.
            </p>
          </div>

          {/* Account status alert banner */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 p-5 rounded-2xl flex items-start gap-4 text-left shadow-sm">
            <div className="p-1 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Account Approved & Active</h3>
              <p className="text-xs sm:text-sm text-emerald-800/80 dark:text-emerald-300/80 mt-1 leading-relaxed">
                Your account is approved. You can now place bulk or wholesale orders and access invoices.
              </p>
            </div>
          </div>

          {/* Statistics Grid (4 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Orders Card */}
            <div className="bg-white dark:bg-slate-900 border border-neutral-100 dark:border-slate-800/50 p-6 rounded-2xl shadow-sm text-left flex flex-col justify-between h-[130px] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">Total Orders</span>
                <div className="p-2.5 bg-red-500/10 text-[#D71920] rounded-xl">
                  <ShoppingBag size={18} />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-3xl font-black text-neutral-900 dark:text-white">{totalOrdersCount}</span>
                <Link href="/account?tab=orders" className="text-[11px] font-bold text-[#D71920] hover:underline flex items-center gap-1 mt-1 transition-all">
                  <span>View all orders</span>
                  <ArrowRight size={11} />
                </Link>
              </div>
            </div>

            {/* Pending Orders Card */}
            <div className="bg-white dark:bg-slate-900 border border-neutral-100 dark:border-slate-800/50 p-6 rounded-2xl shadow-sm text-left flex flex-col justify-between h-[130px] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">Pending Orders</span>
                <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-xl">
                  <Package size={18} />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-3xl font-black text-neutral-900 dark:text-white">{pendingOrdersCount}</span>
                <Link href="/account?tab=orders" className="text-[11px] font-bold text-amber-600 hover:underline flex items-center gap-1 mt-1 transition-all">
                  <span>View pending</span>
                  <ArrowRight size={11} />
                </Link>
              </div>
            </div>

            {/* Completed Orders Card */}
            <div className="bg-white dark:bg-slate-950 dark:bg-slate-900 border border-neutral-100 dark:border-slate-800/50 p-6 rounded-2xl shadow-sm text-left flex flex-col justify-between h-[130px] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">Completed Orders</span>
                <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-3xl font-black text-neutral-900 dark:text-white">{completedOrdersCount}</span>
                <Link href="/account?tab=orders" className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1 mt-1 transition-all">
                  <span>View completed</span>
                  <ArrowRight size={11} />
                </Link>
              </div>
            </div>

            {/* Invoices Card */}
            <div className="bg-white dark:bg-slate-900 border border-neutral-100 dark:border-slate-800/50 p-6 rounded-2xl shadow-sm text-left flex flex-col justify-between h-[130px] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">Invoices</span>
                <div className="p-2.5 bg-purple-500/10 text-purple-600 rounded-xl">
                  <FileText size={18} />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-3xl font-black text-neutral-900 dark:text-white">{invoicesCount}</span>
                <Link href="/account?tab=orders" className="text-[11px] font-bold text-purple-600 hover:underline flex items-center gap-1 mt-1 transition-all">
                  <span>View invoices</span>
                  <ArrowRight size={11} />
                </Link>
              </div>
            </div>
          </div>

          {/* Middle Row (Business Profile & Recent Orders) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Business Profile Details */}
            <div className="bg-white dark:bg-slate-900 border border-neutral-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-6 transition-colors duration-300">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-slate-800">
                <h3 className="text-sm font-extrabold uppercase tracking-wider flex items-center gap-2">
                  <Building size={16} className="text-[#D71920]" />
                  <span>Business Profile</span>
                </h3>
                <Link href="/account?tab=profile" className="text-xs font-bold text-[#D71920] hover:underline">
                  Edit Profile
                </Link>
              </div>
              
              <div className="space-y-4 flex-1 text-left">
                {/* Contact Person */}
                <div className="flex items-start gap-3">
                  <User className="text-neutral-400 mt-0.5 shrink-0" size={15} />
                  <div>
                    <p className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider">Contact Person</p>
                    <p className="text-xs font-bold mt-0.5 text-neutral-850 dark:text-neutral-200">{user.name || "Subramaniyan Santhosh"}</p>
                  </div>
                </div>

                {/* Email Address */}
                <div className="flex items-start gap-3">
                  <Mail className="text-neutral-400 mt-0.5 shrink-0" size={15} />
                  <div className="min-w-0">
                    <p className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider">Email Address</p>
                    <p className="text-xs font-bold mt-0.5 text-neutral-850 dark:text-neutral-200 truncate">{user.email || "santhosh230827@gmail.com"}</p>
                  </div>
                </div>

                {/* Mobile Number */}
                <div className="flex items-start gap-3">
                  <Phone className="text-neutral-400 mt-0.5 shrink-0" size={15} />
                  <div>
                    <p className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider">Mobile Number</p>
                    <p className="text-xs font-bold mt-0.5 text-neutral-850 dark:text-neutral-200">{user.phoneNumber || "9363078483"}</p>
                  </div>
                </div>

                {/* GSTIN */}
                <div className="flex items-start gap-3">
                  <FileText className="text-neutral-400 mt-0.5 shrink-0" size={15} />
                  <div>
                    <p className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider">GSTIN</p>
                    <p className="text-xs font-mono font-bold mt-0.5 text-neutral-850 dark:text-neutral-200">
                      {user.gstin || "28AAACP0165G3ZN"}
                    </p>
                  </div>
                </div>

                {/* Business Address */}
                <div className="flex items-start gap-3">
                  <MapPin className="text-neutral-400 mt-0.5 shrink-0" size={15} />
                  <div>
                    <p className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider">Business Address</p>
                    <p className="text-xs font-semibold mt-0.5 text-neutral-855 dark:text-neutral-200 leading-relaxed">
                      {(user as any).companyAddress || "No. 12, Kamarajar Street, Peelamedu, Coimbatore, Tamil Nadu - 641004"}
                    </p>
                  </div>
                </div>

                {/* Approval Status */}
                <div className="flex items-start gap-3">
                  <Clock className="text-neutral-400 mt-0.5 shrink-0" size={15} />
                  <div>
                    <p className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider">Approval Status</p>
                    <span className="inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mt-1.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {approvalStatus}
                    </span>
                  </div>
                </div>

                {/* Member Since */}
                <div className="flex items-start gap-3">
                  <User className="text-neutral-400 mt-0.5 shrink-0" size={15} />
                  <div>
                    <p className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider">Member Since</p>
                    <p className="text-xs font-bold mt-0.5 text-neutral-850 dark:text-neutral-200">
                      {(user as any).createdAt ? new Date((user as any).createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "15 May 2026"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders History */}
            <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-6 lg:col-span-2 transition-colors duration-300">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-slate-800">
                <h3 className="text-sm font-extrabold uppercase tracking-wider flex items-center gap-2">
                  <ShoppingBag size={16} className="text-[#D71920]" />
                  <span>Recent Orders</span>
                </h3>
                <Link href="/account?tab=orders" className="text-xs font-bold text-[#D71920] hover:underline flex items-center gap-1">
                  <span>View all orders</span>
                  <ArrowRight size={12} />
                </Link>
              </div>

              {loadingOrders ? (
                <div className="py-16 flex flex-col items-center justify-center text-neutral-450 flex-1">
                  <Loader2 className="w-8 h-8 animate-spin text-neutral-400 mb-2" />
                  <p className="text-xs font-bold tracking-wider">Fetching order details...</p>
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-neutral-450 border border-dashed border-neutral-200 rounded-2xl flex-1">
                  <ShoppingBag size={24} className="mb-2 text-neutral-300" />
                  <p className="text-xs font-bold text-neutral-500">No orders placed yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="border-b border-neutral-100 dark:border-slate-800 text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider">
                        <th className="py-3 px-2">Order ID</th>
                        <th className="py-3 px-2">Date Placed</th>
                        <th className="py-3 px-2">Order Total</th>
                        <th className="py-3 px-2">Status</th>
                        <th className="py-3 px-2 text-right">Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-slate-800 text-xs sm:text-sm">
                      {recentOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-neutral-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-4 px-2">
                            <Link href={`/account/orders/${order.id}`} className="font-extrabold text-[#D71920] hover:underline">
                              {order.orderNumber}
                            </Link>
                          </td>
                          <td className="py-4 px-2 text-neutral-600 dark:text-neutral-400 font-semibold">
                            {new Date(order.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit", month: "short", year: "numeric"
                            })}
                          </td>
                          <td className="py-4 px-2 font-bold">
                            ₹{order.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-2">
                            <span className={`inline-block text-[9px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${
                              order.status === "DELIVERED" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" :
                              order.status === "PROCESSING" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" :
                              order.status === "SHIPPED" ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20" :
                              order.status === "PENDING" || order.status === "PENDING_APPROVAL" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" :
                              "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                            }`}>
                              {order.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="py-4 px-2 text-right">
                            <Link 
                              href={`/account/orders/${order.id}?invoice=true`}
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

          {/* Bottom Grid (Quick Actions, Top Categories, Announcements) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            
            {/* Quick Actions Card */}
            <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
              <h3 className="text-sm font-extrabold uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-slate-800">
                <Layers size={16} className="text-[#D71920]" />
                <span>Quick Actions</span>
              </h3>
              
              <div className="grid grid-cols-2 gap-3.5">
                <Link href="/shop" className="flex flex-col items-center justify-center p-4 bg-red-500/5 hover:bg-[#D71920] hover:text-white dark:bg-red-500/10 rounded-2xl transition-all border border-red-500/10 group cursor-pointer">
                  <ShoppingCart size={22} className="text-[#D71920] dark:text-red-400 group-hover:text-white mb-2 transition-colors" />
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 group-hover:text-white">Place Order</span>
                </Link>
                <Link href="/shop" className="flex flex-col items-center justify-center p-4 bg-amber-500/5 hover:bg-amber-600 hover:text-white dark:bg-amber-500/10 rounded-2xl transition-all border border-amber-500/10 group cursor-pointer">
                  <Package size={22} className="text-amber-600 dark:text-amber-400 group-hover:text-white mb-2 transition-colors" />
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 group-hover:text-white">Bulk Order</span>
                </Link>
                <Link href="/account?tab=orders" className="flex flex-col items-center justify-center p-4 bg-purple-500/5 hover:bg-purple-600 hover:text-white dark:bg-purple-500/10 rounded-2xl transition-all border border-purple-500/10 group cursor-pointer">
                  <FileText size={22} className="text-purple-600 dark:text-purple-400 group-hover:text-white mb-2 transition-colors" />
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 group-hover:text-white">View Invoices</span>
                </Link>
                <Link href="/service-request" className="flex flex-col items-center justify-center p-4 bg-emerald-500/5 hover:bg-emerald-600 hover:text-white dark:bg-emerald-500/10 rounded-2xl transition-all border border-emerald-500/10 group cursor-pointer">
                  <Headphones size={22} className="text-emerald-600 dark:text-emerald-400 group-hover:text-white mb-2 transition-colors" />
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 group-hover:text-white">Service Request</span>
                </Link>
                <a 
                  href="/2026-SD Smart Catalogue.pdf" 
                  download 
                  className="flex flex-col items-center justify-center p-4 bg-blue-500/5 hover:bg-blue-600 hover:text-white dark:bg-blue-500/10 rounded-2xl transition-all border border-blue-500/10 group cursor-pointer"
                >
                  <Download size={22} className="text-blue-600 dark:text-blue-400 group-hover:text-white mb-2 transition-colors" />
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 group-hover:text-white text-center">Catalogue</span>
                </a>
                <Link href="/account?tab=profile" className="flex flex-col items-center justify-center p-4 bg-pink-500/5 hover:bg-pink-650 hover:text-white dark:bg-pink-500/10 rounded-2xl transition-all border border-pink-500/10 group cursor-pointer">
                  <User size={22} className="text-pink-600 dark:text-pink-400 group-hover:text-white mb-2 transition-colors" />
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 group-hover:text-white">Update Profile</span>
                </Link>
              </div>
            </div>

            {/* Top Categories Card */}
            <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-slate-800">
                <h3 className="text-sm font-extrabold uppercase tracking-wider flex items-center gap-2">
                  <Layers size={16} className="text-[#D71920]" />
                  <span>Top Categories</span>
                </h3>
                <Link href="/shop" className="text-xs font-bold text-[#D71920] hover:underline flex items-center gap-0.5">
                  <span>View all products</span>
                  <ArrowRight size={12} />
                </Link>
              </div>

              <div className="space-y-4">
                {/* Category 1 */}
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 bg-neutral-100 rounded-xl overflow-hidden flex items-center justify-center border border-neutral-100">
                    <img src="/Categories-1.png" alt="Kitchen Appliances" className="w-10 h-10 object-contain" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-neutral-800 dark:text-neutral-250">Kitchen Appliances</h4>
                    <p className="text-[10px] text-neutral-400 font-bold mt-0.5">56 Products</p>
                  </div>
                </div>

                {/* Category 2 */}
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 bg-neutral-100 rounded-xl overflow-hidden flex items-center justify-center border border-neutral-100">
                    <img src="/Categories-5.png" alt="Home Appliances" className="w-10 h-10 object-contain" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-neutral-800 dark:text-neutral-250">Home Appliances</h4>
                    <p className="text-[10px] text-neutral-400 font-bold mt-0.5">42 Products</p>
                  </div>
                </div>

                {/* Category 3 */}
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 bg-neutral-100 rounded-xl overflow-hidden flex items-center justify-center border border-neutral-100">
                    <img src="/Categories-2.png" alt="Water Heaters" className="w-10 h-10 object-contain" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-neutral-800 dark:text-neutral-250">Water Heaters</h4>
                    <p className="text-[10px] text-neutral-400 font-bold mt-0.5">18 Products</p>
                  </div>
                </div>

                {/* Category 4 */}
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 bg-neutral-100 rounded-xl overflow-hidden flex items-center justify-center border border-neutral-100">
                    <img src="/Categories-4.png" alt="Fans & Coolers" className="w-10 h-10 object-contain" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-neutral-800 dark:text-neutral-250">Fans & Coolers</h4>
                    <p className="text-[10px] text-neutral-400 font-bold mt-0.5">26 Products</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Announcements Card */}
            <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
              <h3 className="text-sm font-extrabold uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-slate-800">
                <Megaphone size={16} className="text-[#D71920]" />
                <span>Announcements</span>
              </h3>

              <div className="space-y-4">
                {/* Announcement 1 */}
                <div className="flex gap-3">
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl shrink-0 h-fit">
                    <Layers size={16} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-extrabold text-neutral-800 dark:text-neutral-200">New Product Launch</h4>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-normal">Check out our new range of Mixer Grinders.</p>
                    <span className="text-[9px] font-extrabold text-neutral-400 uppercase mt-1 block">26 Jun 2026</span>
                  </div>
                </div>

                {/* Announcement 2 */}
                <div className="flex gap-3">
                  <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-xl shrink-0 h-fit">
                    <Clock size={16} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-extrabold text-neutral-800 dark:text-neutral-200">Holiday Notice</h4>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-normal">Our office will be closed on 30 Jun 2026.</p>
                    <span className="text-[9px] font-extrabold text-neutral-400 uppercase mt-1 block">25 Jun 2026</span>
                  </div>
                </div>

                {/* Announcement 3 */}
                <div className="flex gap-3">
                  <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl shrink-0 h-fit">
                    <FileText size={16} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-extrabold text-neutral-800 dark:text-neutral-200">Price Update</h4>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-normal">Some product prices have been updated.</p>
                    <span className="text-[9px] font-extrabold text-neutral-400 uppercase mt-1 block">24 Jun 2026</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </main>

        {/* Footer */}
        <footer className="py-6 px-8 border-t border-neutral-100 dark:border-slate-800 text-center text-xs text-neutral-450 dark:text-neutral-500 transition-colors duration-300">
          <p>© 2026 SD Smart Appliances. All rights reserved. Wholesale & Distribution Network.</p>
        </footer>

      </div>
    </div>
  );
}
