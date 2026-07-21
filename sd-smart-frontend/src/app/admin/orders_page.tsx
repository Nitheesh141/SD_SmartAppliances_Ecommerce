"use client";
import { ENV } from "@/config/env";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";
import { 
  Loader2, ClipboardList, Shield, Filter, Eye, Check, X, 
  Truck, ArrowRight, FileText, Printer, ShieldCheck, RefreshCw,
  Search, Calendar, MessageSquare, AlertCircle, ChevronDown
} from "lucide-react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import Pagination from "@/components/shared/Pagination";
import { cn } from "@/lib/utils";

const logisticsOptions = [
  { value: "", label: "Select logistics stage..." },
  { value: "PENDING_APPROVAL", label: "Pending Approval" },
  { value: "APPROVED", label: "Approved" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
];

const paymentStatusOptions = [
  { value: "PENDING", label: "PENDING" },
  { value: "PAID", label: "PAID" },
  { value: "UNPAID", label: "UNPAID" },
  { value: "REFUNDED", label: "REFUNDED" },
];

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  product?: {
    name: string;
    sku: string | null;
    image: string;
    categoryLabel: string;
    category: string;
    modelNumber: string | null;
    variantDetails: any;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string | null;
    role?: string;
  };
  address: {
    fullName: string;
    companyName: string | null;
    mobileNumber: string;
    addressLine1: string;
    addressLine2: string | null;
    landmark: string | null;
    city: string;
    state: string;
    pincode: string;
    gstin: string | null;
  };
  poNumber: string | null;
  paymentMethod: string;
  status: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  deliveryCharges: number;
  discount: number;
  grandTotal: number;
  items: OrderItem[];
  statusHistory: Array<{
    id: string;
    status: string;
    remarks: string | null;
    updatedBy: string;
    updatedAt: string;
  }>;
  invoice?: {
    invoiceNumber: string;
    invoiceDate: string;
    pdfUrl: string | null;
    generatedBy: string;
  } | null;
  paymentStatus?: string;
  createdAt: string;
}

type TabType = "PENDING" | "APPROVED" | "PROCESSING" | "SHIPPING" | "DELIVERED" | "CANCELLED_REJECTED" | "ALL";

