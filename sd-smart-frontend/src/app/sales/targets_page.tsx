"use client";
import React, { useState, useEffect } from "react";
import { ENV } from "@/config/env";
import { useAuth } from "@/providers/AuthProvider";
import SalesSidebar from "@/components/layout/SalesSidebar";
import { Loader2, TrendingUp, Calendar, AlertCircle, IndianRupee, Target, Award, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TargetType {
  targetType: string;
  targetValue: number;
  month: number;
  year: number;
  achievement: number;
  progressPercent: number;
  remainingTarget: number;
  remarks: string;
}

export default function SalesTargetsPage() {
  const { user } = useAuth();
  const [target, setTarget] = useState<TargetType | null>(null);
  const [loading, setLoading] = useState(true);

  // Month & Year selects
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" }
  ];

  const years = [
    new Date().getFullYear() - 1,
    new Date().getFullYear(),
    new Date().getFullYear() + 1
  ];

  useEffect(() => {
    const fetchTargetData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        const res = await fetch(
          `${ENV.API_BASE_URL}/sales-persons/dashboard-stats?month=${month}&year=${year}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!res.ok) throw new Error("Failed to fetch target data");
        const data = await res.json();

        if (data.success && data.stats) {
          const stats = data.stats;
          if (stats.currentTarget) {
            setTarget({
              targetType: stats.currentTarget.targetType,
              targetValue: stats.currentTarget.targetValue,
              month: stats.currentTarget.month,
              year: stats.currentTarget.year,
              achievement: stats.achievement || 0,
              progressPercent: stats.progressPercent || 0,
              remainingTarget: stats.remainingTarget || 0,
              remarks: stats.remarks || ""
            });
          } else {
            // Target not assigned yet by admin for this month
            setTarget({
              targetType: "REVENUE",
              targetValue: 0,
              month,
              year,
              achievement: stats.achievement || 0,
              progressPercent: 0,
              remainingTarget: 0,
              remarks: ""
            });
          }
        }
      } catch (err: any) {
        console.error("Fetch target error:", err);
        toast.error("Failed to load target details");
      } finally {
        setLoading(false);
      }
    };

    fetchTargetData();
  }, [month, year]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 text-slate-800 font-sans">
      <SalesSidebar currentPath="/sales/targets" />

      <main className="flex-1 lg:ml-64 p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900 flex items-center gap-2">
              <TrendingUp className="text-[#D71920]" size={28} />
              <span>Monthly Sales Targets</span>
            </h1>
            <p className="text-neutral-500 text-sm font-semibold uppercase tracking-wider mt-1">
              Track your assigned monthly goals, achievements, and commissions.
            </p>
          </div>

          {/* Filter Card */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Month:</span>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="px-4 py-2 border border-neutral-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 focus:border-[#D71920]"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Year:</span>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="px-4 py-2 border border-neutral-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 focus:border-[#D71920]"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Main Visual Display */}
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 sm:p-10 flex flex-col md:flex-row gap-8 items-center">
            {loading ? (
              <div className="w-full py-16 flex flex-col items-center justify-center gap-3">
                <Loader2 className="animate-spin text-[#D71920]" size={36} />
                <p className="text-xs font-black uppercase text-neutral-400 tracking-wider">Loading target metrics...</p>
              </div>
            ) : !target || target.targetValue === 0 ? (
              <div className="w-full py-8 text-center flex flex-col items-center justify-center gap-4">
                <div className="p-4 bg-amber-500/10 rounded-full text-amber-500">
                  <AlertCircle size={36} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase text-neutral-800 tracking-wider">No Target Assigned</h3>
                  <p className="text-xs text-neutral-400 font-semibold mt-1 max-w-sm mx-auto">
                    The administrator has not assigned a monthly sales target for {months.find(m => m.value === month)?.label} {year} yet.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Progress Wheel */}
                <div className="relative flex flex-col items-center justify-center flex-shrink-0">
                  <svg className="w-48 h-48 transform -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      className="text-neutral-100"
                      strokeWidth="16"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      className="text-[#D71920] transition-all duration-1000 ease-out"
                      strokeWidth="16"
                      strokeDasharray={502.6}
                      strokeDashoffset={502.6 - (502.6 * target.progressPercent) / 100}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center text-center">
                    <span className="text-3xl font-black text-neutral-900">{target.progressPercent}%</span>
                    <span className="text-[10px] text-neutral-400 font-black uppercase tracking-wider mt-0.5">Progress</span>
                  </div>
                </div>

                {/* Performance Cards */}
                <div className="flex-1 space-y-6 w-full">
                  <div>
                    <span className="px-3 py-1 bg-[#D71920]/10 text-[#D71920] font-black uppercase tracking-widest text-[10px] rounded-full">
                      Target Period: {months.find(m => m.value === month)?.label} {year}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-neutral-900 mt-3 flex items-center gap-1.5">
                      <Target className="text-[#D71920]" size={22} />
                      <span>Monthly Metric Overview</span>
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-neutral-50 border border-neutral-200/60 rounded-2xl flex items-center gap-3">
                      <div className="p-2.5 bg-neutral-200/50 rounded-xl text-neutral-600">
                        <Award size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Target Value</p>
                        <p className="text-base sm:text-lg font-black text-neutral-900 flex items-center">
                          {target.targetType === "REVENUE" && <IndianRupee size={16} />}
                          <span>{target.targetValue.toLocaleString("en-IN")}</span>
                          {target.targetType === "UNITS_SOLD" && <span className="text-xs font-semibold ml-1 text-neutral-500">Units</span>}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-neutral-50 border border-neutral-200/60 rounded-2xl flex items-center gap-3">
                      <div className="p-2.5 bg-[#D71920]/10 rounded-xl text-[#D71920]">
                        <CheckCircle size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Achieved Value</p>
                        <p className="text-base sm:text-lg font-black text-neutral-900 flex items-center">
                          {target.targetType === "REVENUE" && <IndianRupee size={16} />}
                          <span>{target.achievement.toLocaleString("en-IN")}</span>
                          {target.targetType === "UNITS_SOLD" && <span className="text-xs font-semibold ml-1 text-neutral-500">Units</span>}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-dashed border-neutral-200 rounded-2xl space-y-1">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Admin Review Notes / Remarks</span>
                    <p className="text-xs font-medium text-neutral-600 italic">
                      {target.remarks || "No evaluation comments registered by administrator for this target cycle."}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
