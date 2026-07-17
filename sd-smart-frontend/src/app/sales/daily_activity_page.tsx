"use client";
import React, { useState, useEffect } from "react";
import { ENV } from "@/config/env";
import { useAuth } from "@/providers/AuthProvider";
import SalesSidebar from "@/components/layout/SalesSidebar";
import {
  Loader2, Plus, Calendar, Clock, MapPin, CheckCircle2, AlertCircle, AlertTriangle, FileText, Upload, Trash2, Edit2, Eye, X, ArrowRight, IndianRupee, ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DistributorOption {
  id: string;
  companyName?: string;
  firstName: string;
  lastName: string;
}

interface ActivityType {
  id: string;
  activityDate: string;
  startTime: string;
  endTime: string;
  workingStatus: string;
  currentLocation: string;
  distributorId?: string | null;
  distributor?: {
    companyName?: string;
    firstName: string;
    lastName: string;
  } | null;
  visitType?: string | null;
  visitStatus?: string | null;
  orderCollected: boolean;
  orderAmount?: number | null;
  productsOrdered?: string | null;
  expectedDeliveryDate?: string | null;
  newEnquiry: boolean;
  enquiryDistributorName?: string | null;
  enquiryMobile?: string | null;
  enquiryLocation?: string | null;
  interestedProducts?: string | null;
  numberOfVisits: number;
  numberOfOrders: number;
  numberOfEnquiries: number;
  numberOfFollowUps: number;
  distanceTravelled?: number | null;
  achievements?: string | null;
  challenges?: string | null;
  tomorrowPlan?: string | null;
  remarks?: string | null;
  attachment?: {
    visitPhoto?: string;
    shopPhoto?: string;
    invoicePhoto?: string;
    businessCard?: string;
  } | null;
  status: string; // DRAFT, PENDING, APPROVED, CORRECTION_REQUESTED, REJECTED, VERIFIED
  reviewComment?: string | null;
  submittedAt?: string | null;
}

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

function CustomSelect({ value, onChange, options, placeholder = "Select option" }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 flex items-center justify-between transition-all cursor-pointer hover:border-neutral-300"
      >
        <span className={cn("truncate", !selectedOption && "text-neutral-400 font-medium")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className={cn("text-neutral-400 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-neutral-200/90 rounded-xl shadow-xl py-1.5 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3.5 py-2.5 text-xs sm:text-sm font-semibold transition-colors cursor-pointer block",
                  isSelected
                    ? "bg-[#D71920]/10 text-[#D71920]"
                    : "hover:bg-neutral-50 text-slate-700 hover:text-neutral-900"
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface CustomDatePickerProps {
  value: string;
  onChange: (val: string) => void;
}

function CustomDatePicker({ value, onChange }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  const currentDate = value ? new Date(value) : new Date();
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth());

  useEffect(() => {
    if (value) {
      const parts = value.split("-");
      if (parts.length === 3) {
        setCurrentYear(parseInt(parts[0]));
        setCurrentMonth(parseInt(parts[1]) - 1);
      }
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const daysArray = [];
  for (let i = 0; i < firstDay; i++) {
    daysArray.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(i);
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const formattedMonth = String(currentMonth + 1).padStart(2, "0");
    const formattedDay = String(day).padStart(2, "0");
    onChange(`${currentYear}-${formattedMonth}-${formattedDay}`);
    setIsOpen(false);
  };

  const displayValue = () => {
    if (!value) return "Select Date";
    const parts = value.split("-");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return value;
  };

  return (
    <div className="relative w-full text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 flex items-center justify-between transition-all cursor-pointer hover:border-neutral-300"
      >
        <span>{displayValue()}</span>
        <Calendar size={16} className="text-neutral-400" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-72 bg-white border border-neutral-200 rounded-2xl shadow-xl p-4 animate-in fade-in slide-in-from-top-1 duration-150 text-slate-800">
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={handlePrevMonth} className="p-1 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer text-slate-700 font-extrabold">&larr;</button>
            <span className="text-xs font-black uppercase tracking-wider text-slate-800">{months[currentMonth]} {currentYear}</span>
            <button type="button" onClick={handleNextMonth} className="p-1 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer text-slate-700 font-extrabold">&rarr;</button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase text-neutral-400 mb-2">
            <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {daysArray.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} />;
              
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isSelected = value === dateStr;
              
              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={cn(
                    "h-8 w-8 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center mx-auto",
                    isSelected
                      ? "bg-[#D71920] text-white shadow-md shadow-red-500/20"
                      : "hover:bg-neutral-100 text-slate-700"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
          
          <div className="mt-3 pt-3 border-t border-neutral-100 flex justify-between items-center text-xs">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                const yr = today.getFullYear();
                const mth = String(today.getMonth() + 1).padStart(2, "0");
                const dy = String(today.getDate()).padStart(2, "0");
                onChange(`${yr}-${mth}-${dy}`);
                setIsOpen(false);
              }}
              className="text-[#D71920] hover:underline font-bold"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className="text-neutral-450 hover:underline font-bold"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface CustomTimePickerProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

function CustomTimePicker({ value, onChange, placeholder = "Select Time" }: CustomTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [hour, setHour] = useState("09");
  const [minute, setMinute] = useState("00");

  useEffect(() => {
    if (value && value.includes(":")) {
      const parts = value.split(":");
      setHour(parts[0]);
      setMinute(parts[1]);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hoursList = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const minutesList = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

  const handleSelectTime = (selectedHour: string, selectedMinute: string) => {
    onChange(`${selectedHour}:${selectedMinute}`);
  };

  return (
    <div className="relative w-full text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 flex items-center justify-between transition-all cursor-pointer hover:border-neutral-300"
      >
        <span>{value || placeholder}</span>
        <Clock size={16} className="text-neutral-400" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-60 bg-white border border-neutral-200 rounded-2xl shadow-xl p-4 animate-in fade-in slide-in-from-top-1 duration-150 text-slate-800">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-[10px] font-black uppercase text-neutral-400 mb-2">Hour</p>
              <div className="h-40 overflow-y-auto sidebar-scrollbar flex flex-col gap-1 border-r pr-2 border-neutral-100">
                {hoursList.map((h) => {
                  const isSelected = h === hour;
                  return (
                    <button
                      key={`hour-${h}`}
                      type="button"
                      onClick={() => {
                        setHour(h);
                        handleSelectTime(h, minute);
                      }}
                      className={cn(
                        "py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors block w-full text-center",
                        isSelected
                          ? "bg-[#D71920] text-white"
                          : "hover:bg-neutral-50 text-slate-700"
                      )}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase text-neutral-400 mb-2">Minute</p>
              <div className="h-40 overflow-y-auto sidebar-scrollbar flex flex-col gap-1 pl-1">
                {minutesList.map((m) => {
                  const isSelected = m === minute;
                  return (
                    <button
                      key={`minute-${m}`}
                      type="button"
                      onClick={() => {
                        setMinute(m);
                        handleSelectTime(hour, m);
                      }}
                      className={cn(
                        "py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors block w-full text-center",
                        isSelected
                          ? "bg-[#D71920] text-white"
                          : "hover:bg-neutral-50 text-slate-700"
                      )}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-between">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const h = String(now.getHours()).padStart(2, "0");
                const m = String(now.getMinutes()).padStart(2, "0");
                onChange(`${h}:${m}`);
                setIsOpen(false);
              }}
              className="text-[#D71920] hover:underline text-xs font-bold cursor-pointer"
            >
              Current Time
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-neutral-500 hover:underline text-xs font-bold cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SalesDailyActivityPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [distributors, setDistributors] = useState<DistributorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null);

  // Form State
  const [formId, setFormId] = useState<string | null>(null);
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [workingStatus, setWorkingStatus] = useState("Office Work");
  const [currentLocation, setCurrentLocation] = useState("");

  // Section B
  const [distributorId, setDistributorId] = useState("");
  const [visitType, setVisitType] = useState("");
  const [visitStatus, setVisitStatus] = useState("");

  // Section C
  const [orderCollected, setOrderCollected] = useState(false);
  const [orderAmount, setOrderAmount] = useState("");
  const [productsOrdered, setProductsOrdered] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");

  // Section D
  const [newEnquiry, setNewEnquiry] = useState(false);
  const [enquiryDistributorName, setEnquiryDistributorName] = useState("");
  const [enquiryMobile, setEnquiryMobile] = useState("");
  const [enquiryLocation, setEnquiryLocation] = useState("");
  const [interestedProducts, setInterestedProducts] = useState("");

  // Section E
  const [numberOfVisits, setNumberOfVisits] = useState("0");
  const [numberOfOrders, setNumberOfOrders] = useState("0");
  const [numberOfEnquiries, setNumberOfEnquiries] = useState("0");
  const [numberOfFollowUps, setNumberOfFollowUps] = useState("0");
  const [distanceTravelled, setDistanceTravelled] = useState("");

  // Section F
  const [achievements, setAchievements] = useState("");
  const [challenges, setChallenges] = useState("");
  const [tomorrowPlan, setTomorrowPlan] = useState("");
  const [remarks, setRemarks] = useState("");

  // Upload state
  const [visitPhoto, setVisitPhoto] = useState("");
  const [shopPhoto, setShopPhoto] = useState("");
  const [invoicePhoto, setInvoicePhoto] = useState("");
  const [businessCard, setBusinessCard] = useState("");

  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showReminder, setShowReminder] = useState(false);

  // Load activities & distributors
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const actRes = await fetch(`${ENV.API_BASE_URL}/sales-activities/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (actRes.ok) {
        const actData = await actRes.json();
        if (actData.success) {
          setActivities(actData.activities || []);
        }
      }

      const distRes = await fetch(`${ENV.API_BASE_URL}/sales-persons/my-distributors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (distRes.ok) {
        const distData = await distRes.json();
        if (distData.success) {
          setDistributors(distData.distributors || []);
        }
      }

      const reminderRes = await fetch(`${ENV.API_BASE_URL}/sales-activities/reminder`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (reminderRes.ok) {
        const reminderData = await reminderRes.json();
        if (reminderData.success) {
          setShowReminder(reminderData.showReminder);
        }
      }
    } catch (err) {
      console.error("Failed to load activity page data:", err);
      toast.error("Failed to load activities history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setFormId(null);
    setActivityDate(new Date().toISOString().split("T")[0]);
    setStartTime("");
    setEndTime("");
    setWorkingStatus("Office Work");
    setCurrentLocation("");
    setDistributorId("");
    setVisitType("");
    setVisitStatus("");
    setOrderCollected(false);
    setOrderAmount("");
    setProductsOrdered("");
    setExpectedDeliveryDate("");
    setNewEnquiry(false);
    setEnquiryDistributorName("");
    setEnquiryMobile("");
    setEnquiryLocation("");
    setInterestedProducts("");
    setNumberOfVisits("0");
    setNumberOfOrders("0");
    setNumberOfEnquiries("0");
    setNumberOfFollowUps("0");
    setDistanceTravelled("");
    setAchievements("");
    setChallenges("");
    setTomorrowPlan("");
    setRemarks("");
    setVisitPhoto("");
    setShopPhoto("");
    setInvoicePhoto("");
    setBusinessCard("");
    setModalOpen(true);
  };

  const openEditModal = (act: ActivityType) => {
    setFormId(act.id);
    setActivityDate(act.activityDate.split("T")[0]);
    setStartTime(act.startTime || "");
    setEndTime(act.endTime || "");
    setWorkingStatus(act.workingStatus);
    setCurrentLocation(act.currentLocation || "");
    setDistributorId(act.distributorId || "");
    setVisitType(act.visitType || "");
    setVisitStatus(act.visitStatus || "");
    setOrderCollected(act.orderCollected);
    setOrderAmount(act.orderAmount?.toString() || "");
    setProductsOrdered(act.productsOrdered || "");
    setExpectedDeliveryDate(act.expectedDeliveryDate ? act.expectedDeliveryDate.split("T")[0] : "");
    setNewEnquiry(act.newEnquiry);
    setEnquiryDistributorName(act.enquiryDistributorName || "");
    setEnquiryMobile(act.enquiryMobile || "");
    setEnquiryLocation(act.enquiryLocation || "");
    setInterestedProducts(act.interestedProducts || "");
    setNumberOfVisits(act.numberOfVisits.toString());
    setNumberOfOrders(act.numberOfOrders.toString());
    setNumberOfEnquiries(act.numberOfEnquiries.toString());
    setNumberOfFollowUps(act.numberOfFollowUps.toString());
    setDistanceTravelled(act.distanceTravelled?.toString() || "");
    setAchievements(act.achievements || "");
    setChallenges(act.challenges || "");
    setTomorrowPlan(act.tomorrowPlan || "");
    setRemarks(act.remarks || "");

    const att = act.attachment as any;
    setVisitPhoto(att?.visitPhoto || "");
    setShopPhoto(att?.shopPhoto || "");
    setInvoicePhoto(att?.invoicePhoto || "");
    setBusinessCard(att?.businessCard || "");

    setModalOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(fieldName);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("authToken");
      const res = await fetch(`${ENV.API_BASE_URL}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();

      if (data.success && data.urls && data.urls.length > 0) {
        const fileUrl = data.urls[0];
        if (fieldName === "visitPhoto") setVisitPhoto(fileUrl);
        if (fieldName === "shopPhoto") setShopPhoto(fileUrl);
        if (fieldName === "invoicePhoto") setInvoicePhoto(fileUrl);
        if (fieldName === "businessCard") setBusinessCard(fileUrl);
        toast.success("File uploaded successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload file");
    } finally {
      setUploadingField(null);
    }
  };

  const handleSave = async (submitStatus: "DRAFT" | "PENDING") => {
    if (!startTime || !endTime || !currentLocation) {
      toast.error("Please fill in basic details (start time, end time, location)");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const body = {
        id: formId,
        activityDate,
        startTime,
        endTime,
        workingStatus,
        currentLocation,
        distributorId: ["Field Visit", "Distributor Visit"].includes(workingStatus) ? distributorId : null,
        visitType: ["Field Visit", "Distributor Visit"].includes(workingStatus) ? visitType : null,
        visitStatus: ["Field Visit", "Distributor Visit"].includes(workingStatus) ? visitStatus : null,
        orderCollected,
        orderAmount: orderCollected ? orderAmount : null,
        productsOrdered: orderCollected ? productsOrdered : null,
        expectedDeliveryDate: orderCollected ? expectedDeliveryDate : null,
        newEnquiry,
        enquiryDistributorName: newEnquiry ? enquiryDistributorName : null,
        enquiryMobile: newEnquiry ? enquiryMobile : null,
        enquiryLocation: newEnquiry ? enquiryLocation : null,
        interestedProducts: newEnquiry ? interestedProducts : null,
        numberOfVisits,
        numberOfOrders,
        numberOfEnquiries,
        numberOfFollowUps,
        distanceTravelled,
        achievements,
        challenges,
        tomorrowPlan,
        remarks,
        attachment: {
          visitPhoto,
          shopPhoto,
          invoicePhoto,
          businessCard
        },
        status: submitStatus
      };

      const res = await fetch(`${ENV.API_BASE_URL}/sales-activities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error("Submission failed");
      const data = await res.json();

      if (data.success) {
        toast.success(data.message || "Report saved successfully");
        setModalOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit activity report");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 text-slate-800 font-sans">
      <SalesSidebar currentPath="/sales/daily-activity" />

      <main className="flex-1 lg:ml-64 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900 flex items-center gap-2">
                <Calendar className="text-[#D71920]" size={28} />
                <span>Daily Sales Activities</span>
              </h1>
              <p className="text-neutral-500 text-sm font-semibold uppercase tracking-wider mt-1">
                Log distributor visits, collect orders and record enquiries.
              </p>
            </div>

            <button
              onClick={openCreateModal}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-[#D71920] hover:bg-[#B91520] text-white font-black uppercase tracking-wider text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-[#D71920]/20 transform active:scale-95 cursor-pointer"
            >
              <Plus size={18} />
              <span>Add Daily Activity</span>
            </button>
          </div>

          {showReminder && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-850 flex gap-3 text-left items-start animate-pulse">
              <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-extrabold text-amber-900 text-sm sm:text-base">Pending Activity Report</h4>
                <p className="text-xs sm:text-sm text-amber-800 font-semibold mt-0.5">Please submit your report for today.</p>
                <button
                  onClick={openCreateModal}
                  className="text-[#D71920] hover:text-[#B91520] hover:underline font-black mt-2.5 block text-xs uppercase tracking-wider cursor-pointer"
                >
                  Submit Now &rarr;
                </button>
              </div>
            </div>
          )}

          {/* Activity Table Card */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="animate-spin text-[#D71920]" size={36} />
                <p className="text-xs font-black uppercase text-neutral-400 tracking-wider">Loading activities...</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="p-20 text-center flex flex-col items-center justify-center gap-2">
                <FileText className="text-neutral-300" size={48} />
                <p className="text-sm font-extrabold text-neutral-500 uppercase tracking-widest mt-2">No Reports Registered</p>
                <p className="text-xs text-neutral-400 font-medium">Create daily activities to track your field work and targets.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-neutral-50 text-[10px] sm:text-xs font-extrabold text-neutral-400 uppercase tracking-wider">
                      <th className="py-4 px-6">Report Date</th>
                      <th className="py-4 px-6">Status / Time</th>
                      <th className="py-4 px-6">Working Mode</th>
                      <th className="py-4 px-6">Visits / Orders</th>
                      <th className="py-4 px-6">Location</th>
                      <th className="py-4 px-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-xs sm:text-sm font-medium text-slate-700">
                    {activities.map((act) => (
                      <tr key={act.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <span className="font-bold text-neutral-900">
                            {new Date(act.activityDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-1.5">
                            <span className={cn(
                              "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider inline-block w-fit",
                              act.status === "APPROVED" && "bg-green-500/10 text-green-600",
                              act.status === "VERIFIED" && "bg-emerald-500/10 text-emerald-600",
                              act.status === "PENDING" && "bg-amber-500/10 text-amber-600",
                              act.status === "DRAFT" && "bg-neutral-500/10 text-neutral-600",
                              act.status === "CORRECTION_REQUESTED" && "bg-indigo-500/10 text-indigo-600",
                              act.status === "REJECTED" && "bg-red-500/10 text-red-600"
                            )}>
                              {act.status.replace("_", " ")}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider flex items-center gap-1">
                              <Clock size={12} />
                              <span>{act.startTime} - {act.endTime}</span>
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-bold text-neutral-900">{act.workingStatus}</td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="font-semibold text-neutral-700">{act.numberOfVisits} Visits</span>
                            <span className="text-xs text-neutral-400 font-semibold">{act.numberOfOrders} Orders</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-neutral-500 font-semibold max-w-xs truncate flex items-center gap-1 mt-3 sm:mt-0">
                          <MapPin size={14} className="text-neutral-400" />
                          <span>{act.currentLocation}</span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex justify-center items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedActivity(act);
                                setDetailModalOpen(true);
                              }}
                              className="p-2 text-neutral-500 hover:text-neutral-800 transition-colors hover:bg-neutral-100 rounded-lg cursor-pointer"
                              title="View details"
                            >
                              <Eye size={16} />
                            </button>

                            {["DRAFT", "CORRECTION_REQUESTED"].includes(act.status) && (
                              <button
                                onClick={() => openEditModal(act)}
                                className="p-2 text-[#D71920] hover:text-[#B91520] transition-colors hover:bg-red-50 rounded-lg cursor-pointer"
                                title="Edit draft"
                              >
                                <Edit2 size={16} />
                              </button>
                            )}
                          </div>
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

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
          <div className="relative bg-white rounded-3xl shadow-2xl border border-neutral-200/80 w-full max-w-3xl overflow-hidden animate-fade-in animate-duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black uppercase text-neutral-900">
                  {formId ? "Edit Activity Report" : "Create Daily Activity"}
                </h3>
                <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider mt-0.5">
                  Complete sections to log report details.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-800 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">

              {/* SECTION A - Basic Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-[#D71920] tracking-widest border-b pb-1">Section A: Basic Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Activity Date</label>
                    <CustomDatePicker
                      value={activityDate}
                      onChange={setActivityDate}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Start Time</label>
                    <CustomTimePicker
                      value={startTime}
                      onChange={setStartTime}
                      placeholder="Start Time"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">End Time</label>
                    <CustomTimePicker
                      value={endTime}
                      onChange={setEndTime}
                      placeholder="End Time"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Working Status</label>
                    <CustomSelect
                      value={workingStatus}
                      onChange={setWorkingStatus}
                      options={[
                        { value: "Office Work", label: "Office Work" },
                        { value: "Field Visit", label: "Field Visit" },
                        { value: "Distributor Visit", label: "Distributor Visit" },
                        { value: "Market Survey", label: "Market Survey" },
                        { value: "Leave", label: "Leave" },
                        { value: "Training", label: "Training" },
                        { value: "Meeting", label: "Meeting" }
                      ]}
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Current Location</label>
                    <input
                      type="text"
                      placeholder="e.g. T-Nagar Office, Chennai"
                      value={currentLocation}
                      onChange={(e) => setCurrentLocation(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D71920]/20"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION B - Distributor Visit (Only for visits) */}
              {["Field Visit", "Distributor Visit"].includes(workingStatus) && (
                <div className="space-y-4 animate-fade-in animate-duration-200">
                  <h4 className="text-xs font-black uppercase text-[#D71920] tracking-widest border-b pb-1">Section B: Distributor Visit</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase">Visited Distributor</label>
                      <CustomSelect
                        value={distributorId}
                        onChange={setDistributorId}
                        placeholder="Select Distributor"
                        options={[
                          { value: "", label: "Select Distributor" },
                          ...distributors.map((d) => ({
                            value: d.id,
                            label: d.companyName || `${d.firstName} ${d.lastName}`
                          }))
                        ]}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase">Visit Type</label>
                      <CustomSelect
                        value={visitType}
                        onChange={setVisitType}
                        placeholder="Select Visit Type"
                        options={[
                          { value: "", label: "Select Visit Type" },
                          { value: "First Visit", label: "First Visit" },
                          { value: "Follow-up Visit", label: "Follow-up Visit" },
                          { value: "Order Collection", label: "Order Collection" },
                          { value: "Payment Collection", label: "Payment Collection" },
                          { value: "Complaint Visit", label: "Complaint Visit" },
                          { value: "New Distributor Meeting", label: "New Distributor Meeting" }
                        ]}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase">Visit Status</label>
                      <CustomSelect
                        value={visitStatus}
                        onChange={setVisitStatus}
                        placeholder="Select Status"
                        options={[
                          { value: "", label: "Select Status" },
                          { value: "Completed", label: "Completed" },
                          { value: "Not Available", label: "Not Available" },
                          { value: "Rescheduled", label: "Rescheduled" }
                        ]}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION C - Order Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-[#D71920] tracking-widest border-b pb-1">Section C: Order Details</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-neutral-600 uppercase">Order Collected?</span>
                    <button
                      type="button"
                      onClick={() => setOrderCollected(!orderCollected)}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                        orderCollected ? "bg-green-500 text-white shadow-md" : "bg-neutral-100 text-neutral-400 border border-neutral-200"
                      )}
                    >
                      {orderCollected ? "Yes" : "No"}
                    </button>
                  </div>

                  {orderCollected && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in animate-duration-200">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase">Order Value (₹)</label>
                        <input
                          type="number"
                          placeholder="e.g. 75000"
                          value={orderAmount}
                          onChange={(e) => setFormValue(e.target.value, setOrderAmount)}
                          className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D71920]/20"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase">Products Ordered</label>
                        <input
                          type="text"
                          placeholder="e.g. 10x Kitchen Chimney"
                          value={productsOrdered}
                          onChange={(e) => setProductsOrdered(e.target.value)}
                          className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D71920]/20"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase">Expected Delivery Date</label>
                        <CustomDatePicker
                          value={expectedDeliveryDate}
                          onChange={setExpectedDeliveryDate}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION D - Enquiry Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-[#D71920] tracking-widest border-b pb-1">Section D: Enquiry Details</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-neutral-600 uppercase">New Enquiry Received?</span>
                    <button
                      type="button"
                      onClick={() => setNewEnquiry(!newEnquiry)}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                        newEnquiry ? "bg-green-500 text-white shadow-md" : "bg-neutral-100 text-neutral-400 border border-neutral-200"
                      )}
                    >
                      {newEnquiry ? "Yes" : "No"}
                    </button>
                  </div>

                  {newEnquiry && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-fade-in animate-duration-200">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase">Distributor Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Apex Electricals"
                          value={enquiryDistributorName}
                          onChange={(e) => setEnquiryDistributorName(e.target.value)}
                          className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D71920]/20"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase">Mobile Number</label>
                        <input
                          type="text"
                          placeholder="e.g. 9876543210"
                          value={enquiryMobile}
                          onChange={(e) => setEnquiryMobile(e.target.value)}
                          className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D71920]/20"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase">Location</label>
                        <input
                          type="text"
                          placeholder="e.g. Tambaram, Chennai"
                          value={enquiryLocation}
                          onChange={(e) => setEnquiryLocation(e.target.value)}
                          className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D71920]/20"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase">Interested Products</label>
                        <input
                          type="text"
                          placeholder="e.g. Smart Hob, Induction Cookers"
                          value={interestedProducts}
                          onChange={(e) => setInterestedProducts(e.target.value)}
                          className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D71920]/20"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION E - Today's Work Summary */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-[#D71920] tracking-widest border-b pb-1">Section E: Today's Work Summary</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-neutral-400 uppercase">Total Visits</label>
                    <input
                      type="number"
                      value={numberOfVisits}
                      onChange={(e) => setFormValue(e.target.value, setNumberOfVisits)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D71920]/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-neutral-400 uppercase">Orders Collected</label>
                    <input
                      type="number"
                      value={numberOfOrders}
                      onChange={(e) => setFormValue(e.target.value, setNumberOfOrders)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D71920]/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-neutral-400 uppercase">New Enquiries</label>
                    <input
                      type="number"
                      value={numberOfEnquiries}
                      onChange={(e) => setFormValue(e.target.value, setNumberOfEnquiries)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D71920]/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-neutral-400 uppercase">Follow-up Visits</label>
                    <input
                      type="number"
                      value={numberOfFollowUps}
                      onChange={(e) => setFormValue(e.target.value, setNumberOfFollowUps)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D71920]/20"
                    />
                  </div>

                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label className="text-[9px] font-bold text-neutral-400 uppercase">Distance (KM)</label>
                    <input
                      type="number"
                      placeholder="Optional"
                      value={distanceTravelled}
                      onChange={(e) => setFormValue(e.target.value, setDistanceTravelled)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D71920]/20"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION F - Remarks */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-[#D71920] tracking-widest border-b pb-1">Section F: Remarks & Plan</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Today's Achievements</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Met target of visiting 5 shops..."
                      value={achievements}
                      onChange={(e) => setAchievements(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Challenges Faced</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Competitor offering high discount..."
                      value={challenges}
                      onChange={(e) => setChallenges(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Tomorrow's Plan</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Visit Apex Electricals for order finalize..."
                      value={tomorrowPlan}
                      onChange={(e) => setTomorrowPlan(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Additional Remarks / Notes</label>
                    <textarea
                      rows={2}
                      placeholder="Any other comments..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* UPLOADS */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-[#D71920] tracking-widest border-b pb-1">Upload Attachments (Optional)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">

                  {/* Visit Photo */}
                  <div className="p-4 border border-dashed border-neutral-200 rounded-2xl flex flex-col items-center justify-center text-center gap-2">
                    <span className="text-[10px] font-black uppercase text-neutral-400">Visit Photo</span>
                    {visitPhoto ? (
                      <div className="relative w-full h-24 rounded-lg overflow-hidden border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={visitPhoto} alt="Visit" className="w-full h-full object-cover" />
                        <button
                          onClick={() => setVisitPhoto("")}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-4 border rounded-xl hover:bg-neutral-50 cursor-pointer w-full h-24">
                        <Upload size={18} className="text-neutral-400" />
                        <span className="text-[9px] font-bold text-neutral-400 mt-1 uppercase">
                          {uploadingField === "visitPhoto" ? "Uploading..." : "Select File"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, "visitPhoto")}
                        />
                      </label>
                    )}
                  </div>

                  {/* Shop Photo */}
                  <div className="p-4 border border-dashed border-neutral-200 rounded-2xl flex flex-col items-center justify-center text-center gap-2">
                    <span className="text-[10px] font-black uppercase text-neutral-400">Shop Photo</span>
                    {shopPhoto ? (
                      <div className="relative w-full h-24 rounded-lg overflow-hidden border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={shopPhoto} alt="Shop" className="w-full h-full object-cover" />
                        <button
                          onClick={() => setShopPhoto("")}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-4 border rounded-xl hover:bg-neutral-50 cursor-pointer w-full h-24">
                        <Upload size={18} className="text-neutral-400" />
                        <span className="text-[9px] font-bold text-neutral-400 mt-1 uppercase">
                          {uploadingField === "shopPhoto" ? "Uploading..." : "Select File"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, "shopPhoto")}
                        />
                      </label>
                    )}
                  </div>

                  {/* Invoice Photo */}
                  <div className="p-4 border border-dashed border-neutral-200 rounded-2xl flex flex-col items-center justify-center text-center gap-2">
                    <span className="text-[10px] font-black uppercase text-neutral-400">Invoice Photo</span>
                    {invoicePhoto ? (
                      <div className="relative w-full h-24 rounded-lg overflow-hidden border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={invoicePhoto} alt="Invoice" className="w-full h-full object-cover" />
                        <button
                          onClick={() => setInvoicePhoto("")}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-4 border rounded-xl hover:bg-neutral-50 cursor-pointer w-full h-24">
                        <Upload size={18} className="text-neutral-400" />
                        <span className="text-[9px] font-bold text-neutral-400 mt-1 uppercase">
                          {uploadingField === "invoicePhoto" ? "Uploading..." : "Select File"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, "invoicePhoto")}
                        />
                      </label>
                    )}
                  </div>

                  {/* Business Card */}
                  <div className="p-4 border border-dashed border-neutral-200 rounded-2xl flex flex-col items-center justify-center text-center gap-2">
                    <span className="text-[10px] font-black uppercase text-neutral-400">Business Card</span>
                    {businessCard ? (
                      <div className="relative w-full h-24 rounded-lg overflow-hidden border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={businessCard} alt="Business Card" className="w-full h-full object-cover" />
                        <button
                          onClick={() => setBusinessCard("")}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-4 border rounded-xl hover:bg-neutral-50 cursor-pointer w-full h-24">
                        <Upload size={18} className="text-neutral-400" />
                        <span className="text-[9px] font-bold text-neutral-400 mt-1 uppercase">
                          {uploadingField === "businessCard" ? "Uploading..." : "Select File"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, "businessCard")}
                        />
                      </label>
                    )}
                  </div>

                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-end gap-3">
              <button
                onClick={() => handleSave("DRAFT")}
                disabled={saving}
                className="px-5 py-2.5 bg-white border border-neutral-200 text-neutral-600 font-bold uppercase tracking-wider text-xs rounded-xl hover:bg-neutral-50 transition-all cursor-pointer"
              >
                {saving ? "Saving..." : "Save Draft"}
              </button>

              <button
                onClick={() => handleSave("PENDING")}
                disabled={saving}
                className="px-5 py-2.5 bg-[#D71920] hover:bg-[#B91520] text-white font-bold uppercase tracking-wider text-xs rounded-xl transition-all shadow-md shadow-[#D71920]/15 cursor-pointer"
              >
                {saving ? "Submitting..." : "Submit Daily Activity"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {detailModalOpen && selectedActivity && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
          <div className="relative bg-white rounded-3xl shadow-2xl border border-neutral-200/80 w-full max-w-2xl overflow-hidden animate-fade-in animate-duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black uppercase text-neutral-900 flex items-center gap-2">
                  <span>Activity Report Details</span>
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                    selectedActivity.status === "APPROVED" && "bg-green-500/10 text-green-600",
                    selectedActivity.status === "VERIFIED" && "bg-emerald-500/10 text-emerald-600",
                    selectedActivity.status === "PENDING" && "bg-amber-500/10 text-amber-600",
                    selectedActivity.status === "DRAFT" && "bg-neutral-500/10 text-neutral-600",
                    selectedActivity.status === "CORRECTION_REQUESTED" && "bg-indigo-500/10 text-indigo-600",
                    selectedActivity.status === "REJECTED" && "bg-red-500/10 text-red-600"
                  )}>
                    {selectedActivity.status.replace("_", " ")}
                  </span>
                </h3>
                <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider mt-0.5">
                  Logged report for {new Date(selectedActivity.activityDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-800 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">

              {/* Admin feedback if correction requested / rejected */}
              {selectedActivity.reviewComment && (
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                  <span className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">Admin Feedback</span>
                  <p className="text-xs font-bold text-indigo-800 mt-1">{selectedActivity.reviewComment}</p>
                </div>
              )}

              {/* Basic info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl">
                  <span className="text-[9px] text-neutral-400 font-bold uppercase block">Shift Time</span>
                  <span className="text-xs font-bold text-neutral-850">{selectedActivity.startTime} - {selectedActivity.endTime}</span>
                </div>

                <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl">
                  <span className="text-[9px] text-neutral-400 font-bold uppercase block">Working Status</span>
                  <span className="text-xs font-bold text-neutral-850">{selectedActivity.workingStatus}</span>
                </div>

                <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl col-span-2">
                  <span className="text-[9px] text-neutral-400 font-bold uppercase block">Location</span>
                  <span className="text-xs font-bold text-neutral-850 flex items-center gap-1.5 mt-0.5">
                    <MapPin size={12} className="text-[#D71920]" />
                    <span>{selectedActivity.currentLocation}</span>
                  </span>
                </div>
              </div>

              {/* Visited Distributor section */}
              {selectedActivity.distributor && (
                <div className="space-y-2 border-t pt-4">
                  <h4 className="text-xs font-black uppercase text-[#D71920] tracking-wider">Distributor Visit Details</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <span className="text-[9px] text-neutral-400 font-bold uppercase block">Company Name</span>
                      <span className="text-xs font-extrabold text-neutral-800">{selectedActivity.distributor.companyName || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-neutral-400 font-bold uppercase block">Visit Type</span>
                      <span className="text-xs font-semibold text-neutral-700">{selectedActivity.visitType}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-neutral-400 font-bold uppercase block">Visit Status</span>
                      <span className="text-xs font-semibold text-neutral-700">{selectedActivity.visitStatus}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Details */}
              {selectedActivity.orderCollected && (
                <div className="space-y-2 border-t pt-4">
                  <h4 className="text-xs font-black uppercase text-[#D71920] tracking-wider">Order Collected Details</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <span className="text-[9px] text-neutral-400 font-bold uppercase block">Order Value</span>
                      <span className="text-xs font-extrabold text-green-600 flex items-center mt-0.5">
                        <IndianRupee size={12} />
                        <span>{selectedActivity.orderAmount?.toLocaleString("en-IN")}</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-neutral-400 font-bold uppercase block">Products Ordered</span>
                      <span className="text-xs font-semibold text-neutral-700">{selectedActivity.productsOrdered}</span>
                    </div>
                    {selectedActivity.expectedDeliveryDate && (
                      <div>
                        <span className="text-[9px] text-neutral-400 font-bold uppercase block">Expected Delivery</span>
                        <span className="text-xs font-semibold text-neutral-700">
                          {new Date(selectedActivity.expectedDeliveryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Enquiry Details */}
              {selectedActivity.newEnquiry && (
                <div className="space-y-2 border-t pt-4">
                  <h4 className="text-xs font-black uppercase text-[#D71920] tracking-wider">Enquiry Details</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <span className="text-[9px] text-neutral-400 font-bold uppercase block">Distributor Name</span>
                      <span className="text-xs font-extrabold text-neutral-800">{selectedActivity.enquiryDistributorName}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-neutral-400 font-bold uppercase block">Mobile Number</span>
                      <span className="text-xs font-semibold text-neutral-700">{selectedActivity.enquiryMobile}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-neutral-400 font-bold uppercase block">Location</span>
                      <span className="text-xs font-semibold text-neutral-700">{selectedActivity.enquiryLocation}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[9px] text-neutral-400 font-bold uppercase block">Interested Products</span>
                      <span className="text-xs font-semibold text-neutral-700">{selectedActivity.interestedProducts}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary details */}
              <div className="space-y-2 border-t pt-4">
                <h4 className="text-xs font-black uppercase text-[#D71920] tracking-wider">Today's Work Summary</h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                  <div className="p-2 bg-neutral-50 border rounded-xl">
                    <span className="text-[8px] font-black uppercase tracking-wider text-neutral-400 block">Visits</span>
                    <span className="text-sm font-black text-neutral-800">{selectedActivity.numberOfVisits}</span>
                  </div>
                  <div className="p-2 bg-neutral-50 border rounded-xl">
                    <span className="text-[8px] font-black uppercase tracking-wider text-neutral-400 block">Orders</span>
                    <span className="text-sm font-black text-neutral-800">{selectedActivity.numberOfOrders}</span>
                  </div>
                  <div className="p-2 bg-neutral-50 border rounded-xl">
                    <span className="text-[8px] font-black uppercase tracking-wider text-neutral-400 block">Enquiries</span>
                    <span className="text-sm font-black text-neutral-800">{selectedActivity.numberOfEnquiries}</span>
                  </div>
                  <div className="p-2 bg-neutral-50 border rounded-xl">
                    <span className="text-[8px] font-black uppercase tracking-wider text-neutral-400 block">Follow Ups</span>
                    <span className="text-sm font-black text-neutral-800">{selectedActivity.numberOfFollowUps}</span>
                  </div>
                  <div className="p-2 bg-neutral-50 border rounded-xl col-span-2 sm:col-span-1">
                    <span className="text-[8px] font-black uppercase tracking-wider text-neutral-400 block">Distance</span>
                    <span className="text-sm font-black text-neutral-800">{selectedActivity.distanceTravelled || 0} KM</span>
                  </div>
                </div>
              </div>

              {/* Remarks details */}
              <div className="space-y-3 border-t pt-4">
                <h4 className="text-xs font-black uppercase text-[#D71920] tracking-wider">Remarks & Plan</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedActivity.achievements && (
                    <div>
                      <span className="text-[9px] text-neutral-400 font-bold uppercase block">Achievements</span>
                      <p className="text-xs font-semibold text-neutral-700 leading-relaxed mt-0.5">{selectedActivity.achievements}</p>
                    </div>
                  )}
                  {selectedActivity.challenges && (
                    <div>
                      <span className="text-[9px] text-neutral-400 font-bold uppercase block">Challenges</span>
                      <p className="text-xs font-semibold text-neutral-700 leading-relaxed mt-0.5">{selectedActivity.challenges}</p>
                    </div>
                  )}
                  {selectedActivity.tomorrowPlan && (
                    <div>
                      <span className="text-[9px] text-neutral-400 font-bold uppercase block">Tomorrow's Plan</span>
                      <p className="text-xs font-semibold text-neutral-700 leading-relaxed mt-0.5">{selectedActivity.tomorrowPlan}</p>
                    </div>
                  )}
                  {selectedActivity.remarks && (
                    <div>
                      <span className="text-[9px] text-neutral-400 font-bold uppercase block">Additional Notes</span>
                      <p className="text-xs font-semibold text-neutral-700 leading-relaxed mt-0.5">{selectedActivity.remarks}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Images list */}
              {selectedActivity.attachment && Object.values(selectedActivity.attachment as any).some(v => !!v) && (
                <div className="space-y-3 border-t pt-4">
                  <h4 className="text-xs font-black uppercase text-[#D71920] tracking-wider">Attachments</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(selectedActivity.attachment as any).map(([k, v]) => {
                      if (!v) return null;
                      return (
                        <div key={k} className="space-y-1">
                          <span className="text-[8px] font-bold text-neutral-400 uppercase block">{k.replace("Photo", " Photo")}</span>
                          <div className="relative w-full h-24 rounded-lg overflow-hidden border">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={v as string} alt={k} className="w-full h-full object-cover" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );

  function setFormValue(val: string, setter: React.Dispatch<React.SetStateAction<string>>) {
    setter(val);
  }
}
