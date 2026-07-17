"use client";
import { ENV } from "@/config/env";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";
import { 
  Loader2, Search, RefreshCw, X, MessageSquare, 
  Calendar, Check, User, Mail, Phone, ShoppingBag, 
  TrendingUp, AlertCircle, ArrowUpRight, Plus,
  PhoneCall, Send, FileText, CheckCircle, HelpCircle, Clock,
  ArrowUpRight as ArrowUpRightIcon
} from "lucide-react";
import SalesSidebar from "@/components/layout/SalesSidebar";
import { cn } from "@/lib/utils";

interface FollowUpType {
  id: string;
  distributorEnquiryId: string;
  actionType: string; // "CALL", "EMAIL", "REMARK", "STATUS_CHANGE"
  remarks: string;
  performedById: string;
  performedBy: {
    id: string;
    fullName: string;
    employeeId: string;
  };
  createdAt: string;
}

interface EnquiryType {
  id: string;
  distributorId: string;
  productId: string;
  quantity: number;
  message: string | null;
  status: string; // "New", "Assigned", "Contacted", "Quotation Sent", "Negotiation", "Converted to Order", "Closed"
  salesPersonId: string | null;
  viewedByAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  distributor: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    companyName: string;
  };
  product: {
    id: string;
    name: string;
    category: string;
    categoryLabel: string;
    image: string | null;
    price: number;
  };
  followUps: FollowUpType[];
}

export default function SalesDistributorEnquiriesPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [enquiries, setEnquiries] = useState<EnquiryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  
  // Follow Up Form States
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryType | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"CALL" | "EMAIL" | "REMARK" | "STATUS_CHANGE">("REMARK");
  const [remarks, setRemarks] = useState("");
  const [newStatus, setNewStatus] = useState("Contacted");
  const [actionLoading, setActionLoading] = useState(false);

  // Route protection
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user || user.role?.toUpperCase() !== "SALESPERSON") {
        toast.error("Access Denied. Sales Persons only.");
        router.push("/auth/login");
      }
    }
  }, [isAuthenticated, user, authLoading, router]);

  // Fetch Assigned Enquiries
  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const res = await fetch(`${ENV.API_BASE_URL}/distributor-enquiries/sales/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setEnquiries(data.enquiries);
        // Refresh selected enquiry to display updated history
        if (selectedEnquiry) {
          const updated = data.enquiries.find((x: EnquiryType) => x.id === selectedEnquiry.id);
          if (updated) {
            setSelectedEnquiry(updated);
          }
        }
      }
    } catch (err) {
      console.error("Fetch sales enquiries error:", err);
      toast.error("Failed to load assigned enquiries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role?.toUpperCase() === "SALESPERSON") {
      fetchEnquiries();
    }
  }, [isAuthenticated, user]);

  // Filtered Enquiries
  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((e) => {
      const companyName = e.distributor.companyName || "";
      const contactPerson = `${e.distributor.firstName} ${e.distributor.lastName}`;
      const matchesSearch = 
        companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.product.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || e.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [enquiries, searchQuery, statusFilter]);

  // Handle follow up submit
  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnquiry || !remarks.trim()) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const body = {
        enquiryId: selectedEnquiry.id,
        actionType,
        remarks,
        newStatus: actionType === "STATUS_CHANGE" ? newStatus : undefined
      };

      const res = await fetch(`${ENV.API_BASE_URL}/distributor-enquiries/sales/follow-up`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Follow-up logged successfully!");
        setRemarks("");
        // Reset type
        setActionType("REMARK");
        fetchEnquiries();
      } else {
        toast.error(data.message || "Failed to log follow-up");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit follow-up details");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "New":
        return "bg-blue-50 text-blue-600 border border-blue-200/50";
      case "Assigned":
        return "bg-yellow-50 text-yellow-600 border border-yellow-200/50";
      case "Contacted":
        return "bg-purple-50 text-purple-600 border border-purple-200/50";
      case "Quotation Sent":
        return "bg-indigo-50 text-indigo-600 border border-indigo-200/50";
      case "Negotiation":
        return "bg-orange-50 text-orange-600 border border-orange-200/50";
      case "Converted to Order":
        return "bg-green-50 text-green-600 border border-green-200/50";
      case "Closed":
        return "bg-neutral-100 text-neutral-500 border border-neutral-200/50";
      default:
        return "bg-neutral-100 text-neutral-500 border border-neutral-200/50";
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case "CALL":
        return <Phone size={10} className="text-[#D71920]" />;
      case "EMAIL":
        return <Mail size={10} className="text-[#D71920]" />;
      case "STATUS_CHANGE":
        return <Check size={10} className="text-[#D71920]" />;
      case "REMARK":
      default:
        return <FileText size={10} className="text-[#D71920]" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-neutral-50 text-slate-900 transition-colors duration-300 font-sans">
      {/* Sidebar */}
      <SalesSidebar currentPath="/sales/distributor-enquiries" />

      {/* Main Area */}
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 md:p-8 overflow-y-auto text-left">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 mb-8 border-neutral-200">
          <div>
            <span className="text-xs font-bold text-[#D71920] uppercase tracking-widest">
              Distributor Workspace
            </span>
            <h1 className="text-3xl font-black tracking-tight text-neutral-900 uppercase mt-0.5">
              Assigned Enquiries
            </h1>
            <p className="text-xs font-bold text-neutral-500 uppercase mt-0.5">
              Manage your assigned distributor price requests, log updates, and track conversions
            </p>
          </div>

          <button
            onClick={fetchEnquiries}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-neutral-200 hover:bg-neutral-100 bg-white rounded-xl text-xs font-bold transition-all cursor-pointer w-fit text-slate-700"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
            <input
              type="text"
              placeholder="Search by company, contact person, or product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-slate-800 outline-none focus:border-[#D71920] text-xs font-semibold"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto sidebar-scrollbar pb-1 max-w-full">
            {["ALL", "Assigned", "Contacted", "Quotation Sent", "Negotiation", "Converted to Order", "Closed"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap",
                  statusFilter === st
                    ? "bg-[#D71920] border-[#D71920] text-white"
                    : "bg-white border-neutral-200 text-slate-600 hover:text-slate-900"
                )}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={36} className="animate-spin text-[#D71920]" />
            <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Loading your enquiries...</p>
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-neutral-200 border-dashed bg-white">
            <MessageSquare size={32} className="text-neutral-400 mb-3" />
            <h4 className="text-sm font-bold uppercase mb-1">No Enquiries Found</h4>
            <p className="text-xs text-neutral-500 max-w-sm">
              You do not have any assigned enquiries matching the criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredEnquiries.map((e) => {
              const companyName = e.distributor.companyName || "N/A";
              const contactPerson = `${e.distributor.firstName} ${e.distributor.lastName}`;
              const formattedDate = new Date(e.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric"
              });

              return (
                <div
                  key={e.id}
                  onClick={() => {
                    setSelectedEnquiry(e);
                    setIsLogModalOpen(true);
                  }}
                  className="relative flex flex-col rounded-2xl border border-neutral-200 p-5 bg-white hover:border-[#D71920]/40 transition-all hover:shadow-lg cursor-pointer text-left select-none group"
                >
                  <div className="flex justify-between items-start mb-3.5">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase whitespace-nowrap border",
                      getStatusBadge(e.status)
                    )}>
                      {e.status}
                    </span>
                    <span className="text-[10px] text-neutral-450 font-bold">{formattedDate}</span>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-black text-base text-slate-800 group-hover:text-[#D71920] transition-colors line-clamp-1 leading-tight">
                      {companyName}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1 font-semibold">
                      Person: {contactPerson}
                    </p>
                  </div>

                  {/* Product block */}
                  <div className="p-3 bg-neutral-50 border border-neutral-200/60 rounded-xl mb-4 flex items-center gap-2.5">
                    {e.product.image && (
                      <img 
                        src={e.product.image} 
                        alt={e.product.name} 
                        className="w-10 h-10 rounded-lg object-contain bg-white border border-neutral-200 shrink-0" 
                      />
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-black truncate text-slate-800">{e.product.name}</div>
                      <div className="text-[9px] text-neutral-500 font-bold uppercase mt-0.5">
                        Qty Required: <span className="text-slate-900 font-extrabold">{e.quantity} Units</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact details */}
                  <div className="text-[11px] text-neutral-500 font-semibold space-y-1 mt-auto">
                    <div className="flex items-center gap-1.5">
                      <Mail size={12} className="shrink-0 text-neutral-400" />
                      <span className="truncate">{e.distributor.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone size={12} className="shrink-0 text-neutral-400" />
                      <span>{e.distributor.phoneNumber || "No Mobile"}</span>
                    </div>
                  </div>

                  {/* Action Link Icon */}
                  <div className="absolute bottom-4 right-4 text-neutral-450 group-hover:text-[#D71920] transition-all">
                    <ArrowUpRight size={14} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Follow Up & History Modal */}
      {isLogModalOpen && selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" 
            onClick={() => setIsLogModalOpen(false)} 
          />

          <div className="relative w-full max-w-2xl transform rounded-3xl p-6 sm:p-8 shadow-2xl transition-all border border-neutral-200 bg-white text-slate-800 text-left overflow-y-auto max-h-[92vh] sidebar-scrollbar sm:pr-10">
            {/* Close Button */}
            <button
              onClick={() => setIsLogModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Title */}
            <div className="mb-5 border-b border-neutral-200 pb-4 text-left">
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase whitespace-nowrap mb-2 inline-block border",
                getStatusBadge(selectedEnquiry.status)
              )}>
                {selectedEnquiry.status}
              </span>
              <h3 className="text-xl font-black uppercase tracking-tight text-[#D71920]">
                {selectedEnquiry.distributor.companyName || "Distributor Enquiry"}
              </h3>
              <p className="text-xs font-bold text-neutral-500 uppercase mt-0.5">
                Contact: {selectedEnquiry.distributor.firstName} {selectedEnquiry.distributor.lastName} | Mob: {selectedEnquiry.distributor.phoneNumber || "N/A"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Log Follow-up Action */}
              <div>
                <h4 className="text-xs font-black uppercase text-neutral-400 mb-3 tracking-wider text-left">Log Follow-up Action</h4>
                
                <form onSubmit={handleFollowUpSubmit} className="space-y-4">
                  {/* Action Selector */}
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1.5 text-left">Action Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "REMARK", label: "Remarks Log", icon: FileText },
                        { id: "CALL", label: "Call Made", icon: PhoneCall },
                        { id: "EMAIL", label: "Email Sent", icon: Send },
                        { id: "STATUS_CHANGE", label: "Status Update", icon: CheckCircle }
                      ].map((act) => (
                        <button
                          key={act.id}
                          type="button"
                          onClick={() => {
                            setActionType(act.id as any);
                            if (act.id === "STATUS_CHANGE" && !newStatus) {
                              setNewStatus(selectedEnquiry.status);
                            }
                          }}
                          className={cn(
                            "flex items-center gap-1.5 p-2 rounded-lg border text-[11px] font-bold text-left transition-all cursor-pointer",
                            actionType === act.id
                              ? "bg-[#D71920]/10 border-[#D71920] text-[#D71920]"
                              : "bg-white border-neutral-200 text-slate-600 hover:text-slate-800"
                          )}
                        >
                          <act.icon size={12} className="shrink-0" />
                          <span>{act.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Status update selector if status update action selected */}
                  {actionType === "STATUS_CHANGE" && (
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1 text-left">Select Status</label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg outline-none text-slate-800 font-semibold"
                      >
                        {["Contacted", "Quotation Sent", "Negotiation", "Converted to Order", "Closed"].map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Message Remarks */}
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1 text-left">
                      Action Details / Remarks *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder={
                        actionType === "CALL"
                          ? "e.g., Called distributor. Discussed volume requirements, they requested standard price catalog."
                          : actionType === "EMAIL"
                            ? "e.g., Emailed bulk proposal sheet and smart appliance specifications."
                            : actionType === "STATUS_CHANGE"
                              ? "Describe reason for changing stage status..."
                              : "Enter log details..."
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-xl outline-none focus:border-[#D71920] text-slate-800 resize-none font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-[#D71920] hover:bg-[#b8141a] text-white text-xs font-black uppercase rounded-lg transition-colors cursor-pointer disabled:opacity-55"
                  >
                    {actionLoading && <Loader2 size={12} className="animate-spin" />}
                    <span>Submit Follow-up</span>
                  </button>
                </form>

                {/* Product Reference */}
                <div className="mt-5 p-3 rounded-xl border border-neutral-200 bg-neutral-50">
                  <div className="text-[10px] text-neutral-500 font-bold uppercase mb-1.5 text-left">Enquiry Product Details</div>
                  <div className="flex gap-2 text-left">
                    {selectedEnquiry.product.image && (
                      <img 
                        src={selectedEnquiry.product.image} 
                        alt={selectedEnquiry.product.name} 
                        className="w-12 h-12 rounded-lg object-contain bg-white border border-neutral-200 shrink-0"
                      />
                    )}
                    <div>
                      <div className="text-xs font-black leading-snug text-slate-800">{selectedEnquiry.product.name}</div>
                      <div className="text-[9px] text-[#D71920] font-black uppercase mt-0.5">{selectedEnquiry.product.categoryLabel}</div>
                      <div className="text-[10px] text-neutral-500 font-bold mt-1">Quantity: {selectedEnquiry.quantity} Units</div>
                    </div>
                  </div>
                  {selectedEnquiry.message && (
                    <div className="mt-2.5 pt-2.5 border-t border-neutral-200 text-[11px] text-neutral-500 italic text-left">
                      &ldquo;{selectedEnquiry.message}&rdquo;
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Follow-up Logs / History */}
              <div className="flex flex-col text-left">
                <h4 className="text-xs font-black uppercase text-neutral-400 mb-3 tracking-wider flex items-center gap-1.5">
                  <Clock size={12} />
                  <span>Enquiry History & Logs</span>
                </h4>

                <div className="flex-1 overflow-y-auto sidebar-scrollbar max-h-[350px] p-3 rounded-xl border border-neutral-200 space-y-3.5 bg-neutral-50">
                  {selectedEnquiry.followUps.length === 0 ? (
                    <p className="text-xs text-neutral-500 italic text-center py-10">No history logged yet</p>
                  ) : (
                    selectedEnquiry.followUps.map((log, index) => {
                      const logDate = new Date(log.createdAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit"
                      });

                      return (
                        <div key={log.id} className="relative flex gap-3 text-left">
                          {/* Timeline vertical connector */}
                          {index !== selectedEnquiry.followUps.length - 1 && (
                            <div className="absolute left-[9px] top-6 bottom-[-20px] w-[1px] bg-neutral-200" />
                          )}

                          <div className="w-5 h-5 rounded-full bg-white border border-neutral-300 flex items-center justify-center shrink-0">
                            {getActionIcon(log.actionType)}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-neutral-400 font-bold">{logDate}</span>
                              <span className="text-[9px] text-[#D71920] font-black uppercase bg-[#D71920]/10 px-1.5 py-0.5 rounded">
                                {log.actionType}
                              </span>
                            </div>
                            <p className="text-xs text-slate-700 mt-1 font-semibold leading-relaxed break-words">
                              {log.remarks}
                            </p>
                            <p className="text-[9px] text-neutral-400 font-bold uppercase mt-0.5">
                              Logged by: {log.performedBy.fullName}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
