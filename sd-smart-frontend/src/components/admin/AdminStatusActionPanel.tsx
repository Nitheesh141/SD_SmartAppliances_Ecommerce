"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Calendar, Info, AlertCircle, 
  Check, ShieldCheck, Truck, ShieldAlert, Plus, MessageSquare, X, CheckCircle
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

  useEffect(() => {
    if (currentItem) {
      setServiceCharge(currentItem.serviceCharge?.toString() || "");
      setSparePartsCost(currentItem.sparePartsCost?.toString() || "");
      setInspectionRemarks(currentItem.inspectionRemarks || "");
      setActionRemarks("");
    }
  }, [currentItem]);

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      let remarks = actionRemarks.trim();
      
      if (newStatus === "Pickup Scheduled") {
        const formattedDate = new Date(request.preferredPickupDate).toLocaleDateString("en-IN", {
          day: "numeric", month: "long", year: "numeric"
        });
        remarks = `Pickup confirmed for ${formattedDate}. ${remarks}`;
      }

      let payload: any = {
        status: newStatus,
        remarks: remarks || undefined
      };

      if (itemIndex !== undefined) {
        payload.itemIndex = itemIndex;
      }

      if (newStatus === "Awaiting Customer Approval") {
        if (!serviceCharge) {
          toast.error("Service Charge is required");
          setUpdatingStatus(false);
          return;
        }
        payload.serviceCharge = parseFloat(serviceCharge);
        payload.sparePartsCost = sparePartsCost ? parseFloat(sparePartsCost) : 0;
        payload.inspectionRemarks = inspectionRemarks.trim();
        payload.remarks = remarks || `Estimated Service Cost: ₹${payload.serviceCharge + payload.sparePartsCost} (Service Charge: ₹${payload.serviceCharge}, Spare Parts: ₹${payload.sparePartsCost}). Remarks: ${payload.inspectionRemarks}`;
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
          {currentItem.currentStatus === "Pending Verification" && (
            <div className="flex flex-col gap-3">
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Action Required</p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleStatusUpdate("Verified")}
                  disabled={updatingStatus}
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1"
                >
                  <Check size={14} />
                  <span>VERIFY REQUEST</span>
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
          )}

          {currentItem.currentStatus === "Verified" && (
            <div className="space-y-3">
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Action Required: Schedule Pickup</p>
              <div className="p-3 bg-neutral-50 dark:bg-slate-850 rounded-xl border border-neutral-100 dark:border-slate-800 text-left">
                <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider mb-1">Customer Selected Date</p>
                <p className="font-bold text-neutral-800 dark:text-neutral-200">
                  {new Date(request.preferredPickupDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <button
                onClick={() => handleStatusUpdate("Pickup Scheduled")}
                disabled={updatingStatus}
                className="w-full py-3 bg-[#D71920] hover:bg-[#b8141a] text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Calendar size={15} />
                <span>CONFIRM PICKUP SCHEDULED</span>
              </button>
            </div>
          )}

          {currentItem.currentStatus === "Pickup Scheduled" && (
            <button
              onClick={() => handleStatusUpdate("Product Collected")}
              disabled={updatingStatus}
              className="w-full py-3 bg-[#D71920] hover:bg-[#b8141a] text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Truck size={15} />
              <span>MARK PRODUCT COLLECTED</span>
            </button>
          )}

          {currentItem.currentStatus === "Product Collected" && (
            <button
              onClick={() => handleStatusUpdate("Under Inspection")}
              disabled={updatingStatus}
              className="w-full py-3 bg-[#D71920] hover:bg-[#b8141a] text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Info size={15} />
              <span>MOVE TO UNDER INSPECTION</span>
            </button>
          )}

          {currentItem.currentStatus === "Under Inspection" && (
            currentItem.warrantyStatus === "Warranty Expired" ? (
              <button
                onClick={() => handleStatusUpdate("Awaiting Cost Estimation")}
                disabled={updatingStatus}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Info size={15} />
                <span>MOVE TO AWAITING COST ESTIMATION</span>
              </button>
            ) : (
              <button
                onClick={() => handleStatusUpdate("Under Repair")}
                disabled={updatingStatus}
                className="w-full py-3 bg-[#D71920] hover:bg-[#b8141a] text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus size={15} />
                <span>MOVE TO UNDER REPAIR</span>
              </button>
            )
          )}

          {currentItem.currentStatus === "Awaiting Cost Estimation" && (
            <div className="text-xs text-orange-400 font-semibold text-center py-2 bg-orange-500/5 rounded-xl border border-orange-500/10">
              Please enter the service charges in the section below to proceed.
            </div>
          )}

          {currentItem.currentStatus === "Awaiting Customer Approval" && (
            <div className="text-xs text-cyan-400 font-semibold text-center py-2 bg-cyan-500/5 rounded-xl border border-cyan-500/10">
              Estimated cost is sent. Awaiting Customer/Distributor Approval.
            </div>
          )}

          {currentItem.currentStatus === "Cost Approved" && (
            <button
              onClick={() => handleStatusUpdate("Under Repair")}
              disabled={updatingStatus}
              className="w-full py-3 bg-[#D71920] hover:bg-[#b8141a] text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus size={15} />
              <span>START REPAIR PROCESS</span>
            </button>
          )}

          {currentItem.currentStatus === "Cancellation Requested" && (() => {
            const phone = request.contactNumber || request.user?.phoneNumber;
            const isPhoneAvailable = !!phone && phone.trim().length > 0;
            const customerName = request.user ? `${request.user.firstName} ${request.user.lastName}` : "Customer";
            return (
              <div className="flex flex-col gap-3.5 p-4 rounded-xl border border-orange-500/10 bg-orange-500/5 text-left">
                <div className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-wider">
                  <AlertCircle size={15} />
                  <span>Cancellation Requested by User</span>
                </div>
                
                <div className="text-xs text-neutral-300 bg-neutral-900/40 p-3 rounded-lg border border-neutral-800 italic">
                  <span className="font-extrabold text-[10px] uppercase text-neutral-400 block mb-1">Cancelled Message:</span>
                  "{currentItem.cancellationReason}"
                </div>

                <div className="text-xs space-y-1.5 text-neutral-400">
                  <div>Customer Name: <span className="text-neutral-200 font-bold">{customerName}</span></div>
                  <div>Customer Phone: <span className="text-neutral-200 font-mono font-bold">{isPhoneAvailable ? phone : "Not Available"}</span></div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleStatusUpdate("Service Cancelled")}
                    disabled={updatingStatus}
                    className="w-full py-2.5 bg-red-650 hover:bg-red-750 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Check size={13} />
                    <span>CONFIRM CANCELLATION</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {currentItem.currentStatus === "Service Cancelled" && (
            <div className="flex flex-col gap-3">
              <div className="text-xs text-red-400 font-semibold text-center py-2 bg-red-500/5 rounded-xl border border-red-500/10">
                Service request was rejected/cancelled by the customer.
              </div>
              {currentItem.cancellationReason && (
                <div className="text-xs text-neutral-300 bg-neutral-900/40 p-3 rounded-lg border border-neutral-800 italic">
                  <span className="font-extrabold text-[10px] uppercase text-neutral-400 block mb-1">Cancellation Reason:</span>
                  "{currentItem.cancellationReason}"
                </div>
              )}
              <button
                onClick={() => handleStatusUpdate("Closed")}
                disabled={updatingStatus}
                className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ShieldCheck size={15} />
                <span>CLOSE TICKET</span>
              </button>
            </div>
          )}

          {currentItem.currentStatus === "Under Repair" && (
            <button
              onClick={() => handleStatusUpdate("Service Completed")}
              disabled={updatingStatus}
              className="w-full py-3 bg-[#D71920] hover:bg-[#b8141a] text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle size={15} />
              <span>MOVE TO SERVICE COMPLETED</span>
            </button>
          )}

          {currentItem.currentStatus === "Service Completed" && (
            <button
              onClick={() => handleStatusUpdate("Ready For Delivery")}
              disabled={updatingStatus}
              className="w-full py-3 bg-[#D71920] hover:bg-[#b8141a] text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Truck size={15} />
              <span>MARK READY FOR DELIVERY</span>
            </button>
          )}

          {currentItem.currentStatus === "Ready For Delivery" && (
            <button
              onClick={() => handleStatusUpdate("Delivered")}
              disabled={updatingStatus}
              className="w-full py-3 bg-[#D71920] hover:bg-[#b8141a] text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle size={15} />
              <span>MARK DELIVERED</span>
            </button>
          )}

          {currentItem.currentStatus === "Delivered" && (
            <button
              onClick={() => handleStatusUpdate("Closed")}
              disabled={updatingStatus}
              className="w-full py-3 bg-[#D71920] hover:bg-[#b8141a] text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ShieldCheck size={15} />
              <span>CLOSE TICKET</span>
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
