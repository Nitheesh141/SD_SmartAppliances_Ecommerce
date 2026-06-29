"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateServiceRequestStatus = exports.getPurchasedProducts = exports.getServiceRequestById = exports.getServiceRequests = exports.createServiceRequest = void 0;
const db_1 = require("../utils/db");
/**
 * Calculates warranty expiry date and determines status
 */
const calculateWarrantyStatus = (purchaseDateStr, warrantyText) => {
    const purchaseDate = new Date(purchaseDateStr);
    let monthsToAdd = 12; // Default to 1 Year
    if (warrantyText) {
        const text = warrantyText.toLowerCase();
        const match = text.match(/(\d+)\s*(year|month|day|yr|mo|d)s?/);
        if (match && match[1] && match[2]) {
            const value = parseInt(match[1], 10);
            const unit = match[2];
            if (unit.startsWith("year") || unit.startsWith("yr")) {
                monthsToAdd = value * 12;
            }
            else if (unit.startsWith("month") || unit.startsWith("mo")) {
                monthsToAdd = value;
            }
            else if (unit.startsWith("day") || unit.startsWith("d")) {
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
const generateTicketId = async () => {
    const year = new Date().getFullYear();
    const yearPrefix = `SR-${year}-`;
    // Find the last request of this year
    const lastRequest = await db_1.prisma.serviceRequest.findFirst({
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
const createServiceRequest = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const { productId, orderId, purchaseDate, serviceCategory, issueDescription, preferredPickupDate, contactNumber, pickupAddress, attachments // Array of { fileUrl: string, fileType: "PRODUCT_IMAGE" | "WARRANTY_CARD", fileName: string }
         } = req.body;
        if (!productId || !purchaseDate || !serviceCategory || !issueDescription || !preferredPickupDate || !pickupAddress || !contactNumber) {
            res.status(400).json({ success: false, message: "Required fields are missing" });
            return;
        }
        // 1. Fetch Product
        const product = await db_1.prisma.product.findUnique({
            where: { id: productId }
        });
        if (!product) {
            res.status(404).json({ success: false, message: "Product not found" });
            return;
        }
        // 2. Validate Warranty
        const { expiryDate, status: warrantyStatus } = calculateWarrantyStatus(purchaseDate, product.warranty || "1 Year");
        // 3. Generate Ticket ID
        const ticketId = await generateTicketId();
        // 4. Create Service Request with Transaction to ensure all relations are saved
        const result = await db_1.prisma.$transaction(async (tx) => {
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
                    data: attachments.map((att) => ({
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
    }
    catch (error) {
        console.error("Create service request error:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to submit service request" });
    }
};
exports.createServiceRequest = createServiceRequest;
/**
 * Get service requests (Admin gets all, Customer/Distributor gets their own)
 */
const getServiceRequests = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const status = req.query.status;
        const role = user.role.toUpperCase();
        const isAdmin = role === "ADMIN" || role === "SUPERADMIN";
        const whereClause = {};
        if (!isAdmin) {
            whereClause.userId = user.id;
        }
        if (status) {
            whereClause.currentStatus = String(status);
        }
        const requests = await db_1.prisma.serviceRequest.findMany({
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
    }
    catch (error) {
        console.error("Get service requests error:", error);
        res.status(500).json({ success: false, message: "Failed to retrieve service requests" });
    }
};
exports.getServiceRequests = getServiceRequests;
/**
 * Get service request by ID
 */
const getServiceRequestById = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const id = req.params.id;
        const role = user.role.toUpperCase();
        const isAdmin = role === "ADMIN" || role === "SUPERADMIN";
        const request = await db_1.prisma.serviceRequest.findUnique({
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
    }
    catch (error) {
        console.error("Get service request by ID error:", error);
        res.status(500).json({ success: false, message: "Failed to retrieve service request details" });
    }
};
exports.getServiceRequestById = getServiceRequestById;
/**
 * Get unique purchased products for logged-in user
 */
const getPurchasedProducts = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        // Query user's orders, including items and their product info
        const orders = await db_1.prisma.order.findMany({
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
        const productMap = new Map();
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
    }
    catch (error) {
        console.error("Get purchased products error:", error);
        res.status(500).json({ success: false, message: "Failed to retrieve purchased products" });
    }
};
exports.getPurchasedProducts = getPurchasedProducts;
/**
 * Update service request status (Admin action)
 */
const updateServiceRequestStatus = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const role = user.role.toUpperCase();
        if (role !== "ADMIN" && role !== "SUPERADMIN") {
            res.status(403).json({ success: false, message: "Forbidden. Admin access required." });
            return;
        }
        const id = req.params.id;
        const { status, remarks } = req.body;
        if (!status) {
            res.status(400).json({ success: false, message: "Status is required" });
            return;
        }
        // Fetch the request first
        const request = await db_1.prisma.serviceRequest.findUnique({
            where: { id }
        });
        if (!request) {
            res.status(404).json({ success: false, message: "Service request not found" });
            return;
        }
        // Update Request status & log history
        const dbUser = await db_1.prisma.user.findUnique({ where: { id: user.id } });
        const updaterName = dbUser ? `${dbUser.firstName} ${dbUser.lastName} (Admin)` : "Admin";
        const updatedRequest = await db_1.prisma.$transaction(async (tx) => {
            const updated = await tx.serviceRequest.update({
                where: { id },
                data: {
                    currentStatus: status,
                }
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
    }
    catch (error) {
        console.error("Update service request status error:", error);
        res.status(500).json({ success: false, message: "Failed to update service request status" });
    }
};
exports.updateServiceRequestStatus = updateServiceRequestStatus;