export default function AdminOrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  // Theme State
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("admin-theme") as "light" | "dark") || "dark";
    }
    return "dark";
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("PENDING");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Detailed Modal/Drawer state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  // Track whether the detail drawer is open to pause polling
  const isEditingRef = useRef(false);
  useEffect(() => {
    isEditingRef.current = !!selectedOrder;
  }, [selectedOrder]);

  // Status updating state
  const [trackingStatus, setTrackingStatus] = useState("");
  const [trackingRemarks, setTrackingRemarks] = useState("");
  const [isTrackingDropdownOpen, setIsTrackingDropdownOpen] = useState(false);
  const [isPaymentDropdownOpen, setIsPaymentDropdownOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [sellerSettings, setSellerSettings] = useState({
    seller_name: "SD Smart Appliances Pvt. Ltd.",
    seller_address_line1: "Plot No. 42, B2B Industrial Area",
    seller_address_line2: "Phase II, Bangalore, Karnataka - 560001",
    seller_gstin: "29AAAAA1111A1Z1",
    seller_email: "billing@sdsmartappliances.com",
    seller_phone: "+91 80 4455 6677",
    seller_signature: ""
  });

  // Load theme from localStorage
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

  // Sync tracking status when selected order changes
  useEffect(() => {
    if (selectedOrder) {
      const isValidOption = logisticsOptions.some(opt => opt.value === selectedOrder.status && opt.value !== "");
      if (isValidOption) {
        setTrackingStatus(selectedOrder.status);
      } else {
        setTrackingStatus("");
      }
    } else {
      setTrackingStatus("");
    }
  }, [selectedOrder]);

  // Reset page to 1 when search or tab filter changes
  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery]);

  const fetchOrders = async (isBackground = false) => {
    if (!isBackground) setLoadingOrders(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });

      if (activeTab) {
        queryParams.append("status", activeTab);
      }

      if (searchQuery) {
        queryParams.append("search", searchQuery);
      }

      const res = await fetch(`${ENV.API_BASE_URL}/orders/all?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.data || []);
        setTotalRecords(data.pagination?.totalRecords || 0);
        setTotalPages(data.pagination?.totalPages || 1);
        
        // Update selectedOrder in-place if open
        setSelectedOrder(prev => {
          if (!prev) return null;
          const updated = (data.data || []).find((o: any) => o.id === prev.id);
          return updated || prev;
        });
      } else {
        if (!isBackground) toast.error(data.message || "Failed to fetch orders");
      }
    } catch (err) {
      console.error(err);
      if (!isBackground) toast.error("Failed to connect to backend server");
    } finally {
      if (!isBackground) setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders(false);
    }
  }, [page, pageSize, activeTab, searchQuery, isAuthenticated]);

  useEffect(() => {
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

    if (isAuthenticated) {
      fetchSettings();

      const interval = setInterval(() => {
        const activeEl = document.activeElement;
        const isInputFocused = activeEl && (
          ["INPUT", "TEXTAREA", "SELECT"].includes(activeEl.tagName.toUpperCase()) ||
          activeEl.getAttribute("contenteditable") === "true"
        );
        if (!isEditingRef.current && !isInputFocused) {
          fetchOrders(true);
        }
      }, 20000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, page, pageSize, activeTab, searchQuery]);

  const handleUpdateStatus = async (status: string, remarks: string) => {
    if (!selectedOrder) return;
    setUpdatingStatus(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${ENV.API_BASE_URL}/orders/${selectedOrder.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, remarks })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Order status updated to ${status}`);
        setSelectedOrder(data.order);
        // Refresh orders list
        fetchOrders();
        // Reset states
        setShowRejectForm(false);
        setRejectionReason("");
        setTrackingRemarks("");
      } else {
        toast.error(data.message || "Failed to update order status");
      }
    } catch (err) {
      console.error(err);
      toast.error("Status update request failed");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const isDark = theme === "dark";

  // Filter orders by active tab & search query (now offloaded to the backend)
  const filteredOrders = orders;

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
      case "PENDING_APPROVAL": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "APPROVED": return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      case "PROCESSING": return "text-indigo-500 bg-indigo-500/10 border-indigo-500/20";
      case "PACKED": return "text-purple-500 bg-purple-500/10 border-purple-500/20";
      case "SHIPPED": return "text-sky-500 bg-sky-500/10 border-sky-500/20";
      case "IN_TRANSIT": return "text-teal-500 bg-teal-500/10 border-teal-500/20";
      case "OUT_FOR_DELIVERY": return "text-cyan-500 bg-cyan-500/10 border-cyan-500/20";
      case "DELIVERED": return "text-green-500 bg-green-500/10 border-green-500/20";
      case "REJECTED": return "text-red-500 bg-red-500/10 border-red-500/20";
      case "CANCELLED": return "text-gray-500 bg-gray-500/10 border-gray-500/20";
      default: return "text-neutral-500 bg-neutral-500/10 border-neutral-200";
    }
  };

  return (
    <div className={cn(
      "min-h-screen flex flex-col lg:flex-row transition-colors duration-300 font-sans selection:bg-[#D71920]/30 selection:text-white",
      isDark ? "dark bg-[#0d0d0d] text-white" : "bg-[#fafafa] text-slate-900"
    )}>
      <AdminSidebar currentPath="/admin/orders" theme={theme} toggleTheme={toggleTheme} />

      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className={cn(
          "px-6 py-6 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors duration-300",
          isDark ? "border-neutral-800 bg-[#0d0d0d]/80" : "border-neutral-200 bg-white"
        )}>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#D71920] uppercase tracking-wider mb-1">
              <ClipboardList size={14} />
              <span>B2B Operations</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Distributor Orders</h1>
            <p className={cn("text-xs mt-0.5", isDark ? "text-neutral-500" : "text-neutral-400")}>
              Review order approvals, print GST tax invoices, and update logistics tracking.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchOrders(false)}
              className={cn(
                "p-2.5 rounded-lg border transition-all flex items-center justify-center cursor-pointer",
                isDark ? "bg-neutral-900 border-neutral-800 text-white hover:bg-neutral-800" : "bg-white border-neutral-200 text-slate-700 hover:bg-slate-50"
              )}
              title="Refresh Orders"
            >
              <RefreshCw size={16} className={cn(loadingOrders && "animate-spin")} />
            </button>

            {/* Search Input */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
              <input
                type="text"
                placeholder="Search orders, invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#D71920]",
                  isDark ? "bg-neutral-900 border-neutral-800 text-white" : "bg-white border-neutral-200 text-slate-900"
                )}
              />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow p-6 space-y-6">
          
          {/* Status Tabs */}
          <div className={cn("flex flex-wrap border-b gap-1", isDark ? "border-neutral-800" : "border-neutral-200")}>
            {[
              { id: "PENDING", label: "Pending Approvals" },
              { id: "APPROVED", label: "Approved" },
              { id: "PROCESSING", label: "Processing" },
              { id: "SHIPPING", label: "Shipping" },
              { id: "DELIVERED", label: "Delivered History" },
              { id: "CANCELLED_REJECTED", label: "Rejected/Cancelled" },
              { id: "ALL", label: "All Orders" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as TabType);
                  setSelectedOrder(null);
                }}
                className={cn(
                  "px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 -mb-[2px] transition-all cursor-pointer",
                  activeTab === tab.id
                    ? "border-[#D71920] text-[#D71920]"
                    : "border-transparent text-neutral-400 hover:text-neutral-500"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Orders Grid/List */}
          {loadingOrders ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-[#D71920] animate-spin" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className={cn("p-12 text-center border border-dashed rounded-2xl", isDark ? "border-neutral-800" : "border-neutral-200")}>
              <AlertCircle size={32} className="mx-auto text-neutral-400 mb-3" />
              <h3 className="font-bold text-sm">No Orders Found</h3>
              <p className="text-xs text-neutral-500 mt-1">There are no orders matching this tab filter or search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
              
              {/* ORDERS LIST */}
              <div className="xl:col-span-2 space-y-4">
                {filteredOrders.map(order => {
                  const isSelected = selectedOrder?.id === order.id;
                  return (
                    <div
                      key={order.id}
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowRejectForm(false);
                        setRejectionReason("");
                      }}
                      className={cn(
                        "p-5 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md",
                        isSelected
                          ? "border-[#D71920] bg-[#D71920]/5"
                          : isDark ? "bg-neutral-900 border-neutral-800 hover:bg-neutral-850" : "bg-white border-neutral-200 hover:bg-slate-50"
                      )}
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm tracking-tight text-neutral-900 dark:text-white">
                            {order.orderNumber}
                          </span>
                          <span className={cn("px-2 py-0.5 border rounded-md text-[9px] font-bold uppercase tracking-wider", getStatusColor(order.status))}>
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                        
                        <div className="text-xs text-neutral-500 mt-2 space-y-1">
                          <p><span className="font-semibold text-neutral-600 dark:text-neutral-400">{order.user?.role?.toUpperCase() === 'DISTRIBUTOR' ? 'Distributor' : 'Customer'}:</span> {order.address?.fullName || "N/A"}</p>
                          {order.address?.companyName && <p><span className="font-semibold text-neutral-600 dark:text-neutral-400">Company:</span> {order.address.companyName}</p>}
                          <p><span className="font-semibold text-neutral-600 dark:text-neutral-400">Date:</span> {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </div>
                      </div>

                      <div className="text-left md:text-right flex flex-col gap-1 items-start md:items-end">
                        <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Grand Total</span>
                        <span className="text-lg font-black text-[#D71920]">₹{order.grandTotal.toLocaleString()}</span>
                        <span className="text-[10px] text-neutral-400">{order.items.length} items</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DETAILS PANEL / DRAWER VIEW */}
              <div className="xl:col-span-1">
                {selectedOrder ? (
                  <div className={cn(
                    "p-6 rounded-2xl border shadow-sm space-y-6 sticky top-24 max-h-[calc(100vh-140px)] overflow-y-auto",
                    isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200"
                  )}>
                    <div className="flex justify-between items-start border-b border-neutral-200 dark:border-neutral-800 pb-4">
                      <div>
                        <h3 className="font-black text-base">{selectedOrder.orderNumber}</h3>
                        <p className="text-xs text-neutral-500 mt-0.5">{selectedOrder.user?.role?.toUpperCase() === 'DISTRIBUTOR' ? 'Distributor' : 'Customer'} order details</p>
                      </div>
                      <span className={cn("px-2 py-0.5 border rounded-md text-[9px] font-bold uppercase tracking-wider", getStatusColor(selectedOrder.status))}>
                        {getStatusLabel(selectedOrder.status)}
                      </span>
                    </div>

                    {/* Distributor Information */}
                    <div className="space-y-2 text-xs">
                      <h4 className="font-bold text-[#D71920] uppercase tracking-wider text-[10px]">{selectedOrder.user?.role?.toUpperCase() === 'DISTRIBUTOR' ? 'Distributor' : 'Customer'} Contact</h4>
                      <p><span className="text-neutral-500">Name:</span> <span className="font-bold">{selectedOrder.address?.fullName || "N/A"}</span></p>
                      <p><span className="text-neutral-500">Email:</span> <span className="font-bold">{selectedOrder.user?.email || "N/A"}</span></p>
                      <p><span className="text-neutral-500">Mobile:</span> <span className="font-bold">{selectedOrder.address?.mobileNumber || "N/A"}</span></p>
                      {selectedOrder.poNumber && <p><span className="text-neutral-500">PO #:</span> <span className="font-bold">{selectedOrder.poNumber}</span></p>}
                    </div>

                    {/* Shipping Address */}
                    <div className="space-y-2 text-xs">
                      <h4 className="font-bold text-[#D71920] uppercase tracking-wider text-[10px]">Shipping Destination</h4>
                      <div className="p-3 bg-black/5 dark:bg-white/5 rounded-xl border border-neutral-100 dark:border-neutral-800 space-y-1 text-neutral-600 dark:text-neutral-400">
                        <p className="font-bold text-neutral-800 dark:text-white">{selectedOrder.address?.fullName || "N/A"}</p>
                        {selectedOrder.address?.companyName && <p className="font-semibold text-neutral-700 dark:text-neutral-300">{selectedOrder.address.companyName}</p>}
                        <p>{selectedOrder.address?.addressLine1 || ""}</p>
                        {selectedOrder.address?.addressLine2 && <p>{selectedOrder.address.addressLine2}</p>}
                        <p>{selectedOrder.address?.city || ""}, {selectedOrder.address?.state || ""} - {selectedOrder.address?.pincode || ""}</p>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-[#D71920] uppercase tracking-wider text-[10px] border-b border-neutral-100 dark:border-neutral-800 pb-2">
                        Product Checklist
                      </h4>
                      <div className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-48 overflow-y-auto">
                        {selectedOrder.items.map(item => (
                          <div key={item.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                            <div className="min-w-0">
                              <p className="font-bold text-neutral-800 dark:text-white truncate">{item.product?.name || "Product"}</p>
                              <p className="text-[10px] text-neutral-400 font-mono mt-0.5">SKU: {item.product?.sku || "N/A"}</p>
                              <p className="text-[10px] text-neutral-500">Model: {item.product?.modelNumber || "N/A"}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-semibold">Qty: {item.quantity}</p>
                              <p className="text-[10px] text-neutral-500">₹{item.unitPrice.toLocaleString()}/u</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Approval Action Blocks */}
                    {selectedOrder.status === "PENDING_APPROVAL" && (
                      <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4 space-y-4">
                        {!showRejectForm ? (
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => handleUpdateStatus("APPROVED", "Order approved by operations admin.")}
                              disabled={updatingStatus}
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors"
                            >
                              <Check size={14} /> Approve Order
                            </button>
                            <button
                              onClick={() => setShowRejectForm(true)}
                              disabled={updatingStatus}
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors"
                            >
                              <X size={14} /> Reject Order
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3 p-3 bg-red-500/5 rounded-xl border border-red-500/10">
                            <label className="text-[10px] font-bold text-red-500 uppercase tracking-wider block">
                              Enter Rejection Reason
                            </label>
                            <textarea
                              rows={3}
                              placeholder="Remarks/Reason for rejection..."
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              className={cn(
                                "w-full p-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-red-500",
                                isDark ? "bg-neutral-950 border-neutral-800 text-white" : "bg-white border-neutral-200 text-slate-900"
                              )}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateStatus("REJECTED", rejectionReason || "Order rejected by admin.")}
                                disabled={updatingStatus}
                                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                              >
                                Confirm Reject
                              </button>
                              <button
                                onClick={() => {
                                  setShowRejectForm(false);
                                  setRejectionReason("");
                                }}
                                className="px-3 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Super Admin Payment Status updates */}
                    {user?.role === "superadmin" && (
                      <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4 space-y-3">
                        <h4 className="font-bold text-[#D71920] uppercase tracking-wider text-[10px]">
                          Update Payment Status (Super Admin Only)
                        </h4>
                        <div className="flex gap-2">
                          <div className="relative w-full">
                            {/* Custom Styled Trigger Button */}
                            <button
                              type="button"
                              onClick={() => setIsPaymentDropdownOpen(!isPaymentDropdownOpen)}
                              className={cn(
                                "w-full p-2.5 border rounded-lg text-xs font-bold focus:outline-none focus:ring-4 focus:ring-[#D71920]/15 focus:border-[#D71920] cursor-pointer text-left transition-all relative flex items-center justify-between shadow-sm",
                                isDark 
                                  ? "bg-neutral-950 border-neutral-800 text-white" 
                                  : "bg-white border-slate-200 text-slate-900"
                              )}
                            >
                              <span>{selectedOrder.paymentStatus || "PENDING"}</span>
                              <ChevronDown size={14} className={cn("text-slate-400 transition-transform duration-200", isPaymentDropdownOpen ? "rotate-180" : "")} />
                            </button>

                            {/* Dropdown Options List */}
                            {isPaymentDropdownOpen && (
                              <>
                                {/* Backdrop to close on click outside */}
                                <div 
                                  className="fixed inset-0 z-40 cursor-default" 
                                  onClick={() => setIsPaymentDropdownOpen(false)}
                                />
                                
                                <div className={cn(
                                  "absolute left-0 right-0 mt-1.5 border rounded-xl shadow-xl py-1.5 z-50 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200",
                                  isDark 
                                    ? "bg-neutral-950 border-neutral-800 text-white" 
                                    : "bg-white border-neutral-200 text-slate-900"
                                )}>
                                  {paymentStatusOptions.map((option) => {
                                    const isSelected = option.value === (selectedOrder.paymentStatus || "PENDING");
                                    return (
                                      <button
                                        key={option.value}
                                        type="button"
                                        onClick={async () => {
                                          setIsPaymentDropdownOpen(false);
                                          const val = option.value;
                                          try {
                                            const token = localStorage.getItem("authToken");
                                            const res = await fetch(`${ENV.API_BASE_URL}/orders/${selectedOrder.id}/status`, {
                                              method: "PATCH",
                                              headers: {
                                                "Content-Type": "application/json",
                                                Authorization: `Bearer ${token}`
                                              },
                                              body: JSON.stringify({ paymentStatus: val, remarks: `Payment status updated to ${val} by Super Admin.` })
                                            });
                                            const data = await res.json();
                                            if (data.success) {
                                              toast.success(`Payment status updated to ${val}`);
                                              setSelectedOrder(data.order);
                                              fetchOrders();
                                            } else {
                                              toast.error(data.message || "Failed to update payment status");
                                            }
                                          } catch (err) {
                                            console.error(err);
                                            toast.error("Payment status update failed");
                                          }
                                        }}
                                        className={cn(
                                          "w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer",
                                          isDark
                                            ? isSelected
                                              ? "bg-red-950/20 text-red-400"
                                              : "text-neutral-300 hover:bg-neutral-900/50 hover:text-white"
                                            : isSelected
                                              ? "bg-red-50 text-[#D71920]"
                                              : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                        )}
                                      >
                                        <span>{option.label}</span>
                                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#D71920] dark:bg-red-400" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Manual Tracking Workflow updates */}
                    {selectedOrder.status !== "PENDING_APPROVAL" && selectedOrder.status !== "REJECTED" && selectedOrder.status !== "CANCELLED" && (
                      selectedOrder.status === "DELIVERED" ? (
                        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4 text-center">
                          <p className="text-xs font-bold text-green-600 bg-green-500/10 border border-green-500/20 p-3.5 rounded-xl leading-relaxed">
                            This order has already been delivered and can no longer be moved to a previous status.
                          </p>
                        </div>
                      ) : (
                        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4 space-y-4">
                          <h4 className="font-bold text-[#D71920] uppercase tracking-wider text-[10px]">
                            Update Shipping Stage
                          </h4>
                          
                          <div className="space-y-3">
                            <div className="relative">
                              {/* Custom Styled Trigger Button */}
                              <button
                                type="button"
                                onClick={() => setIsTrackingDropdownOpen(!isTrackingDropdownOpen)}
                                className={cn(
                                  "w-full p-2.5 border rounded-lg text-xs font-bold focus:outline-none focus:ring-4 focus:ring-[#D71920]/15 focus:border-[#D71920] cursor-pointer text-left transition-all relative flex items-center justify-between shadow-sm",
                                  isDark 
                                    ? "bg-neutral-950 border-neutral-800 text-white" 
                                    : "bg-white border-slate-200 text-slate-900"
                                )}
                              >
                                <span>{logisticsOptions.find(opt => opt.value === trackingStatus)?.label || "Select logistics stage..."}</span>
                                <ChevronDown size={14} className={cn("text-slate-400 transition-transform duration-200", isTrackingDropdownOpen ? "rotate-180" : "")} />
                              </button>

                              {/* Dropdown Options List */}
                              {isTrackingDropdownOpen && (
                                <>
                                  {/* Backdrop to close on click outside */}
                                  <div 
                                    className="fixed inset-0 z-40 cursor-default" 
                                    onClick={() => setIsTrackingDropdownOpen(false)}
                                  />
                                  
                                  <div className={cn(
                                    "absolute left-0 right-0 mt-1.5 border rounded-xl shadow-xl py-1.5 z-50 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200",
                                    isDark 
                                      ? "bg-neutral-950 border-neutral-800 text-white" 
                                      : "bg-white border-neutral-200 text-slate-900"
                                  )}>
                                    {logisticsOptions
                                      .filter(option => option.value !== "")
                                      .map((option) => {
                                        const isSelected = option.value === trackingStatus;
                                        return (
                                          <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => {
                                              setTrackingStatus(option.value);
                                              setIsTrackingDropdownOpen(false);
                                            }}
                                            className={cn(
                                              "w-full text-left px-4 py-2 text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer",
                                              isDark
                                                ? isSelected
                                                  ? "bg-red-950/20 text-red-400"
                                                  : "text-neutral-300 hover:bg-neutral-900/50 hover:text-white"
                                                : isSelected
                                                  ? "bg-red-50 text-[#D71920]"
                                                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                            )}
                                          >
                                            <span>{option.label}</span>
                                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#D71920] dark:bg-red-400" />}
                                          </button>
                                        );
                                      })}
                                  </div>
                                </>
                              )}
                            </div>

                            <textarea
                              placeholder="Add tracking remarks/notes..."
                              rows={2}
                              value={trackingRemarks}
                              onChange={(e) => setTrackingRemarks(e.target.value)}
                              className={cn(
                                "w-full p-2.5 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#D71920]",
                                isDark ? "bg-neutral-950 border-neutral-800 text-white" : "bg-white border-neutral-200 text-slate-900"
                              )}
                            />

                            <button
                              onClick={() => {
                                if (!trackingStatus) {
                                  toast.error("Please select a tracking status");
                                  return;
                                }
                                handleUpdateStatus(trackingStatus, trackingRemarks);
                              }}
                              disabled={updatingStatus || !trackingStatus}
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-neutral-800 hover:bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow"
                            >
                              <Truck size={14} /> Update Shipping Status
                            </button>
                          </div>
                        </div>
                      )
                    )}


                    {/* Invoice View Control */}
                    {selectedOrder.invoice && selectedOrder.status !== "REJECTED" && (
                      <button
                        onClick={() => setInvoiceModalOpen(true)}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-[#D71920] hover:bg-[#B91520] text-white rounded-xl text-xs font-bold transition-colors shadow cursor-pointer border border-[#D71920]"
                      >
                        <FileText size={14} /> View & Print Invoice
                      </button>
                    )}
                  </div>
                ) : (
                  <div className={cn(
                    "p-8 text-center border border-dashed rounded-2xl",
                    isDark ? "bg-neutral-900/30 border-neutral-800" : "bg-slate-50 border-neutral-200"
                  )}>
                    <Eye size={24} className="mx-auto text-neutral-400 mb-2" />
                    <p className="text-xs text-neutral-500">Select an order from the list to view full details and perform operations.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {filteredOrders.length > 0 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalRecords={totalRecords}
              pageSize={pageSize}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(s) => {
                setPageSize(s);
                setPage(1);
              }}
              theme={theme}
            />
          )}

        </main>
      </div>

      {/* ── GST INVOICE PREVIEW MODAL ── */}
      {invoiceModalOpen && selectedOrder && selectedOrder.invoice && selectedOrder.status !== "REJECTED" && (
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
                  <p className="text-neutral-500 font-bold mt-2">Invoice #: {selectedOrder.invoice.invoiceNumber}</p>
                  <p className="text-neutral-500">Date: {new Date(selectedOrder.invoice.invoiceDate).toLocaleDateString('en-IN')}</p>
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
                  <p className="font-bold text-neutral-900">{selectedOrder.address?.fullName || "N/A"}</p>
                  {selectedOrder.address?.companyName && <p className="font-semibold">{selectedOrder.address.companyName}</p>}
                  <p>Distributor Code: DIST-{selectedOrder.userId?.substring(0, 8).toUpperCase()}</p>
                  <p>{selectedOrder.address?.addressLine1 || ""}</p>
                  {selectedOrder.address?.addressLine2 && <p>{selectedOrder.address.addressLine2}</p>}
                  <p>{selectedOrder.address?.city || ""}, {selectedOrder.address?.state || ""} - {selectedOrder.address?.pincode || ""}</p>
                  <p>GSTIN: {selectedOrder.address?.gstin || "N/A"}</p>
                  <p>Phone: {selectedOrder.address?.mobileNumber || "N/A"}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 p-4 bg-neutral-50 border border-neutral-200 rounded-xl text-[11px]">
                <div>
                  <span className="text-neutral-500 block">Order Number</span>
                  <span className="font-bold">{selectedOrder.orderNumber}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Order Date</span>
                  <span className="font-bold">{new Date(selectedOrder.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Payment Method</span>
                  <span className="font-bold">{selectedOrder.paymentMethod}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Payment Status</span>
                  <span className={`font-bold uppercase ${
                    selectedOrder.paymentStatus === "PAID" ? "text-green-700" :
                    selectedOrder.paymentStatus === "REFUNDED" ? "text-amber-600" :
                    selectedOrder.paymentStatus === "UNPAID" ? "text-red-700" : "text-neutral-600"
                  }`}>
                    {selectedOrder.paymentStatus || "PENDING"}
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
                  {selectedOrder.items.map((item) => {
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
                    <span>₹{(selectedOrder.subtotal).toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">CGST (9%):</span>
                    <span>₹{selectedOrder.cgst.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">SGST (9%):</span>
                    <span>₹{selectedOrder.sgst.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-green-600 font-bold">
                      <span>Distributor Discount:</span>
                      <span>-₹{selectedOrder.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Delivery/Shipping:</span>
                    <span>{selectedOrder.deliveryCharges === 0 ? "Free" : `₹${selectedOrder.deliveryCharges.toLocaleString()}`}</span>
                  </div>
                  <div className="flex justify-between border-t border-neutral-900 pt-2 text-base font-black text-neutral-950">
                    <span>Grand Total:</span>
                    <span>₹{selectedOrder.grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-dashed border-neutral-300 gap-8">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 border border-neutral-355 border-neutral-300 rounded flex items-center justify-center bg-white flex-shrink-0 relative overflow-hidden p-1 shadow-sm">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`http://localhost:3000/account/orders/${selectedOrder.id}?invoice=true`)}`}
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
                      href={`/account/orders/${selectedOrder.id}?invoice=true`}
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
