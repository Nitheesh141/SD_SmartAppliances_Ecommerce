"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Search, 
  ArrowLeft, 
  Loader2, 
  CheckCircle, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  FileText, 
  ShieldAlert, 
  HelpCircle,
  Copy,
  Info
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { navLinks, footerColumns, socialLinks } from "../LandingPage/data/navigation";
import Link from "next/link";

function TrackServiceRequestContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [ticketId, setTicketId] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [request, setRequest] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const ticketIdParam = searchParams.get("ticketId");
  const mobileNumberParam = searchParams.get("mobileNumber");

  useEffect(() => {
    if (ticketIdParam && mobileNumberParam) {
      setTicketId(ticketIdParam);
      setMobileNumber(mobileNumberParam);
      performTracking(ticketIdParam, mobileNumberParam);
    }
  }, [ticketIdParam, mobileNumberParam]);

  const performTracking = async (tId: string, phone: string) => {
    if (!tId.trim() || !phone.trim()) {
      return;
    }
    
    setLoading(true);
    setErrorMsg("");
    setRequest(null);

    try {
      const res = await fetch("http://localhost:5000/api/service-requests/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ticketId: tId.trim(),
          mobileNumber: phone.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        setRequest(data.data);
      } else {
        setErrorMsg(data.message || "Invalid Ticket ID or Mobile Number.");
        toast.error(data.message || "Invalid Ticket ID or Mobile Number.");
      }
    } catch (err: any) {
      console.error("Tracking request failed:", err);
      setErrorMsg("Failed to connect to the server. Please try again later.");
      toast.error("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId.trim()) {
      toast.error("Please enter a Ticket ID");
      return;
    }
    if (!mobileNumber.trim()) {
      toast.error("Please enter your Mobile Number");
      return;
    }
    if (mobileNumber.trim().length !== 10) {
      toast.error("Mobile Number must be exactly 10 digits");
      return;
    }

    // Update query params in URL without full refresh for sharing/bookmarking
    router.replace(`/track-service-request?ticketId=${encodeURIComponent(ticketId.trim())}&mobileNumber=${encodeURIComponent(mobileNumber.trim())}`);
    performTracking(ticketId, mobileNumber);
  };

  const getTimelineIndex = (status: string) => {
    const s = status || "";
    if (["Service Completed", "Customer Feedback", "Closed", "Ready For Delivery", "Delivered"].includes(s)) return 5;
    if (["Technician On The Way", "Reached Customer Location", "Inspection Started", "Repair In Progress", "Waiting For Spare Parts"].includes(s)) return 4;
    if (s === "Technician Assigned") return 3;
    if (s === "Request Accepted") return 2;
    if (s === "Warranty Verified") return 1;
    return 0; // Request Submitted
  };

  const currentActiveIndex = request ? getTimelineIndex(request.currentStatus) : 0;

  const timelineSteps = [
    { label: "Request Submitted", key: "Request Submitted" },
    { label: "Warranty Verification", key: "Warranty Verified" },
    { label: "Request Accepted", key: "Request Accepted" },
    { label: "Technician Assigned", key: "Technician Assigned" },
    { label: "Technician On The Way", key: "Technician On The Way" },
    { label: "Service Completed", key: "Service Completed" }
  ];

  const handleCopyValue = (val: string, label: string) => {
    navigator.clipboard.writeText(val);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto w-full">
      {/* Header Row */}
      <div className="flex items-center gap-3 border-b border-neutral-100 dark:border-slate-800 pb-4">
        <Link
          href="/service-request"
          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors cursor-pointer text-neutral-800 dark:text-neutral-200"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white">Track Your Service Request</h1>
          <p className="text-xs text-neutral-500">Enter your Ticket ID and Mobile Number to check your service request status</p>
        </div>
      </div>

      {/* Input Search Form Card */}
      <form onSubmit={handleTrackSubmit} className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 space-y-6 shadow-md text-left">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Ticket ID <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              placeholder="e.g. SR-2026-000001"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              className="w-full px-4 py-2.5 border border-neutral-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white text-sm rounded-xl focus:border-[#E11D2E] focus:ring-2 focus:ring-[#E11D2E]/20 outline-none transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Mobile Number <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              placeholder="Enter your 10-digit mobile number"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
              className="w-full px-4 py-2.5 border border-neutral-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white text-sm rounded-xl focus:border-[#E11D2E] focus:ring-2 focus:ring-[#E11D2E]/20 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-[#E11D2E] hover:bg-[#c11524] disabled:bg-neutral-350 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-red-500/10 cursor-pointer flex items-center justify-center gap-2 min-w-[140px]"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Tracking...</span>
              </>
            ) : (
              <>
                <Search size={14} />
                <span>Track Status</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error state display */}
      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl text-left flex items-start gap-3">
          <ShieldAlert className="text-red-500 mt-0.5 flex-shrink-0" size={18} />
          <div>
            <h4 className="text-sm font-bold text-red-800 dark:text-red-300">Tracking Failed</h4>
            <p className="text-xs text-red-650 dark:text-red-400 mt-1">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Success details response */}
      {request && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* Main Status Timeline Card */}
          <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-md text-left space-y-8">
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#E11D2E] bg-[#E11D2E]/15 px-2.5 py-1 rounded-full">
                  {request.currentStatus}
                </span>
                <h3 className="text-lg font-black text-neutral-900 dark:text-white mt-2 flex items-center gap-2">
                  <span>Ticket Details:</span>
                  <span className="font-mono text-[#E11D2E]">{request.ticketId}</span>
                  <button 
                    type="button" 
                    onClick={() => handleCopyValue(request.ticketId, "Ticket ID")} 
                    className="p-1 rounded text-neutral-450 hover:text-[#E11D2E] hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Copy size={13} />
                  </button>
                </h3>
              </div>
              <div className="text-xs text-neutral-400">
                Logged Date: <span className="font-semibold text-neutral-700 dark:text-neutral-350">{new Date(request.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
            </div>

            {/* Ticket Info details list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm">
              <div>
                <p className="text-neutral-400 text-xs uppercase tracking-wider mb-0.5">Customer Name</p>
                <p className="font-bold text-neutral-850 dark:text-neutral-200">{request.contactPersonName || "Guest User"}</p>
              </div>
              <div>
                <p className="text-neutral-400 text-xs uppercase tracking-wider mb-0.5">Product Name</p>
                <p className="font-bold text-neutral-850 dark:text-neutral-200">{request.product?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-neutral-400 text-xs uppercase tracking-wider mb-0.5">SKU Code</p>
                <p className="font-mono font-bold text-neutral-850 dark:text-neutral-200">{request.product?.sku || "N/A"}</p>
              </div>
              <div>
                <p className="text-neutral-400 text-xs uppercase tracking-wider mb-0.5">Service Category</p>
                <p className="font-bold text-neutral-850 dark:text-neutral-200">{request.serviceCategory}</p>
              </div>
              <div>
                <p className="text-neutral-400 text-xs uppercase tracking-wider mb-0.5">Warranty Status</p>
                <p className={`font-bold flex items-center gap-1.5 ${request.warrantyStatus === "Under Warranty" ? "text-green-600" : "text-red-500"}`}>
                  <span>{request.warrantyStatus === "Under Warranty" ? "🟢 Under Warranty" : "🔴 Warranty Expired"}</span>
                </p>
              </div>
              <div>
                <p className="text-neutral-400 text-xs uppercase tracking-wider mb-0.5">Complete Address</p>
                <p className="text-neutral-850 dark:text-neutral-200 font-semibold text-xs leading-normal">
                  {request.pickupAddress} {request.pincode && `, ${request.pincode}`}
                </p>
              </div>
            </div>

            {/* Custom Status Timeline */}
            <div className="space-y-4 pt-4 border-t border-neutral-100 dark:border-slate-800">
              <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400">Request Timeline</h4>
              
              {/* Timeline Layout */}
              <div className="relative flex justify-between items-center w-full pt-4 px-2 select-none overflow-x-auto min-w-0">
                <div className="absolute top-[34px] left-[30px] right-[30px] h-[3px] bg-neutral-200 dark:bg-slate-800 -z-0"></div>
                
                {timelineSteps.map((step, idx) => {
                  const isCompleted = idx <= currentActiveIndex;
                  const isActive = idx === currentActiveIndex;

                  return (
                    <div key={idx} className="flex flex-col items-center space-y-2.5 relative z-10 w-16 sm:w-24 text-center">
                      <div className={`w-9 h-9 rounded-full border-3 flex items-center justify-center transition-all ${
                        isCompleted 
                          ? isActive 
                            ? "bg-[#E11D2E] border-[#E11D2E] text-white shadow-md shadow-red-500/25 scale-110" 
                            : "bg-green-500 border-green-500 text-white" 
                          : "bg-white dark:bg-slate-900 border-neutral-300 dark:border-slate-805 text-neutral-405 dark:text-neutral-600"
                      }`}>
                        {isCompleted && !isActive ? (
                          <CheckCircle size={18} className="stroke-[3]" />
                        ) : (
                          <span className="text-xs font-black">{idx + 1}</span>
                        )}
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-wider leading-tight max-w-[80px] sm:max-w-none transition-colors ${
                        isActive ? "text-[#E11D2E]" : isCompleted ? "text-neutral-800 dark:text-neutral-250" : "text-neutral-400"
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Technician Assignment Details Card (Only rendered if technician assigned) */}
          {request.technicianName && (
            <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-md text-left space-y-6 animate-in zoom-in-95 duration-200">
              
              <div className="flex items-center gap-2.5 border-b border-neutral-100 dark:border-slate-800 pb-3">
                <div className="w-8 h-8 rounded-lg bg-[#E11D2E]/10 flex items-center justify-center text-[#E11D2E]">
                  <User size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-neutral-850 dark:text-white">Assigned Technician Details</h3>
                  <p className="text-[10px] text-neutral-400">Technician has been scheduled to visit your site</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <p className="text-neutral-400 text-xs uppercase tracking-wider mb-0.5">Technician Name</p>
                  <p className="font-bold text-neutral-850 dark:text-neutral-200">{request.technicianName}</p>
                </div>

                <div>
                  <p className="text-neutral-400 text-xs uppercase tracking-wider mb-0.5">Mobile Number</p>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-neutral-850 dark:text-neutral-200">{request.technicianPhone || "N/A"}</p>
                    {request.technicianPhone && (
                      <button 
                        type="button" 
                        onClick={() => handleCopyValue(request.technicianPhone, "Technician Mobile")} 
                        className="p-1 rounded text-neutral-450 hover:text-[#E11D2E] hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Copy size={12} />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-neutral-400 text-xs uppercase tracking-wider mb-0.5">Expected Visit Date</p>
                  <p className="font-bold text-neutral-850 dark:text-neutral-200">
                    {request.expectedVisitDate 
                      ? new Date(request.expectedVisitDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) 
                      : "N/A"
                    }
                  </p>
                </div>
              </div>

              {request.inspectionRemarks && (
                <div className="p-4 bg-neutral-50 dark:bg-slate-950/60 border border-neutral-200/60 dark:border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1">
                    <Info size={10} />
                    <span>Admin Remarks</span>
                  </span>
                  <p className="text-xs text-neutral-600 dark:text-neutral-350 leading-relaxed font-semibold">
                    {request.inspectionRemarks}
                  </p>
                </div>
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default function TrackServiceRequestPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 font-sans text-neutral-800 dark:text-neutral-250">
      <Header navLinks={navLinks} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center flex flex-col items-center justify-start min-h-[60vh]">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 size={36} className="text-[#E11D2E] animate-spin" />
            <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Loading tracking parameters...</p>
          </div>
        }>
          <TrackServiceRequestContent />
        </Suspense>
      </main>

      <Footer footerColumns={footerColumns} socialLinks={socialLinks} />
    </div>
  );
}
