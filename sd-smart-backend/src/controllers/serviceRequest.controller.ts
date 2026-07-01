import { Request, Response } from "express";
import { prisma } from "../utils/db";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

/**
 * Calculates warranty expiry date and determines status
 */
const calculateWarrantyStatus = (purchaseDateStr: string | Date, warrantyText: string): { expiryDate: Date; status: string } => {
  const purchaseDate = new Date(purchaseDateStr);
  const text = (warrantyText || "").trim().toLowerCase();
  
  const hasNoWarranty = 
    !text || 
    text === "0" || 
    text === "no" ||
    text.includes("0 day") || 
    text.includes("0 month") || 
    text.includes("0 year") || 
    text.includes("0 yr") || 
    text.includes("0 mo") || 
    text.includes("0 d") || 
    text.includes("no warranty") || 
    text.includes("none") ||
    text.startsWith("0");

  if (hasNoWarranty) {
    return {
      expiryDate: new Date(purchaseDate),
      status: "Warranty Expired"
    };
  }

  let monthsToAdd = 12; // Default to 1 Year

  if (warrantyText) {
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
        return {
          expiryDate,
          status: isExpired ? "Warranty Expired" : "Under Warranty"
        };
      }
    }
  }

  const expiryDate = new Date(purchaseDate);
  expiryDate.setMonth(expiryDate.getMonth() + monthsToAdd);
  const isExpired = expiryDate.getTime() < Date.now();
  return {
    expiryDate,
    status: isExpired ? "Warranty Expired" : "Under Warranty"
  };
};

/**
 * Generate unique Service Ticket ID in format: SR-YYYY-XXXXXX
 */
const generateTicketId = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const yearPrefix = `SR-${year}-`;

  // Find the last request of this year
  const lastRequest = await prisma.serviceRequest.findFirst({
    where: {
      ticketId: {
        startsWith: yearPrefix
      }
    },
    orderBy: {
      ticketId: "desc"
    }
  });

  let nextIndex = 1;
  if (lastRequest) {
    const parts = lastRequest.ticketId.split("-");
    const lastNum = parseInt(parts[2] || "0", 10);
    if (!isNaN(lastNum)) {
      nextIndex = lastNum + 1;
    }
  }

  const serialStr = String(nextIndex).padStart(6, "0");
  return `${yearPrefix}${serialStr}`;
};

/**
 * Create a new service request
 */
export const createServiceRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const {
      productId,
      orderId,
      purchaseDate,
      serviceCategory,
      issueDescription,
      preferredPickupDate,
      contactNumber,
      pickupAddress,
      attachments // Array of { fileUrl: string, fileType: "PRODUCT_IMAGE" | "WARRANTY_CARD", fileName: string }
    } = req.body;

    if (!productId || !purchaseDate || !serviceCategory || !issueDescription || !preferredPickupDate || !pickupAddress || !contactNumber) {
      res.status(400).json({ success: false, message: "Required fields are missing" });
      return;
    }

    // 1. Fetch Product
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    // 2. Validate Warranty
    const { expiryDate, status: warrantyStatus } = calculateWarrantyStatus(purchaseDate, product.warranty ?? "1 Year");

    // 3. Generate Ticket ID
    const ticketId = await generateTicketId();

    // 4. Create Service Request with Transaction to ensure all relations are saved
    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.serviceRequest.create({
        data: {
          ticketId,
          userId: user.id,
          productId,
          orderId: orderId || null,
          purchaseDate: new Date(purchaseDate),
          serviceCategory,
          issueDescription,
          preferredPickupDate: new Date(preferredPickupDate),
          contactNumber,
          pickupAddress,
          warrantyExpiryDate: expiryDate,
          warrantyStatus,
          currentStatus: "Pending Verification",
        }
      });

      // Add attachments
      if (attachments && Array.isArray(attachments)) {
        await tx.serviceRequestAttachment.createMany({
          data: attachments.map((att: any) => ({
            serviceRequestId: request.id,
            fileUrl: att.fileUrl,
            fileType: att.fileType,
            fileName: att.fileName || "file"
          }))
        });
      }

      // Add initial history
      const dbUser = await tx.user.findUnique({ where: { id: user.id } });
      const updaterName = dbUser ? `${dbUser.firstName} ${dbUser.lastName}` : "Customer";
      
      await tx.serviceRequestHistory.create({
        data: {
          serviceRequestId: request.id,
          status: "Pending Verification",
          remarks: "Service request submitted and pending verification.",
          updatedBy: updaterName
        }
      });

      return request;
    });

    res.status(201).json({
      success: true,
      message: "Service request submitted successfully",
      ticketId,
      data: result
    });
  } catch (error: any) {
    console.error("Create service request error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to submit service request" });
  }
};

