"use client";
import { ENV } from "@/config/env";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";
import { 
  Loader2, Search, RefreshCw, X, MessageSquare, 
  Calendar, Check, User, Mail, Phone, ShoppingBag, 
  TrendingUp, AlertCircle, ArrowUpRight, ShieldAlert,
  ChevronRight, CheckSquare, Square
} from "lucide-react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import Pagination from "@/components/shared/Pagination";
import { cn } from "@/lib/utils";

interface EnquiryType {
  id: string;
  distributorId: string;
  distributor: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    companyName: string | null;
  };
  productId: string;
  product: {
    id: string;
    name: string;
    category: string;
    categoryLabel: string;
    image: string;
    price: number;
  };
  quantity: number;
  message: string | null;
  status: string;
  salesPersonId: string | null;
  salesPerson: {
    id: string;
    fullName: string;
    employeeId: string;
    email: string;
    mobileNumber: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface SalesPersonType {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  status: string;
}

export default function AdminDistributorEnquiriesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  const [enquiries, setEnquiries] = useState<EnquiryType[]>([]);
  const [salesPersons, setSalesPersons] = useState<SalesPersonType[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Assignment Modal
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryType | null>(null);
  const [spSearchQuery, setSpSearchQuery] = useState("");
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Sync theme
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const savedTheme = (localStorage.getItem("admin-theme") as "light" | "dark") || "dark";
      setTheme(savedTheme);
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("admin-theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const isDark = theme === "dark";

  // Reset page to 1 on search or filter change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      // Mark enquiries as read
      await fetch(`${ENV.API_BASE_URL}/distributor-enquiries/admin/mark-read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (statusFilter && statusFilter !== "ALL") {
        queryParams.append("status", statusFilter);
      }
      if (searchQuery) {
        queryParams.append("search", searchQuery);
      }

      // Load Enquiries
      const enqRes = await fetch(`${ENV.API_BASE_URL}/distributor-enquiries/admin/list?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const enqData = await enqRes.json();

      // Load Salespersons
      const spRes = await fetch(`${ENV.API_BASE_URL}/sales-persons/admin/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const spData = await spRes.json();

      if (enqData.success) {
        setEnquiries(enqData.data || []);
        setTotalRecords(enqData.pagination?.totalRecords || 0);
        setTotalPages(enqData.pagination?.totalPages || 1);
      }
      if (spData.success) {
        // filter only active salespersons
        const activeSp = (spData.data || spData.salesPersons || []).filter((sp: SalesPersonType) => sp.status === "ACTIVE");
        setSalesPersons(activeSp);
      }
    } catch (err) {
      console.error("Failed to fetch initial data:", err);
      toast.error("Failed to load distributor enquiries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize, statusFilter, searchQuery]);

  // Filtered Enquiries (now handled on the backend)
  const filteredEnquiries = useMemo(() => {
    return enquiries;
  }, [enquiries]);

  // Filtered Active Sales Persons for modal
  const filteredSalesPersons = useMemo(() => {
    return salesPersons.filter((sp) => 
      sp.fullName.toLowerCase().includes(spSearchQuery.toLowerCase()) ||
      sp.employeeId.toLowerCase().includes(spSearchQuery.toLowerCase())
    );
  }, [salesPersons, spSearchQuery]);

  // Handle Assign Sales Person submit
  const handleAssignSubmit = async (spId: string) => {
    if (!selectedEnquiry) return;
    setActionLoading(spId);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${ENV.API_BASE_URL}/distributor-enquiries/admin/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          enquiryId: selectedEnquiry.id,
          salesPersonId: spId
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Sales person assigned successfully!");
        setIsAssignModalOpen(false);
        fetchData();
      } else {
        toast.error(data.message || "Failed to assign sales person");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to assign sales person");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "New":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case "Assigned":
        return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
      case "Contacted":
        return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
      case "Quotation Sent":
        return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
      case "Negotiation":
        return "bg-orange-500/10 text-orange-400 border border-orange-500/20";
      case "Converted to Order":
        return "bg-green-500/10 text-green-400 border border-green-500/20";
      case "Closed":
        return "bg-neutral-500/10 text-neutral-400 border border-neutral-500/20";
      default:
        return "bg-neutral-500/10 text-neutral-400 border border-neutral-500/20";
    }
  };

  if (authLoading || !mounted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-sans bg-neutral-50 dark:bg-[#080808] text-slate-900 dark:text-white transition-colors duration-300">
        <Loader2 className="w-10 h-10 text-[#D71920] animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen flex flex-col lg:flex-row transition-colors duration-300 font-sans",
      isDark ? "bg-[#080808] text-white" : "bg-neutral-50 text-slate-900"
    )}>
      {/* Sidebar */}
      <AdminSidebar currentPath="/admin/distributor-enquiries" theme={theme} toggleTheme={toggleTheme} />

      {/* Main Content */}
      <main className="flex-1 px-6 lg:pl-72 py-8 overflow-y-auto text-left">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 mb-8 border-neutral-800/40">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#1C1C1C] dark:text-white uppercase">
              Distributor Price Enquiries
            </h1>
            <p className="text-xs font-bold text-neutral-500 uppercase mt-1">
              Manage product price enquiries from signed-up distributors & assign sales representatives
            </p>
          </div>

          <button
            onClick={fetchData}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-neutral-200 dark:border-neutral-850 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-xl text-xs font-bold transition-all cursor-pointer w-fit"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
            <input
              type="text"
              placeholder="Search by company, contact person, product name, or salesperson..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none text-xs font-semibold transition-all",
                isDark 
                  ? "bg-[#0c0c0c] border-neutral-800 text-white focus:border-[#D71920]" 
                  : "bg-white border-neutral-200 text-slate-800 focus:border-[#D71920]"
              )}
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 max-w-full sidebar-scrollbar">
            {["ALL", "New", "Assigned", "Contacted", "Quotation Sent", "Negotiation", "Converted to Order", "Closed"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap",
                  statusFilter === st
                    ? "bg-[#D71920] border-[#D71920] text-white"
                    : isDark
                      ? "bg-[#0c0c0c] border-neutral-800 text-neutral-400 hover:text-white"
                      : "bg-white border-neutral-200 text-slate-600 hover:text-slate-900"
                )}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Content Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={36} className="animate-spin text-[#D71920]" />
            <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Loading price enquiries...</p>
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <div className={cn(
            "flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed",
            isDark ? "bg-[#0d0d0d]/30 border-neutral-800" : "bg-neutral-50 border-neutral-200"
          )}>
            <MessageSquare size={32} className="text-neutral-500 mb-3" />
            <h4 className="text-sm font-bold uppercase mb-1">No Price Enquiries Found</h4>
            <p className="text-xs text-neutral-500 max-w-sm">
              There are no distributor price enquiries that match the current filters.
            </p>
          </div>
        ) : (
          <div className={cn(
            "border rounded-2xl overflow-hidden shadow-sm",
            isDark ? "bg-[#0c0c0c] border-neutral-800" : "bg-white border-neutral-200"
          )}>
            <div className="overflow-x-auto sidebar-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={cn(
                    "border-b text-[10px] font-black uppercase tracking-wider text-neutral-500",
                    isDark ? "bg-neutral-900/40 border-neutral-800" : "bg-neutral-50/50 border-neutral-100"
                  )}>
                    <th className="p-4">Distributor</th>
                    <th className="p-4">Contact Details</th>
                    <th className="p-4">Product Details</th>
                    <th className="p-4 text-center">Qty</th>
                    <th className="p-4">Enquiry Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Assigned Sales Person</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/10 dark:divide-neutral-800/60">
                  {filteredEnquiries.map((e) => {
                    const distributorName = e.distributor.companyName || "N/A";
                    const contactPerson = `${e.distributor.firstName} ${e.distributor.lastName}`;
                    const formattedDate = new Date(e.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    });

                    return (
                      <tr 
                        key={e.id}
                        className={cn(
                          "text-xs transition-colors hover:bg-neutral-800/5 dark:hover:bg-neutral-900/20"
                        )}
                      >
                        <td className="p-4 align-middle">
                          <div className="font-extrabold text-sm">{distributorName}</div>
                          <div className="text-[10px] text-neutral-500 font-bold mt-0.5 uppercase tracking-wide">
                            Person: {contactPerson}
                          </div>
                        </td>
                        <td className="p-4 align-middle space-y-0.5">
                          <div className="flex items-center gap-1.5 text-neutral-500 font-medium">
                            <Mail size={12} className="shrink-0" />
                            <span className="truncate max-w-[160px]">{e.distributor.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-neutral-500 font-medium">
                            <Phone size={12} className="shrink-0" />
                            <span>{e.distributor.phoneNumber || "No Phone"}</span>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-2">
                            {e.product.image && (
                              <img 
                                src={e.product.image} 
                                alt={e.product.name} 
                                className="w-8 h-8 rounded-lg object-contain bg-neutral-100 dark:bg-neutral-900 shrink-0" 
                              />
                            )}
                            <div className="min-w-0">
                              <div className="font-bold truncate max-w-[200px]">{e.product.name}</div>
                              <div className="text-[10px] text-[#D71920] font-black uppercase mt-0.5">
                                {e.product.categoryLabel}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle text-center font-black text-sm">
                          {e.quantity}
                        </td>
                        <td className="p-4 align-middle font-bold text-neutral-500 whitespace-nowrap">
                          {formattedDate}
                        </td>
                        <td className="p-4 align-middle">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-black uppercase whitespace-nowrap inline-block",
                            getStatusBadge(e.status)
                          )}>
                            {e.status}
                          </span>
                        </td>
                        <td className="p-4 align-middle">
                          {e.salesPerson ? (
                            <div>
                              <div className="font-extrabold text-slate-800 dark:text-neutral-200">
                                {e.salesPerson.fullName}
                              </div>
                              <div className="text-[9px] text-neutral-500 font-bold uppercase mt-0.5">
                                ID: {e.salesPerson.employeeId}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-neutral-500 font-bold italic">
                              Not Assigned
                            </span>
                          )}
                        </td>
                        <td className="p-4 align-middle text-right">
                          <button
                            onClick={() => {
                              setSelectedEnquiry(e);
                              setIsAssignModalOpen(true);
                            }}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1",
                              e.salesPersonId 
                                ? "border border-neutral-200 dark:border-neutral-850 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-400 hover:text-white"
                                : "bg-[#D71920] hover:bg-[#b8141a] text-white shadow-sm"
                            )}
                          >
                            <span>{e.salesPersonId ? "Reassign" : "Assign Sales Person"}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredEnquiries.length > 0 && (
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
          </div>
        )}
      </main>

      {/* Assignment Modal */}
      {isAssignModalOpen && selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm" 
            onClick={() => setIsAssignModalOpen(false)} 
          />

          <div className={cn(
            "relative w-full max-w-md transform rounded-2xl p-6 shadow-2xl transition-all border border-neutral-800 text-left overflow-y-auto max-h-[90vh] sidebar-scrollbar",
            isDark ? "bg-[#0c0c0c] text-white" : "bg-white text-slate-900"
          )}>
            {/* Close Button */}
            <button
              onClick={() => setIsAssignModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Modal Header */}
            <div className="mb-5">
              <h3 className="text-xl font-black uppercase text-[#D71920]">
                Assign Sales Person
              </h3>
              <p className="text-xs text-neutral-500 font-bold uppercase mt-1">
                Distributor: {selectedEnquiry.distributor.companyName || "N/A"}
              </p>
              <p className="text-[10px] text-neutral-400 font-bold uppercase">
                Product: {selectedEnquiry.product.name} (Qty: {selectedEnquiry.quantity})
              </p>
            </div>

            {/* Sales Persons List with Search */}
            <div className="space-y-4">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" size={14} />
                <input
                  type="text"
                  placeholder="Search active representatives by name or ID..."
                  value={spSearchQuery}
                  onChange={(e) => setSpSearchQuery(e.target.value)}
                  className={cn(
                    "w-full pl-8 pr-3 py-1.5 rounded-lg border outline-none text-xs",
                    isDark 
                      ? "bg-neutral-950 border-neutral-800 text-white" 
                      : "bg-white border-neutral-200 text-slate-900"
                  )}
                />
              </div>

              {/* List */}
              <div className={cn(
                "p-2 rounded-xl border max-h-[260px] overflow-y-auto sidebar-scrollbar space-y-1.5",
                isDark ? "bg-neutral-950 border-neutral-800" : "bg-white border-neutral-200"
              )}>
                {filteredSalesPersons.length === 0 ? (
                  <p className="text-xs text-neutral-500 italic py-4 text-center">No active sales persons found</p>
                ) : (
                  filteredSalesPersons.map((sp) => {
                    const isCurrentlyAssigned = selectedEnquiry.salesPersonId === sp.id;
                    return (
                      <div
                        key={sp.id}
                        className={cn(
                          "flex items-center justify-between p-2.5 rounded-lg transition-colors border",
                          isCurrentlyAssigned
                            ? "bg-[#D71920]/10 border-[#D71920]/40"
                            : isDark
                              ? "bg-neutral-900/35 border-transparent hover:bg-neutral-900/70"
                              : "bg-neutral-50/50 border-transparent hover:bg-neutral-100/75"
                        )}
                      >
                        <div className="min-w-0">
                          <div className="font-extrabold text-xs">{sp.fullName}</div>
                          <div className="text-[10px] text-neutral-500 font-bold uppercase mt-0.5">
                            ID: {sp.employeeId} | Mob: {sp.mobileNumber}
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={actionLoading !== null}
                          onClick={() => handleAssignSubmit(sp.id)}
                          className={cn(
                            "px-2.5 py-1.5 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-1 cursor-pointer",
                            isCurrentlyAssigned
                              ? "bg-green-500/10 text-green-400 border border-green-500/20"
                              : "bg-[#D71920] hover:bg-[#b8141a] text-white"
                          )}
                        >
                          {actionLoading === sp.id ? (
                            <Loader2 size={10} className="animate-spin" />
                          ) : isCurrentlyAssigned ? (
                            <>
                              <Check size={10} />
                              <span>Assigned</span>
                            </>
                          ) : (
                            <span>Assign</span>
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 border border-neutral-200 dark:border-neutral-850 text-xs font-bold rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
