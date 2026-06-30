"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";
import { 
  Loader2, Shield, Search, RefreshCw, Check, X, Trash2,
  Building, User, Mail, Phone, FileText, MapPin, Clock
} from "lucide-react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface DistributorType {
  id: string;
  email: string;
  phoneNumber: string | null;
  firstName: string; // Contact Person
  lastName: string;   // Distributor Name
  companyName: string | null; // Business Name
  gstin: string | null;
  approvalStatus: string | null;
  createdAt: string;
  businessAddress: string;
}

export default function AdminDistributorsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [distributors, setDistributors] = useState<DistributorType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal details state
  const [selectedDistributor, setSelectedDistributor] = useState<DistributorType | null>(null);
  const [distributorOrders, setDistributorOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<any | null>(null);

  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">("dark");

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
      if (!isAuthenticated || !user || (user.role !== "admin" && user.role !== "superadmin" && user.role?.toUpperCase() !== "ADMIN")) {
        toast.error("Access Denied. Admins only.");
        router.push("/auth/login");
      }
    }
  }, [isAuthenticated, user, authLoading, router]);

  // Fetch distributors
  const fetchDistributors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const res = await fetch("http://localhost:5000/api/auth/admin/distributors", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.success) {
        setDistributors(data.distributors || []);
      } else {
        toast.error(data.message || "Failed to fetch distributors");
      }
    } catch (err) {
      console.error("Error fetching distributors:", err);
      toast.error("Failed to load distributors list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDistributors();
    }
  }, [isAuthenticated]);

  // Handle Approve/Reject
  const handleUpdateStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
    setActionLoading(id);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`http://localhost:5000/api/auth/admin/distributors/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Distributor successfully ${status.toLowerCase()}!`);
        // Update state locally to avoid full refetch
        setDistributors(prev => 
          prev.map(d => d.id === id ? { ...d, approvalStatus: status } : d)
        );
      } else {
        toast.error(data.message || "Failed to update distributor status");
      }
    } catch (err) {
      console.error("Error updating distributor status:", err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Delete
  const handleDeleteDistributor = async (id: string) => {
    if (!confirm("Are you sure you want to delete this distributor? This action cannot be undone and will delete all associated data.")) {
      return;
    }
    setActionLoading(id);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`http://localhost:5000/api/auth/admin/distributors/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Distributor successfully deleted!");
        // Update state locally
        setDistributors(prev => prev.filter(d => d.id !== id));
      } else {
        toast.error(data.message || "Failed to delete distributor");
      }
    } catch (err) {
      console.error("Error deleting distributor:", err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSelectDistributor = async (distributor: DistributorType) => {
    setSelectedDistributor(distributor);
    setLoadingOrders(true);
    setDistributorOrders([]);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch("http://localhost:5000/api/orders/all", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.orders) {
        // Filter orders by distributor user ID
        const filtered = data.orders.filter((o: any) => o.userId === distributor.id);
        setDistributorOrders(filtered);
      } else {
        toast.error("Failed to load distributor order history");
      }
    } catch (err) {
      console.error("Error fetching distributor orders:", err);
      toast.error("Failed to fetch order history");
    } finally {
      setLoadingOrders(false);
    }
  };

  const handlePrintInvoice = () => {
    const printContent = document.getElementById("invoice-print-container")?.innerHTML;
    if (printContent) {
      const windowPrint = window.open("", "", "left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0");
      if (windowPrint) {
        windowPrint.document.write(`
          <html>
            <head>
              <title>Tax Invoice - ${selectedInvoiceOrder?.invoice?.invoiceNumber || 'Invoice'}</title>
              <style>
                body { font-family: monospace; font-size: 11px; padding: 20px; color: #000; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px; }
                th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
                th { background-color: #f5f5f5; }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                .font-bold { font-weight: bold; }
                .border-none { border: none !important; }
                .w-full { width: 100%; }
                .flex { display: flex; }
                .justify-between { justify-content: space-between; }
                .gap-4 { gap: 16px; }
                .pb-4 { padding-bottom: 16px; }
                .border-b { border-bottom: 1px solid #ddd; }
                .mb-4 { margin-bottom: 16px; }
                .text-lg { font-size: 14px; }
                .grid { display: grid; }
                .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                .w-1\\/2 { width: 50%; }
                .w-1\\/3 { width: 33.333333%; }
                .text-neutral-500 { color: #6b7280; }
                .text-emerald-600 { color: #059669; }
                .text-base { font-size: 12px; }
                .mt-2 { margin-top: 8px; }
                .mt-8 { margin-top: 32px; }
                .pt-4 { padding-top: 16px; }
                .border-t-2 { border-top: 2px solid #000; }
                .text-\\[\\#D71920\\] { color: #d71920; }
                img { display: none; }
              </style>
            </head>
            <body>
              ${printContent}
              <script>
                window.onload = function() { window.print(); window.close(); }
              </script>
            </body>
          </html>
        `);
        windowPrint.document.close();
      }
    }
  };

  // Filter distributors by search query
  const filteredDistributors = useMemo(() => {
    return distributors.filter(d => {
      const query = searchQuery.toLowerCase();
      return (
        d.lastName.toLowerCase().includes(query) || // Distributor Name
        d.firstName.toLowerCase().includes(query) || // Contact Person
        (d.companyName && d.companyName.toLowerCase().includes(query)) || // Business Name
        d.email.toLowerCase().includes(query) ||
        (d.phoneNumber && d.phoneNumber.includes(query)) ||
        (d.gstin && d.gstin.toLowerCase().includes(query))
      );
    });
  }, [distributors, searchQuery]);

  const isDark = theme === "dark";

  if (authLoading) {
    return (
      <div className={cn(
        "min-h-screen flex flex-col items-center justify-center font-sans",
        isDark ? "bg-[#0d0d0d] text-white" : "bg-[#fafafa] text-slate-950"
      )}>
        <Loader2 className="w-10 h-10 text-[#D71920] animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen font-sans flex flex-col lg:flex-row transition-colors duration-300",
      isDark ? "bg-[#0d0d0d] text-white" : "bg-[#fafafa] text-slate-950"
    )}>
      {/* Sidebar */}
      <AdminSidebar currentPath="/admin/distributors" theme={theme} toggleTheme={toggleTheme} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 min-h-screen flex flex-col">
        
        {/* Page Header */}
        <header className={cn(
          "px-6 sm:px-8 py-5 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sticky top-0 z-30 backdrop-blur-md bg-opacity-95 transition-colors duration-300",
          isDark ? "bg-[#0d0d0d]/95 border-neutral-800" : "bg-white/95 border-neutral-200"
        )}>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              <Shield className="text-[#D71920]" size={22} />
              <span>Distributor Applications</span>
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Review, approve, or reject wholesale distributor registrations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchDistributors}
              disabled={loading}
              className={cn(
                "p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer disabled:opacity-50",
                isDark ? "border-neutral-850 bg-neutral-900/50 hover:bg-neutral-900 hover:text-white" : "border-neutral-200 bg-white hover:bg-neutral-50 hover:text-slate-900"
              )}
            >
              <RefreshCw size={16} className={cn(loading && "animate-spin")} />
            </button>
          </div>
        </header>

        {/* Content Panel */}
        <div className="p-6 sm:p-8 flex-1 flex flex-col gap-6">
          
          {/* Search & Statistics */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by distributor name, contact, email, or GSTIN..."
                className={cn(
                  "w-full pl-11 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 focus:border-[#D71920]",
                  isDark 
                    ? "bg-neutral-900/40 border-neutral-800 text-white placeholder-neutral-500" 
                    : "bg-white border-neutral-300 text-slate-950 placeholder-neutral-400"
                )}
              />
            </div>

            {/* Statistics Badges */}
            <div className="flex gap-3 text-xs font-bold self-start sm:self-auto">
              <span className={cn(
                "px-3 py-1.5 rounded-lg border",
                isDark ? "bg-neutral-900/40 border-neutral-800 text-neutral-400" : "bg-neutral-50 border-neutral-200 text-neutral-600"
              )}>
                Total: {distributors.length}
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400">
                Pending: {distributors.filter(d => d.approvalStatus === "PENDING" || !d.approvalStatus).length}
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400">
                Approved: {distributors.filter(d => d.approvalStatus === "APPROVED").length}
              </span>
            </div>
          </div>

          {/* Distributors Table */}
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-neutral-500">
              <Loader2 className="w-10 h-10 animate-spin text-[#D71920] mb-3" />
              <p className="text-sm font-semibold">Loading distributor data...</p>
            </div>
          ) : filteredDistributors.length === 0 ? (
            <div className={cn(
              "flex-1 flex flex-col items-center justify-center text-center py-20 rounded-2xl border-2 border-dashed",
              isDark ? "border-neutral-850" : "border-neutral-200"
            )}>
              <Building size={40} className="text-neutral-400 mb-3" />
              <h3 className="text-base font-bold">No distributors found</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-[300px]">
                {searchQuery ? "No results match your search criteria. Try a different query." : "No distributor registrations have been made yet."}
              </p>
            </div>
          ) : (
            <div className={cn(
              "border rounded-2xl overflow-hidden transition-all duration-300 shadow-sm",
              isDark ? "border-neutral-800 bg-neutral-900/10" : "border-neutral-200 bg-white"
            )}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className={cn(
                      "border-b text-[10px] font-extrabold uppercase tracking-wider text-neutral-500",
                      isDark ? "border-neutral-800 bg-neutral-900/50" : "border-neutral-200 bg-neutral-50/50"
                    )}>
                      <th className="py-3.5 px-4">Distributor & Contact</th>
                      <th className="py-3.5 px-4">Business & GSTIN</th>
                      <th className="py-3.5 px-4">Business Address</th>
                      <th className="py-3.5 px-4">Applied Date</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={cn(
                    "divide-y text-sm",
                    isDark ? "divide-neutral-800" : "divide-neutral-200"
                  )}>
                    {filteredDistributors.map((d) => {
                      const status = d.approvalStatus?.toUpperCase() || "PENDING";
                      const isPending = status === "PENDING";
                      const isApproved = status === "APPROVED";
                      const isRejected = status === "REJECTED";

                      return (
                        <tr 
                          key={d.id} 
                          onClick={() => handleSelectDistributor(d)}
                          className={cn(
                            "transition-colors cursor-pointer",
                            isDark ? "hover:bg-neutral-900/50" : "hover:bg-neutral-50"
                          )}
                        >
                          {/* Name & Contact */}
                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-1">
                              <h4 className="font-bold">{d.lastName}</h4> {/* Distributor Name */}
                              <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                                <User size={12} />
                                <span>{d.firstName}</span> {/* Contact Person */}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                                <Mail size={12} />
                                <span className="truncate max-w-[180px]">{d.email}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                                <Phone size={12} />
                                <span>{d.phoneNumber || "N/A"}</span>
                              </div>
                            </div>
                          </td>

                          {/* Business & GSTIN */}
                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-1.5 text-sm font-semibold">
                                <Building size={14} className="text-[#D71920] shrink-0" />
                                <span>{d.companyName || "N/A"}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-500">
                                <FileText size={12} className="shrink-0" />
                                <span>{d.gstin || "No GSTIN"}</span>
                              </div>
                            </div>
                          </td>

                          {/* Address */}
                          <td className="py-4 px-4 max-w-[220px]">
                            <div className="flex items-start gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 leading-normal line-clamp-3">
                              <MapPin size={12} className="shrink-0 mt-0.5" />
                              <span>{d.businessAddress}</span>
                            </div>
                          </td>

                          {/* Date */}
                          <td className="py-4 px-4 text-xs text-neutral-600 dark:text-neutral-400">
                            <div className="flex items-center gap-1.5">
                              <Clock size={12} />
                              <span>
                                {new Date(d.createdAt).toLocaleDateString("en-IN", {
                                  day: "2-digit", month: "short", year: "numeric"
                                })}
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4 text-center">
                            <span className={cn(
                              "inline-block text-[9px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full",
                              isApproved ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" :
                              isRejected ? "bg-red-500/15 text-red-600 dark:text-red-400" :
                              "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            )}>
                              {status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-center gap-2">
                              {isPending ? (
                                <>
                                  {/* Approve Button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateStatus(d.id, "APPROVED");
                                    }}
                                    disabled={actionLoading !== null}
                                    title="Approve Distributor"
                                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer border border-emerald-500/30 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:scale-105 active:scale-95"
                                  >
                                    {actionLoading === d.id ? (
                                      <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                      <Check size={14} />
                                    )}
                                  </button>

                                  {/* Reject Button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateStatus(d.id, "REJECTED");
                                    }}
                                    disabled={actionLoading !== null}
                                    title="Reject Distributor"
                                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer border border-red-500/30 hover:bg-red-500/15 text-red-600 dark:text-red-400 hover:scale-105 active:scale-95"
                                  >
                                    {actionLoading === d.id ? (
                                      <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                      <X size={14} />
                                    )}
                                  </button>
                                </>
                              ) : (
                                /* Delete Button (only for Approved or Rejected) */
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteDistributor(d.id);
                                  }}
                                  disabled={actionLoading !== null}
                                  title="Delete Distributor"
                                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer border border-red-500/30 hover:bg-red-500/15 text-red-600 dark:text-red-400 hover:scale-105 active:scale-95 disabled:opacity-50"
                                >
                                  {actionLoading === d.id ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <Trash2 size={14} />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Details Modal */}
          {selectedDistributor && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
              <div className={cn(
                "w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border transition-colors",
                isDark ? "bg-[#0f0f10] border-neutral-800 text-white" : "bg-white border-neutral-200 text-slate-900"
              )}>
                {/* Modal Header */}
                <div className={cn(
                  "p-5 border-b flex justify-between items-center",
                  isDark ? "border-neutral-800 bg-neutral-900/40" : "border-neutral-200 bg-neutral-50/40"
                )}>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-wider flex items-center gap-2">
                      <Building className="text-[#D71920]" size={18} />
                      <span>{selectedDistributor.companyName || "Distributor Profile"}</span>
                    </h3>
                    <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold mt-0.5">
                      Distributor Details &amp; History
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedDistributor(null)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-655 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Modal Content - Scrollable */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
                  
                  {/* Info Blocks Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* General & Contact */}
                    <div className={cn(
                      "p-4 rounded-xl border space-y-3",
                      isDark ? "bg-neutral-900/25 border-neutral-850" : "bg-neutral-50/50 border-neutral-200"
                    )}>
                      <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400 border-b pb-2">
                        Contact Details
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-neutral-400 block">Contact Person</span>
                          <span className="font-bold">{selectedDistributor.firstName}</span>
                        </div>
                        <div>
                          <span className="text-neutral-400 block">Distributor Name</span>
                          <span className="font-bold">{selectedDistributor.lastName}</span>
                        </div>
                        <div>
                          <span className="text-neutral-400 block">Email Address</span>
                          <span className="font-bold">{selectedDistributor.email}</span>
                        </div>
                        <div>
                          <span className="text-neutral-400 block">Mobile Number</span>
                          <span className="font-bold font-mono">{selectedDistributor.phoneNumber || "N/A"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Business Registration */}
                    <div className={cn(
                      "p-4 rounded-xl border space-y-3",
                      isDark ? "bg-neutral-900/25 border-neutral-850" : "bg-neutral-50/50 border-neutral-200"
                    )}>
                      <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400 border-b pb-2">
                        Business Details
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-neutral-400 block">Company Name</span>
                          <span className="font-bold text-sm text-[#D71920]">{selectedDistributor.companyName || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-neutral-400 block">GSTIN</span>
                          <span className="font-bold font-mono text-sm">{selectedDistributor.gstin || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-neutral-400 block">Status</span>
                          <span className={cn(
                            "inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full mt-1",
                            selectedDistributor.approvalStatus === "APPROVED" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" :
                            selectedDistributor.approvalStatus === "REJECTED" ? "bg-red-500/15 text-red-600 dark:text-red-400" :
                            "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          )}>
                            {selectedDistributor.approvalStatus || "PENDING"}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-400 block">Applied Date</span>
                          <span className="font-bold">{new Date(selectedDistributor.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Address Detail */}
                    <div className={cn(
                      "p-4 rounded-xl border space-y-3",
                      isDark ? "bg-neutral-900/25 border-neutral-850" : "bg-neutral-50/50 border-neutral-200"
                    )}>
                      <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400 border-b pb-2">
                        Business Address
                      </h4>
                      <div className="text-xs space-y-2">
                        <div className="flex items-start gap-1.5 leading-relaxed text-neutral-600 dark:text-neutral-400">
                          <MapPin size={14} className="shrink-0 text-neutral-400 mt-0.5" />
                          <span className="font-semibold">{selectedDistributor.businessAddress || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Orders Detail Section */}
                  <div className="space-y-3.5">
                    <h4 className="text-sm font-black uppercase tracking-wider text-neutral-850 dark:text-neutral-200 flex items-center gap-2">
                      <Clock size={16} className="text-[#D71920]" />
                      <span>Order History ({distributorOrders.length})</span>
                    </h4>
                    
                    {loadingOrders ? (
                      <div className="flex flex-col items-center justify-center py-10 text-neutral-500">
                        <Loader2 className="w-8 h-8 animate-spin text-[#D71920] mb-2" />
                        <p className="text-xs font-semibold">Fetching distributor orders...</p>
                      </div>
                    ) : distributorOrders.length === 0 ? (
                      <div className={cn(
                        "p-8 rounded-xl border border-dashed text-center text-neutral-500",
                        isDark ? "border-neutral-850" : "border-neutral-200"
                      )}>
                        <p className="text-xs font-semibold">No orders placed by this distributor yet.</p>
                      </div>
                    ) : (
                      <div className={cn(
                        "border rounded-xl overflow-hidden shadow-sm",
                        isDark ? "border-neutral-800 bg-neutral-900/10" : "border-neutral-200 bg-white"
                      )}>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className={cn(
                                "border-b text-[10px] font-extrabold uppercase tracking-wider text-neutral-500",
                                isDark ? "border-neutral-800 bg-neutral-900/50" : "border-neutral-200 bg-neutral-50/50"
                              )}>
                                <th className="py-2.5 px-3">Order Number</th>
                                <th className="py-2.5 px-3">Date</th>
                                <th className="py-2.5 px-3">Total Amount</th>
                                <th className="py-2.5 px-3 text-center">Payment Status</th>
                                <th className="py-2.5 px-3 text-center">Order Status</th>
                                <th className="py-2.5 px-3 text-center">Invoice</th>
                              </tr>
                            </thead>
                            <tbody className={cn(
                              "divide-y",
                              isDark ? "divide-neutral-800" : "divide-neutral-200"
                            )}>
                              {distributorOrders.map((order) => (
                                <tr key={order.id} className={cn(
                                  "hover:bg-neutral-50/55 dark:hover:bg-neutral-900/20"
                                )}>
                                  <td className="py-3 px-3 font-bold">{order.orderNumber}</td>
                                  <td className="py-3 px-3">
                                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                      day: "2-digit", month: "short", year: "numeric"
                                    })}
                                  </td>
                                  <td className="py-3 px-3 font-bold text-[#D71920]">
                                    ₹{order.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <span className={cn(
                                      "inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                                      order.paymentStatus === "PAID" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-red-500/15 text-red-600 dark:text-red-400"
                                    )}>
                                      {order.paymentStatus}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <span className={cn(
                                      "inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                                      order.status === "DELIVERED" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                    )}>
                                      {order.status.replace("_", " ")}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    {order.invoice ? (
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedInvoiceOrder(order);
                                        }}
                                        className="text-[#D71920] hover:underline font-bold cursor-pointer bg-transparent border-0 outline-none"
                                      >
                                        View Invoice
                                      </button>
                                    ) : (
                                      <span className="text-neutral-450 italic">Pending approval</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className={cn(
                  "p-4 border-t flex justify-end gap-3",
                  isDark ? "border-neutral-800 bg-neutral-900/40" : "border-neutral-200 bg-neutral-50/40"
                )}>
                  {selectedDistributor.approvalStatus === "PENDING" && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateStatus(selectedDistributor.id, "REJECTED");
                          setSelectedDistributor(null);
                        }}
                        className="px-4 py-2 border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Reject Application
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateStatus(selectedDistributor.id, "APPROVED");
                          setSelectedDistributor(null);
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
                      >
                        Approve Distributor
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setSelectedDistributor(null)}
                    className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-100 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* GST TAX INVOICE POPUP MODAL */}
          {selectedInvoiceOrder && selectedInvoiceOrder.invoice && (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
              <div className={cn(
                "w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border transition-colors bg-white text-neutral-900"
              )}>
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-neutral-50 border-neutral-200">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-neutral-850 flex items-center gap-1.5">
                      <FileText size={16} className="text-[#D71920]" />
                      <span>Invoice #: {selectedInvoiceOrder.invoice.invoiceNumber}</span>
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrintInvoice}
                      className="px-3 py-1.5 bg-[#D71920] hover:bg-[#B91520] text-white text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                    >
                      Print Invoice
                    </button>
                    <button 
                      onClick={() => setSelectedInvoiceOrder(null)}
                      className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Printable Invoice Container */}
                <div className="p-8 overflow-y-auto flex-1 font-mono text-[11px] text-left leading-relaxed space-y-6" id="invoice-print-container">
                  {/* Top Header details */}
                  <div className="flex justify-between items-start pb-4 border-b border-neutral-200">
                    <div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/sd-smart-ecommerce/SD-logo.png"
                        alt="SD Smart Appliances"
                        className="h-10 w-auto object-contain mix-blend-multiply"
                      />
                      <p className="font-bold mt-2">SD SMART APPLIANCES</p>
                      <p className="text-neutral-500">No. 12, Kamarajar Street, Peelamedu,</p>
                      <p className="text-neutral-500">Coimbatore, Tamil Nadu - 641004</p>
                      <p className="text-neutral-500 font-bold">GSTIN: 33AAACD1234F1Z0</p>
                    </div>
                    <div className="text-right">
                      <h2 className="text-base font-black text-[#D71920] uppercase tracking-wide">Tax Invoice</h2>
                      <p className="font-bold mt-2">Invoice #: {selectedInvoiceOrder.invoice.invoiceNumber}</p>
                      <p className="text-neutral-500">Invoice Date: {new Date(selectedInvoiceOrder.invoice.invoiceDate).toLocaleDateString("en-IN")}</p>
                      <p className="font-bold mt-1">Order ID: {selectedInvoiceOrder.orderNumber}</p>
                      <p className="text-neutral-500">Order Date: {new Date(selectedInvoiceOrder.createdAt).toLocaleDateString("en-IN")}</p>
                      <p className="text-neutral-500">Payment: {selectedInvoiceOrder.paymentMethod} ({selectedInvoiceOrder.paymentStatus})</p>
                    </div>
                  </div>

                  {/* Addresses */}
                  <div className="grid grid-cols-2 gap-4 pb-4 border-b border-neutral-200">
                    <div>
                      <h4 className="font-bold uppercase text-neutral-400 mb-1">Details of Receiver (Billed To):</h4>
                      <p className="font-bold text-sm text-[#D71920]">{selectedDistributor?.companyName || "N/A"}</p>
                      <p className="font-bold">{selectedDistributor?.firstName} {selectedDistributor?.lastName}</p>
                      <p className="text-neutral-500 leading-normal">{selectedDistributor?.businessAddress}</p>
                      <p className="text-neutral-500">Phone: {selectedDistributor?.phoneNumber || "N/A"}</p>
                      <p className="font-bold mt-1">GSTIN: {selectedDistributor?.gstin || "N/A"}</p>
                    </div>
                    <div className="text-right">
                      <h4 className="font-bold uppercase text-neutral-450 mb-1">Shipping Details:</h4>
                      <p className="font-bold text-sm">{selectedInvoiceOrder.address?.fullName || selectedDistributor?.companyName}</p>
                      <p className="text-neutral-500 leading-normal">
                        {selectedInvoiceOrder.address?.addressLine1}
                        {selectedInvoiceOrder.address?.addressLine2 && `, ${selectedInvoiceOrder.address.addressLine2}`}
                        <br />
                        {selectedInvoiceOrder.address?.city}, {selectedInvoiceOrder.address?.state} - {selectedInvoiceOrder.address?.pincode}
                      </p>
                      <p className="text-neutral-500">Contact: {selectedInvoiceOrder.address?.mobileNumber}</p>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div>
                    <table className="w-full border border-neutral-200">
                      <thead>
                        <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-600">
                          <th className="p-2 border-r border-neutral-200 text-center w-8">#</th>
                          <th className="p-2 border-r border-neutral-200">Description</th>
                          <th className="p-2 border-r border-neutral-200 text-center">HSN/SKU</th>
                          <th className="p-2 border-r border-neutral-200 text-center w-12">Qty</th>
                          <th className="p-2 border-r border-neutral-200 text-right">Rate</th>
                          <th className="p-2 border-r border-neutral-200 text-right">Taxable</th>
                          <th className="p-2 border-r border-neutral-200 text-center w-16">GST %</th>
                          <th className="p-2 border-r border-neutral-200 text-right">Tax Amt</th>
                          <th className="p-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoiceOrder.items.map((item: any, idx: number) => {
                          const product = item.product || {};
                          const qty = item.quantity;
                          const rate = item.unitPrice;
                          const taxable = qty * rate;
                          const gstPercent = 18;
                          const taxAmt = taxable * (gstPercent / 100);
                          const total = taxable + taxAmt;
                          return (
                            <tr key={item.id} className="border-b border-neutral-200">
                              <td className="p-2 border-r border-neutral-200 text-center">{idx + 1}</td>
                              <td className="p-2 border-r border-neutral-200">
                                <p className="font-bold">{product.name || "Appliance Item"}</p>
                                <p className="text-[10px] text-neutral-500">{product.modelNumber}</p>
                              </td>
                              <td className="p-2 border-r border-neutral-200 text-center font-mono">{product.sku || "N/A"}</td>
                              <td className="p-2 border-r border-neutral-200 text-center">{qty}</td>
                              <td className="p-2 border-r border-neutral-200 text-right">₹{rate.toFixed(2)}</td>
                              <td className="p-2 border-r border-neutral-200 text-right">₹{taxable.toFixed(2)}</td>
                              <td className="p-2 border-r border-neutral-200 text-center">{gstPercent}%</td>
                              <td className="p-2 border-r border-neutral-200 text-right">₹{taxAmt.toFixed(2)}</td>
                              <td className="p-2 text-right font-bold">₹{total.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Box */}
                  <div className="flex justify-between items-start">
                    <div className="w-1/2 text-neutral-500 text-[10px]">
                      <p className="font-bold uppercase mb-1">Declaration:</p>
                      <p>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
                      <div className="mt-8 border-t border-neutral-200 pt-4 w-40">
                        <p className="font-bold text-center">Authorized Signatory</p>
                      </div>
                    </div>
                    <div className="w-1/3 space-y-1.5 text-right font-bold">
                      <div className="flex justify-between text-neutral-500">
                        <span>Subtotal:</span>
                        <span>₹{selectedInvoiceOrder.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-neutral-500">
                        <span>CGST (9%):</span>
                        <span>₹{selectedInvoiceOrder.cgst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-neutral-500">
                        <span>SGST (9%):</span>
                        <span>₹{selectedInvoiceOrder.sgst.toFixed(2)}</span>
                      </div>
                      {selectedInvoiceOrder.igst > 0 && (
                        <div className="flex justify-between text-neutral-500">
                          <span>IGST (18%):</span>
                          <span>₹{selectedInvoiceOrder.igst.toFixed(2)}</span>
                        </div>
                      )}
                      {selectedInvoiceOrder.discount > 0 && (
                        <div className="flex justify-between text-emerald-600">
                          <span>Discount:</span>
                          <span>-₹{selectedInvoiceOrder.discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-neutral-500">
                        <span>Shipping:</span>
                        <span>₹{selectedInvoiceOrder.deliveryCharges.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-base border-t-2 border-neutral-900 pt-2 text-[#D71920]">
                        <span>Grand Total:</span>
                        <span>₹{selectedInvoiceOrder.grandTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t flex justify-end bg-neutral-50 border-neutral-200">
                  <button
                    onClick={() => setSelectedInvoiceOrder(null)}
                    className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-855 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-colors"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
