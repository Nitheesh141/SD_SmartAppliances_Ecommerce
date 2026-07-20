import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/db";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { sendServiceRequestConfirmationEmail } from "../utils/email";

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
    // Parse optional JWT authorization token
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_sd_smart_123!";
    let tokenUser: any = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
        tokenUser = decoded;
      } catch (err) {
        // Ignore invalid token to allow guest requests fallback
      }
    }

    const {
      productId,
      orderId, // Optional Order ID for authenticated users
      purchasePlace, // Section 3 - Purchase Place / Dealer Name
      purchaseDate,
      serviceCategory,
      issueDescription,
      contactPersonName,
      contactNumber,
      email,
      pickupAddress,
      pincode,
      attachments // Array of { fileUrl: string, fileType: "PRODUCT_IMAGE" | "WARRANTY_CARD", fileName: string }
    } = req.body;

    if (!productId || !purchaseDate || !serviceCategory || !issueDescription || !contactPersonName || !contactNumber || !email || !pickupAddress || !pincode) {
      res.status(400).json({ success: false, message: "Required fields are missing" });
      return;
    }

    // 1. Fetch main Product
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    const isDistributor = tokenUser && tokenUser.role?.toUpperCase() === "DISTRIBUTOR";

    // 1.5 Validate Order Approval Status ONLY for distributors
    if (isDistributor) {
      const orderNumbersToValidate: string[] = [];
      if (orderId) orderNumbersToValidate.push(orderId);
      if (req.body.distributorItems && Array.isArray(req.body.distributorItems)) {
        req.body.distributorItems.forEach((item: any) => {
          if (item.orderId) orderNumbersToValidate.push(item.orderId);
        });
      }

      if (orderNumbersToValidate.length > 0) {
        const uniqueOrderNumbers = [...new Set(orderNumbersToValidate)];
        const orders = await prisma.order.findMany({
          where: { orderNumber: { in: uniqueOrderNumbers } },
          select: { orderNumber: true, status: true }
        });

        const unapprovedStates = ["PENDING_APPROVAL", "REJECTED", "CANCELLED"];
        const invalidOrders = orders.filter(o => unapprovedStates.includes(o.status));
        
        if (invalidOrders.length > 0) {
          res.status(400).json({ 
            success: false, 
            message: `Cannot create service request. Order(s) ${invalidOrders.map(o => o.orderNumber).join(", ")} are not in an approved state.` 
          });
          return;
        }

        if (orders.length !== uniqueOrderNumbers.length) {
          res.status(400).json({ success: false, message: "One or more provided Order IDs are invalid." });
          return;
        }
      } else {
        res.status(400).json({ success: false, message: "Order ID is required for distributor service requests." });
        return;
      }
    }

    // 2. Validate Warranty for main product
    const { expiryDate, status: warrantyStatus } = calculateWarrantyStatus(purchaseDate, product.warranty ?? "1 Year");

    // Process distributorItems if they exist
    let processedDistributorItems: any = null;
    if (req.body.distributorItems && Array.isArray(req.body.distributorItems)) {
      const productIds = req.body.distributorItems.map((item: any) => item.productId);
      const distributorProducts = await prisma.product.findMany({
        where: { id: { in: productIds } }
      });
      const productMap = new Map(distributorProducts.map(p => [p.id, p]));

      processedDistributorItems = req.body.distributorItems.map((item: any) => {
        const p = productMap.get(item.productId);
        const wResult = calculateWarrantyStatus(item.purchaseDate || purchaseDate, p?.warranty ?? "1 Year");
        return {
          ...item,
          warrantyStatus: wResult.status,
          warrantyExpiryDate: wResult.expiryDate,
          currentStatus: "Pending Verification",
          serviceCharge: 0,
          sparePartsCost: 0,
          totalServiceCost: 0,
          inspectionRemarks: "",
          approvalStatus: null, // "Pending Approval", "Approved", "Rejected"
          repairStatus: "Pending", // "Pending", "In Progress", "Completed"
          finalResolution: ""
        };
      });
    }
    const isBatch = processedDistributorItems && processedDistributorItems.length > 1;

    // 3. Generate Ticket ID
    const ticketId = await generateTicketId();

    // 4. Create Service Request with Transaction to ensure all relations are saved
    const targetUserId = tokenUser ? tokenUser.id : null;

    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.serviceRequest.create({
        data: {
          ticketId,
          userId: targetUserId,
          productId,
          orderId: orderId || null,
          purchasePlace: purchasePlace || null,
          purchaseDate: new Date(purchaseDate),
          serviceCategory,
          issueDescription,
          preferredPickupDate: null,
          contactNumber,
          pickupAddress,
          contactPersonName,
          email,
          pincode,
          warrantyExpiryDate: expiryDate,
          warrantyStatus: isBatch ? "Batch Request" : warrantyStatus,
          currentStatus: isBatch ? "Batch Process" : "Request Submitted",
          distributorItems: isBatch ? processedDistributorItems : undefined,
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
      const dbUser = targetUserId ? await tx.user.findUnique({ where: { id: targetUserId } }) : null;
      const updaterName = dbUser ? `${dbUser.firstName} ${dbUser.lastName}` : (contactPersonName || "Guest");
      
      await tx.serviceRequestHistory.create({
        data: {
          serviceRequestId: request.id,
          status: "Request Submitted",
          remarks: "Service request submitted successfully.",
          updatedBy: updaterName
        }
      });

      return request;
    });

    // Trigger automatic email notification asynchronously (failures are caught and logged)
    try {
      const requestDateFormatted = new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      await sendServiceRequestConfirmationEmail(
        email,
        contactPersonName,
        ticketId,
        contactNumber,
        product.name,
        requestDateFormatted
      );
    } catch (emailError) {
      console.error("Failed to send service request confirmation email via SMTP:", emailError);
    }

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
 * Helper to map guest user details if userId is null
 */
const mapServiceRequestResponse = (req: any) => {
  if (req && !req.user && req.userId === null) {
    return {
      ...req,
      user: {
        id: null,
        firstName: req.contactPersonName || "",
        lastName: "",
        email: req.email || "",
        phoneNumber: req.contactNumber || "",
        role: "GUEST",
        companyName: null,
        gstin: null
      }
    };
  }
  return req;
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

    const mappedRequests = requests.map(mapServiceRequestResponse);

    res.status(200).json({
      success: true,
      data: mappedRequests
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
    // Parse optional JWT authorization token
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_sd_smart_123!";
    let tokenUser: any = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
        tokenUser = decoded;
      } catch (err) {
        // Ignore invalid token
      }
    }

    const id = req.params.id as string;

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

    // Access check:
    // If the request belongs to a registered user, we restrict access
    if (request.userId !== null) {
      if (!tokenUser) {
        res.status(401).json({ success: false, message: "Unauthorized. Please login to view this ticket." });
        return;
      }
      const role = tokenUser.role.toUpperCase();
      const isAdmin = role === "ADMIN" || role === "SUPERADMIN";
      if (!isAdmin && request.userId !== tokenUser.id) {
        res.status(403).json({ success: false, message: "Forbidden" });
        return;
      }
    }

    res.status(200).json({
      success: true,
      data: mapServiceRequestResponse(request)
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
        status: {
          notIn: ["PENDING_APPROVAL", "REJECTED", "CANCELLED"]
        }
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
    const { 
      status, 
      remarks, 
      serviceCharge, 
      sparePartsCost, 
      inspectionRemarks, 
      itemIndex,
      technicianName,
      technicianPhone,
      expectedVisitDate,
      expectedVisitTime,
      internalRemarks
    } = req.body;

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

    let dataToUpdate: any = {};
    let historyRemarks = remarks || `Status updated to ${status}.`;

    if (itemIndex !== undefined && request.distributorItems && Array.isArray(request.distributorItems)) {
      const items = [...(request.distributorItems as any[])];
      if (itemIndex >= 0 && itemIndex < items.length) {
        const item = items[itemIndex];
        item.currentStatus = status;

        if (serviceCharge !== undefined && serviceCharge !== null) {
          const charge = parseFloat(serviceCharge);
          const partsCost = sparePartsCost !== undefined && sparePartsCost !== null ? parseFloat(sparePartsCost) || 0 : 0;
          item.serviceCharge = charge;
          item.sparePartsCost = sparePartsCost !== undefined && sparePartsCost !== null ? partsCost : null;
          item.totalServiceCost = charge + partsCost;
        }

        if (inspectionRemarks !== undefined) {
          item.inspectionRemarks = inspectionRemarks;
        }

        dataToUpdate.distributorItems = items;
        historyRemarks = `[${item.productName || "Product"}] ` + historyRemarks;
      } else {
        res.status(400).json({ success: false, message: "Invalid item index" });
        return;
      }
    } else {
      dataToUpdate.currentStatus = status;

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
    }

    if (technicianName !== undefined) dataToUpdate.technicianName = technicianName;
    if (technicianPhone !== undefined) dataToUpdate.technicianPhone = technicianPhone;
    if (expectedVisitDate !== undefined) dataToUpdate.expectedVisitDate = expectedVisitDate ? new Date(expectedVisitDate) : null;
    if (expectedVisitTime !== undefined) dataToUpdate.expectedVisitTime = expectedVisitTime;
    if (internalRemarks !== undefined) dataToUpdate.internalRemarks = internalRemarks;

    const updatedRequest = await prisma.$transaction(async (tx) => {
      const updated = await tx.serviceRequest.update({
        where: { id },
        data: dataToUpdate
      });

      if (status === "Request Accepted") {
        await tx.serviceRequestHistory.create({
          data: {
            serviceRequestId: id,
            status: "Warranty Verified",
            remarks: "Warranty check completed automatically: " + (request.warrantyStatus || "Verified"),
            updatedBy: updaterName
          }
        });
      }

      await tx.serviceRequestHistory.create({
        data: {
          serviceRequestId: id,
          status,
          remarks: historyRemarks,
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
    const { action, cancellationReason, itemIndex } = req.body;

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

    const nextStatus = action === "APPROVE" ? "Cost Approved" : "Cancellation Requested";
    const statusRemarks = action === "APPROVE"
      ? "Customer approved the estimated service cost."
      : `Customer rejected the estimated service cost. Reason: ${cancellationReason}`;

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    const updaterName = dbUser ? `${dbUser.firstName} ${dbUser.lastName}` : "Customer";

    let dataToUpdate: any = {};
    let finalRemarks = statusRemarks;

    if (itemIndex !== undefined && request.distributorItems && Array.isArray(request.distributorItems)) {
      const items = [...(request.distributorItems as any[])];
      if (itemIndex >= 0 && itemIndex < items.length) {
        const item = items[itemIndex];
        
        if (item.currentStatus !== "Awaiting Customer Approval" && item.currentStatus !== "Awaiting Cost Estimation") {
           res.status(400).json({ success: false, message: "Item is not awaiting approval" });
           return;
        }

        item.currentStatus = nextStatus;
        if (action === "REJECT") {
          item.cancellationReason = cancellationReason;
        }
        item.approvalStatus = action === "APPROVE" ? "Approved" : "Rejected";

        dataToUpdate.distributorItems = items;
        finalRemarks = `[${item.productName || "Product"}] ` + finalRemarks;
      } else {
        res.status(400).json({ success: false, message: "Invalid item index" });
        return;
      }
    } else {
      if (request.currentStatus !== "Awaiting Customer Approval") {
        res.status(400).json({ success: false, message: "Service request is not awaiting customer approval" });
        return;
      }

      dataToUpdate.currentStatus = nextStatus;
      if (action === "REJECT") {
        dataToUpdate.cancellationReason = cancellationReason;
      }
    }

    const updatedRequest = await prisma.$transaction(async (tx) => {
      const updated = await tx.serviceRequest.update({
        where: { id },
        data: dataToUpdate
      });

      await tx.serviceRequestHistory.create({
        data: {
          serviceRequestId: id,
          status: nextStatus,
          remarks: finalRemarks,
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

export const trackServiceRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticketId, mobileNumber } = req.body;

    if (!ticketId || !mobileNumber) {
      res.status(400).json({ success: false, message: "Ticket ID and Mobile Number are required" });
      return;
    }

    const request = await prisma.serviceRequest.findFirst({
      where: {
        ticketId: ticketId.trim(),
        contactNumber: mobileNumber.trim()
      },
      include: {
        product: {
          select: {
            name: true,
            sku: true
          }
        }
      }
    });

    if (!request) {
      res.status(404).json({ success: false, message: "Invalid Ticket ID or Mobile Number." });
      return;
    }

    const hasTechnician = !!request.technicianName;

    res.status(200).json({
      success: true,
      data: {
        id: request.id,
        ticketId: request.ticketId,
        createdAt: request.createdAt,
        currentStatus: request.currentStatus,
        serviceCategory: request.serviceCategory,
        warrantyStatus: request.warrantyStatus,
        contactPersonName: request.contactPersonName,
        pickupAddress: request.pickupAddress,
        pincode: request.pincode,
        product: {
          name: request.product?.name || "N/A",
          sku: request.product?.sku || "N/A"
        },
        ...(hasTechnician ? {
          technicianName: request.technicianName,
          technicianPhone: request.technicianPhone,
          expectedVisitDate: request.expectedVisitDate,
          expectedVisitTime: request.expectedVisitTime,
          inspectionRemarks: request.inspectionRemarks
        } : {})
      }
    });
  } catch (error: any) {
    console.error("Track service request error:", error);
    res.status(500).json({ success: false, message: "Server error occurred while fetching tracking status." });
  }
};
