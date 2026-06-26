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
                        <tr key={d.id} className={cn(
                          "transition-colors",
                          isDark ? "hover:bg-neutral-900/30" : "hover:bg-neutral-50/50"
                        )}>
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
                                    onClick={() => handleUpdateStatus(d.id, "APPROVED")}
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
                                    onClick={() => handleUpdateStatus(d.id, "REJECTED")}
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
                                  onClick={() => handleDeleteDistributor(d.id)}
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

        </div>

      </div>
    </div>
  );
}
