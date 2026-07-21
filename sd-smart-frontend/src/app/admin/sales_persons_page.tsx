"use client";
import { ENV } from "@/config/env";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";
import { 
  Loader2, Search, RefreshCw, Check, X, Trash2, Edit2, Plus,
  User, Mail, Phone, MapPin, CheckSquare, Square, Target, Calendar,
  TrendingUp, ClipboardList, Award, Users, AlertCircle, ArrowUpRight
} from "lucide-react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import Pagination from "@/components/shared/Pagination";
import { cn } from "@/lib/utils";

interface SalesPersonType {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  assignedRegion: string;
  assignedState: string;
  assignedDistrict: string;
  status: string;
  remarks?: string;
  createdAt: string;
  distributors: { id: string; companyName: string | null; firstName: string; lastName: string }[];
  currentTarget?: {
    targetType: string;
    targetValue: number;
    month: number;
    year: number;
  } | null;
  achievement?: number;
  progressPercent?: number;
}

interface DistributorType {
  id: string;
  companyName: string | null;
  firstName: string; // contact person
  lastName: string;  // distributor name
}

interface PerformanceType {
  totalDistributors: number;
  ordersCount: number;
  revenueAchieved: number;
  unitsSold: number;
  targetType: string;
  targetValue: number;
  achievement: number;
  progressPercent: number;
  remainingTarget: number;
  remarks: string;
}