/**
 * Get service requests (Admin gets all, Customer/Distributor gets their own)
 */
export const getServiceRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const status = req.query.status as string | undefined;
    const role = user.role.toUpperCase();
    const isAdmin = role === "ADMIN" || role === "SUPERADMIN";

    const whereClause: any = {};

    if (!isAdmin) {
      whereClause.userId = user.id;
    }

    if (status) {
      whereClause.currentStatus = String(status);
    }

    const requests = await prisma.serviceRequest.findMany({
      where: whereClause,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            categoryLabel: true,
            sku: true,
            variantGroup: true,
            warranty: true,
            modelNumber: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            companyName: true,
            gstin: true,
            phoneNumber: true
          }
        },
        attachments: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error: any) {
    console.error("Get service requests error:", error);
    res.status(500).json({ success: false, message: "Failed to retrieve service requests" });
  }
};

/**
 * Get service request by ID
 */
export const getServiceRequestById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const id = req.params.id as string;
    const role = user.role.toUpperCase();
    const isAdmin = role === "ADMIN" || role === "SUPERADMIN";

    const request = await prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        product: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            companyName: true,
            gstin: true,
            phoneNumber: true
          }
        },
        attachments: true,
        history: {
          orderBy: {
            updatedAt: "asc"
          }
        }
      }
    });

    if (!request) {
      res.status(404).json({ success: false, message: "Service request not found" });
      return;
    }

    // Access check
    if (!isAdmin && request.userId !== user.id) {
      res.status(403).json({ success: false, message: "Forbidden" });
      return;
    }

    res.status(200).json({
      success: true,
      data: request
    });
  } catch (error: any) {
    console.error("Get service request by ID error:", error);
    res.status(500).json({ success: false, message: "Failed to retrieve service request details" });
  }
};

/**
 * Get unique purchased products for logged-in user
 */
