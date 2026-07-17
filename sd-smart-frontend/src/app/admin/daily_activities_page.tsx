"use client";
import React, { useState, useEffect } from "react";
import { ENV } from "@/config/env";
import { useAuth } from "@/providers/AuthProvider";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { 
  Loader2, Calendar, Shield, IndianRupee, Eye, CheckCircle2, AlertTriangle, XCircle, Clock, MapPin, RefreshCw, X, MessageSquare, Clipboard, User, Target, BarChart3, ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ActivityAdminType {
  id: string;
  activityDate: string;
  startTime: string;
  endTime: string;
  workingStatus: string;
  currentLocation: string;
  distributorId?: string | null;
  distributor?: {
    companyName?: string;
    firstName: string;
    lastName: string;
  } | null;
  salesPerson: {
    fullName: string;
    employeeId: string;
    assignedRegion: string;
  };
  visitType?: string | null;
  visitStatus?: string | null;
  orderCollected: boolean;
  orderAmount?: number | null;
  productsOrdered?: string | null;
  expectedDeliveryDate?: string | null;
  newEnquiry: boolean;
  enquiryDistributorName?: string | null;
  enquiryMobile?: string | null;
  enquiryLocation?: string | null;
  interestedProducts?: string | null;
  numberOfVisits: number;
  numberOfOrders: number;
  numberOfEnquiries: number;
  numberOfFollowUps: number;
  distanceTravelled?: number | null;
  achievements?: string | null;
  challenges?: string | null;
  tomorrowPlan?: string | null;
  remarks?: string | null;
  attachment?: {
    visitPhoto?: string;
    shopPhoto?: string;
    invoicePhoto?: string;
    businessCard?: string;
  } | null;
  status: string; // PENDING, APPROVED, CORRECTION_REQUESTED, REJECTED, VERIFIED
  reviewComment?: string | null;
  submittedAt?: string | null;
  createdAt: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  isDark?: boolean;
}

function CustomSelect({ value, onChange, options, placeholder = "Select option", isDark }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-3 py-2 border rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between transition-all cursor-pointer",
          isDark
            ? "bg-[#0d0d0d] border-neutral-800 text-white hover:bg-neutral-900"
            : "bg-white border-neutral-250 text-slate-850 hover:border-neutral-350"
        )}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={14} className={cn("text-neutral-450 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className={cn(
          "absolute z-50 mt-1.5 w-full border rounded-xl shadow-xl py-1.5 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150",
          isDark ? "bg-[#0d0d0d] border-neutral-800 text-white" : "bg-white border-neutral-200 text-slate-800"
        )}>
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3.5 py-2.5 text-xs font-bold transition-colors cursor-pointer block",
                  isSelected
                    ? "bg-[#D71920]/10 text-[#D71920]"
                    : isDark
                      ? "hover:bg-neutral-850/50 text-neutral-300 hover:text-white"
                      : "hover:bg-neutral-50 text-slate-750 hover:text-neutral-900"
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminDailyActivitiesPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityAdminType[]>([]);
  const [salesPersons, setSalesPersons] = useState<any[]>([]);
  const [distributors, setDistributors] = useState<any[]>([]);
  
  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = (localStorage.getItem("admin-theme") as "light" | "dark") || "dark";
    setTheme(savedTheme);
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

  // Dashboard Metrics
  const [stats, setStats] = useState({
    todaySubmitted: 0,
    pendingReports: 0,
    totalVisits: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalEnquiries: 0
  });

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityAdminType | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  
  // Filters State
  const [timeRange, setTimeRange] = useState("all");
  const [salesPersonId, setSalesPersonId] = useState("");
  const [region, setRegion] = useState("");
  const [distributorId, setDistributorId] = useState("");
  const [workingStatus, setWorkingStatus] = useState("");

  // Review state
  const [reviewComment, setReviewComment] = useState("");

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const res = await fetch(`${ENV.API_BASE_URL}/sales-activities/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const spRes = await fetch(`${ENV.API_BASE_URL}/sales-persons/admin/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (spRes.ok) {
        const spData = await spRes.json();
        if (spData.success) {
          setSalesPersons(spData.salesPersons || []);
        }
      }

      const distRes = await fetch(`${ENV.API_BASE_URL}/auth/admin/distributors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (distRes.ok) {
        const distData = await distRes.json();
        if (distData.success) {
          setDistributors(distData.distributors || []);
        }
      }
    } catch (err) {
      console.error("Filter options error:", err);
    }
  };

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const queryParams = new URLSearchParams();
      if (timeRange !== "all") queryParams.append("timeRange", timeRange);
      if (salesPersonId) queryParams.append("salesPersonId", salesPersonId);
      if (region) queryParams.append("region", region);
      if (distributorId) queryParams.append("distributorId", distributorId);
      if (workingStatus) queryParams.append("workingStatus", workingStatus);

      const res = await fetch(`${ENV.API_BASE_URL}/sales-activities/admin/list?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setActivities(data.activities || []);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load daily activities list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [timeRange, salesPersonId, region, distributorId, workingStatus]);

  const handleAdminAction = async (action: "APPROVE" | "CORRECTION" | "REJECT" | "VERIFY") => {
    if (!selectedActivity) return;

    if (["CORRECTION", "REJECT"].includes(action) && !reviewComment) {
      toast.error("Please add a review comment justifying the action.");
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const res = await fetch(`${ENV.API_BASE_URL}/sales-activities/admin/${selectedActivity.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action, reviewComment })
      });

      if (!res.ok) throw new Error("Action failed");
      const data = await res.json();

      if (data.success) {
        toast.success(data.message || "Status updated successfully");
        setDetailModalOpen(false);
        setReviewComment("");
        fetchActivities();
        fetchStats();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to execute admin action");
    } finally {
      setActionLoading(false);
    }
  };

  // Get distinct regions for filter dropdown
  const regions = Array.from(new Set(salesPersons.map(sp => sp.assignedRegion))).filter(Boolean);

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-300 flex flex-col lg:flex-row font-sans w-full max-w-full overflow-x-hidden",
      isDark ? "dark bg-[#0d0d0d] text-white" : "bg-slate-50 text-slate-800"
    )}>
      <AdminSidebar currentPath="/admin/daily-activities" theme={theme} toggleTheme={toggleTheme} />

      <main className="flex-1 lg:ml-64 p-4 sm:p-6 md:p-8 overflow-y-auto text-left">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Header */}
          <div>
            <h1 className={cn("text-2xl sm:text-3xl font-black uppercase tracking-tight flex items-center gap-2", isDark ? "text-white" : "text-neutral-900")}>
              <Clipboard className="text-[#D71920]" size={28} />
              <span>Daily Sales Activities Review</span>
            </h1>
            <p className={cn("text-xs sm:text-sm font-semibold uppercase tracking-wider mt-1", isDark ? "text-neutral-500" : "text-neutral-450")}>
              Review and approve daily work logs submitted by sales person representatives.
            </p>
          </div>

          {/* Stats Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {statsLoading ? (
              <div className={cn("col-span-6 p-6 rounded-2xl border text-center flex justify-center items-center gap-2", isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200")}>
                <Loader2 className="animate-spin text-[#D71920]" size={20} />
                <span className="text-xs font-black uppercase text-neutral-400">Loading Stats...</span>
              </div>
            ) : (
              <>
                <div className={cn("p-4 rounded-2xl border shadow-sm flex flex-col justify-between", isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200")}>
                  <span className={cn("text-[9px] font-black uppercase tracking-wider", isDark ? "text-neutral-500" : "text-neutral-400")}>Submitted (Today)</span>
                  <span className={cn("text-2xl font-black mt-2", isDark ? "text-white" : "text-neutral-900")}>{stats.todaySubmitted}</span>
                </div>
                <div className={cn("p-4 rounded-2xl border shadow-sm flex flex-col justify-between", isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200")}>
                  <span className={cn("text-[9px] font-black uppercase tracking-wider", isDark ? "text-neutral-500" : "text-neutral-400")}>Pending Approvals</span>
                  <span className="text-2xl font-black text-[#D71920] mt-2">{stats.pendingReports}</span>
                </div>
                <div className={cn("p-4 rounded-2xl border shadow-sm flex flex-col justify-between", isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200")}>
                  <span className={cn("text-[9px] font-black uppercase tracking-wider", isDark ? "text-neutral-500" : "text-neutral-400")}>Visits (Month)</span>
                  <span className={cn("text-2xl font-black mt-2", isDark ? "text-white" : "text-neutral-900")}>{stats.totalVisits}</span>
                </div>
                <div className={cn("p-4 rounded-2xl border shadow-sm flex flex-col justify-between", isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200")}>
                  <span className={cn("text-[9px] font-black uppercase tracking-wider", isDark ? "text-neutral-500" : "text-neutral-400")}>Orders (Month)</span>
                  <span className={cn("text-2xl font-black mt-2", isDark ? "text-white" : "text-neutral-900")}>{stats.totalOrders}</span>
                </div>
                <div className={cn("p-4 rounded-2xl border shadow-sm flex flex-col justify-between", isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200")}>
                  <span className={cn("text-[9px] font-black uppercase tracking-wider", isDark ? "text-neutral-500" : "text-neutral-400")}>Revenue (Month)</span>
                  <span className="text-lg sm:text-xl font-black text-green-600 mt-2 flex items-center">
                    <IndianRupee size={16} />
                    <span>{stats.totalRevenue.toLocaleString("en-IN")}</span>
                  </span>
                </div>
                <div className={cn("p-4 rounded-2xl border shadow-sm flex flex-col justify-between", isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200")}>
                  <span className={cn("text-[9px] font-black uppercase tracking-wider", isDark ? "text-neutral-500" : "text-neutral-400")}>Enquiries (Month)</span>
                  <span className={cn("text-2xl font-black mt-2", isDark ? "text-white" : "text-neutral-900")}>{stats.totalEnquiries}</span>
                </div>
              </>
            )}
          </div>

          {/* Filters Row */}
          <div className={cn("p-4 sm:p-6 rounded-2xl border shadow-sm grid grid-cols-2 md:grid-cols-5 gap-4", isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200")}>
            <div className="space-y-1">
              <label className={cn("text-[9px] font-bold uppercase tracking-wider", isDark ? "text-neutral-500" : "text-neutral-400")}>Time Period</label>
              <CustomSelect
                value={timeRange}
                onChange={setTimeRange}
                isDark={isDark}
                options={[
                  { value: "all", label: "All Dates" },
                  { value: "today", label: "Today" },
                  { value: "yesterday", label: "Yesterday" },
                  { value: "week", label: "Last 7 Days" },
                  { value: "month", label: "This Month" }
                ]}
              />
            </div>

            <div className="space-y-1">
              <label className={cn("text-[9px] font-bold uppercase tracking-wider", isDark ? "text-neutral-500" : "text-neutral-400")}>Sales Representative</label>
              <CustomSelect
                value={salesPersonId}
                onChange={setSalesPersonId}
                isDark={isDark}
                placeholder="All Reps"
                options={[
                  { value: "", label: "All Reps" },
                  ...salesPersons.map((sp) => ({
                    value: sp.id,
                    label: `${sp.fullName} (${sp.employeeId})`
                  }))
                ]}
              />
            </div>

            <div className="space-y-1">
              <label className={cn("text-[9px] font-bold uppercase tracking-wider", isDark ? "text-neutral-500" : "text-neutral-400")}>Assigned Region</label>
              <CustomSelect
                value={region}
                onChange={setRegion}
                isDark={isDark}
                placeholder="All Regions"
                options={[
                  { value: "", label: "All Regions" },
                  ...regions.map((reg: any) => ({
                    value: reg,
                    label: reg
                  }))
                ]}
              />
            </div>

            <div className="space-y-1">
              <label className={cn("text-[9px] font-bold uppercase tracking-wider", isDark ? "text-neutral-500" : "text-neutral-400")}>Distributor Visited</label>
              <CustomSelect
                value={distributorId}
                onChange={setDistributorId}
                isDark={isDark}
                placeholder="All Distributors"
                options={[
                  { value: "", label: "All Distributors" },
                  ...distributors.map((d) => ({
                    value: d.id,
                    label: d.companyName || `${d.firstName} ${d.lastName}`
                  }))
                ]}
              />
            </div>

            <div className="space-y-1 col-span-2 md:col-span-1">
              <label className={cn("text-[9px] font-bold uppercase tracking-wider", isDark ? "text-neutral-500" : "text-neutral-400")}>Working Mode</label>
              <CustomSelect
                value={workingStatus}
                onChange={setWorkingStatus}
                isDark={isDark}
                placeholder="All Modes"
                options={[
                  { value: "", label: "All Modes" },
                  { value: "Office Work", label: "Office Work" },
                  { value: "Field Visit", label: "Field Visit" },
                  { value: "Distributor Visit", label: "Distributor Visit" },
                  { value: "Market Survey", label: "Market Survey" },
                  { value: "Leave", label: "Leave" },
                  { value: "Training", label: "Training" },
                  { value: "Meeting", label: "Meeting" }
                ]}
              />
            </div>
          </div>

          {/* Activities List Table */}
          <div className={cn("border rounded-2xl shadow-sm overflow-hidden", isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200")}>
            {loading ? (
              <div className="p-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="animate-spin text-[#D71920]" size={36} />
                <p className="text-xs font-black uppercase text-neutral-400 tracking-wider">Loading activities list...</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="p-20 text-center flex flex-col items-center justify-center gap-2">
                <Clipboard className="text-neutral-300" size={48} />
                <p className={cn("text-sm font-extrabold uppercase tracking-widest mt-2", isDark ? "text-neutral-400" : "text-neutral-500")}>No Activities Found</p>
                <p className="text-xs text-neutral-400 font-medium">No sales person reports found matching active filter configurations.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={cn("border-b text-[10px] sm:text-xs font-extrabold uppercase tracking-wider", isDark ? "border-neutral-800 bg-neutral-950/20 text-neutral-500" : "border-neutral-100 bg-neutral-50 text-neutral-400")}>
                      <th className="py-4 px-6">Report Date</th>
                      <th className="py-4 px-6">Sales Person</th>
                      <th className="py-4 px-6">Working Mode</th>
                      <th className="py-4 px-6">Visits / Orders</th>
                      <th className="py-4 px-6">Status / Time</th>
                      <th className="py-4 px-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={cn("divide-y text-xs sm:text-sm font-medium", isDark ? "divide-neutral-800 text-neutral-350" : "divide-neutral-100 text-slate-700")}>
                    {activities.map((act) => (
                      <tr key={act.id} className={cn("transition-colors border-b", isDark ? "border-neutral-800/60 hover:bg-neutral-850" : "border-neutral-100 hover:bg-neutral-50/50")}>
                        <td className="py-4 px-6">
                          <span className={cn("font-bold", isDark ? "text-white" : "text-neutral-900")}>
                            {new Date(act.activityDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className={cn("font-bold", isDark ? "text-white" : "text-neutral-900")}>{act.salesPerson.fullName}</span>
                            <span className={cn("text-[10px] font-bold uppercase tracking-wider", isDark ? "text-neutral-500" : "text-neutral-400")}>
                              ID: {act.salesPerson.employeeId} | {act.salesPerson.assignedRegion}
                            </span>
                          </div>
                        </td>
                        <td className={cn("py-4 px-6 font-bold", isDark ? "text-neutral-200" : "text-neutral-850")}>{act.workingStatus}</td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className={cn("font-semibold", isDark ? "text-neutral-300" : "text-neutral-700")}>{act.numberOfVisits} Visits</span>
                            <span className={cn("text-xs font-semibold", isDark ? "text-neutral-500" : "text-neutral-500")}>
                              {act.orderCollected ? `₹${act.orderAmount?.toLocaleString("en-IN")}` : "No Orders"}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-1.5">
                            <span className={cn(
                              "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider inline-block w-fit",
                              act.status === "APPROVED" && "bg-green-500/10 text-green-600",
                              act.status === "VERIFIED" && "bg-emerald-500/10 text-emerald-600",
                              act.status === "PENDING" && "bg-amber-500/10 text-amber-600",
                              act.status === "CORRECTION_REQUESTED" && "bg-indigo-500/10 text-indigo-600",
                              act.status === "REJECTED" && "bg-red-500/10 text-red-600"
                            )}>
                              {act.status.replace("_", " ")}
                            </span>
                            {act.submittedAt && (
                              <span className="text-[9px] text-neutral-400 font-semibold tracking-wider">
                                Sub: {new Date(act.submittedAt).toLocaleTimeString([], {hour: "2-digit", minute:"2-digit"})}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => {
                              setSelectedActivity(act);
                              setDetailModalOpen(true);
                            }}
                            className={cn("px-4 py-2 transition-colors text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer", isDark ? "bg-neutral-800 text-white hover:bg-[#D71920]" : "bg-neutral-100 hover:bg-[#D71920] hover:text-white")}
                          >
                            Review Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* DETAIL & ACTION MODAL */}
      {detailModalOpen && selectedActivity && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
          <div className={cn("relative rounded-3xl shadow-2xl border w-full max-w-3xl overflow-hidden animate-fade-in animate-duration-200", isDark ? "bg-[#0d0d0d] border-neutral-800 text-white" : "bg-white border-neutral-200/80 text-slate-800")}>
            {/* Modal Header */}
            <div className={cn("px-6 py-5 border-b flex items-center justify-between", isDark ? "border-neutral-800" : "border-neutral-100")}>
              <div>
                <h3 className={cn("text-lg font-black uppercase flex items-center gap-2", isDark ? "text-white" : "text-neutral-900")}>
                  <span>Sales Representative Report</span>
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                    selectedActivity.status === "APPROVED" && "bg-green-500/10 text-green-600",
                    selectedActivity.status === "VERIFIED" && "bg-emerald-500/10 text-emerald-600",
                    selectedActivity.status === "PENDING" && "bg-amber-500/10 text-amber-600",
                    selectedActivity.status === "CORRECTION_REQUESTED" && "bg-indigo-500/10 text-indigo-600",
                    selectedActivity.status === "REJECTED" && "bg-red-500/10 text-red-600"
                  )}>
                    {selectedActivity.status.replace("_", " ")}
                  </span>
                </h3>
                <p className={cn("text-xs font-bold uppercase tracking-wider mt-0.5", isDark ? "text-neutral-500" : "text-neutral-400")}>
                  Submitted by {selectedActivity.salesPerson.fullName} ({selectedActivity.salesPerson.employeeId}) on {new Date(selectedActivity.activityDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <button 
                onClick={() => setDetailModalOpen(false)}
                className={cn("p-1.5 rounded-lg cursor-pointer", isDark ? "hover:bg-neutral-800 text-neutral-500 hover:text-white" : "hover:bg-neutral-100 text-neutral-400 hover:text-neutral-800")}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">

              {/* Basic info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className={cn("p-3 border rounded-xl", isDark ? "bg-neutral-950/40 border-neutral-800" : "bg-neutral-50 border-neutral-100")}>
                  <span className={cn("text-[9px] font-bold uppercase block", isDark ? "text-neutral-500" : "text-neutral-400")}>Shift Time</span>
                  <span className={cn("text-xs font-bold", isDark ? "text-neutral-200" : "text-neutral-800")}>{selectedActivity.startTime} - {selectedActivity.endTime}</span>
                </div>

                <div className={cn("p-3 border rounded-xl", isDark ? "bg-neutral-950/40 border-neutral-800" : "bg-neutral-50 border-neutral-100")}>
                  <span className={cn("text-[9px] font-bold uppercase block", isDark ? "text-neutral-500" : "text-neutral-400")}>Working Status</span>
                  <span className={cn("text-xs font-bold", isDark ? "text-neutral-200" : "text-neutral-800")}>{selectedActivity.workingStatus}</span>
                </div>

                <div className={cn("p-3 border rounded-xl", isDark ? "bg-neutral-950/40 border-neutral-800" : "bg-neutral-50 border-neutral-100")}>
                  <span className={cn("text-[9px] font-bold uppercase block", isDark ? "text-neutral-500" : "text-neutral-400")}>Region</span>
                  <span className={cn("text-xs font-bold", isDark ? "text-neutral-200" : "text-neutral-800")}>{selectedActivity.salesPerson.assignedRegion || "N/A"}</span>
                </div>

                <div className={cn("p-3 border rounded-xl col-span-3", isDark ? "bg-neutral-950/40 border-neutral-800" : "bg-neutral-50 border-neutral-100")}>
                  <span className={cn("text-[9px] font-bold uppercase block", isDark ? "text-neutral-500" : "text-neutral-400")}>Logged Location</span>
                  <span className={cn("text-xs font-bold flex items-center gap-1.5 mt-0.5", isDark ? "text-neutral-200" : "text-neutral-800")}>
                    <MapPin size={12} className="text-[#D71920]" />
                    <span>{selectedActivity.currentLocation}</span>
                  </span>
                </div>
              </div>

              {/* Visited Distributor section */}
              {selectedActivity.distributor && (
                <div className={cn("space-y-2 border-t pt-4", isDark ? "border-neutral-800" : "border-neutral-100")}>
                  <h4 className="text-xs font-black uppercase text-[#D71920] tracking-wider">Distributor Visit Details</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <span className={cn("text-[9px] font-bold uppercase block", isDark ? "text-neutral-500" : "text-neutral-400")}>Company Name</span>
                      <span className={cn("text-xs font-extrabold", isDark ? "text-white" : "text-neutral-800")}>{selectedActivity.distributor.companyName || "N/A"}</span>
                    </div>
                    <div>
                      <span className={cn("text-[9px] font-bold uppercase block", isDark ? "text-neutral-500" : "text-neutral-400")}>Visit Type</span>
                      <span className={cn("text-xs font-semibold", isDark ? "text-neutral-300" : "text-neutral-750")}>{selectedActivity.visitType}</span>
                    </div>
                    <div>
                      <span className={cn("text-[9px] font-bold uppercase block", isDark ? "text-neutral-500" : "text-neutral-400")}>Visit Status</span>
                      <span className={cn("text-xs font-semibold", isDark ? "text-neutral-300" : "text-neutral-750")}>{selectedActivity.visitStatus}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Details */}
              {selectedActivity.orderCollected && (
                <div className={cn("space-y-2 border-t pt-4", isDark ? "border-neutral-800" : "border-neutral-100")}>
                  <h4 className="text-xs font-black uppercase text-[#D71920] tracking-wider">Order Collected Details</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <span className={cn("text-[9px] font-bold uppercase block", isDark ? "text-neutral-500" : "text-neutral-400")}>Order Value</span>
                      <span className="text-xs font-extrabold text-green-600 flex items-center mt-0.5">
                        <IndianRupee size={12} />
                        <span>{selectedActivity.orderAmount?.toLocaleString("en-IN")}</span>
                      </span>
                    </div>
                    <div>
                      <span className={cn("text-[9px] font-bold uppercase block", isDark ? "text-neutral-500" : "text-neutral-400")}>Products Ordered</span>
                      <span className={cn("text-xs font-semibold", isDark ? "text-neutral-300" : "text-neutral-750")}>{selectedActivity.productsOrdered}</span>
                    </div>
                    {selectedActivity.expectedDeliveryDate && (
                      <div>
                        <span className={cn("text-[9px] font-bold uppercase block", isDark ? "text-neutral-500" : "text-neutral-400")}>Expected Delivery</span>
                        <span className={cn("text-xs font-semibold", isDark ? "text-neutral-300" : "text-neutral-750")}>
                          {new Date(selectedActivity.expectedDeliveryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Enquiry Details */}
              {selectedActivity.newEnquiry && (
                <div className={cn("space-y-2 border-t pt-4", isDark ? "border-neutral-800" : "border-neutral-100")}>
                  <h4 className="text-xs font-black uppercase text-[#D71920] tracking-wider">Enquiry Details</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <span className={cn("text-[9px] font-bold uppercase block", isDark ? "text-neutral-500" : "text-neutral-400")}>Distributor Name</span>
                      <span className={cn("text-xs font-extrabold", isDark ? "text-white" : "text-neutral-800")}>{selectedActivity.enquiryDistributorName}</span>
                    </div>
                    <div>
                      <span className={cn("text-[9px] font-bold uppercase block", isDark ? "text-neutral-500" : "text-neutral-400")}>Mobile Number</span>
                      <span className={cn("text-xs font-semibold", isDark ? "text-neutral-300" : "text-neutral-750")}>{selectedActivity.enquiryMobile}</span>
                    </div>
                    <div>
                      <span className={cn("text-[9px] font-bold uppercase block", isDark ? "text-neutral-500" : "text-neutral-400")}>Location</span>
                      <span className={cn("text-xs font-semibold", isDark ? "text-neutral-300" : "text-neutral-750")}>{selectedActivity.enquiryLocation}</span>
                    </div>
                    <div className="col-span-2">
                      <span className={cn("text-[9px] font-bold uppercase block", isDark ? "text-neutral-500" : "text-neutral-400")}>Interested Products</span>
                      <span className={cn("text-xs font-semibold", isDark ? "text-neutral-300" : "text-neutral-750")}>{selectedActivity.interestedProducts}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary details */}
              <div className={cn("space-y-2 border-t pt-4", isDark ? "border-neutral-800" : "border-neutral-100")}>
                <h4 className="text-xs font-black uppercase text-[#D71920] tracking-wider">Today's Work Summary</h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                  <div className={cn("p-2 border rounded-xl", isDark ? "bg-neutral-950/40 border-neutral-800" : "bg-neutral-50 border-neutral-100")}>
                    <span className={cn("text-[8px] font-black uppercase tracking-wider block", isDark ? "text-neutral-500" : "text-neutral-400")}>Visits</span>
                    <span className={cn("text-sm font-black", isDark ? "text-neutral-100" : "text-neutral-800")}>{selectedActivity.numberOfVisits}</span>
                  </div>
                  <div className={cn("p-2 border rounded-xl", isDark ? "bg-neutral-950/40 border-neutral-800" : "bg-neutral-50 border-neutral-100")}>
                    <span className={cn("text-[8px] font-black uppercase tracking-wider block", isDark ? "text-neutral-500" : "text-neutral-400")}>Orders</span>
                    <span className={cn("text-sm font-black", isDark ? "text-neutral-100" : "text-neutral-800")}>{selectedActivity.numberOfOrders}</span>
                  </div>
                  <div className={cn("p-2 border rounded-xl", isDark ? "bg-neutral-950/40 border-neutral-800" : "bg-neutral-50 border-neutral-100")}>
                    <span className={cn("text-[8px] font-black uppercase tracking-wider block", isDark ? "text-neutral-500" : "text-neutral-400")}>Enquiries</span>
                    <span className={cn("text-sm font-black", isDark ? "text-neutral-100" : "text-neutral-800")}>{selectedActivity.numberOfEnquiries}</span>
                  </div>
                  <div className={cn("p-2 border rounded-xl", isDark ? "bg-neutral-950/40 border-neutral-800" : "bg-neutral-50 border-neutral-100")}>
                    <span className={cn("text-[8px] font-black uppercase tracking-wider block", isDark ? "text-neutral-500" : "text-neutral-400")}>Follow Ups</span>
                    <span className={cn("text-sm font-black", isDark ? "text-neutral-100" : "text-neutral-800")}>{selectedActivity.numberOfFollowUps}</span>
                  </div>
                  <div className={cn("p-2 border rounded-xl col-span-2 sm:col-span-1", isDark ? "bg-neutral-950/40 border-neutral-800" : "bg-neutral-50 border-neutral-100")}>
                    <span className={cn("text-[8px] font-black uppercase tracking-wider block", isDark ? "text-neutral-500" : "text-neutral-400")}>Distance</span>
                    <span className={cn("text-sm font-black", isDark ? "text-neutral-100" : "text-neutral-800")}>{selectedActivity.distanceTravelled || 0} KM</span>
                  </div>
                </div>
              </div>

              {/* Remarks details */}
              <div className={cn("space-y-3 border-t pt-4", isDark ? "border-neutral-800" : "border-neutral-100")}>
                <h4 className="text-xs font-black uppercase text-[#D71920] tracking-wider">Remarks & Plan</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedActivity.achievements && (
                    <div>
                      <span className={cn("text-[9px] font-bold uppercase block", isDark ? "text-neutral-500" : "text-neutral-400")}>Achievements</span>
                      <p className={cn("text-xs font-semibold leading-relaxed mt-0.5", isDark ? "text-neutral-300" : "text-neutral-700")}>{selectedActivity.achievements}</p>
                    </div>
                  )}
                  {selectedActivity.challenges && (
                    <div>
                      <span className={cn("text-[9px] font-bold uppercase block", isDark ? "text-neutral-500" : "text-neutral-400")}>Challenges</span>
                      <p className={cn("text-xs font-semibold leading-relaxed mt-0.5", isDark ? "text-neutral-300" : "text-neutral-700")}>{selectedActivity.challenges}</p>
                    </div>
                  )}
                  {selectedActivity.tomorrowPlan && (
                    <div>
                      <span className={cn("text-[9px] font-bold uppercase block", isDark ? "text-neutral-500" : "text-neutral-400")}>Tomorrow's Plan</span>
                      <p className={cn("text-xs font-semibold leading-relaxed mt-0.5", isDark ? "text-neutral-300" : "text-neutral-700")}>{selectedActivity.tomorrowPlan}</p>
                    </div>
                  )}
                  {selectedActivity.remarks && (
                    <div>
                      <span className={cn("text-[9px] font-bold uppercase block", isDark ? "text-neutral-500" : "text-neutral-400")}>Additional Notes</span>
                      <p className={cn("text-xs font-semibold leading-relaxed mt-0.5", isDark ? "text-neutral-300" : "text-neutral-700")}>{selectedActivity.remarks}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Images list */}
              {selectedActivity.attachment && Object.values(selectedActivity.attachment as any).some(v => !!v) && (
                <div className={cn("space-y-3 border-t pt-4", isDark ? "border-neutral-800" : "border-neutral-100")}>
                  <h4 className="text-xs font-black uppercase text-[#D71920] tracking-wider">Attachments</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(selectedActivity.attachment as any).map(([k, v]) => {
                      if (!v) return null;
                      return (
                        <div key={k} className="space-y-1">
                          <span className={cn("text-[8px] font-bold uppercase block", isDark ? "text-neutral-500" : "text-neutral-400")}>{k.replace("Photo", " Photo")}</span>
                          <div className={cn("relative w-full h-24 rounded-lg overflow-hidden border", isDark ? "border-neutral-800" : "border-neutral-200")}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={v as string} alt={k} className="w-full h-full object-cover" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Review inputs section */}
              {selectedActivity.status === "PENDING" && (
                <div className={cn("space-y-3 border-t -mx-6 -mb-6 p-6", isDark ? "border-neutral-800 bg-neutral-950/60" : "border-neutral-100 bg-neutral-50")}>
                  <h4 className="text-xs font-black uppercase text-[#D71920] tracking-wider">Administrator Evaluation</h4>
                  
                  <div className="space-y-1.5">
                    <label className={cn("text-[10px] font-bold uppercase", isDark ? "text-neutral-500" : "text-neutral-400")}>Review Feedback / Comment</label>
                    <textarea
                      rows={2}
                      placeholder="Add review feedback comment here..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className={cn("w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 resize-none", isDark ? "bg-[#0d0d0d] border-neutral-800 text-white" : "bg-white border-neutral-200 text-slate-800")}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 items-center justify-end">
                    <button
                      onClick={() => handleAdminAction("REJECT")}
                      disabled={actionLoading}
                      className={cn("px-4 py-2 border font-bold uppercase tracking-wider text-[10px] rounded-lg transition-all cursor-pointer", isDark ? "bg-red-950/20 text-red-400 border-red-900/50 hover:bg-red-950/40" : "bg-red-50 text-red-600 hover:bg-red-100 border-red-200/50")}
                    >
                      Reject Report
                    </button>

                    <button
                      onClick={() => handleAdminAction("CORRECTION")}
                      disabled={actionLoading}
                      className={cn("px-4 py-2 border font-bold uppercase tracking-wider text-[10px] rounded-lg transition-all cursor-pointer", isDark ? "bg-indigo-950/20 text-indigo-400 border-indigo-900/50 hover:bg-indigo-950/40" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-200/50")}
                    >
                      Request Correction
                    </button>

                    <button
                      onClick={() => handleAdminAction("VERIFY")}
                      disabled={actionLoading}
                      className={cn("px-4 py-2 border font-bold uppercase tracking-wider text-[10px] rounded-lg transition-all cursor-pointer", isDark ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/50 hover:bg-emerald-950/40" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200/50")}
                    >
                      Mark Verified
                    </button>

                    <button
                      onClick={() => handleAdminAction("APPROVE")}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 font-bold uppercase tracking-wider text-[10px] rounded-lg transition-all shadow-sm cursor-pointer"
                    >
                      Approve Report
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