export default function AdminSalesPersonsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [salesPersons, setSalesPersons] = useState<SalesPersonType[]>([]);
  const [distributors, setDistributors] = useState<DistributorType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Form Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Management Modal State
  const [isMgmtModalOpen, setIsMgmtModalOpen] = useState(false);
  const [selectedSp, setSelectedSp] = useState<SalesPersonType | null>(null);
  
  // Management Panel Form Fields
  const [mgmtMonth, setMgmtMonth] = useState<number>(new Date().getMonth() + 1);
  const [mgmtYear, setMgmtYear] = useState<number>(new Date().getFullYear());
  const [mgmtTargetType, setMgmtTargetType] = useState<string>("REVENUE");
  const [mgmtTargetValue, setMgmtTargetValue] = useState<string>("");
  const [mgmtRemarks, setMgmtRemarks] = useState<string>("");
  const [mgmtSelectedDistributors, setMgmtSelectedDistributors] = useState<string[]>([]);
  const [mgmtDistributorSearch, setMgmtDistributorSearch] = useState<string>("");
  const [mgmtPerformance, setMgmtPerformance] = useState<PerformanceType | null>(null);
  const [mgmtLoading, setMgmtLoading] = useState<boolean>(false);
  const [mgmtActionLoading, setMgmtActionLoading] = useState<string | null>(null);
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

  // Form Fields State for simplified Create/Edit
  const [employeeId, setEmployeeId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [assignedRegion, setAssignedRegion] = useState("");
  const [assignedState, setAssignedState] = useState("");
  const [assignedDistrict, setAssignedDistrict] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  const [mounted, setMounted] = useState(false);
  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">("dark");

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

  // Route protection
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user || (user.role !== "admin" && user.role !== "superadmin" && user.role?.toUpperCase() !== "ADMIN")) {
        toast.error("Access Denied. Admins only.");
        router.push("/auth/login");
      }
    }
  }, [isAuthenticated, user, authLoading, router]);

  // Fetch Distributors
  const fetchDistributors = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;
      const res = await fetch(`${ENV.API_BASE_URL}/auth/admin/distributors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDistributors(data.distributors || []);
      }
    } catch (err) {
      console.error("Error fetching distributors:", err);
    }
  };

  // Reset page to 1 when search query changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  // Fetch Sales Persons
  const fetchSalesPersons = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });

      if (searchQuery) {
        queryParams.append("search", searchQuery);
      }

      const res = await fetch(`${ENV.API_BASE_URL}/sales-persons/admin/list?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.success) {
        setSalesPersons(data.data || []);
        setTotalRecords(data.pagination?.totalRecords || 0);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        if (!isBackground) toast.error(data.message || "Failed to fetch sales persons");
      }
    } catch (err) {
      console.error("Error fetching sales persons:", err);
      if (!isBackground) toast.error("Failed to load sales persons");
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSalesPersons(false);
    }
  }, [page, pageSize, searchQuery, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDistributors();
    }
  }, [isAuthenticated]);

  // Fetch performance metrics for specific Sales Person & Month/Year
  const fetchMgmtPerformance = async (spId: string, month: number, year: number) => {
    setMgmtLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;
      const res = await fetch(
        `${ENV.API_BASE_URL}/sales-persons/admin/${spId}/performance?month=${month}&year=${year}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success && data.performance) {
        setMgmtPerformance(data.performance);
        setMgmtTargetType(data.performance.targetType);
        setMgmtTargetValue(data.performance.targetValue > 0 ? data.performance.targetValue.toString() : "");
        setMgmtRemarks(data.performance.remarks || "");
      }
    } catch (err) {
      console.error("Error loading performance stats:", err);
      toast.error("Failed to load performance summary");
    } finally {
      setMgmtLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSalesPersons(false);
      fetchDistributors();
    }
  }, [isAuthenticated]);

  // Open Create Modal (Simplified)
  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setEmployeeId("");
    setFullName("");
    setEmail("");
    setMobileNumber("");
    setPassword("");
    setAssignedRegion("");
    setAssignedState("");
    setAssignedDistrict("");
    setStatus("ACTIVE");
    setIsModalOpen(true);
  };

  // Open Edit Details Modal (Simplified)
  const handleOpenEdit = (sp: SalesPersonType, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering open card management
    setIsEditing(true);
    setEditingId(sp.id);
    setEmployeeId(sp.employeeId);
    setFullName(sp.fullName);
    setEmail(sp.email);
    setMobileNumber(sp.mobileNumber);
    setPassword(""); // Leave blank unless updating
    setAssignedRegion(sp.assignedRegion);
    setAssignedState(sp.assignedState);
    setAssignedDistrict(sp.assignedDistrict);
    setStatus(sp.status);
    setIsModalOpen(true);
  };

  // Open Management Panel
  const handleOpenMgmt = (sp: SalesPersonType) => {
    const currentM = new Date().getMonth() + 1;
    const currentY = new Date().getFullYear();
    setSelectedSp(sp);
    setMgmtMonth(currentM);
    setMgmtYear(currentY);
    setMgmtSelectedDistributors(sp.distributors?.map(d => d.id) || []);
    setMgmtDistributorSearch("");
    setMgmtPerformance(null);
    setIsMgmtModalOpen(true);
    setIsMonthDropdownOpen(false);
    setIsYearDropdownOpen(false);
    fetchMgmtPerformance(sp.id, currentM, currentY);
  };

  // Reload Management Panel when date changes
  const handleDateChange = (m: number, y: number) => {
    setMgmtMonth(m);
    setMgmtYear(y);
    if (selectedSp) {
      fetchMgmtPerformance(selectedSp.id, m, y);
    }
  };

  // Submit create/edit basic details form
  const handleSubmitBasicForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading("form");
    try {
      const token = localStorage.getItem("authToken");
      const url = isEditing 
        ? `${ENV.API_BASE_URL}/sales-persons/admin/edit/${editingId}`
        : `${ENV.API_BASE_URL}/sales-persons/admin/create`;

      const method = isEditing ? "PUT" : "POST";
      const body = {
        employeeId,
        fullName,
        email,
        mobileNumber,
        password: password || undefined,
        assignedRegion,
        assignedState,
        assignedDistrict,
        status
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || `Sales Person ${isEditing ? "updated" : "created"} successfully!`);
        setIsModalOpen(false);
        fetchSalesPersons(true);
      } else {
        toast.error(data.message || "Operation failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit form data");
    } finally {
      setActionLoading(null);
    }
  };

  // Save target specific to selected month/year
  const handleSaveTarget = async () => {
    if (!selectedSp) return;
    setMgmtActionLoading("target");
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${ENV.API_BASE_URL}/sales-persons/admin/${selectedSp.id}/target`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          targetType: mgmtTargetType,
          targetValue: parseFloat(mgmtTargetValue) || 0,
          month: mgmtMonth,
          year: mgmtYear
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Sales target saved successfully!");
        fetchMgmtPerformance(selectedSp.id, mgmtMonth, mgmtYear);
        fetchSalesPersons(true); // background update main list
      } else {
        toast.error(data.message || "Failed to save target");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error saving sales target");
    } finally {
      setMgmtActionLoading(null);
    }
  };

  // Save assigned distributors
  const handleSaveDistributors = async () => {
    if (!selectedSp) return;
    setMgmtActionLoading("distributors");
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${ENV.API_BASE_URL}/sales-persons/admin/${selectedSp.id}/assign-distributors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ distributorIds: mgmtSelectedDistributors })
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Distributor assignments updated successfully!");
        fetchMgmtPerformance(selectedSp.id, mgmtMonth, mgmtYear);
        fetchSalesPersons(true); // background update main list
      } else {
        toast.error(data.message || "Failed to assign distributors");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating distributor assignments");
    } finally {
      setMgmtActionLoading(null);
    }
  };

  // Save remarks
  const handleSaveRemarks = async () => {
    if (!selectedSp) return;
    setMgmtActionLoading("remarks");
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${ENV.API_BASE_URL}/sales-persons/admin/${selectedSp.id}/remarks`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ remarks: mgmtRemarks })
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Admin remarks updated successfully!");
        fetchMgmtPerformance(selectedSp.id, mgmtMonth, mgmtYear);
      } else {
        toast.error(data.message || "Failed to update remarks");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating admin remarks");
    } finally {
      setMgmtActionLoading(null);
    }
  };

  // Toggle status
  const handleToggleStatus = async (id: string, currentStatus: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering open card management
    const nextStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setActionLoading(id);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${ENV.API_BASE_URL}/sales-persons/admin/status/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Sales Person is now ${nextStatus.toLowerCase()}`);
        setSalesPersons(prev => 
          prev.map(sp => sp.id === id ? { ...sp, status: nextStatus } : sp)
        );
        // If we are currently managing this salesperson, update status in modal too
        if (selectedSp && selectedSp.id === id) {
          setSelectedSp(prev => prev ? { ...prev, status: nextStatus } : null);
        }
      } else {
        toast.error(data.message || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to toggle sales person status");
    } finally {
      setActionLoading(null);
    }
  };

  // Delete sales person
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering open card management
    if (!confirm("Are you sure you want to delete this sales person? This will disassociate their assigned distributors and enquiries.")) return;
    setActionLoading(id);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${ENV.API_BASE_URL}/sales-persons/admin/delete/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Sales Person deleted successfully");
        if (selectedSp && selectedSp.id === id) {
          setIsMgmtModalOpen(false);
          setSelectedSp(null);
        }
        if (salesPersons.length === 1 && page > 1) {
          setPage(prev => prev - 1);
        } else {
          fetchSalesPersons();
        }
      } else {
        toast.error(data.message || "Failed to delete");
      }
    } catch (err) {
      console.error(err);
      toast.error("Delete operation failed");
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle distributor selection in Section B checklist
  const handleToggleMgmtDistributor = (distId: string) => {
    setMgmtSelectedDistributors(prev => 
      prev.includes(distId) ? prev.filter(id => id !== distId) : [...prev, distId]
    );
  };

  // Filter distributor list in Section B by search query
  const filteredMgmtDistributors = useMemo(() => {
    return distributors.filter(d => {
      const q = mgmtDistributorSearch.toLowerCase();
      const comp = d.companyName?.toLowerCase() || "";
      const first = d.firstName.toLowerCase();
      const last = d.lastName.toLowerCase();
      return comp.includes(q) || first.includes(q) || last.includes(q);
    });
  }, [distributors, mgmtDistributorSearch]);

  // Filter Sales Persons for main grid (now done on the backend)
  const filteredSalesPersons = useMemo(() => {
    return salesPersons;
  }, [salesPersons]);

  const isDark = theme === "dark";

  // Years option range (current year - 1 up to current + 3)
  const yearOptions = useMemo(() => {
    const startY = new Date().getFullYear() - 1;
    return Array.from({ length: 5 }, (_, i) => startY + i);
  }, []);

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
      <AdminSidebar currentPath="/admin/sales-persons" theme={theme} toggleTheme={toggleTheme} />

      {/* Main Content Area */}
      <main className="flex-1 px-6 lg:pl-72 py-8 overflow-y-auto text-left">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 mb-8 border-neutral-800/40">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#1C1C1C] dark:text-white uppercase">
              Sales Persons
            </h1>
            <p className="text-xs font-bold text-neutral-500 uppercase mt-1">
              Manage Sales Team members, territories, and distributor assignments
            </p>
          </div>
          
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#D71920] hover:bg-[#b8141a] text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-[#D71920]/10 cursor-pointer w-fit"
          >
            <Plus size={16} />
            <span>Create Sales Person</span>
          </button>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by ID, name, email, district, state..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none text-sm transition-all",
                isDark 
                  ? "bg-[#0d0d0d] border-neutral-800 text-white focus:border-[#D71920]" 
                  : "bg-white border-neutral-200 text-slate-900 focus:border-[#D71920]"
              )}
            />
          </div>
          
          <button
            onClick={() => fetchSalesPersons(false)}
            disabled={loading}
            className={cn(
              "flex items-center justify-center p-3 rounded-xl border transition-all cursor-pointer",
              isDark 
                ? "border-neutral-800 bg-[#0d0d0d] hover:bg-neutral-900 text-white" 
                : "border-neutral-200 bg-white hover:bg-neutral-50 text-slate-700"
            )}
          >
            <RefreshCw size={18} className={cn(loading && "animate-spin")} />
          </button>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-[#D71920]" size={36} />
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
              Fetching Sales Persons...
            </p>
          </div>
        ) : filteredSalesPersons.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-neutral-800 p-6">
            <User size={48} className="mx-auto mb-4 text-neutral-500" />
            <h3 className="font-bold text-lg">No Sales Persons Found</h3>
            <p className="text-sm text-neutral-400 mt-1">
              Try adjusting your search criteria or register a new Sales Person to get started.
            </p>
          </div>
        ) : (
          /* Cards Grid Layout */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredSalesPersons.map((sp) => {
              const target = sp.currentTarget;
              const hasTarget = !!target && target.targetValue > 0;
              const formattedTarget = hasTarget 
                ? target.targetType === "REVENUE" 
                  ? `₹${target.targetValue.toLocaleString("en-IN")}` 
                  : `${target.targetValue.toLocaleString("en-IN")} Units`
                : "No Target Set";

              const formattedAchieved = hasTarget
                ? target.targetType === "REVENUE"
                  ? `₹${(sp.achievement || 0).toLocaleString("en-IN")}`
                  : `${(sp.achievement || 0).toLocaleString("en-IN")} Units`
                : target?.targetType === "UNITS_SOLD"
                  ? `${(sp.achievement || 0).toLocaleString("en-IN")} Units`
                  : `₹${(sp.achievement || 0).toLocaleString("en-IN")}`;

              const progress = sp.progressPercent || 0;

              return (
                <div
                  key={sp.id}
                  onClick={() => handleOpenMgmt(sp)}
                  className={cn(
                    "relative flex flex-col rounded-2xl border p-5 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl cursor-pointer select-none group text-left",
                    isDark 
                      ? "bg-[#0d0d0d] border-neutral-800 hover:border-[#D71920]/40 hover:shadow-[#D71920]/5 text-white" 
                      : "bg-white border-neutral-200 hover:border-[#D71920]/30 hover:shadow-neutral-200 text-slate-900"
                  )}
                >
                  {/* Status Badge & Actions */}
                  <div className="flex items-start justify-between mb-4">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1",
                      sp.status === "ACTIVE"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-neutral-500/15 text-neutral-500"
                    )}>
                      <span className="w-1 h-1 rounded-full bg-current"></span>
                      {sp.status}
                    </span>

                    <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleOpenEdit(sp, e)}
                        className="p-1.5 rounded-md hover:bg-neutral-800/10 dark:hover:bg-neutral-800 text-neutral-400 hover:text-[#D71920]"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(sp.id, e)}
                        className="p-1.5 rounded-md hover:bg-neutral-800/10 dark:hover:bg-neutral-800 text-neutral-400 hover:text-[#D71920]"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Employee Info */}
                  <div className="mb-4">
                    <h3 className="font-black text-lg group-hover:text-[#D71920] transition-colors leading-tight">
                      {sp.fullName}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-1 font-semibold">
                      <span>ID: {sp.employeeId}</span>
                      <span>•</span>
                      <span>{sp.assignedDistrict}, {sp.assignedState}</span>
                    </div>
                  </div>

                  {/* Summary Metric Badges */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className={cn(
                      "p-2.5 rounded-xl text-left",
                      isDark ? "bg-neutral-900/50" : "bg-neutral-50"
                    )}>
                      <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Distributors</div>
                      <div className="text-sm font-black mt-0.5">{sp.distributors?.length || 0}</div>
                    </div>
                    <div className={cn(
                      "p-2.5 rounded-xl text-left",
                      isDark ? "bg-neutral-900/50" : "bg-neutral-50"
                    )}>
                      <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Territory State</div>
                      <div className="text-sm font-black mt-0.5 truncate">{sp.assignedState}</div>
                    </div>
                  </div>

                  {/* Target Achievement block */}
                  <div className="mt-auto pt-3 border-t border-neutral-800/30">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-[10px] text-neutral-500 font-black uppercase">Month Target:</span>
                      <span className="text-xs font-black">{formattedTarget}</span>
                    </div>

                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-[10px] text-neutral-500 font-black uppercase">Achievement:</span>
                      <span className="text-xs font-black text-[#D71920]">{formattedAchieved}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[10px] font-bold text-neutral-500 mb-1">
                        <span>PROGRESS</span>
                        <span>{progress}%</span>
                      </div>
                      <div className={cn("w-full h-1.5 rounded-full overflow-hidden", isDark ? "bg-neutral-800" : "bg-neutral-200")}>
                        <div 
                          className="h-full bg-[#D71920] rounded-full transition-all duration-500" 
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Click indicator */}
                  <div className="absolute bottom-4 right-4 text-neutral-700 group-hover:text-[#D71920] transition-colors">
                    <ArrowUpRight size={14} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredSalesPersons.length > 0 && (
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

      {/* simplified basic creation/editing modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
          <div className={cn(
            "relative w-full max-w-2xl transform rounded-2xl p-6 shadow-2xl transition-all border border-neutral-800 text-left overflow-y-auto max-h-[90vh] sidebar-scrollbar",
            isDark ? "bg-[#0d0d0d] text-white" : "bg-white text-slate-900"
          )}>
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black uppercase text-[#D71920] mb-6">
              {isEditing ? "Edit Details" : "Create Sales Person"}
            </h3>

            <form onSubmit={handleSubmitBasicForm} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Employee ID */}
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">Employee ID *</label>
                  <input
                    type="text"
                    required
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className={cn(
                      "w-full px-4 py-2.5 rounded-xl border outline-none text-sm",
                      isDark ? "bg-neutral-950 border-neutral-800 text-white" : "bg-neutral-50 border-neutral-200 text-slate-900"
                    )}
                    placeholder="e.g. SP001"
                  />
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={cn(
                      "w-full px-4 py-2.5 rounded-xl border outline-none text-sm",
                      isDark ? "bg-neutral-950 border-neutral-800 text-white" : "bg-neutral-50 border-neutral-200 text-slate-900"
                    )}
                    placeholder="e.g. Rajesh Kumar"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn(
                      "w-full px-4 py-2.5 rounded-xl border outline-none text-sm",
                      isDark ? "bg-neutral-950 border-neutral-800 text-white" : "bg-neutral-50 border-neutral-200 text-slate-900"
                    )}
                    placeholder="e.g. rajesh@sdsmart.in"
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className={cn(
                      "w-full px-4 py-2.5 rounded-xl border outline-none text-sm",
                      isDark ? "bg-neutral-950 border-neutral-800 text-white" : "bg-neutral-50 border-neutral-200 text-slate-900"
                    )}
                    placeholder="e.g. 9876543210"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">
                    Password {isEditing ? "(leave blank to keep current)" : "*"}
                  </label>
                  <input
                    type="password"
                    required={!isEditing}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(
                      "w-full px-4 py-2.5 rounded-xl border outline-none text-sm",
                      isDark ? "bg-neutral-950 border-neutral-800 text-white" : "bg-neutral-50 border-neutral-200 text-slate-900"
                    )}
                    placeholder="Minimum 8 characters"
                  />
                </div>

                {/* Region */}
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">Assigned Region *</label>
                  <input
                    type="text"
                    required
                    value={assignedRegion}
                    onChange={(e) => setAssignedRegion(e.target.value)}
                    className={cn(
                      "w-full px-4 py-2.5 rounded-xl border outline-none text-sm",
                      isDark ? "bg-neutral-950 border-neutral-800 text-white" : "bg-neutral-50 border-neutral-200 text-slate-900"
                    )}
                    placeholder="e.g. South, North-East"
                  />
                </div>

                {/* State */}
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">Assigned State *</label>
                  <input
                    type="text"
                    required
                    value={assignedState}
                    onChange={(e) => setAssignedState(e.target.value)}
                    className={cn(
                      "w-full px-4 py-2.5 rounded-xl border outline-none text-sm",
                      isDark ? "bg-neutral-950 border-neutral-800 text-white" : "bg-neutral-50 border-neutral-200 text-slate-900"
                    )}
                    placeholder="e.g. Tamil Nadu"
                  />
                </div>

                {/* District */}
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">Assigned District *</label>
                  <input
                    type="text"
                    required
                    value={assignedDistrict}
                    onChange={(e) => setAssignedDistrict(e.target.value)}
                    className={cn(
                      "w-full px-4 py-2.5 rounded-xl border outline-none text-sm",
                      isDark ? "bg-neutral-950 border-neutral-800 text-white" : "bg-neutral-50 border-neutral-200 text-slate-900"
                    )}
                    placeholder="e.g. Coimbatore"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800/30 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={cn(
                    "px-5 py-2.5 border text-sm font-semibold rounded-xl transition-all cursor-pointer",
                    isDark ? "border-neutral-800 hover:bg-neutral-900" : "border-neutral-200 hover:bg-neutral-50 text-slate-700"
                  )}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === "form"}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#D71920] hover:bg-[#b8141a] text-white text-sm font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-[#D71920]/10"
                >
                  {actionLoading === "form" && <Loader2 size={16} className="animate-spin" />}
                  <span>{isEditing ? "Save Changes" : "Create Account"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Advanced Sales Person Management Modal */}
      {isMgmtModalOpen && selectedSp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm" onClick={() => setIsMgmtModalOpen(false)} />
          
          <div className={cn(
            "relative w-full max-w-4xl transform rounded-2xl p-6 shadow-2xl transition-all border border-neutral-800 text-left overflow-y-auto max-h-[95vh] sidebar-scrollbar",
            isDark ? "bg-[#0c0c0c] text-white" : "bg-white text-slate-900"
          )}>
            {/* Close Button */}
            <button
              onClick={() => setIsMgmtModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-800/40 pb-4 mb-6 gap-2">
              <div>
                <h3 className="text-xl font-black uppercase text-[#D71920]">
                  Sales Person Management
                </h3>
                <p className="text-xs text-neutral-500 font-semibold mt-1 uppercase">
                  Manage Account: {selectedSp.fullName} ({selectedSp.employeeId})
                </p>
              </div>
              
              {/* Target month/year selector - Styled with space to clear modal close button */}
              <div className="flex items-center gap-2 sm:pr-8 z-30">
                <Calendar size={14} className="text-neutral-500" />
                
                {/* Custom Month Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMonthDropdownOpen(!isMonthDropdownOpen);
                      setIsYearDropdownOpen(false);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg border text-xs outline-none font-bold flex items-center gap-1.5 justify-between min-w-[110px] transition-colors",
                      isDark 
                        ? "bg-neutral-950 border-neutral-800 text-white hover:bg-neutral-900" 
                        : "bg-white border-neutral-200 text-slate-800 hover:bg-neutral-50"
                    )}
                  >
                    <span>{new Date(2026, mgmtMonth - 1, 1).toLocaleString("default", { month: "long" })}</span>
                    <span className="text-[9px] text-neutral-400">▼</span>
                  </button>
                  {isMonthDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsMonthDropdownOpen(false)} />
                      <div className={cn(
                        "absolute right-0 mt-1 w-36 rounded-xl border shadow-xl z-50 py-1 max-h-60 overflow-y-auto sidebar-scrollbar animate-fade-in",
                        isDark ? "bg-[#0d0d0d] border-neutral-800 text-white" : "bg-white border-neutral-200 text-slate-800"
                      )}>
                        {Array.from({ length: 12 }, (_, i) => {
                          const m = i + 1;
                          const isSelected = mgmtMonth === m;
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                handleDateChange(m, mgmtYear);
                                setIsMonthDropdownOpen(false);
                              }}
                              className={cn(
                                "w-full text-left px-3.5 py-2 text-xs font-bold transition-all",
                                isSelected
                                  ? "bg-[#D71920] text-white"
                                  : isDark
                                    ? "hover:bg-neutral-900 hover:text-white text-neutral-300"
                                    : "hover:bg-neutral-50 hover:text-slate-900 text-slate-700"
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
                    className={cn(
                      "px-3 py-1.5 rounded-lg border text-xs outline-none font-bold flex items-center gap-1.5 justify-between min-w-[80px] transition-colors",
                      isDark 
                        ? "bg-neutral-950 border-neutral-800 text-white hover:bg-neutral-900" 
                        : "bg-white border-neutral-200 text-slate-800 hover:bg-neutral-50"
                    )}
                  >
                    <span>{mgmtYear}</span>
                    <span className="text-[9px] text-neutral-400">▼</span>
                  </button>
                  {isYearDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsYearDropdownOpen(false)} />
                      <div className={cn(
                        "absolute right-0 mt-1 w-24 rounded-xl border shadow-xl z-50 py-1 animate-fade-in",
                        isDark ? "bg-[#0d0d0d] border-neutral-800 text-white" : "bg-white border-neutral-200 text-slate-800"
                      )}>
                        {yearOptions.map((y) => {
                          const isSelected = mgmtYear === y;
                          return (
                            <button
                              key={y}
                              type="button"
                              onClick={() => {
                                handleDateChange(mgmtMonth, y);
                                setIsYearDropdownOpen(false);
                              }}
                              className={cn(
                                "w-full text-left px-3.5 py-2 text-xs font-bold transition-all",
                                isSelected
                                  ? "bg-[#D71920] text-white"
                                  : isDark
                                    ? "hover:bg-neutral-900 hover:text-white text-neutral-300"
                                    : "hover:bg-neutral-50 hover:text-slate-900 text-slate-700"
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

            {/* Loading Indicator */}
            {mgmtLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="animate-spin text-[#D71920]" size={36} />
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                  Loading Management Details...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* LEFT COLUMN: DETAILS & DISTRIBUTOR ASSIGNMENT */}
                <div className="space-y-6">
                  {/* Section A: Employee Details */}
                  <div className={cn(
                    "p-5 rounded-2xl border",
                    isDark ? "bg-neutral-950/40 border-neutral-800" : "bg-neutral-50 border-neutral-200"
                  )}>
                    <h4 className="text-xs font-black uppercase text-[#D71920] mb-4 flex items-center gap-1.5">
                      <User size={14} />
                      <span>Section A – Employee Details (Read Only)</span>
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-y-3.5 gap-x-4 text-xs">
                      <div>
                        <div className="text-neutral-500 font-bold uppercase text-[10px]">Employee ID</div>
                        <div className="font-extrabold mt-1">{selectedSp.employeeId}</div>
                      </div>
                      <div>
                        <div className="text-neutral-500 font-bold uppercase text-[10px]">Full Name</div>
                        <div className="font-extrabold mt-1">{selectedSp.fullName}</div>
                      </div>
                      <div>
                        <div className="text-neutral-500 font-bold uppercase text-[10px]">Region</div>
                        <div className="font-extrabold mt-1">{selectedSp.assignedRegion}</div>
                      </div>
                      <div>
                        <div className="text-neutral-500 font-bold uppercase text-[10px]">State</div>
                        <div className="font-extrabold mt-1">{selectedSp.assignedState}</div>
                      </div>
                      <div>
                        <div className="text-neutral-500 font-bold uppercase text-[10px]">District</div>
                        <div className="font-extrabold mt-1">{selectedSp.assignedDistrict}</div>
                      </div>
                      <div>
                        <div className="text-neutral-500 font-bold uppercase text-[10px]">Status</div>
                        <div className="mt-1 flex items-center gap-2">
                          <button
                            onClick={(e) => handleToggleStatus(selectedSp.id, selectedSp.status, e)}
                            disabled={actionLoading === selectedSp.id}
                            className={cn(
                              "px-2.5 py-0.5 rounded-full text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer",
                              selectedSp.status === "ACTIVE" 
                                ? "bg-green-500/10 text-green-500" 
                                : "bg-red-500/10 text-red-500"
                            )}
                          >
                            <span>{selectedSp.status}</span>
                            {actionLoading === selectedSp.id && <Loader2 size={10} className="animate-spin" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section B: Assign Distributors */}
                  <div className={cn(
                    "p-5 rounded-2xl border flex flex-col",
                    isDark ? "bg-neutral-950/40 border-neutral-800" : "bg-neutral-50 border-neutral-200"
                  )}>
                    <h4 className="text-xs font-black uppercase text-[#D71920] mb-3.5 flex items-center gap-1.5">
                      <Users size={14} />
                      <span>Section B – Assign Distributors</span>
                    </h4>

                    {/* Search bar inside section */}
                    <div className="relative mb-3">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        placeholder="Search distributors..."
                        value={mgmtDistributorSearch}
                        onChange={(e) => setMgmtDistributorSearch(e.target.value)}
                        className={cn(
                          "w-full pl-8 pr-3 py-1.5 rounded-lg border outline-none text-xs",
                          isDark 
                            ? "bg-neutral-950 border-neutral-800 text-white" 
                            : "bg-white border-neutral-200 text-slate-900"
                        )}
                      />
                    </div>

                    <div className={cn(
                      "p-3 rounded-xl border max-h-[160px] overflow-y-auto sidebar-scrollbar space-y-2",
                      isDark ? "bg-neutral-950 border-neutral-800" : "bg-white border-neutral-200"
                    )}>
                      {filteredMgmtDistributors.length === 0 ? (
                        <p className="text-xs text-neutral-500 italic py-1">No distributors match</p>
                      ) : (
                        filteredMgmtDistributors.map((d) => {
                          const isChecked = mgmtSelectedDistributors.includes(d.id);
                          return (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => handleToggleMgmtDistributor(d.id)}
                              className="flex items-center gap-2.5 w-full text-left text-xs font-semibold hover:text-[#D71920] transition-colors cursor-pointer"
                            >
                              {isChecked ? (
                                <CheckSquare size={14} className="text-[#D71920]" />
                              ) : (
                                <Square size={14} className="text-neutral-500" />
                              )}
                              <span>{d.companyName || `${d.firstName} ${d.lastName}`}</span>
                            </button>
                          );
                        })
                      )}
                    </div>

                    <button
                      onClick={handleSaveDistributors}
                      disabled={mgmtActionLoading === "distributors"}
                      className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-[#D71920] hover:bg-[#b8141a] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-[#D71920]/10"
                    >
                      {mgmtActionLoading === "distributors" && <Loader2 size={12} className="animate-spin" />}
                      <span>Save Assigned Distributors</span>
                    </button>
                  </div>
                </div>

                {/* RIGHT COLUMN: MONTHLY TARGET & SUMMARY & REMARKS */}
                <div className="space-y-6">
                  {/* Section C: Monthly Sales Target */}
                  <div className={cn(
                    "p-5 rounded-2xl border",
                    isDark ? "bg-neutral-950/40 border-neutral-800" : "bg-neutral-50 border-neutral-200"
                  )}>
                    <h4 className="text-xs font-black uppercase text-[#D71920] mb-4 flex items-center gap-1.5">
                      <Target size={14} />
                      <span>Section C – Monthly Sales Target</span>
                    </h4>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Target Type</label>
                        <select
                          value={mgmtTargetType}
                          onChange={(e) => setMgmtTargetType(e.target.value)}
                          className={cn(
                            "w-full px-3 py-2 rounded-xl border text-xs outline-none font-bold",
                            isDark ? "bg-neutral-950 border-neutral-800 text-white" : "bg-white border-neutral-200 text-slate-900"
                          )}
                        >
                          <option value="REVENUE">Revenue (₹)</option>
                          <option value="UNITS_SOLD">Units Sold</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Target Value</label>
                        <input
                          type="number"
                          value={mgmtTargetValue}
                          onChange={(e) => setMgmtTargetValue(e.target.value)}
                          className={cn(
                            "w-full px-3 py-2 rounded-xl border text-xs outline-none font-bold",
                            isDark ? "bg-neutral-950 border-neutral-800 text-white" : "bg-white border-neutral-200 text-slate-900"
                          )}
                          placeholder="e.g. 50000"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleSaveTarget}
                      disabled={mgmtActionLoading === "target"}
                      className="flex items-center justify-center gap-2 w-full py-2 bg-[#D71920] hover:bg-[#b8141a] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-[#D71920]/10"
                    >
                      {mgmtActionLoading === "target" && <Loader2 size={12} className="animate-spin" />}
                      <span>Save Target</span>
                    </button>
                  </div>

                  {/* Section D: Performance Summary */}
                  {mgmtPerformance && (
                    <div className={cn(
                      "p-5 rounded-2xl border",
                      isDark ? "bg-neutral-950/40 border-neutral-800" : "bg-neutral-50 border-neutral-200"
                    )}>
                      <h4 className="text-xs font-black uppercase text-[#D71920] mb-4 flex items-center gap-1.5">
                        <TrendingUp size={14} />
                        <span>Section D – Performance Summary ({new Date(mgmtYear, mgmtMonth - 1, 1).toLocaleString("default", { month: "short", year: "numeric" })})</span>
                      </h4>

                      <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs mb-4">
                        <div>
                          <div className="text-neutral-500 font-bold uppercase text-[9px]">Assigned Distributors</div>
                          <div className="font-extrabold mt-0.5 text-sm">{mgmtPerformance.totalDistributors}</div>
                        </div>
                        <div>
                          <div className="text-neutral-500 font-bold uppercase text-[9px]">Orders This Month</div>
                          <div className="font-extrabold mt-0.5 text-sm">{mgmtPerformance.ordersCount}</div>
                        </div>
                        <div>
                          <div className="text-neutral-500 font-bold uppercase text-[9px]">Revenue Achieved</div>
                          <div className="font-extrabold mt-0.5 text-sm text-[#D71920]">₹{mgmtPerformance.revenueAchieved.toLocaleString("en-IN")}</div>
                        </div>
                        <div>
                          <div className="text-neutral-500 font-bold uppercase text-[9px]">Units Sold</div>
                          <div className="font-extrabold mt-0.5 text-sm">{mgmtPerformance.unitsSold.toLocaleString("en-IN")} Units</div>
                        </div>
                        <div>
                          <div className="text-neutral-500 font-bold uppercase text-[9px]">Target Value</div>
                          <div className="font-extrabold mt-0.5 text-sm">
                            {mgmtPerformance.targetValue > 0 
                              ? mgmtPerformance.targetType === "REVENUE" 
                                ? `₹${mgmtPerformance.targetValue.toLocaleString("en-IN")}` 
                                : `${mgmtPerformance.targetValue.toLocaleString("en-IN")} Units` 
                              : "Not Set"}
                          </div>
                        </div>
                        <div>
                          <div className="text-neutral-500 font-bold uppercase text-[9px]">Remaining Target</div>
                          <div className="font-extrabold mt-0.5 text-sm">
                            {mgmtPerformance.targetType === "REVENUE" 
                              ? `₹${mgmtPerformance.remainingTarget.toLocaleString("en-IN")}` 
                              : `${mgmtPerformance.remainingTarget.toLocaleString("en-IN")} Units`}
                          </div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-[10px] font-black text-neutral-500 mb-1.5 uppercase">
                          <span>Progress achieved</span>
                          <span>{mgmtPerformance.progressPercent}%</span>
                        </div>
                        <div className={cn("w-full h-2 rounded-full overflow-hidden", isDark ? "bg-neutral-800" : "bg-neutral-200")}>
                          <div 
                            className="h-full bg-[#D71920] rounded-full transition-all duration-500" 
                            style={{ width: `${mgmtPerformance.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section E: Admin Remarks */}
                  <div className={cn(
                    "p-5 rounded-2xl border",
                    isDark ? "bg-neutral-950/40 border-neutral-800" : "bg-neutral-50 border-neutral-200"
                  )}>
                    <h4 className="text-xs font-black uppercase text-[#D71920] mb-3 flex items-center gap-1.5">
                      <ClipboardList size={14} />
                      <span>Section E – Admin Remarks</span>
                    </h4>

                    <textarea
                      value={mgmtRemarks}
                      onChange={(e) => setMgmtRemarks(e.target.value)}
                      rows={3}
                      placeholder="Enter optional observations, follow-ups or general performance remarks..."
                      className={cn(
                        "w-full px-3 py-2 rounded-xl border text-xs outline-none resize-none mb-3",
                        isDark 
                          ? "bg-neutral-950 border-neutral-800 text-white" 
                          : "bg-white border-neutral-200 text-slate-900"
                      )}
                    />

                    <button
                      onClick={handleSaveRemarks}
                      disabled={mgmtActionLoading === "remarks"}
                      className="flex items-center justify-center gap-2 w-full py-2 bg-[#D71920] hover:bg-[#b8141a] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-[#D71920]/10"
                    >
                      {mgmtActionLoading === "remarks" && <Loader2 size={12} className="animate-spin" />}
                      <span>Save Remarks</span>
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
