"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";
import { 
  Headphones, Plus, ArrowLeft, Loader2, Calendar, FileText, MapPin, Phone, 
  CheckCircle, Clock, ShieldAlert, Image as ImageIcon, Eye, Download, Info,
  AlertCircle, ChevronRight, X
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { navLinks, footerColumns, socialLinks } from "../LandingPage/data/navigation";
import { serviceRequestService } from "@/services/serviceRequestService";
import { productService } from "@/services/productService";
import { apiGet } from "@/utils/api";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { CustomDatePicker } from "@/components/ui/CustomDatePicker";

const SERVICE_CATEGORIES = [
  "Repair",
  "Installation",
  "Warranty Claim",
  "Product Not Working",
  "Spare Parts Request"
];

const getStatusSteps = (warrantyStatus: string, currentStatus: string, cancellationReason?: string | null) => {
  if (currentStatus === "Request Rejected") {
    return [
      { label: "Request Submitted", key: "Pending Verification" },
      { label: "Request Rejected", key: "Request Rejected" }
    ];
  }

  const isExpired = warrantyStatus === "Warranty Expired";
  
  const steps = [
    { label: "Request Submitted", key: "Pending Verification" },
    { label: "Verified", key: "Verified" },
    { label: "Pickup Scheduled", key: "Pickup Scheduled" },
    { label: "Product Collected", key: "Product Collected" },
    { label: "Under Inspection", key: "Under Inspection" },
  ];

  if (isExpired) {
    steps.push(
      { label: "Awaiting Cost Estimation", key: "Awaiting Cost Estimation" },
      { label: "Awaiting Customer Approval", key: "Awaiting Customer Approval" }
    );
    
    if (cancellationReason || currentStatus === "Cancellation Requested" || currentStatus === "Service Cancelled") {
      steps.push({ label: "Cancellation Requested", key: "Cancellation Requested" });
      steps.push({ label: "Service Cancelled", key: "Service Cancelled" });
      if (currentStatus === "Closed") {
        steps.push({ label: "Closed", key: "Closed" });
      }
      return steps;
    }
    
    steps.push({ label: "Cost Approved", key: "Cost Approved" });
  }

  steps.push(
    { label: "Under Repair", key: "Under Repair" },
    { label: "Service Completed", key: "Service Completed" },
    { label: "Ready For Delivery", key: "Ready For Delivery" },
    { label: "Delivered", key: "Delivered" },
    { label: "Closed", key: "Closed" }
  );

  return steps;
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
  const [showCancelReasonModal, setShowCancelReasonModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");

  const isDistributor = user?.role === "DISTRIBUTOR";
  
  const [addedProducts, setAddedProducts] = useState([{
    localId: Math.random().toString(36).substr(2, 9),
    categoryLabel: "",
    productId: "",
    serviceCategory: SERVICE_CATEGORIES[0],
    issueDescription: "",
    productImages: [] as string[],
    warrantyCard: "",
    orderId: "",
    purchaseDate: ""
  }]);

  // Removed global orderId and purchaseDate
  const [preferredPickupDate, setPreferredPickupDate] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  
  // Attachments state
  const [warrantyCard, setWarrantyCard] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  // Derived categories
  const categories = Array.from(new Set(allProducts.map(p => p.categoryLabel || p.category))).filter(Boolean);

  // Auth redirection
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error("Please login to access the Service Requests portal");
      router.push("/auth/login?redirect=/service-request");
    }
  }, [authLoading, isAuthenticated, router]);

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
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  // Load products and user details on form opening
  useEffect(() => {
    if (view === "CREATE" && isAuthenticated) {
      const loadFormData = async () => {
        setLoadingProducts(true);
        try {
          // Pre-populate contact number if available
          if (user?.phoneNumber) {
            setContactNumber(user.phoneNumber);
          }

          // Pre-populate pickup address with default address if available
          const token = localStorage.getItem("authToken");
          if (token) {
            const addrRes = await fetch("http://localhost:5000/api/addresses", {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (addrRes.ok) {
              const addrData = await addrRes.json();
              if (addrData.success && addrData.data?.length > 0) {
                const defaultAddr = addrData.data.find((a: any) => a.isDefault) || addrData.data[0];
                setPickupAddress(
                  `${defaultAddr.fullName}, ${defaultAddr.addressLine1}${defaultAddr.addressLine2 ? ', ' + defaultAddr.addressLine2 : ''}, ${defaultAddr.city}, ${defaultAddr.state} - ${defaultAddr.pincode}`
                );
              }
            }
          }

          // Fetch purchased products
          const purchasedRes = await serviceRequestService.getPurchasedProducts();
          if (purchasedRes.success) {
            setPurchasedProducts(purchasedRes.data || []);
          }

          // Fetch all products as fallback
          const allProdRes = await productService.getProducts({ limit: 100 });
          if (allProdRes.success && allProdRes.data) {
            setAllProducts(allProdRes.data.products || []);
          }
        } catch (error) {
          console.error("Error loading products details:", error);
        } finally {
          setLoadingProducts(false);
        }
      };

      loadFormData();
    }
  }, [view, isAuthenticated, user]);

  // Handle product dropdown selection
  const handleProductChange = (productId: string, localId: string) => {
    const purchased = purchasedProducts.find(p => p.id === productId);
    setAddedProducts(prev => prev.map(p => {
      if (p.localId === localId) {
        return {
          ...p,
          productId,
          orderId: purchased?.orderNumber || "",
          purchaseDate: purchased?.purchaseDate ? new Date(purchased.purchaseDate).toISOString().split('T')[0] : ""
        };
      }
      return p;
    }));
  };

  // Upload file to server
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fileType: "PRODUCT_IMAGE" | "WARRANTY_CARD", localId?: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const fileArray = Array.from(e.target.files);
    
    const formData = new FormData();
    fileArray.forEach(file => {
      formData.append("files", file);
    });

    setUploading(true);
    try {
      const response = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      if (result.success && result.urls) {
        if (fileType === "WARRANTY_CARD") {
          if (localId) {
            setAddedProducts(prev => prev.map(p => 
              p.localId === localId 
                ? { ...p, warrantyCard: result.urls[0] }
                : p
            ));
          } else {
            setWarrantyCard(result.urls[0]);
          }
          toast.success("Warranty card uploaded successfully");
        } else if (fileType === "PRODUCT_IMAGE" && localId) {
          setAddedProducts(prev => prev.map(p => 
            p.localId === localId 
              ? { ...p, productImages: [...p.productImages, ...result.urls] }
              : p
          ));
          toast.success(`${result.urls.length} product image(s) uploaded`);
        }
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

    // Per-product validations
    for (const [index, p] of addedProducts.entries()) {
      if (!p.productId) { toast.error(`Please select a product for item #${index + 1}`); return; }
      if (!p.purchaseDate) { toast.error(`Please select purchase date for item #${index + 1}`); return; }
      if (!p.issueDescription) { toast.error(`Please provide issue description for item #${index + 1}`); return; }
    }

    if (!contactNumber) { toast.error("Please provide Contact Number"); return; }
    if (!pickupAddress) { toast.error("Please provide Pickup Address"); return; }
    if (!preferredPickupDate) {
      toast.error("Preferred pickup date is required");
      return;
    }

    try {
      setUploading(true);
      
      const payload = {
        userId: user?.id,
        productId: addedProducts[0].productId,
        orderId: addedProducts[0].orderId || null,
        purchaseDate: new Date(addedProducts[0].purchaseDate),
        serviceCategory: addedProducts[0].serviceCategory,
        issueDescription: addedProducts[0].issueDescription,
        preferredPickupDate: new Date(preferredPickupDate),
        contactNumber,
        pickupAddress,
        // Send the full array of items for distributors
        distributorItems: isDistributor ? addedProducts.map(p => {
          const productDetails = allProducts.find(prod => prod.id === p.productId) || {};
          return {
            productId: p.productId,
            productName: productDetails.name || "Unknown Product",
            sku: productDetails.sku || "Unknown SKU",
            serviceCategory: p.serviceCategory,
            issueDescription: p.issueDescription,
            productImages: p.productImages,
            warrantyCard: p.warrantyCard,
            orderId: p.orderId,
            purchaseDate: p.purchaseDate
          };
        }) : null,
        attachments: [
          { fileUrl: addedProducts[0].warrantyCard, fileType: "WARRANTY_CARD", fileName: "warranty_card" },
          // Flatten all product images for the main attachments array if needed, or just let them stay in distributorItems.
          ...(!isDistributor ? addedProducts[0].productImages.map((img, i) => ({
            fileUrl: img,
            fileType: "PRODUCT_IMAGE",
            fileName: `product_img_${i + 1}`
          })) : [])
        ].filter(a => a.fileUrl)
      };

      const res = await serviceRequestService.createServiceRequest(payload);
      if (res.success) {
        const ticketId = res.data?.ticketId || (res as any).ticketId || "";
        toast.success(`Service request submitted successfully! Ticket ID: ${ticketId}`);
        // Reset form
        setAddedProducts([{
          localId: Math.random().toString(36).substr(2, 9),
          categoryLabel: "",
          productId: "",
          serviceCategory: SERVICE_CATEGORIES[0],
          issueDescription: "",
          productImages: [],
          warrantyCard: "",
          orderId: "",
          purchaseDate: ""
        }]);
        setPreferredPickupDate("");
        
        // Go back to dashboard list and refresh
        setView("LIST");
        fetchRequests();
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
      case "Pending Verification":
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-400">Pending Verification</span>;
      case "Verified":
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400">Verified</span>;
      case "Pickup Scheduled":
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950/20 dark:text-purple-400">Pickup Scheduled</span>;
      case "Product Collected":
      case "Under Inspection":
      case "Under Repair":
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-400">{status}</span>;
      case "Awaiting Cost Estimation":
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-950/20 dark:text-orange-400">Awaiting Cost Estimation</span>;
      case "Awaiting Customer Approval":
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-950/20 dark:text-cyan-400">Awaiting Customer Approval</span>;
      case "Cost Approved":
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400">Cost Approved</span>;
      case "Cancellation Requested":
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-orange-100 text-orange-850 dark:bg-amber-950/20 dark:text-amber-400">Cancellation Requested</span>;
      case "Service Cancelled":
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400">Service Cancelled</span>;
      case "Request Rejected":
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400">Request Rejected</span>;
      case "Service Completed":
      case "Ready For Delivery":
      case "Delivered":
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400">{status}</span>;
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
    return <span className="inline-block whitespace-nowrap px-2 py-0.5 text-[10px] font-bold rounded bg-red-100 text-red-800 dark:bg-red-950/35 dark:text-red-400">WARRANTY EXPIRED</span>;
  };

  // Calculate current status index in timeline
  const getStatusIndex = (currentStatus: string, steps: any[]) => {
    return steps.findIndex(step => step.key === currentStatus);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 font-sans">
        <Loader2 className="w-12 h-12 text-[#D71920] animate-spin" />
        <p className="mt-4 text-sm font-semibold text-neutral-500 tracking-wider">Verifying session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] dark:bg-slate-950 font-sans text-neutral-800 dark:text-neutral-100 w-full max-w-full overflow-x-hidden">
      <Header navLinks={navLinks} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 text-left overflow-x-hidden">
        
        {/* VIEW: DASHBOARD LIST */}
        {view === "LIST" && (
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
                           <th className="px-6 py-4 hidden xl:table-cell">Preferred Pickup</th>
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
                             <td className="px-6 py-4">{getWarrantyBadge(req.warrantyStatus)}</td>
                             <td className="px-6 py-4 text-xs font-semibold text-neutral-600 dark:text-neutral-350 whitespace-nowrap hidden xl:table-cell">
                               {new Date(req.preferredPickupDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                             </td>
                             <td className="px-6 py-4">{getStatusBadge(req.currentStatus, req.cancellationReason)}</td>
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
                          {getWarrantyBadge(req.warrantyStatus)}
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1">Current Status</span>
                          {getStatusBadge(req.currentStatus, req.cancellationReason)}
                        </div>
                      </div>

                      {/* Footer Info & Action */}
                      <div className="pt-3 border-t border-neutral-100 dark:border-slate-800 flex justify-between items-center text-xs">
                        <div>
                          <span className="block text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-0.5">Preferred Pickup</span>
                          <span className="font-semibold text-neutral-600 dark:text-neutral-350">
                            {new Date(req.preferredPickupDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
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
        )}

        {/* VIEW: CREATE FORM */}
        {view === "CREATE" && (
          <div className="space-y-6 max-w-4xl mx-auto">
            
            {/* Header back row */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView("LIST")}
                className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 hover:bg-neutral-50 cursor-pointer"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h1 className="text-2xl font-black">Submit Service Request</h1>
                <p className="text-xs text-neutral-500">Provide details for validation, inspection, and repair</p>
              </div>
            </div>

            {/* Form Box */}
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 space-y-8 shadow-md text-left">
              
              {/* Per-Product Entry Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-neutral-100 dark:border-slate-800/80 pb-2">
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#D71920]">
                    1. Product & Service Details
                  </h3>
                  {isDistributor && (
                    <button
                      type="button"
                      onClick={() => setAddedProducts(prev => [...prev, {
                        localId: Math.random().toString(36).substr(2, 9),
                        categoryLabel: "",
                        productId: "",
                        serviceCategory: SERVICE_CATEGORIES[0],
                        issueDescription: "",
                        productImages: [],
                        warrantyCard: "",
                        orderId: "",
                        purchaseDate: ""
                      }])}
                      className="px-3 py-1.5 text-xs font-bold text-[#D71920] bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Plus size={14} /> Add Product
                    </button>
                  )}
                </div>

                {loadingProducts ? (
                  <div className="py-4 flex gap-2 items-center text-xs text-neutral-500 font-semibold"><Loader2 size={14} className="animate-spin" /> Loading your orders details...</div>
                ) : (
                  <div className="space-y-8">
                    {addedProducts.map((product, idx) => (
                      <div key={product.localId} className="p-5 border border-neutral-200 dark:border-slate-800 rounded-xl space-y-6 bg-neutral-50/30 dark:bg-slate-800/20 relative">
                        {isDistributor && addedProducts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setAddedProducts(prev => prev.filter(p => p.localId !== product.localId))}
                            className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors"
                          >
                            <X size={16} />
                          </button>
                        )}
                        
                        {/* Product Selection */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {isDistributor && (
                            <div>
                              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Category <span className="text-red-500">*</span></label>
                              <CustomSelect
                                required
                                value={product.categoryLabel}
                                onChange={(val) => setAddedProducts(prev => prev.map(p => p.localId === product.localId ? { ...p, categoryLabel: val, productId: "" } : p))}
                                placeholder="Select category..."
                                groups={[{
                                  label: "Categories",
                                  options: categories.map(c => ({ value: c, label: c }))
                                }]}
                              />
                            </div>
                          )}
                          
                          <div className={!isDistributor ? "sm:col-span-2" : ""}>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Product Name <span className="text-red-500">*</span></label>
                            <CustomSelect
                              required
                              value={product.productId}
                              onChange={(val) => handleProductChange(val, product.localId)}
                              placeholder="Select a product..."
                              groups={
                                isDistributor 
                                  ? [{
                                      label: product.categoryLabel ? `Products in ${product.categoryLabel}` : "Select a category first",
                                      options: allProducts.filter(p => (p.categoryLabel || p.category) === product.categoryLabel).map(p => ({ value: p.id, label: p.name, subLabel: `SKU: ${p.sku || "N/A"}` }))
                                    }]
                                  : [{
                                      label: "Your Purchased Products",
                                      options: purchasedProducts.map(p => ({ value: p.id, label: p.name, subLabel: `SKU: ${p.sku || "N/A"}` }))
                                    }, {
                                      label: "All Other Products",
                                      options: allProducts.filter(p => !purchasedProducts.some(pp => pp.id === p.id)).map(p => ({ value: p.id, label: p.name, subLabel: `SKU: ${p.sku || "N/A"}` }))
                                    }]
                              }
                            />
                          </div>
                        </div>

                        {/* Order ID & Purchase Date (Per Product) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Order ID / Order Number (Optional)</label>
                            <input
                              type="text"
                              placeholder="e.g. ORD-12345"
                              value={product.orderId}
                              onChange={(e) => setAddedProducts(prev => prev.map(p => p.localId === product.localId ? { ...p, orderId: e.target.value } : p))}
                              className="w-full px-4 py-2.5 border border-neutral-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white text-sm rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 outline-none transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Purchase Date <span className="text-red-500">*</span></label>
                            <CustomDatePicker
                              required
                              value={product.purchaseDate}
                              onChange={(val) => setAddedProducts(prev => prev.map(p => p.localId === product.localId ? { ...p, purchaseDate: val } : p))}
                              placeholder="Select purchase date..."
                              max={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                        </div>

                        {/* Service Category */}
                        <div>
                          <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Service Category <span className="text-red-500">*</span></label>
                          <div className="flex flex-wrap gap-2.5">
                            {SERVICE_CATEGORIES.map(cat => (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => setAddedProducts(prev => prev.map(p => p.localId === product.localId ? { ...p, serviceCategory: cat } : p))}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                  product.serviceCategory === cat
                                    ? "bg-[#D71920] border-[#D71920] text-white shadow-md shadow-red-500/10"
                                    : "bg-white border-neutral-200 dark:bg-slate-900 dark:border-slate-700 hover:border-neutral-300"
                                }`}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Issue Description */}
                        <div>
                          <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Detailed Issue Description <span className="text-red-500">*</span></label>
                          <textarea
                            required
                            rows={3}
                            placeholder="Please describe in detail what is wrong with the appliance..."
                            value={product.issueDescription}
                            onChange={(e) => setAddedProducts(prev => prev.map(p => p.localId === product.localId ? { ...p, issueDescription: e.target.value } : p))}
                            className="w-full px-4 py-3 border border-neutral-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white text-sm rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 outline-none transition-all resize-none"
                          />
                        </div>

                        {/* Product Images & Warranty Card */}
                        <div className="space-y-4">
                          <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Product Images & Warranty Card <span className="text-red-500">*</span></label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-neutral-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900/50 hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group">
                              <ImageIcon size={20} className="text-neutral-400 group-hover:text-[#D71920] mb-2 transition-colors" />
                              <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 group-hover:text-[#D71920] transition-colors">Upload Product Images</span>
                              <span className="text-[10px] text-neutral-400 mt-1">JPEG, PNG, WEBP (Max 5MB)</span>
                              <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => handleFileUpload(e, "PRODUCT_IMAGE", product.localId)} disabled={uploading} />
                            </label>
                            <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-neutral-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900/50 hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group">
                              <FileText size={20} className="text-neutral-400 group-hover:text-[#D71920] mb-2 transition-colors" />
                              <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 group-hover:text-[#D71920] transition-colors">Upload Warranty Card</span>
                              <span className="text-[10px] text-neutral-400 mt-1">Optional for verification</span>
                              <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => handleFileUpload(e, "WARRANTY_CARD", product.localId)} disabled={uploading} />
                            </label>
                          </div>
                          
                          {/* Preview uploaded images for this product */}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {product.productImages.map((img, i) => (
                              <div key={i} className="relative w-16 h-16 rounded overflow-hidden border border-neutral-200 dark:border-slate-700">
                                <img src={img} alt={`Preview ${i+1}`} className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => setAddedProducts(prev => prev.map(p => p.localId === product.localId ? { ...p, productImages: p.productImages.filter((_, index) => index !== i) } : p))}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                                >
                                  <X size={10} />
                                </button>
                              </div>
                            ))}
                            {product.warrantyCard && (
                              <div className="relative w-16 h-16 rounded overflow-hidden border border-green-500 bg-green-50 dark:bg-green-900/20 flex flex-col items-center justify-center">
                                <FileText size={16} className="text-green-600" />
                                <span className="text-[8px] font-bold mt-1 text-green-700 uppercase">Warranty</span>
                                <button
                                  type="button"
                                  onClick={() => setAddedProducts(prev => prev.map(p => p.localId === product.localId ? { ...p, warrantyCard: "" } : p))}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                                >
                                  <X size={10} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pickup & Contact Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#D71920] border-b border-neutral-100 dark:border-slate-800/80 pb-2">
                  2. Pickup & Contact Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Preferred Pickup Date <span className="text-red-500">*</span></label>
                    <CustomDatePicker
                      required
                      value={preferredPickupDate}
                      onChange={(val) => setPreferredPickupDate(val)}
                      placeholder="Select pickup date..."
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <p className="text-[10px] text-neutral-400 mt-1">Our logistics partner will collect the product on or near this date.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Contact Number <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        required
                        placeholder="10-digit mobile number"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white text-sm rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Pickup Address <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3.5 top-5 text-neutral-400" />
                      <textarea
                        required
                        rows={3}
                        placeholder="Street details, locality, city, state and pincode"
                        value={pickupAddress}
                        onChange={(e) => setPickupAddress(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white text-sm rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 outline-none transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-4 pt-4 border-t border-neutral-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 py-3 bg-[#D71920] hover:bg-[#b8141a] text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-red-500/10 cursor-pointer disabled:opacity-50 text-center"
                >
                  {uploading ? "UPLOADING ATTACHMENTS..." : "SUBMIT SERVICE TICKET"}
                </button>
                <button
                  type="button"
                  onClick={() => setView("LIST")}
                  className="px-6 py-3 border border-neutral-300 hover:bg-neutral-50 text-sm font-bold rounded-xl transition-all cursor-pointer"
                >
                  CANCEL
                </button>
              </div>

            </form>
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
                {selectedRequest.distributorItems && selectedRequest.distributorItems.length > 0 ? (
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
                          <div>{getWarrantyBadge(selectedRequest.warrantyStatus)}</div>
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
                          <p className="text-neutral-400 mb-0.5">Preferred Pickup Date</p>
                          <p className="font-semibold text-neutral-700 dark:text-neutral-200">
                            {new Date(selectedRequest.preferredPickupDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-neutral-400 mb-0.5">Contact Number</p>
                          <p className="font-semibold text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5 break-all">
                            <Phone size={12} className="text-neutral-400" />
                            <span>{selectedRequest.contactNumber}</span>
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-neutral-400 mb-0.5">Pickup Address</p>
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

                {/* Out of Warranty Charges & Approval */}
                {/* Out of Warranty Charges & Approval (Single Product Only) */}
                {(!selectedRequest.distributorItems || selectedRequest.distributorItems.length === 0) && selectedRequest.warrantyStatus === "Warranty Expired" && selectedRequest.serviceCharge !== null && selectedRequest.serviceCharge !== undefined && (
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
                  {getStatusSteps(selectedRequest.warrantyStatus, selectedRequest.currentStatus, selectedRequest.cancellationReason).map((step, idx, arr) => {
                    const statusIdx = getStatusIndex(selectedRequest.currentStatus, arr);
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
