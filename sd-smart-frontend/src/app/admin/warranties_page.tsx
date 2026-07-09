"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";
import {
  Loader2, Search, Calendar, FileText, MapPin, Phone,
  CheckCircle, Clock, Eye, Download, Info, AlertCircle, ChevronDown,
  X, Check, ShieldCheck, User, ShieldAlert, FileSpreadsheet, ImageIcon, AlertTriangle, Package
} from "lucide-react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { cn } from "@/lib/utils";
import { warrantyService } from "@/services/warrantyService";

type TabType = "ALL" | "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED" | "EXPIRED";

export default function AdminWarrantiesPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // Theme & State
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("admin-theme") as "light" | "dark") || "dark";
    }
    return "dark";
  });
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Drawer / Modal state
  const [selectedReg, setSelectedReg] = useState<any | null>(null);
  const [actionRemarks, setActionRemarks] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Sync theme
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

  // Fetch registrations
  const fetchRegistrations = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await warrantyService.getWarrantyRegistrations();
      if (res.success) {
        setRegistrations(res.data || []);
        
        // Sync selected detail view if already open
        setSelectedReg((prev: any) => {
          if (!prev) return null;
          const updated = res.data?.find((r: any) => r.id === prev.id);
          return updated || null;
        });
      } else {
        toast.error(res.message || "Failed to load warranty registrations");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to connect to API");
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchRegistrations();
    }
  }, [isAuthenticated, user]);

  // Update Status
  const handleUpdateStatus = async (id: string, newStatus: TabType) => {
    if (newStatus === "REJECTED" && !actionRemarks.trim()) {
      toast.warning("Please enter remarks/reason for rejection");
      return;
    }

    setUpdatingStatus(true);
    try {
      const res = await warrantyService.updateWarrantyRegistrationStatus(id, {
        status: newStatus,
        remarks: actionRemarks.trim() || undefined
      });

      if (res.success) {
        toast.success(`Registration status updated to ${newStatus.replace("_", " ")}`);
        setActionRemarks("");
        await fetchRegistrations(true);
      } else {
        toast.error(res.message || "Failed to update status");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("API error while updating status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (registrations.length === 0) {
      toast.info("No records to export.");
      return;
    }

    const headers = [
      "Registration ID", "Customer Name", "Email", "Phone", "Alt Phone",
      "Category", "Product Name", "Model Number", "Serial Number", "SKU",
      "Capacity", "Purchase Date", "Invoice Number", "Dealer Name",
      "Place of Purchase", "Start Date", "Expiry Date", "Status", "Rejection Reason"
    ];

    const rows = registrations.map((reg) => [
      reg.registrationId,
      reg.customerName,
      reg.customerEmail,
      reg.customerPhone,
      reg.customerAltPhone || "",
      reg.productCategory,
      reg.productName,
      reg.modelNumber,
      reg.serialNumber,
      reg.skuCode || "",
      reg.productCapacity || "",
      new Date(reg.purchaseDate).toLocaleDateString("en-IN"),
      reg.invoiceNumber,
      reg.dealerName,
      reg.placeOfPurchase,
      new Date(reg.warrantyStartDate).toLocaleDateString("en-IN"),
      new Date(reg.warrantyExpiryDate).toLocaleDateString("en-IN"),
      reg.status,
      reg.rejectionReason || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `warranty_registrations_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exported successfully.");
  };

  // Filter logic
  const filteredRegs = registrations.filter((reg) => {
    const matchesTab = activeTab === "ALL" || reg.status === activeTab;
    
    if (!matchesTab) return false;

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      return (
        reg.registrationId?.toLowerCase().includes(q) ||
        reg.customerName?.toLowerCase().includes(q) ||
        reg.customerEmail?.toLowerCase().includes(q) ||
        reg.customerPhone?.toLowerCase().includes(q) ||
        reg.serialNumber?.toLowerCase().includes(q) ||
        reg.invoiceNumber?.toLowerCase().includes(q) ||
        reg.productName?.toLowerCase().includes(q)
      );
    }

    return true;
  });

  // Metric computations
  const totalCount = registrations.length;
  const pendingCount = registrations.filter((r) => r.status === "PENDING_VERIFICATION").length;
  const verifiedCount = registrations.filter((r) => r.status === "VERIFIED").length;
  const rejectedCount = registrations.filter((r) => r.status === "REJECTED").length;

  const isDark = theme === "dark";

  return (
    <div className={cn(
      "min-h-screen flex flex-col lg:flex-row transition-colors duration-300 font-sans selection:bg-[#D71920]/30 selection:text-white",
      isDark ? "dark bg-[#0d0d0d] text-white" : "bg-[#fafafa] text-slate-900"
    )}>
      <AdminSidebar currentPath="/admin/warranties" theme={theme} toggleTheme={toggleTheme} />

      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen min-w-0">
        {/* Header bar */}
        <header className={cn(
          "px-6 py-6 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors duration-300",
          isDark ? "border-neutral-800 bg-[#0d0d0d]/80" : "border-neutral-200 bg-white"
        )}>
          <div>
            <h1 className="text-xl md:text-2xl font-black font-heading tracking-tight flex items-center gap-2">
              <ShieldCheck className="text-[#D71920]" />
              Warranty Registrations
            </h1>
            <p className={cn("text-xs mt-0.5", isDark ? "text-neutral-500" : "text-neutral-400")}>
              Review, verify, and manage customer product warranty registrations.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className={cn(
              "px-4 py-2 border rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto",
              isDark
                ? "bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            <FileSpreadsheet size={14} />
            Export CSV
          </button>
        </header>

        {/* Dashboard Content */}
        <main className="flex-grow p-6 space-y-6">
          {/* Key Metrics row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={cn("p-4 border rounded-2xl shadow-sm", isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-200")}>
              <span className="text-3xs font-bold text-neutral-400 uppercase tracking-widest block mb-1">Total Submissions</span>
              <span className="text-xl md:text-2xl font-black font-heading">{totalCount}</span>
            </div>
            <div className={cn("p-4 border rounded-2xl shadow-sm", isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-200")}>
              <span className="text-3xs font-bold text-amber-500 uppercase tracking-widest block mb-1">Pending Audit</span>
              <span className="text-xl md:text-2xl font-black font-heading text-amber-500">{pendingCount}</span>
            </div>
            <div className={cn("p-4 border rounded-2xl shadow-sm", isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-200")}>
              <span className="text-3xs font-bold text-green-500 uppercase tracking-widest block mb-1">Verified</span>
              <span className="text-xl md:text-2xl font-black font-heading text-green-500">{verifiedCount}</span>
            </div>
            <div className={cn("p-4 border rounded-2xl shadow-sm", isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-200")}>
              <span className="text-3xs font-bold text-red-500 uppercase tracking-widest block mb-1">Rejected</span>
              <span className="text-xl md:text-2xl font-black font-heading text-red-500">{rejectedCount}</span>
            </div>
          </div>

          {/* Table Container */}
          <div className={cn("border rounded-2xl shadow-sm overflow-hidden flex flex-col", isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-200")}>
            {/* Search and Filters Bar */}
            <div className={cn("p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4", isDark ? "border-neutral-800 bg-neutral-900/40" : "border-slate-200 bg-slate-50/50")}>
              {/* Tabs */}
              <div className="flex flex-wrap gap-1.5 border-b md:border-b-0 pb-3 md:pb-0">
                {(["ALL", "PENDING_VERIFICATION", "VERIFIED", "REJECTED", "EXPIRED"] as TabType[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap",
                      activeTab === tab
                        ? "bg-[#D71920] text-white"
                        : isDark
                          ? "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850"
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                    )}
                  >
                    {tab.replace("_", " ")}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative max-w-xs w-full">
                <Search className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4", isDark ? "text-neutral-450" : "text-slate-400")} />
                <input
                  type="text"
                  placeholder="Search ID, customer, serial, invoice..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "w-full pl-10 pr-4 py-2 text-xs border rounded-xl outline-none transition-all",
                    isDark
                      ? "bg-neutral-950 border-neutral-800 text-white focus:border-[#D71920]"
                      : "bg-white border-slate-200 text-slate-800 focus:border-[#D71920]"
                  )}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-neutral-400 hover:text-white">
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* List Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-[#D71920] animate-spin" />
                  <span className="text-xs text-neutral-400">Loading warranty database records...</span>
                </div>
              ) : filteredRegs.length === 0 ? (
                <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-amber-500" />
                  <span className="text-xs text-neutral-400">No warranty registrations found.</span>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={cn("text-3xs font-extrabold uppercase tracking-wider border-b", isDark ? "border-neutral-800 bg-neutral-950/20 text-neutral-400" : "border-slate-200 bg-slate-50 text-slate-500")}>
                      <th className="px-6 py-4">ID / Date</th>
                      <th className="px-6 py-4">Customer Details</th>
                      <th className="px-6 py-4">Appliance Info</th>
                      <th className="px-6 py-4">Purchase Details</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={cn("divide-y text-xs", isDark ? "divide-neutral-800" : "divide-slate-200")}>
                    {filteredRegs.map((reg) => (
                      <tr key={reg.id} className={cn("hover:bg-slate-50/5 transition-colors", isDark ? "hover:bg-neutral-850" : "hover:bg-slate-50")}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-bold text-slate-900 dark:text-slate-100 block">{reg.registrationId}</span>
                          <span className="text-3xs text-neutral-400 block mt-0.5">
                            {new Date(reg.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold block">{reg.customerName}</span>
                          <span className="text-neutral-400 text-3xs block mt-0.5">{reg.customerEmail}</span>
                          <span className="text-neutral-400 text-3xs block mt-0.5">{reg.customerPhone}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold block text-slate-900 dark:text-slate-100">{reg.productName}</span>
                          <span className="text-neutral-400 text-3xs block mt-0.5">Serial: {reg.serialNumber}</span>
                          <span className="text-neutral-400 text-3xs block mt-0.5">Model: {reg.modelNumber}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold block">Inv: {reg.invoiceNumber}</span>
                          <span className="text-neutral-400 text-3xs block mt-0.5">
                            Dealer: {reg.dealerName} ({reg.placeOfPurchase})
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 text-3xs font-extrabold rounded-full uppercase tracking-wider",
                            reg.status === "VERIFIED" && "bg-green-500/10 text-green-500",
                            reg.status === "PENDING_VERIFICATION" && "bg-amber-500/10 text-amber-500",
                            reg.status === "REJECTED" && "bg-red-500/10 text-red-500",
                            reg.status === "EXPIRED" && "bg-neutral-500/20 text-neutral-400"
                          )}>
                            {reg.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedReg(reg)}
                            className={cn(
                              "p-1.5 border rounded-lg transition-all hover:bg-[#D71920] hover:text-white cursor-pointer inline-flex items-center gap-1 text-2xs font-semibold",
                              isDark ? "border-neutral-800 bg-neutral-900 text-neutral-450" : "border-slate-200 bg-white text-slate-600"
                            )}
                          >
                            <Eye size={12} />
                            View Audit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* DETAIL DRAWER / MODAL */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          {/* Overlay click to close */}
          <div className="absolute inset-0 -z-10" onClick={() => { setSelectedReg(null); setActionRemarks(""); }} />

          <div className={cn(
            "w-full max-w-lg h-full overflow-y-auto flex flex-col p-6 shadow-2xl animate-in slide-in-from-right duration-300 text-left",
            isDark ? "bg-neutral-900 border-l border-neutral-800 text-white" : "bg-white border-l border-slate-200 text-slate-900"
          )}>
            {/* Header */}
            <div className={cn("flex items-center justify-between border-b pb-4 mb-6", isDark ? "border-neutral-850" : "border-slate-200")}>
              <div>
                <span className="text-3xs font-extrabold text-[#D71920] uppercase tracking-wider">REGISTRATION TICKET</span>
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">{selectedReg.registrationId}</h2>
              </div>
              <button
                onClick={() => { setSelectedReg(null); setActionRemarks(""); }}
                className={cn("p-1.5 border rounded-lg cursor-pointer", isDark ? "border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800" : "border-slate-200 hover:bg-slate-50")}
              >
                <X size={16} />
              </button>
            </div>

            {/* Content info blocks */}
            <div className="space-y-6 flex-grow">
              {/* Customer information */}
              <div className={cn("p-4 border rounded-xl", isDark ? "bg-neutral-950/40 border-neutral-800" : "bg-slate-50 border-slate-200/50")}>
                <h3 className="text-3xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <User size={12} /> Customer Information
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Full Name</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{selectedReg.customerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Email</span>
                    <span className="font-semibold block truncate">{selectedReg.customerEmail}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Mobile Phone</span>
                    <span className="font-semibold">{selectedReg.customerPhone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Alt Contact</span>
                    <span className="font-semibold">{selectedReg.customerAltPhone || "N/A"}</span>
                  </div>
                  <div className={cn("col-span-2 border-t pt-2 mt-1", isDark ? "border-neutral-800" : "border-slate-250/20")}>
                    <span className="text-slate-400 block mb-0.5">Address</span>
                    <p className="font-semibold leading-relaxed">
                      {selectedReg.addressLine1}
                      {selectedReg.addressLine2 && `, ${selectedReg.addressLine2}`}
                      <br />
                      {selectedReg.city}, {selectedReg.state} - {selectedReg.pincode}
                    </p>
                  </div>
                </div>
              </div>

              {/* Product and Purchase Details */}
              <div className={cn("p-4 border rounded-xl", isDark ? "bg-neutral-950/40 border-neutral-800" : "bg-slate-50 border-slate-200/50")}>
                <h3 className="text-3xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Package size={12} /> Product & Purchase Details
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Product Name</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{selectedReg.productName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Category</span>
                    <span className="font-semibold">{selectedReg.productCategory}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Model Number</span>
                    <span className="font-semibold">{selectedReg.modelNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Serial Code</span>
                    <span className="font-bold text-indigo-550">{selectedReg.serialNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Invoice Number</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedReg.invoiceNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Purchase Date</span>
                    <span className="font-semibold">{new Date(selectedReg.purchaseDate).toLocaleDateString("en-IN")}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Dealer Store</span>
                    <span className="font-semibold">{selectedReg.dealerName} ({selectedReg.placeOfPurchase})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Capacity / Variant</span>
                    <span className="font-semibold">{selectedReg.productCapacity || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Warranty Auto calculations display */}
              <div className="bg-red-50/25 border border-red-900/10 rounded-xl p-4 text-xs dark:bg-red-950/10 dark:border-red-900/30">
                <h4 className="text-3xs font-extrabold text-red-500 uppercase tracking-widest mb-2">Calculated Expiry Dates</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block">Warranty Activated</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {new Date(selectedReg.warrantyStartDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Warranty Expiry</span>
                    <span className="font-bold text-green-650 dark:text-green-400">
                      {new Date(selectedReg.warrantyExpiryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Document Uploads Preview */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b pb-1.5 mb-3">Uploaded Attachments</h3>
                {selectedReg.attachments && selectedReg.attachments.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs">
                    {selectedReg.attachments.map((att: any) => (
                      <a
                        key={att.id}
                        href={att.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(
                          "p-2.5 border rounded-lg flex items-center justify-between hover:border-[#D71920] group transition-all",
                          isDark ? "bg-neutral-950/60 border-neutral-800 text-neutral-300" : "bg-slate-50 border-slate-200 text-slate-700"
                        )}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          {att.fileType === "PRODUCT_IMAGE" ? (
                            <ImageIcon className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <FileText className="w-4 h-4 text-red-550" />
                          )}
                          <span className="truncate max-w-[120px] font-semibold">{att.fileName}</span>
                        </div>
                        <Download size={12} className="text-slate-400 group-hover:text-[#D71920] transition-colors shrink-0" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs italic text-slate-500">No proof documents attached.</p>
                )}
              </div>

              {/* Display rejection reason if rejected */}
              {selectedReg.status === "REJECTED" && (
                <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 text-xs dark:bg-red-950/20 dark:border-red-900/40">
                  <h4 className="font-extrabold text-red-500 uppercase tracking-widest mb-1">Rejection Reason Remarks</h4>
                  <p className="text-slate-600 dark:text-slate-450 leading-relaxed font-semibold">{selectedReg.rejectionReason}</p>
                </div>
              )}
            </div>

            {/* Actions verification drawer panel */}
            {selectedReg.status === "PENDING_VERIFICATION" && (
              <div className={cn("border-t pt-6 mt-6 space-y-4", isDark ? "border-neutral-850" : "border-slate-200")}>
                <div>
                  <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-widest mb-2">Verification Audit Remarks</label>
                  <textarea
                    rows={2}
                    value={actionRemarks}
                    onChange={(e) => setActionRemarks(e.target.value)}
                    placeholder="Enter audit/rejection details here..."
                    className={cn(
                      "w-full px-4 py-2.5 text-xs border rounded-xl outline-none focus:border-[#D71920] dark:text-slate-100 resize-none",
                      isDark ? "bg-neutral-950 border-neutral-800" : "bg-slate-50 border-slate-200"
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    disabled={updatingStatus}
                    onClick={() => handleUpdateStatus(selectedReg.id, "REJECTED")}
                    className="py-3 bg-red-950/20 hover:bg-red-900 border border-red-900/40 text-red-500 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {updatingStatus ? <Loader2 size={12} className="animate-spin" /> : <ShieldAlert size={12} />}
                    Reject Registration
                  </button>
                  <button
                    disabled={updatingStatus}
                    onClick={() => handleUpdateStatus(selectedReg.id, "VERIFIED")}
                    className="py-3 bg-[#D71920] hover:bg-[#b8141a] text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-[#D71920]/20 disabled:opacity-50"
                  >
                    {updatingStatus ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                    Verify & Approve
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
