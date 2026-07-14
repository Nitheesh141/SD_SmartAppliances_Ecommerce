"use client";
import { ENV } from "@/config/env";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";
import { 
  Loader2, Search, RefreshCw, X,
  MessageSquare, Mail, Phone, Clock, Save, Edit3
} from "lucide-react";
import SalesSidebar from "@/components/layout/SalesSidebar";
import { cn } from "@/lib/utils";

interface EnquiryType {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: string; // PENDING, CONTACTED, QUOTATION_SENT, CLOSED
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function SalesEnquiriesPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [enquiries, setEnquiries] = useState<EnquiryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Follow-up editing states
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryType | null>(null);
  const [status, setStatus] = useState("PENDING");
  const [remarks, setRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Route protection
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user || user.role !== "SALESPERSON") {
        toast.error("Access Denied. Sales Persons only.");
        router.push("/auth/login");
      }
    }
  }, [isAuthenticated, user, authLoading, router]);

  // Fetch enquiries
  const fetchEnquiries = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const res = await fetch(`${ENV.API_BASE_URL}/sales-persons/my-enquiries`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.success) {
        setEnquiries(data.enquiries || []);
      } else {
        if (!isBackground) toast.error(data.message || "Failed to fetch enquiries");
      }
    } catch (err) {
      console.error("Error fetching enquiries:", err);
      if (!isBackground) toast.error("Failed to load enquiries");
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === "SALESPERSON") {
      fetchEnquiries(false);
    }
  }, [isAuthenticated, user]);

  const handleOpenEdit = (enquiry: EnquiryType) => {
    setSelectedEnquiry(enquiry);
    setStatus(enquiry.status);
    setRemarks(enquiry.remarks || "");
  };

  const handleUpdateEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnquiry) return;
    setActionLoading(selectedEnquiry.id);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${ENV.API_BASE_URL}/sales-persons/my-enquiries/${selectedEnquiry.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status, remarks })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Enquiry status updated successfully!");
        setEnquiries(prev => 
          prev.map(enq => enq.id === selectedEnquiry.id ? { ...enq, status, remarks } : enq)
        );
        setSelectedEnquiry(null);
      } else {
        toast.error(data.message || "Failed to update enquiry");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit remark update");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredEnquiries = useMemo(() => {
    return enquiries.filter(enq => {
      const q = searchQuery.toLowerCase();
      return (
        enq.name.toLowerCase().includes(q) ||
        enq.email.toLowerCase().includes(q) ||
        enq.phone.includes(q) ||
        enq.message.toLowerCase().includes(q) ||
        (enq.remarks && enq.remarks.toLowerCase().includes(q))
      );
    });
  }, [enquiries, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-neutral-50 text-slate-900 transition-colors duration-300 font-sans">
      {/* Sidebar */}
      <SalesSidebar currentPath="/sales/enquiries" />

      {/* Main Content Area */}
      <main className="flex-1 px-6 lg:pl-72 py-8 overflow-y-auto text-left">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 mb-8 border-neutral-200">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#1C1C1C] uppercase">
              Customer Enquiries
            </h1>
            <p className="text-xs font-bold text-neutral-500 uppercase mt-1">
              View sales leads, add follow-up remarks, and update quotation states
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone, message content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none text-sm transition-all bg-white border-neutral-200 text-slate-900 focus:border-[#D71920]"
            />
          </div>
          
          <button
            onClick={() => fetchEnquiries(false)}
            disabled={loading}
            className="flex items-center justify-center p-3 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-slate-700 transition-all cursor-pointer"
          >
            <RefreshCw size={18} className={cn(loading && "animate-spin")} />
          </button>
        </div>

        {/* Table / List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-[#D71920]" size={36} />
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
              Fetching Enquiries...
            </p>
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-neutral-200 bg-white p-6">
            <MessageSquare size={48} className="mx-auto mb-4 text-neutral-450" />
            <h3 className="font-bold text-lg">No Enquiries Assigned</h3>
            <p className="text-sm text-neutral-500 mt-1">
              You do not have any pending customer enquiries assigned to you.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {filteredEnquiries.map((enq) => (
              <div key={enq.id} className="p-5 rounded-2xl border bg-white border-neutral-200 flex flex-col gap-4 text-xs font-semibold justify-between transition-all hover:scale-[1.01] duration-200">
                {/* Submitter and Status */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-black text-sm text-[#1C1C1C] uppercase">{enq.name}</h3>
                    <div className="flex items-center gap-1.5 text-neutral-500 mt-1 font-mono text-[10px]">
                      <Clock size={11} />
                      <span>{new Date(enq.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <span className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider",
                    enq.status === "CLOSED"
                      ? "bg-green-500/10 text-green-600"
                      : enq.status === "QUOTATION_SENT"
                        ? "bg-blue-500/10 text-blue-600"
                        : enq.status === "CONTACTED"
                          ? "bg-orange-500/10 text-orange-600"
                          : "bg-red-500/10 text-red-600"
                  )}>
                    {enq.status}
                  </span>
                </div>

                {/* Submitter Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-neutral-500">
                  <div className="flex items-center gap-1.5">
                    <Mail size={12} className="text-neutral-500 shrink-0" />
                    <span className="truncate">{enq.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone size={12} className="text-neutral-500 shrink-0" />
                    <span>{enq.phone}</span>
                  </div>
                </div>

                {/* Message & Remarks */}
                <div className="p-3 rounded-xl border bg-neutral-50 border-neutral-200 flex flex-col gap-2 leading-relaxed text-[11px]">
                  <div>
                    <span className="text-[9px] font-black text-neutral-500 uppercase tracking-wider block mb-0.5">Message</span>
                    <p className="font-medium text-neutral-700">&ldquo;{enq.message}&rdquo;</p>
                  </div>
                  
                  {enq.remarks && (
                    <div className="border-t border-neutral-200/50 pt-2 mt-1">
                      <span className="text-[9px] font-black text-neutral-500 uppercase tracking-wider block mb-0.5">Remarks</span>
                      <p className="font-semibold text-[#D71920]">{enq.remarks}</p>
                    </div>
                  )}
                </div>

                {/* Action button */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => handleOpenEdit(enq)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#D71920] hover:bg-[#b8141a] text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-[#D71920]/10 cursor-pointer"
                  >
                    <Edit3 size={13} />
                    <span>Update Follow-up</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Remark update modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={() => setSelectedEnquiry(null)} />
          
          <div className="relative w-full max-w-md transform rounded-2xl p-6 shadow-2xl transition-all border border-neutral-200 bg-white text-slate-900 text-left">
            <button
              onClick={() => setSelectedEnquiry(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-black uppercase text-[#D71920] mb-5">
              Update Enquiry Status
            </h3>

            <form onSubmit={handleUpdateEnquiry} className="space-y-4">
              {/* Client Info Summary */}
              <div className="p-3.5 rounded-xl border bg-neutral-50 border-neutral-200 text-[11px]">
                <div className="font-extrabold text-xs text-neutral-800 uppercase">{selectedEnquiry.name}</div>
                <div className="text-neutral-500 mt-1">{selectedEnquiry.email} &bull; {selectedEnquiry.phone}</div>
              </div>

              {/* Status Dropdown */}
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">Lead Status *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-slate-900 text-xs font-bold uppercase"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="CONTACTED">CONTACTED</option>
                  <option value="QUOTATION_SENT">QUOTATION SENT</option>
                  <option value="CLOSED">CLOSED (RESOLVED)</option>
                </select>
              </div>

              {/* Follow-up Remarks */}
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">Follow-up Remarks</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 text-slate-900 text-xs font-medium resize-none"
                  placeholder="Describe details of client interaction, pricing discussions..."
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 mt-6">
                <button
                  type="button"
                  onClick={() => setSelectedEnquiry(null)}
                  className="px-4 py-2 border border-neutral-200 bg-white hover:bg-neutral-50 text-slate-705 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === selectedEnquiry.id}
                  className="flex items-center justify-center gap-2 px-5 py-2 bg-[#D71920] hover:bg-[#b8141a] text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-lg shadow-[#D71920]/10"
                >
                  {actionLoading === selectedEnquiry.id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Save size={13} />
                  )}
                  <span>Save Updates</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
