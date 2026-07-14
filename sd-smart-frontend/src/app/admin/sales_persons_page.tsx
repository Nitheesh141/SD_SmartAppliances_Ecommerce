"use client";
import { ENV } from "@/config/env";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";
import { 
  Loader2, Shield, Search, RefreshCw, Check, X, Trash2, Edit2, Plus,
  User, Mail, Phone, MapPin, CheckSquare, Square
} from "lucide-react";
import AdminSidebar from "@/components/layout/AdminSidebar";
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
  createdAt: string;
  distributors: { id: string; companyName: string | null; firstName: string; lastName: string }[];
}

interface DistributorType {
  id: string;
  companyName: string | null;
  firstName: string; // contact person
  lastName: string;  // distributor name
}

export default function AdminSalesPersonsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [salesPersons, setSalesPersons] = useState<SalesPersonType[]>([]);
  const [distributors, setDistributors] = useState<DistributorType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields State
  const [employeeId, setEmployeeId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [assignedRegion, setAssignedRegion] = useState("");
  const [assignedState, setAssignedState] = useState("");
  const [assignedDistrict, setAssignedDistrict] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [selectedDistributors, setSelectedDistributors] = useState<string[]>([]);

  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("admin-theme") as "light" | "dark") || "dark";
    }
    return "dark";
  });

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

  // Fetch Sales Persons
  const fetchSalesPersons = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const res = await fetch(`${ENV.API_BASE_URL}/sales-persons/admin/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.success) {
        setSalesPersons(data.salesPersons || []);
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
      fetchDistributors();
    }
  }, [isAuthenticated]);

  // Open Create Modal
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
    setSelectedDistributors([]);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (sp: SalesPersonType) => {
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
    setSelectedDistributors(sp.distributors?.map(d => d.id) || []);
    setIsModalOpen(true);
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
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
        status,
        distributorIds: selectedDistributors
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

  // Toggle status
  const handleToggleStatus = async (id: string, currentStatus: string) => {
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
  const handleDelete = async (id: string) => {
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
        setSalesPersons(prev => prev.filter(sp => sp.id !== id));
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

  // Toggle distributor selection in checklist
  const handleToggleDistributor = (distId: string) => {
    setSelectedDistributors(prev => 
      prev.includes(distId) ? prev.filter(id => id !== distId) : [...prev, distId]
    );
  };

  // Filter lists
  const filteredSalesPersons = useMemo(() => {
    return salesPersons.filter(sp => {
      const q = searchQuery.toLowerCase();
      return (
        sp.fullName.toLowerCase().includes(q) ||
        sp.employeeId.toLowerCase().includes(q) ||
        sp.email.toLowerCase().includes(q) ||
        sp.mobileNumber.includes(q) ||
        sp.assignedDistrict.toLowerCase().includes(q) ||
        sp.assignedState.toLowerCase().includes(q)
      );
    });
  }, [salesPersons, searchQuery]);

  const isDark = theme === "dark";

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
          <div className="text-center py-20 rounded-2xl border border-dashed border-neutral-850 p-6">
            <User size={48} className="mx-auto mb-4 text-neutral-500" />
            <h3 className="font-bold text-lg">No Sales Persons Found</h3>
            <p className="text-sm text-neutral-400 mt-1">
              Try adjusting your search criteria or register a new Sales Person to get started.
            </p>
          </div>
        ) : (
          <div className={cn(
            "overflow-x-auto rounded-xl border",
            isDark ? "border-neutral-800 bg-[#0d0d0d]" : "border-neutral-200 bg-white"
          )}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={cn(
                  "border-b text-xs font-bold uppercase tracking-wider",
                  isDark ? "border-neutral-850 text-neutral-400 bg-neutral-950/40" : "border-neutral-200 text-neutral-500 bg-neutral-50"
                )}>
                  <th className="py-4 px-6">ID / Name</th>
                  <th className="py-4 px-6">Contact info</th>
                  <th className="py-4 px-6">Assigned territory</th>
                  <th className="py-4 px-6">Distributors</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/20">
                {filteredSalesPersons.map((sp) => (
                  <tr key={sp.id} className={cn(
                    "text-sm transition-colors",
                    isDark ? "hover:bg-neutral-900/30" : "hover:bg-neutral-50/50"
                  )}>
                    <td className="py-4 px-6">
                      <div className="font-bold text-[#1C1C1C] dark:text-white">{sp.fullName}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">Emp ID: {sp.employeeId}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Mail size={12} className="text-neutral-500" />
                        <span>{sp.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs mt-1">
                        <Phone size={12} className="text-neutral-500" />
                        <span>{sp.mobileNumber}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1 text-xs">
                        <MapPin size={12} className="text-neutral-500" />
                        <span>{sp.assignedDistrict}, {sp.assignedState} ({sp.assignedRegion})</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="max-w-[200px] truncate font-semibold text-xs">
                        {sp.distributors && sp.distributors.length > 0 ? (
                          sp.distributors.map(d => d.companyName || `${d.firstName} ${d.lastName}`).join(", ")
                        ) : (
                          <span className="text-neutral-500 italic">None Assigned</span>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5 font-bold uppercase">
                        {sp.distributors?.length || 0} distributor(s)
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggleStatus(sp.id, sp.status)}
                        disabled={actionLoading === sp.id}
                        className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer",
                          sp.status === "ACTIVE" 
                            ? "bg-green-500/10 text-green-500" 
                            : "bg-red-500/10 text-red-500"
                        )}
                      >
                        {actionLoading === sp.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        )}
                        <span>{sp.status}</span>
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(sp)}
                          disabled={actionLoading !== null}
                          className={cn(
                            "p-2 rounded-lg border transition-all cursor-pointer",
                            isDark ? "border-neutral-850 hover:bg-neutral-900 text-white" : "border-neutral-200 hover:bg-neutral-50 text-slate-700"
                          )}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(sp.id)}
                          disabled={actionLoading !== null}
                          className="p-2 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-red-500 transition-all cursor-pointer"
                        >
                          {actionLoading === sp.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Creation / Editing Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
          <div className={cn(
            "relative w-full max-w-2xl transform rounded-2xl p-6 shadow-2xl transition-all border border-neutral-800 text-left overflow-y-auto max-h-[90vh]",
            isDark ? "bg-[#0d0d0d] text-white" : "bg-white text-slate-900"
          )}>
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black uppercase text-[#D71920] mb-6">
              {isEditing ? "Edit Sales Person" : "Create Sales Person"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
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

              {/* Assigned Distributors Checkbox List */}
              <div className="mt-4">
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Assign Distributors</label>
                <div className={cn(
                  "p-4 rounded-xl border max-h-[160px] overflow-y-auto space-y-2.5",
                  isDark ? "bg-neutral-950 border-neutral-800" : "bg-neutral-50 border-neutral-200"
                )}>
                  {distributors.length === 0 ? (
                    <p className="text-xs text-neutral-500 italic">No distributors available to assign</p>
                  ) : (
                    distributors.map((d) => {
                      const isChecked = selectedDistributors.includes(d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => handleToggleDistributor(d.id)}
                          className="flex items-center gap-2.5 w-full text-left text-xs font-semibold hover:text-[#D71920] transition-colors cursor-pointer"
                        >
                          {isChecked ? (
                            <CheckSquare size={16} className="text-[#D71920]" />
                          ) : (
                            <Square size={16} className="text-neutral-500" />
                          )}
                          <span>{d.companyName || `${d.firstName} ${d.lastName}`}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-850 mt-6">
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
    </div>
  );
}
