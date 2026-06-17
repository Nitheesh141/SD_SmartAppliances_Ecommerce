"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";
import { 
  Loader2, Layers, TrendingUp, TrendingDown, Calendar as CalendarIcon, Filter
} from "lucide-react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  productId: string;
  type: "IN" | "OUT";
  quantity: number;
  createdAt: string;
  product: {
    name: string;
    productId: string | null;
    modelNumber: string | null;
    categoryLabel: string;
  };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

  // Filters state
  const [viewMode, setViewMode] = useState<"daily" | "monthly">("daily");
  
  // Default to today
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split("T")[0]);
  const [selectedMonth, setSelectedMonth] = useState(today.toISOString().slice(0, 7)); // YYYY-MM

  // Load theme from localStorage on client side mount
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
      if (!isAuthenticated || !user || (user.role !== "admin" && user.role !== "superadmin")) {
        toast.error("Access Denied. Admins only.");
        router.push("/auth/login");
      }
    }
  }, [isAuthenticated, user, authLoading, router]);

  // Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          setLoadingTransactions(false);
          return;
        }
        
        const res = await fetch("http://localhost:5000/api/products/transactions", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const data = await res.json();
        if (data.success) {
          setTransactions(data.transactions);
        } else {
          toast.error(data.message || "Failed to fetch transactions");
        }
      } catch (err) {
        console.error("Error fetching transactions:", err);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoadingTransactions(false);
      }
    };

    if (isAuthenticated) {
      fetchTransactions();
    }
  }, [isAuthenticated]);

  const isDark = theme === "dark";

  // Filter transactions based on view mode
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const date = new Date(t.createdAt);
      if (viewMode === "daily") {
        return date.toISOString().split("T")[0] === selectedDate;
      } else {
        return date.toISOString().slice(0, 7) === selectedMonth;
      }
    });
  }, [transactions, viewMode, selectedDate, selectedMonth]);

  // KPIs
  const totalStockIn = filteredTransactions.filter(t => t.type === "IN").reduce((acc, t) => acc + t.quantity, 0);
  const totalStockOut = filteredTransactions.filter(t => t.type === "OUT").reduce((acc, t) => acc + t.quantity, 0);

  // Chart Data preparation
  const chartData = useMemo(() => {
    // Always show day progress for the month of the selected date or selected month
    let targetMonthStr = selectedMonth;
    if (viewMode === "daily") {
      targetMonthStr = selectedDate.slice(0, 7); // Extract YYYY-MM from YYYY-MM-DD
    }
    
    if (!targetMonthStr) return [];
    
    const [year, month] = targetMonthStr.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    return days.map(day => {
      // Find transactions on this specific day
      const trs = transactions.filter(t => {
        const d = new Date(t.createdAt);
        return d.getFullYear() === year && (d.getMonth() + 1) === month && d.getDate() === day;
      });
      
      return {
        label: `${day}`,
        in: trs.filter(t => t.type === "IN").reduce((sum, t) => sum + t.quantity, 0),
        out: trs.filter(t => t.type === "OUT").reduce((sum, t) => sum + t.quantity, 0)
      };
    });
  }, [transactions, viewMode, selectedDate, selectedMonth]);

  if (authLoading) {
    return (
      <div className={cn(
        "min-h-screen flex flex-col items-center justify-center font-sans",
        isDark ? "bg-[#0d0d0d] text-white" : "bg-[#fafafa] text-slate-950"
      )}>
        <Loader2 className="w-10 h-10 text-[#D71920] animate-spin" />
      </div>
    );
  }

  // Calculate SVG Graph Dimensions & Scaling
  const maxVal = Math.max(...chartData.map(d => Math.max(d.in, d.out)), 10); // Ensure min height of 10
  const graphHeight = 250;
  const graphWidth = 1000;
  const paddingX = 40;
  const paddingY = 20;

  const getPoint = (val: number, index: number, total: number) => {
    const x = paddingX + (index / (total - 1)) * (graphWidth - 2 * paddingX);
    const y = graphHeight - paddingY - (val / maxVal) * (graphHeight - 2 * paddingY);
    return `${x},${y}`;
  };

  const polylineIn = chartData.map((d, i) => getPoint(d.in, i, chartData.length)).join(" ");
  const polylineOut = chartData.map((d, i) => getPoint(d.out, i, chartData.length)).join(" ");

  return (
    <div className={cn(
      "min-h-screen flex flex-col lg:flex-row transition-colors duration-300 font-sans selection:bg-[#D71920]/30 selection:text-white",
      isDark ? "dark bg-[#0d0d0d] text-white" : "bg-[#fafafa] text-slate-900"
    )}>
      <AdminSidebar currentPath="/admin/dashboard" theme={theme} toggleTheme={toggleTheme} />

      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <header className={cn(
          "px-6 py-6 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors duration-300",
          isDark ? "border-neutral-800 bg-[#0d0d0d]/80" : "border-neutral-200 bg-white"
        )}>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#D71920] uppercase tracking-wider mb-1">
              <Layers size={14} />
              <span>Analytics</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
            <p className={cn("text-xs mt-0.5", isDark ? "text-neutral-500" : "text-neutral-400")}>
              Inventory movements, stock in, and stock out progress.
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className={cn("flex items-center p-1 rounded-md border", isDark ? "border-neutral-800 bg-neutral-900" : "border-neutral-200 bg-white")}>
              <button 
                onClick={() => setViewMode("daily")}
                className={cn("px-3 py-1.5 text-xs font-medium rounded transition-colors", viewMode === "daily" ? (isDark ? "bg-neutral-800 text-white" : "bg-neutral-100 text-slate-900") : "text-neutral-500")}
              >
                Daily
              </button>
              <button 
                onClick={() => setViewMode("monthly")}
                className={cn("px-3 py-1.5 text-xs font-medium rounded transition-colors", viewMode === "monthly" ? (isDark ? "bg-neutral-800 text-white" : "bg-neutral-100 text-slate-900") : "text-neutral-500")}
              >
                Monthly
              </button>
            </div>

            {viewMode === "daily" ? (
              <input 
                type="date" 
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className={cn(
                  "px-3 py-2 text-sm rounded-md border focus:outline-none focus:ring-1 focus:ring-[#D71920]",
                  isDark ? "bg-neutral-900 border-neutral-800 text-white" : "bg-white border-neutral-200 text-slate-900"
                )}
              />
            ) : (
              <input 
                type="month" 
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className={cn(
                  "px-3 py-2 text-sm rounded-md border focus:outline-none focus:ring-1 focus:ring-[#D71920]",
                  isDark ? "bg-neutral-900 border-neutral-800 text-white" : "bg-white border-neutral-200 text-slate-900"
                )}
              />
            )}
          </div>
        </header>

        <main className="flex-grow p-6 space-y-6">
          {loadingTransactions ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-[#D71920] animate-spin" />
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={cn("p-6 rounded-xl border flex items-center gap-4", isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200")}>
                  <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <p className={cn("text-xs font-medium uppercase tracking-wider", isDark ? "text-neutral-400" : "text-slate-500")}>Total Stock In</p>
                    <h3 className="text-2xl font-bold mt-1 text-emerald-500">{totalStockIn}</h3>
                  </div>
                </div>

                <div className={cn("p-6 rounded-xl border flex items-center gap-4", isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200")}>
                  <div className="p-3 bg-red-500/10 text-red-500 rounded-lg">
                    <TrendingDown size={24} />
                  </div>
                  <div>
                    <p className={cn("text-xs font-medium uppercase tracking-wider", isDark ? "text-neutral-400" : "text-slate-500")}>Total Stock Out</p>
                    <h3 className="text-2xl font-bold mt-1 text-red-500">{totalStockOut}</h3>
                  </div>
                </div>
              </div>

              {/* Progress Line Chart */}
              <div className={cn("p-6 rounded-xl border", isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200")}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-semibold">Inventory Movement Progress</h3>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500"></div>Stock In</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500"></div>Stock Out</div>
                  </div>
                </div>
                
                <div className="w-full overflow-x-auto relative">
                  <svg width="100%" height={graphHeight} viewBox={`0 0 ${graphWidth} ${graphHeight}`} preserveAspectRatio="none" className="w-full min-w-[600px] bg-transparent">
                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                      const y = paddingY + ratio * (graphHeight - 2 * paddingY);
                      return (
                        <g key={`grid-${i}`}>
                          <line x1={paddingX} y1={y} x2={graphWidth - paddingX} y2={y} stroke={isDark ? "#333" : "#e5e7eb"} strokeDasharray="4 4" />
                          <text x={paddingX - 10} y={y + 4} fontSize="10" fill={isDark ? "#666" : "#999"} textAnchor="end">
                            {Math.round(maxVal - ratio * maxVal)}
                          </text>
                        </g>
                      );
                    })}

                    {/* Stock In Line */}
                    <polyline points={polylineIn} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    {chartData.map((d, i) => (
                      <circle key={`in-${i}`} cx={getPoint(d.in, i, chartData.length).split(',')[0]} cy={getPoint(d.in, i, chartData.length).split(',')[1]} r="4" fill="#10b981" />
                    ))}

                    {/* Stock Out Line */}
                    <polyline points={polylineOut} fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    {chartData.map((d, i) => (
                      <circle key={`out-${i}`} cx={getPoint(d.out, i, chartData.length).split(',')[0]} cy={getPoint(d.out, i, chartData.length).split(',')[1]} r="4" fill="#ef4444" />
                    ))}

                    {/* X-axis labels */}
                    {chartData.map((d, i) => {
                      // Show fewer labels if too many
                      if (chartData.length > 20 && i % 3 !== 0) return null;
                      const x = paddingX + (i / (chartData.length - 1)) * (graphWidth - 2 * paddingX);
                      return (
                        <text key={`label-${i}`} x={x} y={graphHeight - 2} fontSize="10" fill={isDark ? "#666" : "#999"} textAnchor="middle">
                          {d.label}
                        </text>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Transaction History Table */}
              <div className={cn("rounded-xl border overflow-hidden", isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200")}>
                <div className="p-4 border-b border-inherit">
                  <h3 className="text-sm font-semibold">Transaction History</h3>
                </div>
                
                {filteredTransactions.length === 0 ? (
                  <div className="p-8 text-center text-sm text-neutral-500">
                    No transactions found for the selected period.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className={cn("text-xs uppercase bg-black/5 dark:bg-white/5", isDark ? "text-neutral-400" : "text-neutral-500")}>
                        <tr>
                          <th className="px-6 py-3 font-medium">Date & Time</th>
                          <th className="px-6 py-3 font-medium">Product</th>
                          <th className="px-6 py-3 font-medium">Model</th>
                          <th className="px-6 py-3 font-medium">Type</th>
                          <th className="px-6 py-3 font-medium text-right">Quantity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                        {filteredTransactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              {new Date(tx.createdAt).toLocaleString(undefined, {
                                year: 'numeric', month: 'short', day: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-medium text-slate-900 dark:text-white truncate max-w-[200px]">{tx.product.name}</div>
                              <div className="text-xs text-neutral-500">{tx.product.categoryLabel}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-neutral-500">
                              {tx.product.modelNumber || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={cn(
                                "px-2.5 py-0.5 rounded text-xs font-semibold",
                                tx.type === "IN" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                              )}>
                                {tx.type === "IN" ? "STOCK IN" : "STOCK OUT"}
                              </span>
                            </td>
                            <td className={cn(
                              "px-6 py-4 whitespace-nowrap text-right font-bold",
                              tx.type === "IN" ? "text-emerald-500" : "text-red-500"
                            )}>
                              {tx.type === "IN" ? "+" : "-"}{tx.quantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
