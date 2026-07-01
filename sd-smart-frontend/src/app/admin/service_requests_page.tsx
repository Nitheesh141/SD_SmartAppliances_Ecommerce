"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";
import { 
  Loader2, Headphones, Search, Calendar, FileText, MapPin, Phone, 
  CheckCircle, Clock, Eye, Download, Info, AlertCircle, ChevronDown,
  X, Check, ShieldCheck, User, Truck, ShieldAlert, Plus, MessageSquare, Image as ImageIcon
} from "lucide-react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { cn } from "@/lib/utils";
import { serviceRequestService } from "@/services/serviceRequestService";
import { CustomDatePicker } from "@/components/ui/CustomDatePicker";
import { AdminStatusActionPanel } from "@/components/admin/AdminStatusActionPanel";

type TabType = "ALL" | "PENDING_VERIFICATION" | "PICKUP_SCHEDULED" | "UNDER_SERVICE" | "COMPLETED" | "CLOSED";

export default function AdminServiceRequestsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  // Theme State
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Drawer / Modal state
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [actionRemarks, setActionRemarks] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Out of Warranty Cost Estimate State
  // (State removed - moved to AdminStatusActionPanel)

  // Sync estimate states
  // (Effect removed - moved to AdminStatusActionPanel)

  // Load theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("admin-theme") as "light" | "dark" || "dark";
    setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("admin-theme", nextTheme);
  };

  // Route protection
  useEffect(() => {
    if (!authLoading) {
      const role = user?.role?.toUpperCase();
      if (!isAuthenticated || !user || (role !== "ADMIN" && role !== "SUPERADMIN" && user.role !== "admin" && user.role !== "superadmin")) {
        toast.error("Access Denied. Admins only.");
        router.push("/auth/login");
      }
    }
  }, [isAuthenticated, user, authLoading, router]);

  // Fetch all service requests
  const fetchRequests = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await serviceRequestService.getServiceRequests();
      if (res.success) {
        setRequests(res.data || []);
        
        // Update selectedRequest in-place if open
        setSelectedRequest((prev: any) => {
          if (!prev) return null;
          const updated = res.data?.find((r: any) => r.id === prev.id);
          return updated || prev;
        });
      }
    } catch (err: any) {
      console.error(err);
      if (!isBackground) toast.error("Failed to load service requests");
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // Track whether the detail drawer is open to pause polling
  const isEditingRef = useRef(false);
  useEffect(() => {
    isEditingRef.current = !!selectedRequest;
  }, [selectedRequest]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRequests(false);

      const interval = setInterval(() => {
        const activeEl = document.activeElement;
        const isInputFocused = activeEl && (
          ["INPUT", "TEXTAREA", "SELECT"].includes(activeEl.tagName.toUpperCase()) ||
          activeEl.getAttribute("contenteditable") === "true"
        );
        if (!isEditingRef.current && !isInputFocused) {
          fetchRequests(true);
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Handle status update action
  // (Moved to AdminStatusActionPanel)

  // Filter requests based on search query and tab selection
  const filteredRequests = requests.filter(req => {
    // Search filter
    const matchesSearch = 
      req.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${req.user?.firstName} ${req.user?.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (req.contactNumber && req.contactNumber.includes(searchQuery));

    if (!matchesSearch) return false;

    // Tab filter
    switch (activeTab) {
      case "PENDING_VERIFICATION":
        return req.currentStatus === "Pending Verification";
      case "PICKUP_SCHEDULED":
        return req.currentStatus === "Pickup Scheduled";
      case "UNDER_SERVICE":
        return ["Product Collected", "Under Inspection", "Awaiting Cost Estimation", "Awaiting Customer Approval", "Cost Approved", "Under Repair"].includes(req.currentStatus);
      case "COMPLETED":
        return ["Service Completed", "Ready For Delivery", "Delivered"].includes(req.currentStatus);
      case "CLOSED":
        return ["Closed", "Service Cancelled", "Request Rejected"].includes(req.currentStatus);
      case "ALL":
      default:
        return true;
    }
  });

  // Calculate KPI metrics
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.currentStatus === "Pending Verification").length;
  const pickupScheduledRequests = requests.filter(r => r.currentStatus === "Pickup Scheduled").length;
  const underServiceRequests = requests.filter(r => ["Product Collected", "Under Inspection", "Awaiting Cost Estimation", "Awaiting Customer Approval", "Cost Approved", "Under Repair"].includes(r.currentStatus)).length;
  const completedRequests = requests.filter(r => ["Service Completed", "Ready For Delivery", "Delivered"].includes(r.currentStatus)).length;
  const closedRequests = requests.filter(r => ["Closed", "Service Cancelled", "Request Rejected"].includes(r.currentStatus)).length;

  // Render Status Badge
  const getStatusBadge = (status: string, cancellationReason?: string | null) => {
    switch (status) {
      case "Pending Verification":
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-yellow-500/10 text-yellow-400">Pending Verification</span>;
      case "Verified":
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-blue-500/10 text-blue-400">Verified</span>;
      case "Pickup Scheduled":
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-purple-500/10 text-purple-400">Pickup Scheduled</span>;
      case "Product Collected":
      case "Under Inspection":
      case "Under Repair":
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-500/10 text-indigo-400">{status}</span>;
      case "Awaiting Cost Estimation":
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-orange-500/10 text-orange-400">Awaiting Cost Estimation</span>;
      case "Awaiting Customer Approval":
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-cyan-500/10 text-cyan-400">Awaiting Customer Approval</span>;
      case "Cost Approved":
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-400">Cost Approved</span>;
      case "Cancellation Requested":
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-orange-500/10 text-orange-400">Cancellation Requested</span>;
      case "Service Cancelled":
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-red-500/10 text-red-400">Service Cancelled</span>;
      case "Request Rejected":
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-red-500/10 text-red-500">Request Rejected</span>;
      case "Service Completed":
      case "Ready For Delivery":
      case "Delivered":
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-green-500/10 text-green-400">{status}</span>;
      case "Closed":
        if (cancellationReason) {
          return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-red-500/10 text-red-400">Closed (Cancelled)</span>;
        }
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-neutral-800 text-neutral-400">Closed</span>;
      default:
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-neutral-800 text-neutral-400">{status}</span>;
    }
  };

  const isDark = theme === "dark";

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
        <Loader2 className="w-12 h-12 text-[#D71920] animate-spin" />
        <p className="mt-4 text-sm text-neutral-500 font-semibold tracking-wider">Verifying Administrator...</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen font-sans flex flex-col lg:flex-row transition-colors duration-300 w-full max-w-full overflow-x-hidden",
      isDark ? "bg-[#070707] text-white" : "bg-slate-50 text-slate-900"
    )}>
      
      {/* Admin Sidebar */}
      <AdminSidebar currentPath="/admin/service-requests" theme={theme} toggleTheme={toggleTheme} />

      <div className="flex-grow lg:pl-64 flex flex-col min-h-screen min-w-0 w-full max-w-full overflow-x-hidden">
        {/* Main content area */}
        <main className="flex-grow flex flex-col min-w-0 max-w-full overflow-x-hidden h-screen overflow-y-auto px-6 sm:px-10 py-8 text-left">
        
        {/* Page title and Search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6 border-neutral-800">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Service Requests</h1>
            <p className="text-xs text-neutral-500 mt-1">Review validation and transition service request lifecycles.</p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
            <input
              type="text"
              placeholder="Search by ticket, name, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full pl-10 pr-4 py-2.5 text-xs rounded-xl outline-none border transition-all",
                isDark 
                  ? "bg-neutral-900 border-neutral-800 focus:border-[#D71920] text-white" 
                  : "bg-white border-neutral-200 focus:border-[#D71920] text-black"
              )}
            />
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mt-6">
          {[
            { label: "Total Requests", val: totalRequests, color: "text-[#D71920] bg-[#D71920]/10" },
            { label: "Pending Verification", val: pendingRequests, color: "text-yellow-500 bg-yellow-500/10" },
            { label: "Pickup Scheduled", val: pickupScheduledRequests, color: "text-purple-500 bg-purple-500/10" },
            { label: "Under Service", val: underServiceRequests, color: "text-indigo-500 bg-indigo-500/10" },
            { label: "Completed Services", val: completedRequests, color: "text-green-500 bg-green-500/10" },
            { label: "Closed Requests", val: closedRequests, color: "text-neutral-400 bg-neutral-800/40" },
          ].map((card, idx) => (
            <div
              key={idx}
              className={cn(
                "p-4 rounded-2xl border transition-all flex flex-col justify-between shadow-sm",
                isDark ? "bg-[#0d0d0d] border-neutral-800" : "bg-white border-neutral-200"
              )}
            >
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500">{card.label}</span>
              <span className={cn("text-2xl font-black mt-2 inline-block px-2.5 py-0.5 rounded-lg w-fit", card.color)}>
                {card.val}
              </span>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-8 border-b border-neutral-800 pb-2">
          {(["ALL", "PENDING_VERIFICATION", "PICKUP_SCHEDULED", "UNDER_SERVICE", "COMPLETED", "CLOSED"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer",
                activeTab === tab
                  ? "bg-[#D71920] text-white shadow-lg shadow-red-500/10"
                  : isDark
                    ? "text-neutral-400 hover:text-white hover:bg-neutral-900"
                    : "text-neutral-600 hover:text-[#D71920] hover:bg-red-50/50"
              )}
            >
              {tab.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Listing Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-[#D71920] animate-spin mb-4" />
            <p className="text-xs text-neutral-500 font-semibold tracking-wider">Retrieving tickets...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className={cn(
            "p-12 text-center border border-dashed rounded-2xl mt-6 max-w-md mx-auto space-y-3",
            isDark ? "border-neutral-800 bg-[#0d0d0d]" : "border-neutral-200 bg-white"
          )}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-neutral-500 bg-neutral-800/10 mx-auto">
              <Headphones size={24} />
            </div>
            <h4 className="font-bold text-sm">No requests found</h4>
            <p className="text-xs text-neutral-500 leading-normal">There are no service requests matching the filter settings or search query.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {/* Desktop View: Table */}
            <div className={cn(
              "hidden lg:block rounded-2xl border overflow-hidden shadow-sm w-full",
              isDark ? "bg-[#0d0d0d] border-neutral-800" : "bg-white border-neutral-200"
            )}>
              <div className="w-full">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className={cn(
                      "border-b font-bold uppercase tracking-wider text-neutral-500",
                      isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-neutral-50 border-neutral-200"
                    )}>
                      <th className="px-3 py-4">Ticket ID</th>
                      <th className="px-3 py-4">User Details</th>
                      <th className="px-3 py-4">Product Name</th>
                      <th className="px-3 py-4 hidden lg:table-cell">Purchase Date</th>
                      <th className="px-3 py-4">Warranty Status</th>
                      <th className="px-3 py-4 hidden lg:table-cell">Preferred Pickup</th>
                      <th className="px-3 py-4">Status</th>
                      <th className="px-3 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className={cn("divide-y text-xs", isDark ? "divide-neutral-800/80" : "divide-neutral-100")}>
                    {filteredRequests.map((req) => (
                      <tr key={req.id} className={cn("transition-colors", isDark ? "hover:bg-neutral-900/40" : "hover:bg-neutral-50/50")}>
                        <td className="px-3 py-4 font-mono font-bold text-[#D71920] whitespace-nowrap">{req.ticketId}</td>
                        <td className="px-3 py-4">
                          <div className="font-bold text-sm">{req.user?.firstName} {req.user?.lastName}</div>
                          <div className="text-[10px] text-neutral-500 mt-0.5 uppercase tracking-wider font-extrabold flex items-center gap-1">
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-[8px]",
                              req.user?.role === "DISTRIBUTOR" ? "bg-red-500/10 text-[#D71920]" : "bg-blue-500/10 text-blue-400"
                            )}>{req.user?.role}</span>
                            {req.user?.companyName && <span className="truncate max-w-[120px]">- {req.user.companyName}</span>}
                          </div>
                        </td>
                        <td className="px-3 py-4 font-semibold text-sm">{req.product?.name}</td>
                        <td className="px-3 py-4 whitespace-nowrap hidden lg:table-cell">
                          {new Date(req.purchaseDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-3 py-4">
                          <span className={cn(
                            "px-2 py-0.5 font-bold rounded text-[9px] inline-block whitespace-nowrap",
                            req.warrantyStatus === "Under Warranty" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                          )}>{req.warrantyStatus.toUpperCase()}</span>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap hidden lg:table-cell">
                          {new Date(req.preferredPickupDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-3 py-4">{getStatusBadge(req.currentStatus, req.cancellationReason)}</td>
                        <td className="px-3 py-4 text-right">
                          <button
                            onClick={() => setSelectedRequest(req)}
                            className={cn(
                              "px-3.5 py-2 border rounded-xl font-bold cursor-pointer inline-flex items-center gap-1 transition-all",
                              isDark 
                                ? "border-neutral-800 hover:border-[#D71920] hover:text-[#D71920]" 
                                : "border-neutral-200 hover:border-[#D71920] hover:text-[#D71920]"
                            )}
                          >
                            <Eye size={12} />
                            <span>Review</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile View: Card List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
              {filteredRequests.map((req) => (
                <div 
                  key={req.id} 
                  className={cn(
                    "border p-5 rounded-2xl shadow-sm space-y-4",
                    isDark ? "bg-[#0d0d0d] border-neutral-800 text-white" : "bg-white border-neutral-200 text-neutral-800"
                  )}
                >
                  {/* Top Row: Ticket ID & Date */}
                  <div className="flex justify-between items-start">
                    <span className="font-bold font-mono text-[#D71920] text-sm">{req.ticketId}</span>
                    <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500">
                      {new Date(req.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>

                  {/* User Details */}
                  <div className="pt-1">
                    <h4 className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-0.5">User Details</h4>
                    <div className="font-bold text-sm">{req.user?.firstName} {req.user?.lastName}</div>
                    <div className="text-[9px] text-neutral-500 mt-1 uppercase tracking-wider font-extrabold flex items-center gap-1 flex-wrap">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[8px]",
                        req.user?.role === "DISTRIBUTOR" ? "bg-red-500/10 text-[#D71920]" : "bg-blue-500/10 text-blue-400"
                      )}>{req.user?.role}</span>
                      {req.user?.companyName && <span className="truncate max-w-[150px]">- {req.user.companyName}</span>}
                    </div>
                  </div>

                  {/* Product */}
                  <div>
                    <h4 className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-0.5">Product</h4>
                    <p className="font-bold text-xs text-neutral-700 dark:text-neutral-200">{req.product?.name}</p>
                  </div>

                  {/* Status Badges */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-100 dark:border-slate-800/40">
                    <div>
                      <span className="block text-[8px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1">Warranty</span>
                      <span className={cn(
                        "px-2 py-0.5 font-bold rounded text-[9px] inline-block whitespace-nowrap",
                        req.warrantyStatus === "Under Warranty" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                      )}>{req.warrantyStatus.toUpperCase()}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1">Status</span>
                      {getStatusBadge(req.currentStatus, req.cancellationReason)}
                    </div>
                  </div>

                  {/* Footer Info & Actions */}
                  <div className="pt-3 border-t border-neutral-100 dark:border-slate-800/40 flex justify-between items-center text-xs flex-wrap gap-2">
                    <div className="flex gap-4">
                      <div>
                        <span className="block text-[8px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-0.5">Purchase Date</span>
                        <span className="font-semibold text-neutral-600 dark:text-neutral-350">
                          {new Date(req.purchaseDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[8px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-0.5">Preferred Pickup</span>
                        <span className="font-semibold text-neutral-600 dark:text-neutral-350">
                          {new Date(req.preferredPickupDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setSelectedRequest(req)}
                      className={cn(
                        "px-3.5 py-2 border rounded-xl font-bold cursor-pointer inline-flex items-center gap-1 transition-all text-xs ml-auto",
                        isDark 
                          ? "border-neutral-800 hover:border-[#D71920] hover:text-[#D71920]" 
                          : "border-neutral-200 hover:border-[#D71920] hover:text-[#D71920]"
                      )}
                    >
                      <Eye size={12} />
                      <span>Review</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        </main>
      </div>

      {/* DRAWER: DETAILS & ACTION CONTROL PANEL */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          
          {/* Close Backdrop */}
          <div className="absolute inset-0" onClick={() => setSelectedRequest(null)} />

          {/* Drawer Body */}
          <div className={cn(
            "relative w-full max-w-full sm:max-w-2xl h-screen shadow-2xl flex flex-col text-left animate-in slide-in-from-right duration-350 overflow-x-hidden",
            isDark ? "bg-[#0d0d0d] border-l border-neutral-800 text-white" : "bg-white border-l border-neutral-200 text-slate-900"
          )}>
            
            {/* Header */}
            <div className={cn(
              "px-6 py-4 border-b flex items-center justify-between sticky top-0 z-10 backdrop-blur w-full",
              isDark ? "bg-[#0d0d0d]/95 border-neutral-800" : "bg-white/95 border-neutral-250"
            )}>
              <div className="flex items-center gap-3 min-w-0">
                <Headphones size={20} className="text-[#D71920] shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-sm font-black flex items-center gap-1.5 break-all">
                    Ticket ID: <span className="font-mono text-[#D71920]">{selectedRequest.ticketId}</span>
                  </h3>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                    Submitted: {new Date(selectedRequest.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-800/40 text-neutral-400 hover:text-white shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Container */}
            <div className="p-6 overflow-y-auto overflow-x-hidden flex-1 space-y-8 w-full break-words [word-break:break-word] [overflow-wrap:break-word]">
              
              {/* STATUS ACTION FORM SECTION (For Single Items) */}
              {(!selectedRequest.distributorItems || selectedRequest.distributorItems.length === 0) && (
                <AdminStatusActionPanel
                  request={selectedRequest}
                  isDark={isDark}
                  onUpdate={async () => {
                    await fetchRequests();
                    const detailRes = await serviceRequestService.getServiceRequestById(selectedRequest.id);
                    if (detailRes.success) setSelectedRequest(detailRes.data);
                  }}
                  getStatusBadge={getStatusBadge}
                />
              )}


              {/* USER METADATA */}
              <div className="space-y-3.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400 border-b pb-1">Customer / Distributor Details</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-neutral-500">Name</p>
                    <p className="font-bold mt-0.5">{selectedRequest.user?.firstName} {selectedRequest.user?.lastName}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Role</p>
                    <p className="font-bold uppercase tracking-wider mt-0.5 text-[#D71920]">{selectedRequest.user?.role}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Email Address</p>
                    <p className="font-semibold mt-0.5 break-all">{selectedRequest.user?.email}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Registered Phone</p>
                    <p className="font-semibold mt-0.5 break-all">{selectedRequest.user?.phoneNumber || "N/A"}</p>
                  </div>

                  {selectedRequest.user?.role === "DISTRIBUTOR" && (
                    <>
                      <div>
                        <p className="text-neutral-500">Company Name</p>
                        <p className="font-bold mt-0.5 text-indigo-400 break-words">{selectedRequest.user.companyName || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-neutral-500">GSTIN</p>
                        <p className="font-mono font-bold mt-0.5 text-indigo-400 break-all">{selectedRequest.user.gstin || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-neutral-500">Distributor ID</p>
                        <p className="font-mono font-semibold mt-0.5 text-neutral-400 break-all">{selectedRequest.user.id}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* PRODUCT(S) DETAILS */}
              {selectedRequest.distributorItems && selectedRequest.distributorItems.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400 border-b pb-1">Products in this Batch</h4>
                  <div className="space-y-4">
                    {selectedRequest.distributorItems.map((item: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/30">
                        <div className="flex justify-between items-start mb-3">
                          <h5 className="text-xs font-bold text-[#D71920]">Product {idx + 1}: {item.productName}</h5>
                          <span className="text-[10px] font-mono bg-neutral-800 px-2 py-1 rounded text-neutral-300">SKU: {item.sku}</span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-xs">
                          <div>
                            <p className="text-neutral-500">Order ID</p>
                            <p className="font-bold mt-0.5">{item.orderId || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-neutral-500">Purchase Date</p>
                            <p className="font-bold mt-0.5">
                              {item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-neutral-500">Service Category</p>
                            <p className="font-bold mt-0.5">{item.serviceCategory}</p>
                          </div>
                          <div>
                            <p className="text-neutral-500">Issue Description</p>
                            <p className="italic text-neutral-300 mt-0.5">"{item.issueDescription}"</p>
                          </div>
                        </div>

                        {(item.productImages?.length > 0 || item.warrantyCard) && (
                          <div className="pt-3 border-t border-neutral-800/50">
                            <p className="text-[10px] font-bold text-neutral-500 uppercase mb-2">Attached Documents & Images</p>
                            <div className="flex flex-wrap gap-2">
                              {item.productImages?.map((imgUrl: string, imgIdx: number) => (
                                <a key={`img-${imgIdx}`} href={imgUrl} target="_blank" rel="noreferrer" className="block relative w-12 h-12 rounded overflow-hidden border border-neutral-700 hover:border-neutral-500">
                                  <img src={imgUrl} alt={`Product ${idx+1} img ${imgIdx+1}`} className="w-full h-full object-cover" />
                                </a>
                              ))}
                              {item.warrantyCard && (
                                <a href={item.warrantyCard} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center w-12 h-12 rounded border border-green-700/50 hover:border-green-500 bg-green-900/20 text-green-500">
                                  <FileText size={16} className="mb-0.5" />
                                  <span className="text-[7px] font-bold uppercase tracking-wider">Warranty</span>
                                </a>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Individual Item Action Panel */}
                        <div className="mt-4 pt-4 border-t border-neutral-800">
                          <AdminStatusActionPanel
                            request={selectedRequest}
                            item={item}
                            itemIndex={idx}
                            isDark={isDark}
                            onUpdate={async () => {
                              await fetchRequests();
                              const detailRes = await serviceRequestService.getServiceRequestById(selectedRequest.id);
                              if (detailRes.success) setSelectedRequest(detailRes.data);
                            }}
                            getStatusBadge={getStatusBadge}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {/* SINGLE PRODUCT DETAILS */}
                  <div className="space-y-3.5">
                    <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400 border-b pb-1">Product Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-neutral-500">Product Name</p>
                        <p className="font-bold mt-0.5 break-words">{selectedRequest.product?.name}</p>
                      </div>
                      <div>
                        <p className="text-neutral-500">SKU Code</p>
                        <p className="font-mono font-bold mt-0.5 break-all">{selectedRequest.product?.sku || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-neutral-500">Variant Group</p>
                        <p className="font-semibold mt-0.5 break-words">{selectedRequest.product?.variantGroup || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-neutral-500">Internal Product ID</p>
                        <p className="font-mono text-neutral-450 mt-0.5 break-all">{selectedRequest.product?.id}</p>
                      </div>
                      <div>
                        <p className="text-neutral-500">Purchase Date</p>
                        <p className="font-semibold mt-0.5">
                          {new Date(selectedRequest.purchaseDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div>
                        <p className="text-neutral-500">Warranty Expiry Date</p>
                        <p className="font-semibold mt-0.5">
                          {new Date(selectedRequest.warrantyExpiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div>
                        <p className="text-neutral-500">Warranty Status</p>
                        <p className="mt-0.5">
                          <span className={cn(
                            "px-2 py-0.5 rounded font-black text-[9px] inline-block whitespace-nowrap",
                            selectedRequest.warrantyStatus === "Under Warranty" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                          )}>{selectedRequest.warrantyStatus.toUpperCase()}</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-neutral-500">Warranty Duration</p>
                        <p className="font-semibold mt-0.5">{selectedRequest.product?.warranty || "1 Year"}</p>
                      </div>
                    </div>
                  </div>

                  {/* SERVICE CATEGORY (SINGLE ITEM) */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400 border-b pb-1">Service category</h4>
                    <p className="text-xs font-bold bg-neutral-900 px-3 py-1.5 w-fit rounded-lg">{selectedRequest.serviceCategory}</p>
                    <p className="text-[10px] text-neutral-500 leading-normal mt-1 italic">"{selectedRequest.issueDescription}"</p>
                  </div>
                </>
              )}

              {/* PICKUP INFORMATION (SHARED) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400 border-b pb-1">Pickup Details</h4>
                  <div className="text-xs space-y-1.5 leading-normal">
                    <p className="flex items-center gap-1">
                      <Phone size={11} className="text-neutral-500" />
                      <span className="font-semibold">{selectedRequest.contactNumber}</span>
                    </p>
                    <p className="flex items-start gap-1">
                      <MapPin size={11} className="text-neutral-500 mt-0.5 flex-shrink-0" />
                      <span>{selectedRequest.pickupAddress}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* ATTACHMENT IMAGES */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400 border-b pb-1">Attachments</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedRequest.attachments?.map((att: any) => (
                    <div key={att.id} className="border border-neutral-800 rounded-xl p-2.5 space-y-2 bg-[#121212] flex flex-col justify-between text-xs">
                      <div className="flex items-start gap-2">
                        {att.fileType === "WARRANTY_CARD" ? (
                          <FileText size={16} className="text-[#D71920] mt-0.5 flex-shrink-0" />
                        ) : (
                          <ImageIcon size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-[9px] font-black text-neutral-500 uppercase leading-none">{att.fileType.replace("_", " ")}</p>
                          <p className="text-xs font-semibold truncate mt-1 text-neutral-300">{att.fileName}</p>
                        </div>
                      </div>
                      <a
                        href={att.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-1 bg-neutral-900 border border-neutral-800 text-[9px] font-bold text-center rounded hover:bg-neutral-800 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        <Download size={10} />
                        <span>View File</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* STATUS HISTORY TIMELINE */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400 border-b pb-1">Status Logs & Remarks</h4>
                <div className="relative pl-6 space-y-5 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-neutral-800">
                  {selectedRequest.history?.map((log: any, idx: number) => (
                    <div key={log.id} className="relative text-xs">
                      <div className="absolute -left-[20px] top-0.5 w-3 h-3 rounded-full border-2 border-green-500 bg-slate-950 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      </div>
                      <div className="pl-1">
                        <p className="font-bold text-neutral-300 text-xs flex items-center gap-2">
                          <span>{log.status}</span>
                          <span className="text-[10px] text-neutral-500 font-normal">
                            {new Date(log.updatedAt).toLocaleString("en-IN")}
                          </span>
                        </p>
                        {log.remarks && <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">"{log.remarks}"</p>}
                        <p className="text-[9px] font-black text-[#D71920] mt-0.5 uppercase tracking-wide">Updated by: {log.updatedBy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
