"use client";
import { ENV } from "@/config/env";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";
import { 
  Headphones, Plus, ArrowLeft, Loader2, Calendar, FileText, MapPin, Phone, 
  CheckCircle, Clock, ShieldAlert, Image as ImageIcon, Eye, Download, Info,
  AlertCircle, ChevronRight, X, User, Search, Copy
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { navLinks, footerColumns, socialLinks } from "../LandingPage/data/navigation";
import { serviceRequestService } from "@/services/serviceRequestService";
import { productService } from "@/services/productService";
import { apiGet } from "@/utils/api";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { CustomDatePicker } from "@/components/ui/CustomDatePicker";
import { cn } from "@/lib/utils";

const SERVICE_CATEGORIES = [
  "Repair",
  "Installation",
  "Product Not Working",
  "Spare Parts Request"
];

const PRODUCT_CATEGORIES = [
  "Mixer Grinder",
  "Wet Grinder",
  "Pressure Cooker",
  "Gas Stove",
  "Induction Stove",
  "Chimney",
  "Rice Cooker"
];

const calculateWarrantyExpiry = (purchaseDateStr: string, warrantyText: string): { expiryDate: Date; isExpired: boolean } => {
  if (!purchaseDateStr) return { expiryDate: new Date(), isExpired: true };
  const purchaseDate = new Date(purchaseDateStr);
  const text = (warrantyText || "1 Year").trim().toLowerCase();
  
  const hasNoWarranty = 
    !text || 
    text === "0" || 
    text === "no" ||
    text.includes("no warranty") || 
    text.startsWith("0");

  if (hasNoWarranty) {
    return {
      expiryDate: new Date(purchaseDate),
      isExpired: true
    };
  }

  let monthsToAdd = 12; // Default to 1 Year

  const match = text.match(/(\d+)\s*(year|month|day|yr|mo|d)s?/);
  if (match && match[1] && match[2]) {
    const value = parseInt(match[1], 10);
    const unit = match[2];

    if (unit.startsWith("year") || unit.startsWith("yr")) {
      monthsToAdd = value * 12;
    } else if (unit.startsWith("month") || unit.startsWith("mo")) {
      monthsToAdd = value;
    } else if (unit.startsWith("day") || unit.startsWith("d")) {
      const expiryDate = new Date(purchaseDate);
      expiryDate.setDate(expiryDate.getDate() + value);
      const isExpired = expiryDate.getTime() < Date.now();
      return { expiryDate, isExpired };
    }
  }

  const expiryDate = new Date(purchaseDate);
  expiryDate.setMonth(expiryDate.getMonth() + monthsToAdd);
  const isExpired = expiryDate.getTime() < Date.now();
  return { expiryDate, isExpired };
};

const getStatusSteps = (warrantyStatus: string, currentStatus: string, cancellationReason?: string | null) => {
  const steps = [
    { label: "Request Submitted", key: "Request Submitted" },
    { label: "Warranty Verified", key: "Warranty Verified" },
    { label: "Request Accepted", key: "Request Accepted" },
    { label: "Technician Assigned", key: "Technician Assigned" },
    { label: "Technician Visiting", key: "Technician On The Way" },
    { label: "Reached Location", key: "Reached Customer Location" },
    { label: "Inspection Started", key: "Inspection Started" },
    { label: "Repair In Progress", key: "Repair In Progress" },
    { label: "Service Completed", key: "Service Completed" }
  ];

  if (currentStatus === "Request Rejected") {
    return [
      { label: "Request Submitted", key: "Request Submitted" },
      { label: "Request Rejected", key: "Request Rejected" }
    ];
  }

  // Filter or insert optional ones
  const filteredSteps = steps.filter(step => {
    if (step.key === "Customer Feedback" && currentStatus !== "Customer Feedback" && currentStatus !== "Closed") {
      return false;
    }
    return true;
  });

  // If status is Waiting For Spare Parts, insert it
  if (currentStatus === "Waiting For Spare Parts") {
    const idx = filteredSteps.findIndex(s => s.key === "Service Completed");
    if (idx !== -1) {
      filteredSteps.splice(idx, 0, { label: "Waiting For Spare Parts", key: "Waiting For Spare Parts" });
    }
  }

  return filteredSteps;
};

export default function ServiceRequestPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // View state: 'LIST' or 'CREATE'
  const [view, setView] = useState<"LIST" | "CREATE">("LIST");
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [purchasedProducts, setPurchasedProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Selected request details modal
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [respondingEstimate, setRespondingEstimate] = useState(false);

  const getEffectiveWarrantyStatus = (req: any) => {
    if (!req) return "";
    const items = req.distributorItems;
    if (items && Array.isArray(items) && items.length > 1) {
      return "Batch Request";
    }
    if (items && Array.isArray(items) && items.length === 1) {
      return items[0].warrantyStatus || req.warrantyStatus;
    }
    return req.warrantyStatus;
  };

  const getEffectiveCurrentStatus = (req: any) => {
    if (!req) return "";
    const items = req.distributorItems;
    if (items && Array.isArray(items) && items.length > 1) {
      return "Batch Process";
    }
    if (items && Array.isArray(items) && items.length === 1) {
      return items[0].currentStatus || req.currentStatus;
    }
    return req.currentStatus;
  };
  const [showCancelReasonModal, setShowCancelReasonModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");

  const isDistributor = user?.role === "DISTRIBUTOR";
  
  // Form input fields
  const [contactPersonName, setContactPersonName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [pincode, setPincode] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchasePlace, setPurchasePlace] = useState("");
  const [serviceCategory, setServiceCategory] = useState("Repair");
  const [issueDescription, setIssueDescription] = useState("");
  const [warrantyCard, setWarrantyCard] = useState("");
  const [uploading, setUploading] = useState(false);
  const [warrantyStatus, setWarrantyStatus] = useState<"Under Warranty" | "Warranty Expired" | null>(null);
  const [submittedRequest, setSubmittedRequest] = useState<any | null>(null);

  // Derived categories
  const categories = Array.from(new Set(allProducts.map(p => p.categoryLabel || p.category))).filter(Boolean);

  // View state initial sync
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        setView("CREATE");
      }
    }
  }, [authLoading, isAuthenticated]);

  // Poll request details when on the confirmation page
  useEffect(() => {
    if (!submittedRequest) return;
    
    const interval = setInterval(async () => {
      try {
        const res = await serviceRequestService.getServiceRequestById(submittedRequest.id);
        if (res.success && res.data) {
          setSubmittedRequest(res.data);
        }
      } catch (err) {
        console.error("Failed to poll request status", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [submittedRequest]);

  // Load service requests
  const fetchRequests = async (isBackground = false) => {
    if (!isBackground) setLoadingRequests(true);
    try {
      const res = await serviceRequestService.getServiceRequests();
      if (res.success) {
        setRequests(res.data || []);
        
        // Update selectedRequest in-place if open
        setSelectedRequest((prev: any) => {
          if (!prev) return null;
          const updated = res.data?.find((r: any) => r.id === prev.id);
          return updated || prev;
        });
      }
    } catch (err: any) {
      console.error(err);
      if (!isBackground) toast.error("Failed to load service requests");
    } finally {
      if (!isBackground) setLoadingRequests(false);
    }
  };

  // Track whether a form or detail modal is open to pause polling
  const isEditingRef = useRef(false);
  useEffect(() => {
    isEditingRef.current = view === "CREATE" || !!selectedRequest || showCancelReasonModal;
  }, [view, selectedRequest, showCancelReasonModal]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchRequests(false);

      const interval = setInterval(() => {
        const activeEl = document.activeElement;
        const isInputFocused = activeEl && (
          ["INPUT", "TEXTAREA", "SELECT"].includes(activeEl.tagName.toUpperCase()) ||
          activeEl.getAttribute("contenteditable") === "true"
        );
        if (!isEditingRef.current && !isInputFocused) {
          fetchRequests(true);
        }
      }, 20000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  // Load products details on form opening
  useEffect(() => {
    if (view === "CREATE") {
      const loadFormData = async () => {
        setLoadingProducts(true);
        try {
          // Fetch all products dynamically from Product table
          const allProdRes = await productService.getProducts({ limit: 100 });
          if (allProdRes.success && allProdRes.data) {
            setAllProducts(allProdRes.data.products || []);
          }
        } catch (error) {
          console.error("Error loading products:", error);
        } finally {
          setLoadingProducts(false);
        }
      };

      loadFormData();
    }
  }, [view]);

  // Automatic warranty validation trigger
  useEffect(() => {
    if (!selectedProductId || !purchaseDate) {
      setWarrantyStatus(null);
      return;
    }

    const product = allProducts.find(p => p.id === selectedProductId);
    if (!product) {
      setWarrantyStatus(null);
      return;
    }

    const { isExpired } = calculateWarrantyExpiry(purchaseDate, product.warranty);
    setWarrantyStatus(isExpired ? "Warranty Expired" : "Under Warranty");
  }, [selectedProductId, purchaseDate, allProducts]);

  // Upload file to server
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const fileArray = Array.from(e.target.files);
    
    const formData = new FormData();
    fileArray.forEach(file => {
      formData.append("files", file);
    });

    setUploading(true);
    try {
      const response = await fetch(`${ENV.API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      if (result.success && result.urls) {
        setWarrantyCard(result.urls[0]);
        toast.success("Warranty card uploaded successfully");
      } else {
        throw new Error(result.message || "Failed to parse upload results");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  // Submit Request Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contactPersonName) { toast.error("Please provide Contact Person Name"); return; }
    if (!contactNumber) { toast.error("Please provide Mobile Number"); return; }
    if (contactNumber.length !== 10) { toast.error("Mobile Number must be exactly 10 digits"); return; }
    if (!email) { toast.error("Please provide Email Address"); return; }
    if (!pickupAddress) { toast.error("Please provide Complete Address"); return; }
    if (!pincode) { toast.error("Please provide Pincode"); return; }

    if (!selectedCategory) { toast.error("Please select a Product Category"); return; }
    if (!selectedProductId) { toast.error("Please select a Product Name"); return; }

    if (!purchaseDate) { toast.error("Please provide Purchase Date"); return; }
    if (!purchasePlace) { toast.error("Please provide Purchase Place / Dealer Name"); return; }

    if (!warrantyStatus) { toast.error("Warranty must be validated before submitting"); return; }

    try {
      setUploading(true);
      
      const payload = {
        productId: selectedProductId,
        purchasePlace,
        purchaseDate: new Date(purchaseDate),
        serviceCategory,
        issueDescription: issueDescription || "N/A",
        contactPersonName,
        contactNumber,
        email,
        pickupAddress, // Complete Address
        pincode,
        attachments: warrantyCard ? [
          { fileUrl: warrantyCard, fileType: "WARRANTY_CARD", fileName: "warranty_card" }
        ] : []
      };

      const res = await serviceRequestService.createServiceRequest(payload);
      if (res.success) {
        const ticketId = res.data?.ticketId || (res as any).ticketId || "";
        toast.success(`Service request submitted successfully! Ticket ID: ${ticketId}`);
        
        setSubmittedRequest(res.data);
      } else {
        toast.error(res.message || "Failed to submit request");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Server error while submitting request");
    } finally {
      setUploading(false);
    }
  };

  const handleCopyTicket = (ticketId: string) => {
    navigator.clipboard.writeText(ticketId);
    toast.success("Ticket ID copied to clipboard!");
  };

  // View individual ticket detail
  const viewTicketDetail = async (id: string) => {
    try {
      const res = await serviceRequestService.getServiceRequestById(id);
      if (res.success) {
        setSelectedRequest(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load service ticket details");
    }
  };

  // Handle customer response to cost estimate
  const handleEstimateResponse = async (id: string, action: "APPROVE" | "REJECT", reason?: string, itemIndex?: number) => {
    setRespondingEstimate(true);
    try {
      const payload: any = { 
        action, 
        cancellationReason: reason 
      };
      if (itemIndex !== undefined) {
        payload.itemIndex = itemIndex;
      }
      
      const res = await serviceRequestService.respondToEstimate(id, payload);
      if (res.success) {
        toast.success(`Successfully submitted estimate response`);
        
        // Refresh requests list
        await fetchRequests();
        
        // Refresh selectedRequest detail
        const detailRes = await serviceRequestService.getServiceRequestById(id);
        if (detailRes.success) {
          setSelectedRequest(detailRes.data);
        }
      } else {
        toast.error(res.message || "Failed to submit estimate response");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to submit estimate response");
    } finally {
      setRespondingEstimate(false);
    }
  };

  // Render status badge
  const getStatusBadge = (status: string, cancellationReason?: string | null) => {
    switch (status) {
      case "Request Submitted":
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-yellow-555/10 text-yellow-500 border border-yellow-500/10">Request Submitted</span>;
      case "Warranty Verified":
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-blue-555/10 text-blue-500 border border-blue-500/10">Warranty Verified</span>;
      case "Request Accepted":
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-green-555/10 text-green-500 border border-green-500/10">Request Accepted</span>;
      case "Technician Assigned":
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-purple-555/10 text-purple-500 border border-purple-500/10">Technician Assigned</span>;
      case "Technician On The Way":
      case "Reached Customer Location":
      case "Inspection Started":
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-555/10 text-indigo-500 border border-indigo-500/10">{status}</span>;
      case "Repair In Progress":
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-cyan-555/10 text-cyan-500 border border-cyan-500/10">Repair In Progress</span>;
      case "Waiting For Spare Parts":
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-orange-555/10 text-orange-500 border border-orange-500/10">Waiting For Spare Parts</span>;
      case "Service Completed":
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-green-555/10 text-green-550 border border-green-550/10">Service Completed</span>;
      case "Customer Feedback":
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-555/10 text-emerald-500 border border-emerald-500/10">Customer Feedback</span>;
      case "Request Rejected":
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-red-555/10 text-red-500 border border-red-500/10">Request Rejected</span>;
      case "Closed":
        if (cancellationReason) {
          return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-850 dark:bg-red-950/20 dark:text-red-400">Closed (Cancelled)</span>;
        }
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-400">Closed</span>;
      default:
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-400">{status}</span>;
    }
  };

  // Render warranty status badge
  const getWarrantyBadge = (status: string) => {
    if (status === "Under Warranty") {
      return <span className="inline-block whitespace-nowrap px-2 py-0.5 text-[10px] font-bold rounded bg-green-100 text-green-800 dark:bg-green-950/35 dark:text-green-400">UNDER WARRANTY</span>;
    }
    if (status === "Batch Request") {
      return <span className="inline-block whitespace-nowrap px-2 py-0.5 text-[10px] font-bold rounded bg-red-100/10 text-red-650 border border-red-500/20 dark:bg-red-950/35 dark:text-red-400">BATCH REQUEST</span>;
    }
    return <span className="inline-block whitespace-nowrap px-2 py-0.5 text-[10px] font-bold rounded bg-red-100 text-red-800 dark:bg-red-950/35 dark:text-red-400">WARRANTY EXPIRED</span>;
  };

  // Calculate current status index in timeline
  const getStatusIndex = (currentStatus: string, steps: any[]) => {
    if (currentStatus === "Closed" || currentStatus === "Ready For Delivery" || currentStatus === "Delivered") {
      const idx = steps.findIndex(step => step.key === "Service Completed");
      return idx !== -1 ? idx : steps.length - 1;
    }
    return steps.findIndex(step => step.key === currentStatus);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 font-sans">
        <Loader2 className="w-12 h-12 text-[#D71920] animate-spin" />
        <p className="mt-4 text-sm font-semibold text-neutral-500 tracking-wider">Loading Service Request portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] dark:bg-slate-950 font-sans text-neutral-800 dark:text-neutral-100 w-full max-w-full overflow-x-hidden">
      <Header navLinks={navLinks} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 text-left overflow-x-hidden">
        
        {view === "LIST" ? (
          <div className="space-y-8">
            
            {/* Header and Call to Action */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 dark:border-slate-800 pb-6">
              <div>
                <div className="flex items-center gap-2 mb-2 text-[#D71920]">
                  <Headphones size={18} />
                  <span className="text-xs font-bold uppercase tracking-widest">Support Portal</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                  My Service Requests
                </h1>
                <p className="text-sm text-neutral-500 mt-1 dark:text-neutral-400">
                  Track and manage service requests for your SD Smart Appliances.
                </p>
              </div>
              <button
                onClick={() => setView("CREATE")}
                className="flex items-center gap-2 px-5 py-3 bg-[#D71920] hover:bg-[#b8141a] text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-red-500/10 cursor-pointer"
              >
                <Plus size={16} />
                <span>FILE NEW REQUEST</span>
              </button>
            </div>

            {/* Service Requests Table */}
            {loadingRequests ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl">
                <Loader2 className="w-10 h-10 text-[#D71920] animate-spin mb-4" />
                <p className="text-sm text-neutral-500 font-semibold">Loading service tickets...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-dashed border-neutral-300 dark:border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 rounded-full flex items-center justify-center mx-auto text-[#D71920]">
                  <Headphones size={30} />
                </div>
                <h3 className="text-lg font-bold">No Service Requests Found</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  You haven't filed any service requests yet. If you have an appliance requiring service or warranty verification, submit a ticket.
                </p>
                <button
                  onClick={() => setView("CREATE")}
                  className="px-6 py-2.5 bg-[#D71920] text-white text-xs font-bold rounded-xl hover:bg-[#b8141a] transition-all cursor-pointer inline-block"
                >
                  CREATE FIRST TICKET
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                 {/* Desktop/Tablet View: Table */}
                 <div className="hidden md:block bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                   <div className="w-full">
                     <table className="w-full text-left border-collapse">
                       <thead>
                         <tr className="bg-neutral-50 dark:bg-slate-800/40 border-b border-neutral-200 dark:border-slate-800 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                           <th className="px-6 py-4">Ticket ID</th>
                           <th className="px-6 py-4">Product Name</th>
                           <th className="px-6 py-4">Warranty Status</th>
                           <th className="px-6 py-4 hidden xl:table-cell">Technician Visit</th>
                           <th className="px-6 py-4">Current Status</th>
                           <th className="px-6 py-4 hidden xl:table-cell">Created Date</th>
                           <th className="px-6 py-4 text-right">Actions</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-neutral-100 dark:divide-slate-800 text-sm">
                         {requests.map((req) => (
                           <tr key={req.id} className="hover:bg-neutral-50/50 dark:hover:bg-slate-800/20 transition-colors">
                             <td className="px-6 py-4 font-bold font-mono text-[#D71920] whitespace-nowrap">{req.ticketId}</td>
                             <td className="px-6 py-4 font-semibold">{req.product?.name || "Product"}</td>
                             <td className="px-6 py-4">{getWarrantyBadge(getEffectiveWarrantyStatus(req))}</td>
                             <td className="px-6 py-4 text-xs font-semibold text-neutral-600 dark:text-neutral-350 whitespace-nowrap hidden xl:table-cell">
                               {req.technicianName ? (
                                  <div>
                                    <p className="font-bold text-neutral-800 dark:text-neutral-200">{req.technicianName}</p>
                                    <p className="text-[10px] text-neutral-400">
                                      {req.expectedVisitDate ? new Date(req.expectedVisitDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-neutral-400">Awaiting Assignment</span>
                                )}
                             </td>
                             <td className="px-6 py-4">{getStatusBadge(getEffectiveCurrentStatus(req), req.cancellationReason)}</td>
                             <td className="px-6 py-4 text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap hidden xl:table-cell">
                               {new Date(req.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                             </td>
                             <td className="px-6 py-4 text-right">
                               <button
                                 onClick={() => viewTicketDetail(req.id)}
                                 className="px-4 py-2 border border-neutral-200 hover:border-[#D71920] hover:text-[#D71920] dark:border-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                               >
                                 <Eye size={13} />
                                 <span>View Details</span>
                               </button>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                 </div>
 
                 {/* Mobile View: Card List */}
                 <div className="grid grid-cols-1 gap-4 md:hidden">
                  {requests.map((req) => (
                    <div 
                      key={req.id} 
                      className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4"
                    >
                      {/* Top Row: Ticket ID & Date */}
                      <div className="flex justify-between items-start">
                        <span className="font-bold font-mono text-[#D71920] text-sm">{req.ticketId}</span>
                        <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500">
                          {new Date(req.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>

                      {/* Product Name */}
                      <div>
                        <h4 className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-0.5">Product Name</h4>
                        <p className="font-bold text-sm text-neutral-800 dark:text-neutral-100">{req.product?.name || "Product"}</p>
                      </div>

                      {/* Badges Grid */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <span className="block text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1">Warranty Status</span>
                          {getWarrantyBadge(getEffectiveWarrantyStatus(req))}
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1">Current Status</span>
                          {getStatusBadge(getEffectiveCurrentStatus(req), req.cancellationReason)}
                        </div>
                      </div>

                      {/* Footer Info & Action */}
                      <div className="pt-3 border-t border-neutral-100 dark:border-slate-800 flex justify-between items-center text-xs">
                        <div>
                          <span className="block text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-0.5">Technician Visit</span>
                          <span className="font-semibold text-neutral-600 dark:text-neutral-350">
                            {req.technicianName ? `${req.technicianName} (${req.expectedVisitDate ? new Date(req.expectedVisitDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""})` : "Awaiting Assignment"}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => viewTicketDetail(req.id)}
                          className="px-3.5 py-2 border border-neutral-200 hover:border-[#D71920] hover:text-[#D71920] dark:border-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye size={12} />
                          <span>Details</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={cn(
            "space-y-6 w-full mx-auto transition-all",
            submittedRequest ? "max-w-7xl" : "max-w-4xl"
          )}>
            
            {/* Header back row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-150/60 dark:border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                {isAuthenticated && (
                  <button
                    type="button"
                    onClick={() => setView("LIST")}
                    className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 hover:bg-neutral-50 cursor-pointer text-neutral-800 dark:text-neutral-200"
                  >
                    <ArrowLeft size={16} />
                  </button>
                )}
                <div>
                  <h1 className="text-2xl font-black">Submit Service Request</h1>
                  <p className="text-xs text-neutral-500">Provide details for validation, inspection, and repair</p>
                </div>
              </div>
              <div className="flex items-center">
                <Link
                  href="/track-service-request"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-[#E11D2E] hover:bg-[#E11D2E] hover:text-white text-[#E11D2E] text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer bg-white dark:bg-slate-950 font-bold"
                >
                  <Search size={14} />
                  <span>Track Existing Request</span>
                </Link>
              </div>
            </div>

            {/* Layout Grid */}
            <div className={cn(
              "grid grid-cols-1 gap-8",
              submittedRequest ? "lg:grid-cols-2" : "grid-cols-1"
            )}>
              {/* Form Box */}
              <form onSubmit={handleSubmit} className={cn(
                "bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 space-y-8 shadow-md text-left h-fit",
                submittedRequest && "opacity-75 pointer-events-none select-none"
              )}>
              
              {/* SECTION 1 – CUSTOMER DETAILS */}
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#D71920] border-b border-neutral-100 dark:border-slate-800/80 pb-2">
                  Section 1 – Customer Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Full Name <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        required
                        placeholder="Enter full name"
                        value={contactPersonName}
                        onChange={(e) => setContactPersonName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 border border-neutral-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white text-sm rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Mobile Number <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        required
                        placeholder="10-digit mobile number"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 border border-neutral-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white text-sm rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Email Address <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <FileText size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="email"
                        required
                        placeholder="Enter email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 border border-neutral-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white text-sm rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Pincode <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        required
                        placeholder="6-digit pincode"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 border border-neutral-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white text-sm rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Complete Address <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3.5 top-5 text-neutral-400" />
                      <textarea
                        required
                        rows={2}
                        placeholder="Street details, building number, locality, city and state"
                        value={pickupAddress}
                        onChange={(e) => setPickupAddress(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 border border-neutral-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white text-sm rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 outline-none transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2 – PRODUCT DETAILS */}
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#D71920] border-b border-neutral-100 dark:border-slate-800/80 pb-2">
                  Section 2 – Product Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Category <span className="text-red-500">*</span></label>
                    <CustomSelect
                      required
                      value={selectedCategory}
                      onChange={(val) => {
                        setSelectedCategory(val);
                        setSelectedProductId("");
                      }}
                      placeholder="Select category..."
                      groups={[{
                        label: "Categories",
                        options: categories.map(c => ({ value: c, label: c }))
                      }]}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Product Name <span className="text-red-500">*</span></label>
                    <CustomSelect
                      required
                      value={selectedProductId}
                      onChange={(val) => setSelectedProductId(val)}
                      placeholder={selectedCategory ? "Select product..." : "Please select a category first"}
                      groups={[{
                        label: selectedCategory ? `Products in ${selectedCategory}` : "Select a category first",
                        options: allProducts
                          .filter(p => {
                            if (!selectedCategory) return false;
                            const pCat = (p.categoryLabel || p.category || "").toLowerCase().replace(/\s+/g, "").trim();
                            const sCat = selectedCategory.toLowerCase().replace(/\s+/g, "").trim();
                            return pCat === sCat || pCat.includes(sCat) || sCat.includes(pCat);
                          })
                          .map(p => ({
                            value: p.id,
                            label: `${p.name} (SKU : ${p.sku || "N/A"})`
                          }))
                      }]}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Service Category <span className="text-red-500">*</span></label>
                    <CustomSelect
                      required
                      value={serviceCategory}
                      onChange={(val) => setServiceCategory(val)}
                      placeholder="Select service category..."
                      groups={[{
                        label: "Service Categories",
                        options: SERVICE_CATEGORIES.map(cat => ({ value: cat, label: cat }))
                      }]}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Detailed Issue Description <span className="text-red-500">*</span></label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Please describe in detail what is wrong with the appliance..."
                      value={issueDescription}
                      onChange={(e) => setIssueDescription(e.target.value)}
                      className="w-full px-4 py-3 bg-white text-slate-900 border border-neutral-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white text-sm rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 outline-none transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3 – PURCHASE DETAILS */}
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#D71920] border-b border-neutral-100 dark:border-slate-800/80 pb-2">
                  Section 3 – Purchase Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Purchase Date <span className="text-red-500">*</span></label>
                    <CustomDatePicker
                      required
                      value={purchaseDate}
                      onChange={(val) => setPurchaseDate(val)}
                      placeholder="Select purchase date..."
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Purchase Place / Dealer Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Retailer Store, Amazon, Chennai"
                      value={purchasePlace}
                      onChange={(e) => setPurchasePlace(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white text-slate-900 border border-neutral-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white text-sm rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 outline-none transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-2">
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Warranty Card Upload <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-1 gap-4">
                      <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-neutral-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900/50 hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group">
                        <FileText size={20} className="text-neutral-400 group-hover:text-[#D71920] mb-2 transition-colors" />
                        <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 group-hover:text-[#D71920] transition-colors">Upload Warranty Card</span>
                        <span className="text-[10px] text-neutral-400 mt-1">JPEG, PNG, PDF (Max 5MB)</span>
                        <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} disabled={uploading} />
                      </label>
                    </div>
                    
                    {warrantyCard && (
                      <div className="flex gap-2 mt-2">
                        <div className="relative w-16 h-16 rounded overflow-hidden border border-green-500 bg-green-50 dark:bg-green-900/20 flex flex-col items-center justify-center">
                          <FileText size={16} className="text-green-600" />
                          <span className="text-[8px] font-bold mt-1 text-green-700 uppercase">Uploaded</span>
                          <button
                            type="button"
                            onClick={() => setWarrantyCard("")}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 4 – WARRANTY VALIDATION */}
              {selectedProductId && purchaseDate && (
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#D71920] border-b border-neutral-100 dark:border-slate-800/80 pb-2">
                    Section 4 – Warranty Validation
                  </h3>
                  <div className="p-5 border rounded-2xl bg-neutral-50/50 dark:bg-slate-900/40 border-neutral-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">Calculated Status:</span>
                      {warrantyStatus === "Under Warranty" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black rounded-full bg-green-500/10 text-green-500 border border-green-500/25">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                          <span>🟢 Under Warranty</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black rounded-full bg-red-500/10 text-red-500 border border-red-500/25">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                          <span>🔴 Warranty Expired</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                      {warrantyStatus === "Under Warranty"
                        ? "Your product is covered under warranty."
                        : "Warranty has expired. Service charges may apply after inspection."}
                    </p>
                  </div>
                </div>
              )}

              {/* SECTION 5 – SUBMIT */}
              <div className="pt-6 border-t border-neutral-100 dark:border-slate-800 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#D71920]">
                  Section 5 – Submit
                </h3>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={uploading || !warrantyStatus}
                    className="flex-1 py-3 bg-[#D71920] hover:bg-[#b8141a] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-red-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-center"
                  >
                    {uploading ? "UPLOADING ATTACHMENTS..." : "SUBMIT SERVICE TICKET"}
                  </button>
                  {isAuthenticated && (
                    <button
                      type="button"
                      onClick={() => setView("LIST")}
                      className="px-6 py-3 border border-neutral-300 hover:bg-neutral-50 dark:border-slate-700 dark:hover:bg-slate-900 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      CANCEL
                    </button>
                  )}
                </div>
              </div>

            </form>

            {/* Confirmation details segment on the right */}
            {submittedRequest && (
              <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl p-8 shadow-md space-y-8 animate-in fade-in zoom-in-95 duration-200 text-left h-fit lg:sticky lg:top-6 w-full">
                {/* Success Message Header */}
                <div className="flex flex-col items-center text-center space-y-4 border-b border-neutral-100 dark:border-slate-800/80 pb-6">
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                    <CheckCircle size={36} />
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white uppercase tracking-wide">
                    ✅ Service Request Submitted Successfully
                  </h2>
                  <div className="space-y-2 text-sm text-neutral-500 dark:text-neutral-400">
                    <p className="font-semibold text-neutral-600 dark:text-neutral-350">Your service request has been submitted successfully.</p>
                    <p className="text-xs text-neutral-450 dark:text-neutral-400">
                      If you do not receive the email within a few minutes, you can still track your request using your Ticket ID and Mobile Number.
                    </p>
                  </div>
                </div>

                {/* Ticket ID Box */}
                <div className="bg-neutral-50 dark:bg-slate-950 p-5 rounded-2xl border border-neutral-200/60 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden">
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Ticket ID</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xl sm:text-2xl font-black text-[#E11D2E] tracking-wider">
                      {submittedRequest.ticketId}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyTicket(submittedRequest.ticketId)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-[#E11D2E] hover:bg-neutral-100 dark:hover:bg-slate-900 transition-colors cursor-pointer flex items-center justify-center"
                      title="Copy Ticket ID"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>

                {/* Estimated Processing Time */}
                <div className="p-5 border-l-4 border-[#E11D2E] bg-[#E11D2E]/5 rounded-r-2xl space-y-2 text-xs sm:text-sm leading-relaxed text-neutral-600 dark:text-neutral-350">
                  <p className="font-extrabold text-[#E11D2E] text-xs sm:text-sm uppercase tracking-wide mb-1">Estimated Processing Time</p>
                  <p className="text-base font-black text-neutral-900 dark:text-white">2–7 Working Days</p>
                  <p className="text-neutral-500 dark:text-neutral-400">A technician will be assigned after warranty verification.</p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-neutral-100 dark:border-slate-800">
                  <Link
                    href={`/service-request/track?ticket=${submittedRequest.ticketId}&mobile=${contactNumber}`}
                    className="flex-1 py-3 bg-[#E11D2E] hover:bg-[#c11524] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-red-500/10 cursor-pointer text-center font-bold flex items-center justify-center"
                  >
                    Track My Request
                  </Link>
                  <button
                    onClick={() => {
                      setSubmittedRequest(null);
                      // Reset all form inputs
                      setContactPersonName("");
                      setContactNumber("");
                      setEmail("");
                      setPickupAddress("");
                      setPincode("");
                      setSelectedCategory("");
                      setSelectedProductId("");
                      setPurchaseDate("");
                      setPurchasePlace("");
                      setServiceCategory("Repair");
                      setIssueDescription("");
                      setWarrantyCard("");
                      setWarrantyStatus(null);
                      
                      if (isAuthenticated) {
                        setView("LIST");
                        fetchRequests();
                      } else {
                        setView("CREATE");
                      }
                    }}
                    className="flex-1 py-3 border border-neutral-300 dark:border-slate-700 hover:bg-neutral-50 dark:hover:bg-slate-900 text-neutral-700 dark:text-neutral-300 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center font-bold"
                  >
                    Raise Another Request
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      </main>

      <Footer footerColumns={footerColumns} socialLinks={socialLinks} />

      {/* MODAL: DETAIL MODAL VIEW */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-full lg:max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl overflow-y-auto overflow-x-hidden shadow-2xl flex flex-col text-left animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-neutral-50 dark:bg-slate-800/40 border-b border-neutral-100 dark:border-slate-800/70 flex items-center justify-between sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur w-full">
              <div className="flex items-center gap-3 min-w-0">
                <Headphones size={20} className="text-[#D71920] shrink-0" />
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black flex items-center gap-2 break-all">
                    Service Ticket: <span className="font-mono text-[#D71920]">{selectedRequest.ticketId}</span>
                  </h2>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                    Created on {new Date(selectedRequest.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer text-neutral-500 hover:text-neutral-800 shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto overflow-x-hidden flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 w-full break-words [word-break:break-word] [overflow-wrap:break-word]">
              
              {/* Left Column (2 cols wide): Request & product details */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Distributor Items or Single Product Details */}
                {selectedRequest.distributorItems && selectedRequest.distributorItems.length > 1 ? (
                  <div className="space-y-6">
                    {selectedRequest.distributorItems.map((item: any, idx: number) => (
                      <div key={idx} className="p-4 bg-neutral-50 dark:bg-slate-850 border border-neutral-100 dark:border-slate-800 rounded-xl space-y-4">
                        <div className="flex items-center justify-between border-b dark:border-slate-800 pb-2 mb-2">
                          <h4 className="text-xs font-black uppercase tracking-wider text-[#D71920]">Product {idx + 1}</h4>
                          <div>{getWarrantyBadge(item.warrantyStatus)}</div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
                          <div>
                            <p className="text-neutral-400 mb-0.5">Product Name</p>
                            <p className="font-bold break-words">{item.productName || "Product"}</p>
                          </div>
                          <div>
                            <p className="text-neutral-400 mb-0.5">Order ID</p>
                            <p className="font-semibold font-mono break-all">{item.orderId || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-neutral-400 mb-0.5">Service Category</p>
                            <p className="font-bold text-neutral-700 dark:text-neutral-200 break-words">{item.serviceCategory}</p>
                          </div>
                          <div>
                            <p className="text-neutral-400 mb-0.5">Purchase Date</p>
                            <p className="font-semibold">
                              {item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-neutral-400 mb-1">Issue Description</p>
                            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg text-xs leading-relaxed text-neutral-600 dark:text-neutral-350 break-words border border-neutral-100 dark:border-slate-800">
                              {item.issueDescription}
                            </div>
                          </div>
                        </div>

                        {/* Out of Warranty Charges & Approval for THIS ITEM */}
                        {item.warrantyStatus === "Warranty Expired" && item.serviceCharge !== null && item.serviceCharge !== undefined && (
                          <div className="p-4 bg-orange-50 dark:bg-slate-800/30 border border-orange-100 dark:border-slate-800 rounded-xl space-y-4 mt-4">
                            <h4 className="text-xs font-black uppercase tracking-wider text-orange-500 border-b dark:border-slate-805 pb-1">Out of Warranty Service Estimate</h4>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs sm:text-sm">
                              <div>
                                <p className="text-neutral-400 mb-0.5">Service Charge</p>
                                <p className="font-bold text-neutral-700 dark:text-neutral-200">₹{item.serviceCharge}</p>
                              </div>
                              <div>
                                <p className="text-neutral-400 mb-0.5">Spare Parts Cost</p>
                                <p className="font-bold text-neutral-700 dark:text-neutral-200">₹{item.sparePartsCost || 0}</p>
                              </div>
                              <div>
                                <p className="text-neutral-400 mb-0.5">Total Service Cost</p>
                                <p className="font-extrabold text-[#D71920]">₹{item.totalServiceCost}</p>
                              </div>
                              <div className="col-span-2 md:col-span-3">
                                <p className="text-neutral-400 mb-0.5">Inspection Remarks</p>
                                <p className="font-semibold text-neutral-700 dark:text-neutral-200 italic">
                                  "{item.inspectionRemarks || "No remarks provided"}"
                                </p>
                              </div>
                            </div>

                            {/* Actions if Awaiting Customer Approval */}
                            {item.currentStatus === "Awaiting Customer Approval" && (
                              <div className="pt-2 border-t dark:border-slate-800/40 flex flex-col sm:flex-row gap-3">
                                <button
                                  onClick={() => handleEstimateResponse(selectedRequest.id, "APPROVE", undefined, idx)}
                                  disabled={respondingEstimate}
                                  className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1 transition-colors"
                                >
                                  <CheckCircle size={14} />
                                  <span>APPROVE ESTIMATE</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setCancellationReason(`Rejected estimate for item ${idx + 1}`);
                                    handleEstimateResponse(selectedRequest.id, "REJECT", `Rejected estimate for item ${idx + 1}`, idx);
                                  }}
                                  disabled={respondingEstimate}
                                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1 transition-colors"
                                >
                                  <X size={14} />
                                  <span>REJECT ESTIMATE</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Single Product details */}
                    <div className="p-4 bg-neutral-50 dark:bg-slate-850 border border-neutral-100 dark:border-slate-800 rounded-xl space-y-2.5">
                      <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400">Product Details</h4>
                      <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
                        <div>
                          <p className="text-neutral-400 mb-0.5">Product Name</p>
                          <p className="font-bold break-words">{selectedRequest.product?.name || "Product"}</p>
                        </div>
                        <div>
                          <p className="text-neutral-400 mb-0.5">Order ID</p>
                          <p className="font-semibold font-mono break-all">{selectedRequest.orderId || "N/A"}</p>
                        </div>
                        {selectedRequest.purchasePlace && (
                          <div>
                            <p className="text-neutral-400 mb-0.5">Purchase Place / Dealer Name</p>
                            <p className="font-semibold break-words">{selectedRequest.purchasePlace}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-neutral-400 mb-0.5">Purchase Date</p>
                          <p className="font-semibold">
                            {new Date(selectedRequest.purchaseDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        <div>
                          <p className="text-neutral-400 mb-0.5">Warranty Expiry Date</p>
                          <p className="font-semibold">
                            {new Date(selectedRequest.warrantyExpiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-neutral-400 mb-1">Warranty Status</p>
                          <div>{getWarrantyBadge(getEffectiveWarrantyStatus(selectedRequest))}</div>
                        </div>
                      </div>
                    </div>

                    {/* Service Details */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400 border-b pb-1">Service Details</h4>
                      <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
                        <div>
                          <p className="text-neutral-400 mb-0.5">Service Category</p>
                          <p className="font-bold text-neutral-700 dark:text-neutral-200 break-words">{selectedRequest.serviceCategory}</p>
                        </div>
                        <div>
                          <p className="text-neutral-400 mb-0.5">Contact Person Name</p>
                          <p className="font-bold text-neutral-700 dark:text-neutral-200 break-words">{selectedRequest.contactPersonName || (selectedRequest.user?.firstName + " " + selectedRequest.user?.lastName)}</p>
                        </div>
                        <div>
                          <p className="text-neutral-400 mb-0.5">Contact Number</p>
                          <p className="font-semibold text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5 break-all">
                            <Phone size={12} className="text-neutral-400" />
                            <span>{selectedRequest.contactNumber}</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-neutral-400 mb-0.5">Email Address</p>
                          <p className="font-semibold text-neutral-700 dark:text-neutral-200 break-all">{selectedRequest.email || selectedRequest.user?.email || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-neutral-400 mb-0.5">Pincode</p>
                          <p className="font-semibold text-neutral-700 dark:text-neutral-200">{selectedRequest.pincode || "N/A"}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-neutral-400 mb-0.5">Complete Address</p>
                          <p className="font-semibold text-neutral-700 dark:text-neutral-200 flex items-start gap-1.5 break-words">
                            <MapPin size={12} className="text-neutral-400 mt-0.5 flex-shrink-0" />
                            <span>{selectedRequest.pickupAddress}</span>
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-neutral-400 mb-1">Issue Description</p>
                          <div className="p-3 bg-neutral-50 dark:bg-slate-850 rounded-lg text-xs leading-relaxed text-neutral-600 dark:text-neutral-350 break-words">
                            {selectedRequest.issueDescription}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
 
                {/* Technician Details */}
                {selectedRequest.technicianName && (
                  <div className="p-4 bg-red-500/5 dark:bg-slate-850 border border-red-500/10 dark:border-slate-800 rounded-xl space-y-2.5">
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#D71920]">Technician Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm text-left">
                      <div>
                        <p className="text-neutral-400 mb-0.5">Technician Name</p>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200">{selectedRequest.technicianName}</p>
                      </div>
                      <div>
                        <p className="text-neutral-400 mb-0.5">Contact Number</p>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200">{selectedRequest.technicianPhone}</p>
                      </div>
                      <div>
                        <p className="text-neutral-400 mb-0.5">Expected Visit Date</p>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200">
                          {selectedRequest.expectedVisitDate ? new Date(selectedRequest.expectedVisitDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Out of Warranty Charges & Approval (Single Product Only) */}
                {(!selectedRequest.distributorItems || selectedRequest.distributorItems.length <= 1) && getEffectiveWarrantyStatus(selectedRequest) === "Warranty Expired" && selectedRequest.serviceCharge !== null && selectedRequest.serviceCharge !== undefined && (
                  <div className="p-4 bg-orange-50 dark:bg-slate-800/30 border border-orange-100 dark:border-slate-800 rounded-xl space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-orange-500 border-b dark:border-slate-805 pb-1">Out of Warranty Service Estimate</h4>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs sm:text-sm">
                      <div>
                        <p className="text-neutral-400 mb-0.5">Service Charge</p>
                        <p className="font-bold text-neutral-700 dark:text-neutral-200">₹{selectedRequest.serviceCharge}</p>
                      </div>
                      <div>
                        <p className="text-neutral-400 mb-0.5">Spare Parts Cost</p>
                        <p className="font-bold text-neutral-700 dark:text-neutral-200">₹{selectedRequest.sparePartsCost || 0}</p>
                      </div>
                      <div>
                        <p className="text-neutral-400 mb-0.5">Total Service Cost</p>
                        <p className="font-extrabold text-[#D71920]">₹{selectedRequest.totalServiceCost}</p>
                      </div>
                      <div className="col-span-2 md:col-span-3">
                        <p className="text-neutral-400 mb-0.5">Inspection Remarks</p>
                        <p className="font-semibold text-neutral-700 dark:text-neutral-200 italic">
                          "{selectedRequest.inspectionRemarks || "No remarks provided"}"
                        </p>
                      </div>
                    </div>

                    {/* Actions if Awaiting Customer Approval */}
                    {selectedRequest.currentStatus === "Awaiting Customer Approval" && (
                      <div className="pt-2 border-t dark:border-slate-800/40 flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => handleEstimateResponse(selectedRequest.id, "APPROVE")}
                          disabled={respondingEstimate}
                          className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1 transition-colors"
                        >
                          <CheckCircle size={14} />
                          <span>APPROVE SERVICE & PROCEED</span>
                        </button>
                        <button
                          onClick={() => {
                            setCancellationReason("");
                            setShowCancelReasonModal(true);
                          }}
                          disabled={respondingEstimate}
                          className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1 transition-colors"
                        >
                          <X size={14} />
                          <span>REJECT SERVICE & CANCEL</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Uploaded Files */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400 border-b pb-1">Uploaded Files</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedRequest.attachments?.map((att: any) => (
                      <div key={att.id} className="border rounded-xl p-2.5 space-y-2 bg-neutral-50/50 dark:bg-slate-900 flex flex-col justify-between">
                        <div className="flex items-start gap-2">
                          {att.fileType === "WARRANTY_CARD" ? (
                            <FileText size={16} className="text-[#D71920] mt-0.5 flex-shrink-0" />
                          ) : (
                            <ImageIcon size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-neutral-400 uppercase leading-none">{att.fileType.replace("_", " ")}</p>
                            <p className="text-xs font-semibold truncate mt-1 text-neutral-700 dark:text-neutral-200">{att.fileName}</p>
                          </div>
                        </div>
                        <a
                          href={att.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-1 border border-neutral-200 dark:border-slate-800 text-[10px] font-bold text-center rounded hover:bg-neutral-100 dark:hover:bg-slate-800 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <Download size={10} />
                          <span>View / Download</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Column (1 col wide): Visual status timeline */}
              <div className="space-y-6 lg:border-l lg:pl-6 dark:border-slate-800">
                <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400 border-b pb-1">Ticket Progress</h4>

                <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-neutral-200 dark:before:bg-slate-800">
                  {getStatusSteps(getEffectiveWarrantyStatus(selectedRequest), getEffectiveCurrentStatus(selectedRequest), selectedRequest.cancellationReason).map((step, idx, arr) => {
                    const statusIdx = getStatusIndex(getEffectiveCurrentStatus(selectedRequest), arr);
                    const isCompleted = idx <= statusIdx;
                    const isActive = idx === statusIdx;
                    
                    // Filter details of history for this step if matching logs
                    const logs = selectedRequest.history?.filter((h: any) => h.status === step.key) || [];

                    return (
                      <div key={step.key} className="relative text-xs">
                        {/* Dot indicator */}
                        <div className={`absolute -left-[20px] top-0.5 w-3 h-3 rounded-full border-2 transition-all flex items-center justify-center ${
                          isCompleted
                            ? isActive
                              ? "bg-red-500 border-red-500 scale-125 animate-pulse"
                              : "bg-green-500 border-green-500"
                            : "bg-white dark:bg-slate-900 border-neutral-300 dark:border-slate-700"
                        }`}>
                          {isCompleted && !isActive && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>

                        {/* Step Details */}
                        <div className="space-y-1 pl-1">
                          <p className={`font-bold transition-colors ${
                            isActive ? "text-[#D71920] font-black text-sm" : isCompleted ? "text-neutral-700 dark:text-neutral-200" : "text-neutral-400"
                          }`}>
                            {step.label}
                          </p>
                          
                          {logs.map((log: any) => (
                            <div key={log.id} className="text-[10px] text-neutral-500 space-y-0.5">
                              <p className="italic leading-normal">"{log.remarks}"</p>
                              <p className="font-semibold text-neutral-400">
                                {new Date(log.updatedAt).toLocaleString("en-IN", { hour: "numeric", minute: "numeric", hour12: true, day: "numeric", month: "short" })}
                              </p>
                              <p className="text-[9px] text-[#D71920] font-bold">By: {log.updatedBy}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>

            </div>
          </div>
        </div>
      )}
      {/* MODAL: ENTER CANCELLATION REASON */}
      {showCancelReasonModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center gap-2 text-red-500 border-b pb-3 dark:border-slate-800">
              <AlertCircle size={20} />
              <h3 className="text-sm font-black uppercase tracking-wider">Cancellation Reason Required</h3>
            </div>
            
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Please enter a valid and detailed reason for rejecting the service estimate and canceling this ticket.
            </p>

            <div>
              <label className="block text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1.5">
                Cancellation Reason (Min. 10 chars)
              </label>
              <textarea
                required
                rows={4}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Why are you canceling this service request?..."
                className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 outline-none transition-all resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={async () => {
                  if (cancellationReason.trim().length < 10) {
                    toast.error("Please provide a more detailed reason (minimum 10 characters)");
                    return;
                  }
                  setShowCancelReasonModal(false);
                  await handleEstimateResponse(selectedRequest.id, "REJECT", cancellationReason);
                  setSelectedRequest(null);
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-750 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors text-center"
              >
                CONFIRM CANCELLATION
              </button>
              <button
                type="button"
                onClick={() => setShowCancelReasonModal(false)}
                className="px-4 py-2.5 border border-neutral-300 dark:border-slate-750 hover:bg-neutral-50 dark:hover:bg-slate-800 text-neutral-700 dark:text-neutral-300 font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                GO BACK
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