export const getPurchasedProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    // Query user's orders, including items and their product info
    const orders = await prisma.order.findMany({
      where: {
        userId: user.id,
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    // Extract unique products
    const productMap = new Map<string, any>();

    for (const order of orders) {
      for (const item of order.items) {
        if (item.product && !productMap.has(item.productId)) {
          productMap.set(item.productId, {
            id: item.product.id,
            name: item.product.name,
            warranty: item.product.warranty,
            sku: item.product.sku,
            variantGroup: item.product.variantGroup,
            orderId: order.id,
            orderNumber: order.orderNumber,
            purchaseDate: order.createdAt
          });
        }
      }
    }

    const products = Array.from(productMap.values());

    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error: any) {
    console.error("Get purchased products error:", error);
    res.status(500).json({ success: false, message: "Failed to retrieve purchased products" });
  }
};

/**
 * Update service request status (Admin action)
 */
export const updateServiceRequestStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const role = user.role.toUpperCase();
    if (role !== "ADMIN" && role !== "SUPERADMIN") {
      res.status(403).json({ success: false, message: "Forbidden. Admin access required." });
      return;
    }

    const id = req.params.id as string;
    const { status, remarks, serviceCharge, sparePartsCost, inspectionRemarks } = req.body;

    if (!status) {
      res.status(400).json({ success: false, message: "Status is required" });
      return;
    }

    // Fetch the request first
    const request = await prisma.serviceRequest.findUnique({
      where: { id }
    });

    if (!request) {
      res.status(404).json({ success: false, message: "Service request not found" });
      return;
    }

    // Update Request status & log history
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    const updaterName = dbUser ? `${dbUser.firstName} ${dbUser.lastName} (Admin)` : "Admin";

    const dataToUpdate: any = {
      currentStatus: status,
    };

    if (serviceCharge !== undefined && serviceCharge !== null) {
      const charge = parseFloat(serviceCharge);
      const partsCost = sparePartsCost !== undefined && sparePartsCost !== null ? parseFloat(sparePartsCost) || 0 : 0;
      dataToUpdate.serviceCharge = charge;
      dataToUpdate.sparePartsCost = sparePartsCost !== undefined && sparePartsCost !== null ? partsCost : null;
      dataToUpdate.totalServiceCost = charge + partsCost;
    }

    if (inspectionRemarks !== undefined) {
      dataToUpdate.inspectionRemarks = inspectionRemarks;
    }

    const updatedRequest = await prisma.$transaction(async (tx) => {
      const updated = await tx.serviceRequest.update({
        where: { id },
        data: dataToUpdate
      });

      await tx.serviceRequestHistory.create({
        data: {
          serviceRequestId: id,
          status,
          remarks: remarks || `Status updated to ${status}.`,
          updatedBy: updaterName
        }
      });

      return updated;
    });

    res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: updatedRequest
    });
  } catch (error: any) {
    console.error("Update service request status error:", error);
    res.status(500).json({ success: false, message: "Failed to update service request status" });
  }
};

/**
 * Respond to cost estimate (Customer action)
 */
export const respondToEstimate = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const id = req.params.id as string;
    const { action, cancellationReason } = req.body;

    if (!action || (action !== "APPROVE" && action !== "REJECT")) {
      res.status(400).json({ success: false, message: "Action must be APPROVE or REJECT" });
      return;
    }

    if (action === "REJECT" && (!cancellationReason || !cancellationReason.trim())) {
      res.status(400).json({ success: false, message: "Cancellation reason is required" });
      return;
    }

    const request = await prisma.serviceRequest.findUnique({
      where: { id }
    });

    if (!request) {
      res.status(404).json({ success: false, message: "Service request not found" });
      return;
    }

    // Owner check
    if (request.userId !== user.id) {
      res.status(403).json({ success: false, message: "Forbidden" });
      return;
    }

    if (request.currentStatus !== "Awaiting Customer Approval") {
      res.status(400).json({ success: false, message: "Service request is not awaiting customer approval" });
      return;
    }

    const nextStatus = action === "APPROVE" ? "Cost Approved" : "Cancellation Requested";
    const statusRemarks = action === "APPROVE"
      ? "Customer approved the estimated service cost."
      : `Customer rejected the estimated service cost. Reason: ${cancellationReason}`;

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    const updaterName = dbUser ? `${dbUser.firstName} ${dbUser.lastName}` : "Customer";

    const updatedRequest = await prisma.$transaction(async (tx) => {
      const updated = await tx.serviceRequest.update({
        where: { id },
        data: {
          currentStatus: nextStatus,
          cancellationReason: action === "REJECT" ? cancellationReason : null,
        }
      });

      await tx.serviceRequestHistory.create({
        data: {
          serviceRequestId: id,
          status: nextStatus,
          remarks: statusRemarks,
          updatedBy: updaterName
        }
      });

      return updated;
    });

    res.status(200).json({
      success: true,
      message: `Successfully ${action === "APPROVE" ? "approved" : "rejected"} the service cost estimate`,
      data: updatedRequest
    });
  } catch (error: any) {
    console.error("Customer response to estimate error:", error);
    res.status(500).json({ success: false, message: "Failed to submit estimate response" });
  }
};
