"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Calendar, Info, AlertCircle, 
  Check, ShieldCheck, Truck, ShieldAlert, Plus, MessageSquare, X, CheckCircle, User, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { serviceRequestService } from "@/services/serviceRequestService";


interface AdminStatusActionPanelProps {
  request: any;
  item?: any;
  itemIndex?: number;
  isDark: boolean;
  onUpdate: () => void;
  getStatusBadge: (status: string, cancellationReason?: string | null) => React.ReactNode;
}

export function AdminStatusActionPanel({
  request,
  item,
  itemIndex,
  isDark,
  onUpdate,
  getStatusBadge
}: AdminStatusActionPanelProps) {
  const currentItem = item || request;
  
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [actionRemarks, setActionRemarks] = useState("");

  const [serviceCharge, setServiceCharge] = useState<string>("");
  const [sparePartsCost, setSparePartsCost] = useState<string>("");
  const [inspectionRemarks, setInspectionRemarks] = useState<string>("");

  const [techName, setTechName] = useState("");
  const [techPhone, setTechPhone] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [internalRemarks, setInternalRemarks] = useState("");

  useEffect(() => {
    if (currentItem) {
      setServiceCharge(currentItem.serviceCharge?.toString() || "");
      setSparePartsCost(currentItem.sparePartsCost?.toString() || "");
      setInspectionRemarks(currentItem.inspectionRemarks || "");
      
      setTechName(currentItem.technicianName || "");
      setTechPhone(currentItem.technicianPhone || "");
      setExpectedDate(currentItem.expectedVisitDate ? new Date(currentItem.expectedVisitDate).toISOString().split('T')[0] : "");
      setInternalRemarks(currentItem.internalRemarks || "");
      
      setActionRemarks("");
    }
  }, [currentItem]);

  const handleTechnicianAssignment = async () => {
    if (!techName.trim()) { toast.error("Technician Name is required"); return; }
    if (!techPhone.trim()) { toast.error("Technician Mobile Number is required"); return; }
    if (techPhone.trim().length !== 10) { toast.error("Technician Mobile Number must be exactly 10 digits"); return; }
    if (!expectedDate) { toast.error("Expected Visit Date is required"); return; }

    setUpdatingStatus(true);
    try {
      const payload = {
        status: "Technician Assigned",
        technicianName: techName.trim(),
        technicianPhone: techPhone.trim(),
        expectedVisitDate: expectedDate,
        expectedVisitTime: "",
        internalRemarks: internalRemarks.trim(),
        remarks: `Technician ${techName.trim()} assigned. Visit scheduled for ${new Date(expectedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.`
      };

      const res = await serviceRequestService.updateServiceRequestStatus(request.id, payload);

      if (res.success) {
        toast.success(`Technician assigned successfully!`);
        onUpdate();
      } else {
        toast.error(res.message || "Failed to assign technician");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to assign technician");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      let remarks = actionRemarks.trim();
      
      let payload: any = {
        status: newStatus,
        remarks: remarks || undefined
      };

      if (itemIndex !== undefined) {
        payload.itemIndex = itemIndex;
      }

      if (newStatus === "Awaiting Cost Estimation") {
        payload.remarks = remarks || `Moved to Awaiting Cost Estimation.`;
      }

      const res = await serviceRequestService.updateServiceRequestStatus(request.id, payload);

      if (res.success) {
        toast.success(`Status updated to "${newStatus}"`);
        setActionRemarks("");
        onUpdate();
      } else {
        toast.error(res.message || "Failed to update status");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* STATUS ACTION FORM SECTION */}
      <div className={cn(
        "p-5 rounded-2xl border space-y-4 shadow-sm",
        isDark ? "bg-[#141414] border-neutral-800/70" : "bg-red-50/10 border-red-100"
      )}>
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-[#D71920]">Manage Status Flow</h4>
          <div>{getStatusBadge(currentItem.currentStatus, currentItem.cancellationReason)}</div>
        </div>

        <div className="space-y-4">
          {currentItem.currentStatus === "Request Submitted" && (
            <div className="space-y-4">
              {/* Warranty Verification section displayed first */}
              <div className="p-4 rounded-xl border border-neutral-800 dark:border-slate-800 bg-neutral-900/10 dark:bg-slate-900/40 text-left space-y-3">
                <h5 className="text-[10px] font-black uppercase tracking-wider text-[#D71920]">Warranty Verification</h5>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-neutral-500">Purchase Date</p>
                    <p className="font-bold text-neutral-800 dark:text-neutral-200">
                      {new Date(request.purchaseDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Warranty Duration</p>
                    <p className="font-bold text-neutral-800 dark:text-neutral-200">{request.product?.warranty || "1 Year"}</p>
                  </div>
                  <div className="col-span-2 border-t border-neutral-200 dark:border-slate-800 pt-2 flex items-center justify-between">
                    <span className="text-neutral-500">Warranty Status:</span>
                    {request.warrantyStatus === "Under Warranty" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-green-500">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span>Under Warranty</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-red-500">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        <span>Warranty Expired</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider text-left">Action Required</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleStatusUpdate("Request Accepted")}
                    disabled={updatingStatus}
                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Check size={14} />
                    <span>ACCEPT REQUEST</span>
                  </button>
                  <button
                    onClick={() => handleStatusUpdate("Request Rejected")}
                    disabled={updatingStatus}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1"
                  >
                    <X size={14} />
                    <span>REJECT REQUEST</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentItem.currentStatus === "Request Accepted" && (
            <div className="space-y-3.5 text-left">
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Technician Assignment</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Technician Name *</label>
                  <input
                    type="text"
                    placeholder="Technician Name"
                    value={techName}
                    onChange={(e) => setTechName(e.target.value)}
                    className={cn(
                      "w-full px-3 py-2 text-xs rounded-xl border outline-none",
                      isDark ? "bg-slate-950 border-neutral-800 text-white" : "bg-white border-neutral-300"
                    )}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Technician Mobile *</label>
                  <input
                    type="text"
                    placeholder="Technician Phone"
                    value={techPhone}
                    onChange={(e) => setTechPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className={cn(
                      "w-full px-3 py-2 text-xs rounded-xl border outline-none",
                      isDark ? "bg-slate-950 border-neutral-800 text-white" : "bg-white border-neutral-300"
                    )}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Expected Visit Date *</label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={cn(
                      "w-full px-3 py-2 text-xs rounded-xl border outline-none",
                      isDark ? "bg-slate-950 border-neutral-800 text-white" : "bg-white border-neutral-300"
                    )}
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Internal Remarks (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Private notes..."
                    value={internalRemarks}
                    onChange={(e) => setInternalRemarks(e.target.value)}
                    className={cn(
                      "w-full px-3 py-2 text-xs rounded-xl border outline-none resize-none",
                      isDark ? "bg-slate-950 border-neutral-800 text-white" : "bg-white border-neutral-300"
                    )}
                  />
                </div>
              </div>

              <button
                onClick={handleTechnicianAssignment}
                disabled={updatingStatus}
                className="w-full py-3 bg-[#D71920] hover:bg-[#b8141a] text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus size={15} />
                <span>SAVE & ASSIGN TECHNICIAN</span>
              </button>
            </div>
          )}

          {currentItem.currentStatus === "Technician Assigned" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-slate-800 bg-neutral-50 dark:bg-slate-900/30 text-left space-y-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-purple-500">Assigned Technician</p>
                <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{currentItem.technicianName} ({currentItem.technicianPhone})</p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">Visit Scheduled: {currentItem.expectedVisitDate ? new Date(currentItem.expectedVisitDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}</p>
                {currentItem.internalRemarks && (
                  <p className="text-[10px] text-neutral-400 italic">Remarks: "{currentItem.internalRemarks}"</p>
                )}
              </div>
              <button
                onClick={() => handleStatusUpdate("Technician On The Way")}
                disabled={updatingStatus}
                className="w-full py-3 bg-[#D71920] hover:bg-[#b8141a] text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Truck size={15} />
                <span>MARK TECHNICIAN ON THE WAY</span>
              </button>
            </div>
          )}

          {currentItem.currentStatus === "Technician On The Way" && (
            <button
              onClick={() => handleStatusUpdate("Reached Customer Location")}
              disabled={updatingStatus}
              className="w-full py-3 bg-[#D71920] hover:bg-[#b8141a] text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Truck size={15} />
              <span>MARK REACHED LOCATION</span>
            </button>
          )}

          {currentItem.currentStatus === "Reached Customer Location" && (
            <button
              onClick={() => handleStatusUpdate("Inspection Started")}
              disabled={updatingStatus}
              className="w-full py-3 bg-[#D71920] hover:bg-[#b8141a] text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Clock size={15} />
              <span>MARK INSPECTION STARTED</span>
            </button>
          )}

          {currentItem.currentStatus === "Inspection Started" && (
            <button
              onClick={() => handleStatusUpdate("Repair In Progress")}
              disabled={updatingStatus}
              className="w-full py-3 bg-[#D71920] hover:bg-[#b8141a] text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus size={15} />
              <span>MARK REPAIR IN PROGRESS</span>
            </button>
          )}

          {(currentItem.currentStatus === "Repair In Progress" || currentItem.currentStatus === "Waiting For Spare Parts") && (
            <div className="space-y-3">
              {currentItem.currentStatus === "Repair In Progress" && (
                <button
                  onClick={() => handleStatusUpdate("Waiting For Spare Parts")}
                  disabled={updatingStatus}
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Info size={15} />
                  <span>WAITING FOR SPARE PARTS</span>
                </button>
              )}
              {currentItem.currentStatus === "Waiting For Spare Parts" && (
                <button
                  onClick={() => handleStatusUpdate("Repair In Progress")}
                  disabled={updatingStatus}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus size={15} />
                  <span>RESUME REPAIR PROCESS</span>
                </button>
              )}
              <button
                onClick={() => handleStatusUpdate("Service Completed")}
                disabled={updatingStatus}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle size={15} />
                <span>MARK SERVICE COMPLETED</span>
              </button>
            </div>
          )}

          {currentItem.currentStatus === "Service Completed" && (
            <button
              onClick={() => handleStatusUpdate("Customer Feedback")}
              disabled={updatingStatus}
              className="w-full py-3 bg-[#D71920] hover:bg-[#b8141a] text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
            >
              <MessageSquare size={15} />
              <span>COLLECT CUSTOMER FEEDBACK</span>
            </button>
          )}

          {currentItem.currentStatus === "Customer Feedback" && (
            <button
              onClick={() => handleStatusUpdate("Closed")}
              disabled={updatingStatus}
              className="w-full py-3 bg-[#D71920] hover:bg-[#b8141a] text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ShieldCheck size={15} />
              <span>CLOSE SERVICE TICKET</span>
            </button>
          )}

          {currentItem.currentStatus === "Closed" && (
            <div className="flex flex-col gap-2.5 p-4 rounded-xl border border-neutral-800 bg-neutral-900/20 text-center">
              <div className="flex gap-2 items-center text-xs text-neutral-400 justify-center italic font-semibold">
                {currentItem.cancellationReason ? (
                  <>
                    <AlertCircle size={14} className="text-red-500" />
                    <span>This service request was cancelled and closed.</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={14} className="text-green-500" />
                    <span>This service request is completed and closed.</span>
                  </>
                )}
              </div>
              {currentItem.cancellationReason && (
                <div className="text-[11px] text-neutral-400 italic bg-neutral-900/40 p-2.5 rounded-lg border border-neutral-850">
                  <span className="font-extrabold text-[9px] uppercase text-neutral-500 block mb-0.5">Cancellation Reason:</span>
                  "{currentItem.cancellationReason}"
                </div>
              )}
            </div>
          )}

          {currentItem.currentStatus === "Request Rejected" && (
            <div className="flex gap-2 items-center text-xs text-red-500 justify-center py-2 bg-red-500/5 rounded-xl border border-red-500/10 italic font-semibold">
              <ShieldAlert size={14} className="text-red-500" />
              <span>This service request was rejected by the admin.</span>
            </div>
          )}

          {currentItem.currentStatus !== "Closed" && currentItem.currentStatus !== "Request Rejected" && (
            <div className="mt-3">
              <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Add Remarks / History Log Message</label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 text-neutral-500" size={14} />
                <input
                  type="text"
                  placeholder="e.g. Parts replaced, verification approved, etc."
                  value={actionRemarks}
                  onChange={(e) => setActionRemarks(e.target.value)}
                  className={cn(
                    "w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border outline-none",
                    isDark ? "bg-slate-950 border-neutral-800 text-white" : "bg-white border-neutral-300"
                  )}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* OUT OF WARRANTY SERVICE CHARGES SECTION */}
      {currentItem.warrantyStatus === "Warranty Expired" && (
        <div className={cn(
          "p-5 rounded-2xl border space-y-4 shadow-sm",
          isDark ? "bg-[#141414] border-neutral-800/70" : "bg-orange-50/10 border-orange-100"
        )}>
          <div className="flex items-center justify-between border-b border-neutral-800/60 pb-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-orange-500">Out of Warranty Service Charges</h4>
            {currentItem.totalServiceCost !== null && currentItem.totalServiceCost !== undefined && (
              <span className="text-xs font-bold bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full">
                Total Estimate: ₹{currentItem.totalServiceCost}
              </span>
            )}
          </div>

          {currentItem.currentStatus === "Awaiting Cost Estimation" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Service Charge (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 500"
                    value={serviceCharge}
                    onChange={(e) => setServiceCharge(e.target.value)}
                    className={cn(
                      "w-full px-3 py-2 text-xs rounded-xl border outline-none",
                      isDark ? "bg-slate-950 border-neutral-800 text-white" : "bg-white border-neutral-300"
                    )}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Spare Parts Cost (₹) (Optional)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 1200"
                    value={sparePartsCost}
                    onChange={(e) => setSparePartsCost(e.target.value)}
                    className={cn(
                      "w-full px-3 py-2 text-xs rounded-xl border outline-none",
                      isDark ? "bg-slate-950 border-neutral-800 text-white" : "bg-white border-neutral-300"
                    )}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Inspection Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Describe inspection results and reason for spare parts..."
                  value={inspectionRemarks}
                  onChange={(e) => setInspectionRemarks(e.target.value)}
                  className={cn(
                    "w-full px-3 py-2 text-xs rounded-xl border outline-none resize-none",
                    isDark ? "bg-slate-950 border-neutral-800 text-white" : "bg-white border-neutral-300"
                  )}
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="text-xs font-semibold text-neutral-400">
                  Calculated Total: <span className="text-orange-500 font-bold">₹{(parseFloat(serviceCharge) || 0) + (parseFloat(sparePartsCost) || 0)}</span>
                </div>
                <button
                  onClick={() => handleStatusUpdate("Awaiting Customer Approval")}
                  disabled={updatingStatus}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <Check size={14} />
                  <span>SAVE ESTIMATE</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-neutral-500">Service Charge</p>
                <p className="font-bold mt-0.5">₹{currentItem.serviceCharge ?? "N/A"}</p>
              </div>
              <div>
                <p className="text-neutral-500">Spare Parts Cost</p>
                <p className="font-bold mt-0.5">₹{currentItem.sparePartsCost ?? "0"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-neutral-500">Inspection Remarks</p>
                <p className="font-semibold text-neutral-300 mt-0.5 italic">
                  "{currentItem.inspectionRemarks || "No remarks provided"}"
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
