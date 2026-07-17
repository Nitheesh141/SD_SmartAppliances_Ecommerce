"use client";
import { ENV } from "@/config/env";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";
import { 
  Loader2, Shield, Search, RefreshCw, X, Building,
  Mail, Phone, IndianRupee, Clock, ArrowLeftRight
} from "lucide-react";
import SalesSidebar from "@/components/layout/SalesSidebar";
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

export default function SalesDistributorsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [distributors, setDistributors] = useState<DistributorType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Drawer / modal states
  const [selectedDistributor, setSelectedDistributor] = useState<DistributorType | null>(null);
  const [distributorOrders, setDistributorOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Route protection
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user || user.role !== "SALESPERSON") {
        toast.error("Access Denied. Sales Persons only.");
        router.push("/auth/login");
      }
    }
  }, [isAuthenticated, user, authLoading, router]);

  // Fetch Distributors
  const fetchDistributors = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const res = await fetch(`${ENV.API_BASE_URL}/sales-persons/my-distributors`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.success) {
        setDistributors(data.distributors || []);
      } else {
        if (!isBackground) toast.error(data.message || "Failed to fetch distributors");
      }
    } catch (err) {
      console.error("Error fetching distributors:", err);
      if (!isBackground) toast.error("Failed to load distributors list");
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === "SALESPERSON") {
      fetchDistributors(false);
    }
  }, [isAuthenticated, user]);

  // Fetch Distributor Orders
  const fetchDistributorOrders = async (distId: string) => {
    setLoadingOrders(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${ENV.API_BASE_URL}/sales-persons/my-distributors/${distId}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDistributorOrders(data.orders || []);
      } else {
        toast.error("Failed to retrieve distributor order history");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading order history");
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleOpenDetails = (d: DistributorType) => {
    setSelectedDistributor(d);
    setDistributorOrders([]);
    fetchDistributorOrders(d.id);
  };

  const filteredDistributors = useMemo(() => {
    return distributors.filter(d => {
      const q = searchQuery.toLowerCase();
      return (
        d.lastName.toLowerCase().includes(q) ||
        (d.companyName && d.companyName.toLowerCase().includes(q)) ||
        d.firstName.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q) ||
        (d.phoneNumber && d.phoneNumber.includes(q))
      );
    });
  }, [distributors, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-neutral-50 text-slate-900 transition-colors duration-300 font-sans">
      {/* Sidebar */}
      <SalesSidebar currentPath="/sales/distributors" />

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 md:p-8 overflow-y-auto text-left">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 mb-8 border-neutral-200">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#1C1C1C] uppercase">
              Assigned Distributors
            </h1>
            <p className="text-xs font-bold text-neutral-500 uppercase mt-1">
              View your portfolio of distributors, track active orders, and view billing logs
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by company name, contact person, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none text-sm transition-all bg-white border-neutral-200 text-slate-900 focus:border-[#D71920]"
            />
          </div>
          
          <button
            onClick={() => fetchDistributors(false)}
            disabled={loading}
            className="flex items-center justify-center p-3 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-slate-700 transition-all cursor-pointer"
          >
            <RefreshCw size={18} className={cn(loading && "animate-spin")} />
          </button>
        </div>

        {/* Table / Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-[#D71920]" size={36} />
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
              Fetching Distributors...
            </p>
          </div>
        ) : filteredDistributors.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-neutral-200 bg-white p-6">
            <Building size={48} className="mx-auto mb-4 text-neutral-450" />
            <h3 className="font-bold text-lg">No Distributors Found</h3>
            <p className="text-sm text-neutral-500 mt-1">
              You are currently not assigned to any active distributors. Please contact administrator.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-xs font-bold uppercase tracking-wider border-neutral-250 text-neutral-500 bg-neutral-50">
                  <th className="py-4 px-6">Business Details</th>
                  <th className="py-4 px-6">Contact Person</th>
                  <th className="py-4 px-6">Email / Mobile</th>
                  <th className="py-4 px-6">GSTIN</th>
                  <th className="py-4 px-6">Approval</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/45">
                {filteredDistributors.map((d) => (
                  <tr key={d.id} className="text-sm transition-colors hover:bg-neutral-50/50">
                    <td className="py-4 px-6">
                      <div className="font-bold text-[#1C1C1C]">{d.companyName || d.lastName}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">{d.businessAddress}</div>
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-800">{d.firstName}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Mail size={12} className="text-neutral-500" />
                        <span>{d.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs mt-1">
                        <Phone size={12} className="text-neutral-500" />
                        <span>{d.phoneNumber || "N/A"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs uppercase tracking-wider text-slate-700">
                      {d.gstin || <span className="text-neutral-450 italic">None</span>}
                    </td>
                    <td className="py-4 px-6">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-bold uppercase",
                        d.approvalStatus === "APPROVED" 
                          ? "bg-green-500/10 text-green-600" 
                          : d.approvalStatus === "REJECTED"
                            ? "bg-red-500/10 text-red-600"
                            : "bg-yellow-500/10 text-yellow-600"
                      )}>
                        {d.approvalStatus || "PENDING"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleOpenDetails(d)}
                        className="px-4 py-2 border border-neutral-200 bg-white hover:bg-neutral-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        View Profile & Orders
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Details Drawer */}
      {selectedDistributor && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={() => setSelectedDistributor(null)} />
          
          {/* Drawer container */}
          <div className="relative w-full max-w-3xl transform shadow-2xl transition-all border-l border-neutral-200 text-left flex flex-col h-full bg-white text-slate-900 animate-slide-in-right">
            {/* Drawer Header */}
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between bg-white">
              <div>
                <h3 className="text-lg font-black uppercase text-[#D71920]">
                  Distributor Profile Details
                </h3>
                <p className="text-xs font-bold text-neutral-500 uppercase mt-0.5">
                  {selectedDistributor.companyName || selectedDistributor.lastName}
                </p>
              </div>
              <button
                onClick={() => setSelectedDistributor(null)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
              {/* Profile details grid */}
              <div className="p-4 rounded-xl border bg-neutral-50 border-neutral-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <span className="text-neutral-500 uppercase font-bold text-[10px]">Business Name</span>
                  <p className="text-sm font-extrabold mt-0.5">{selectedDistributor.companyName || "N/A"}</p>
                </div>
                <div>
                  <span className="text-neutral-500 uppercase font-bold text-[10px]">Contact Person</span>
                  <p className="text-sm font-extrabold mt-0.5">{selectedDistributor.firstName}</p>
                </div>
                <div>
                  <span className="text-neutral-500 uppercase font-bold text-[10px]">Email Address</span>
                  <p className="text-sm font-extrabold mt-0.5">{selectedDistributor.email}</p>
                </div>
                <div>
                  <span className="text-neutral-500 uppercase font-bold text-[10px]">Mobile Number</span>
                  <p className="text-sm font-extrabold mt-0.5">{selectedDistributor.phoneNumber || "N/A"}</p>
                </div>
                <div className="md:col-span-2">
                  <span className="text-neutral-500 uppercase font-bold text-[10px]">Business Address</span>
                  <p className="text-sm font-extrabold mt-0.5 leading-relaxed">{selectedDistributor.businessAddress}</p>
                </div>
                <div>
                  <span className="text-neutral-500 uppercase font-bold text-[10px]">GSTIN Number</span>
                  <p className="text-sm font-mono mt-0.5 uppercase">{selectedDistributor.gstin || "N/A"}</p>
                </div>
                <div>
                  <span className="text-neutral-500 uppercase font-bold text-[10px]">Registration Status</span>
                  <p className="text-sm font-extrabold mt-0.5 text-[#D71920] uppercase">{selectedDistributor.approvalStatus}</p>
                </div>
              </div>

              {/* Order History list */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-200 pb-2">
                  <ArrowLeftRight size={16} className="text-[#D71920]" />
                  <h4 className="font-extrabold uppercase text-xs tracking-wider">Distributor Order History</h4>
                </div>

                {loadingOrders ? (
                  <div className="flex justify-center items-center py-10 gap-2">
                    <Loader2 className="animate-spin text-[#D71920]" size={20} />
                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Loading Orders...</span>
                  </div>
                ) : distributorOrders.length === 0 ? (
                  <p className="text-xs text-neutral-500 italic py-4 text-center">No orders found for this distributor</p>
                ) : (
                  <div className="space-y-4">
                    {distributorOrders.map((order) => (
                      <div key={order.id} className="p-4 rounded-xl border bg-neutral-50 border-neutral-200 space-y-3 text-xs font-semibold">
                        <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                          <div>
                            <span className="font-mono text-xs tracking-wide text-neutral-800 font-extrabold">{order.orderNumber}</span>
                            <span className="text-neutral-500 block text-[9px] mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</span>
                          </div>
                          
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                            order.status === "DELIVERED"
                              ? "bg-green-500/10 text-green-600"
                              : order.status === "CANCELLED" || order.status === "REJECTED"
                                ? "bg-red-500/10 text-red-600"
                                : "bg-[#D71920]/10 text-[#D71920]"
                          )}>
                            {order.status.replace("_", " ")}
                          </span>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-2">
                          {order.items?.map((item: any) => (
                            <div key={item.id} className="flex justify-between items-center text-[11px] font-medium text-neutral-500">
                              <span className="truncate max-w-[320px]">{item.product?.name || "Product"} (x{item.quantity})</span>
                              <span>₹{(item.unitPrice * item.quantity).toLocaleString("en-IN")}</span>
                            </div>
                          ))}
                        </div>

                        {/* Order Totals */}
                        <div className="flex items-center justify-between border-t border-neutral-200 pt-2 text-xs font-black">
                          <span className="text-neutral-550">Grand Total</span>
                          <span className="text-sm text-neutral-800">₹{order.grandTotal.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
