"use client";
import React, { useState, useEffect } from "react";
import { ENV } from "@/config/env";
import { useAuth } from "@/providers/AuthProvider";
import SalesSidebar from "@/components/layout/SalesSidebar";
import { Loader2, Search, ArrowUpDown, FileText, Calendar, Shield, IndianRupee } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface OrderType {
  id: string;
  orderNumber: string;
  grandTotal: number;
  status: string;
  createdAt: string;
  user?: {
    companyName?: string;
    firstName: string;
    lastName: string;
  };
}

export default function SalesOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchAllOrders = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        // 1. Fetch assigned distributors
        const distRes = await fetch(`${ENV.API_BASE_URL}/sales-persons/my-distributors`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!distRes.ok) throw new Error("Failed to fetch distributors");
        const distData = await distRes.json();

        if (distData.success && distData.distributors) {
          const allOrdersList: OrderType[] = [];

          // 2. Fetch orders for each distributor
          await Promise.all(
            distData.distributors.map(async (dist: any) => {
              try {
                const orderRes = await fetch(`${ENV.API_BASE_URL}/sales-persons/my-distributors/${dist.id}/orders`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                if (orderRes.ok) {
                  const orderData = await orderRes.json();
                  if (orderData.success && orderData.orders) {
                    const formattedOrders = orderData.orders.map((o: any) => ({
                      ...o,
                      user: {
                        companyName: dist.companyName,
                        firstName: dist.firstName,
                        lastName: dist.lastName
                      }
                    }));
                    allOrdersList.push(...formattedOrders);
                  }
                }
              } catch (err) {
                console.error(`Error fetching orders for distributor ${dist.id}:`, err);
              }
            })
          );

          // 3. Sort orders by date descending
          allOrdersList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setOrders(allOrdersList);
        }
      } catch (err: any) {
        console.error("Fetch orders error:", err);
        toast.error("Failed to load distributor orders");
      } finally {
        setLoading(false);
      }
    };

    fetchAllOrders();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.user?.companyName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${order.user?.firstName} ${order.user?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 text-slate-800 font-sans">
      <SalesSidebar currentPath="/sales/orders" />
      
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900 flex items-center gap-2">
                <FileText className="text-[#D71920]" size={28} />
                <span>Distributor Orders</span>
              </h1>
              <p className="text-neutral-500 text-sm font-semibold uppercase tracking-wider mt-1">
                Monitor order collections and processing states of your distributors.
              </p>
            </div>
          </div>

          {/* Filters card */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Search orders, company or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 focus:border-[#D71920] text-sm"
              />
              <Search className="absolute left-3 top-2.5 text-neutral-400" size={18} />
            </div>

            <div className="flex gap-2 items-center w-full md:w-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 whitespace-nowrap">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-neutral-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 focus:border-[#D71920]"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="animate-spin text-[#D71920]" size={36} />
                <p className="text-xs font-black uppercase text-neutral-400 tracking-wider">Loading orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-20 text-center flex flex-col items-center justify-center gap-2">
                <FileText className="text-neutral-300" size={48} />
                <p className="text-sm font-extrabold text-neutral-500 uppercase tracking-widest mt-2">No Orders Found</p>
                <p className="text-xs text-neutral-400 font-medium">No order activity recorded under your distributors.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-neutral-50 text-[10px] sm:text-xs font-extrabold text-neutral-400 uppercase tracking-wider">
                      <th className="py-4 px-6">Order Number</th>
                      <th className="py-4 px-6">Distributor / Company</th>
                      <th className="py-4 px-6">Order Date</th>
                      <th className="py-4 px-6">Grand Total</th>
                      <th className="py-4 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-xs sm:text-sm font-medium text-slate-700">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="py-4 px-6 font-bold text-[#D71920]">{order.orderNumber}</td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-neutral-900">{order.user?.companyName || "N/A"}</span>
                            <span className="text-xs text-neutral-400 font-semibold">{order.user?.firstName} {order.user?.lastName}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-neutral-500 font-semibold flex items-center gap-1.5 mt-2 sm:mt-0">
                          <Calendar size={14} />
                          <span>{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </td>
                        <td className="py-4 px-6 font-bold text-neutral-900">
                          <span className="flex items-center gap-0.5">
                            <IndianRupee size={14} className="text-neutral-400" />
                            <span>{order.grandTotal.toLocaleString("en-IN")}</span>
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block",
                            order.status === "DELIVERED" && "bg-green-500/10 text-green-600",
                            order.status === "PENDING" && "bg-amber-500/10 text-amber-600",
                            order.status === "PROCESSING" && "bg-blue-500/10 text-blue-600",
                            order.status === "SHIPPED" && "bg-indigo-500/10 text-indigo-600",
                            order.status === "CANCELLED" && "bg-red-500/10 text-red-600"
                          )}>
                            {order.status}
                          </span>
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
    </div>
  );
}
