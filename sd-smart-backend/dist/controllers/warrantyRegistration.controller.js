"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateWarrantyRegistrationStatus = exports.getWarrantyRegistrationById = exports.getWarrantyRegistrations = exports.checkDuplicate = exports.createWarrantyRegistration = void 0;
const db_1 = require("../utils/db");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Generate unique Warranty Registration Ticket ID in format: WR-YYYY-XXXXXX
 */
const generateRegistrationId = async () => {
    const year = new Date().getFullYear();
    const yearPrefix = `WR-${year}-`;
    // Find the last registration of this year
    const lastRegistration = await db_1.prisma.warrantyRegistration.findFirst({
        where: {
            registrationId: {
                startsWith: yearPrefix
            }
        },
        orderBy: {
            registrationId: "desc"
        }
    });
    let nextIndex = 1;
    if (lastRegistration) {
        const parts = lastRegistration.registrationId.split("-");
        const lastNum = parseInt(parts[2] || "0", 10);
        if (!isNaN(lastNum)) {
            nextIndex = lastNum + 1;
        }
    }
    const serialStr = String(nextIndex).padStart(6, "0");
    return `${yearPrefix}${serialStr}`;
};
/**
 * Register a new warranty
 */
const createWarrantyRegistration = async (req, res) => {
    try {
        // Optional Authentication: attempt to link registration if logged in
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        let userId = null;
        if (token) {
            try {
                const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_sd_smart_123!";
                const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
                userId = decoded.id;
            }
            catch (e) {
                // invalid token is ignored for optional auth
            }
        }
        const { customerName, customerEmail, customerPhone, customerAltPhone, addressLine1, addressLine2, city, state, pincode, productCategory, productName, modelNumber, serialNumber, skuCode, productCapacity, purchaseDate, invoiceNumber, dealerName, placeOfPurchase, attachments // Array of { fileUrl: string, fileType: "PURCHASE_INVOICE" | "WARRANTY_CARD" | "PRODUCT_IMAGE", fileName: string }
         } = req.body;
        // Required fields check
        if (!customerName ||
            !customerEmail ||
            !customerPhone ||
            !addressLine1 ||
            !city ||
            !state ||
            !pincode ||
            !productCategory ||
            !productName ||
            !modelNumber ||
            !serialNumber ||
            !purchaseDate ||
            !invoiceNumber ||
            !dealerName ||
            !placeOfPurchase) {
            res.status(400).json({ success: false, message: "Required fields are missing" });
            return;
        }
        // 1. Validate Purchase Date is not in the future
        const parsedPurchaseDate = new Date(purchaseDate);
        if (parsedPurchaseDate.getTime() > Date.now()) {
            res.status(400).json({ success: false, message: "Purchase date cannot be a future date" });
            return;
        }
        // 2. Validate Email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customerEmail)) {
            res.status(400).json({ success: false, message: "Invalid email format" });
            return;
        }
        // 3. Validate Mobile Number (at least 10 digits)
        const mobileRegex = /^[0-9+() -]{10,20}$/;
        if (!mobileRegex.test(customerPhone)) {
            res.status(400).json({ success: false, message: "Invalid mobile number format" });
            return;
        }
        // 4. Validate Duplicate Serial Number Registration
        const existingBySerial = await db_1.prisma.warrantyRegistration.findUnique({
            where: { serialNumber }
        });
        if (existingBySerial) {
            res.status(400).json({
                success: false,
                message: `Product with serial number "${serialNumber}" has already been registered for warranty`
            });
            return;
        }
        // 5. Validate Duplicate Invoice + Serial Number combination
        const existingByInvoiceSerial = await db_1.prisma.warrantyRegistration.findFirst({
            where: {
                invoiceNumber,
                serialNumber
            }
        });
        if (existingByInvoiceSerial) {
            res.status(400).json({
                success: false,
                message: `Product with serial number "${serialNumber}" is already registered under invoice "${invoiceNumber}"`
            });
            return;
        }
        // 6. Mandatory uploads verification
        const uploadedAttachments = attachments || [];
        const hasInvoice = uploadedAttachments.some((att) => att.fileType === "PURCHASE_INVOICE");
        const hasWarrantyCard = uploadedAttachments.some((att) => att.fileType === "WARRANTY_CARD");
        if (!hasInvoice || !hasWarrantyCard) {
            res.status(400).json({
                success: false,
                message: "Mandatory uploads missing: Both Purchase Invoice and Warranty Card must be uploaded"
            });
            return;
        }
        // 7. Calculate dates (starts from purchase date, defaults to 5 years warranty duration)
        const warrantyStartDate = new Date(parsedPurchaseDate);
        const warrantyExpiryDate = new Date(parsedPurchaseDate);
        warrantyExpiryDate.setFullYear(warrantyExpiryDate.getFullYear() + 5);
        const generatedRegId = await generateRegistrationId();
        // 8. Create database entry
        const result = await db_1.prisma.$transaction(async (tx) => {
            const reg = await tx.warrantyRegistration.create({
                data: {
                    registrationId: generatedRegId,
                    userId: userId || undefined,
                    customerName,
                    customerEmail,
                    customerPhone,
                    customerAltPhone: customerAltPhone || null,
                    addressLine1,
                    addressLine2: addressLine2 || null,
                    city,
                    state,
                    pincode,
                    productCategory,
                    productName,
                    modelNumber,
                    serialNumber,
                    skuCode: skuCode || null,
                    productCapacity: productCapacity || null,
                    purchaseDate: parsedPurchaseDate,
                    invoiceNumber,
                    dealerName,
                    placeOfPurchase,
                    warrantyStartDate,
                    warrantyExpiryDate,
                    warrantyDuration: 5,
                    status: "PENDING_VERIFICATION"
                }
            });
            if (uploadedAttachments.length > 0) {
                await tx.warrantyAttachment.createMany({
                    data: uploadedAttachments.map((att) => ({
                        warrantyRegistrationId: reg.id,
                        fileUrl: att.fileUrl,
                        fileType: att.fileType,
                        fileName: att.fileName || "attachment"
                    }))
                });
            }
            return reg;
        });
        res.status(201).json({
            success: true,
            message: "Warranty registration submitted successfully",
            data: {
                id: result.id,
                registrationId: result.registrationId,
                productName: result.productName,
                warrantyStartDate: result.warrantyStartDate,
                warrantyExpiryDate: result.warrantyExpiryDate,
                status: result.status
            }
        });
    }
    catch (error) {
        console.error("Warranty Registration Error:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to process warranty registration" });
    }
};
exports.createWarrantyRegistration = createWarrantyRegistration;
/**
 * Check if details are duplicate before submission
 */
const checkDuplicate = async (req, res) => {
    try {
        const { serialNumber, invoiceNumber } = req.query;
        if (!serialNumber) {
            res.status(400).json({ success: false, message: "Serial number is required" });
            return;
        }
        // Check serial duplicate
        const bySerial = await db_1.prisma.warrantyRegistration.findUnique({
            where: { serialNumber }
        });
        if (bySerial) {
            res.status(200).json({
                success: true,
                isDuplicate: true,
                message: `Serial number "${serialNumber}" is already registered.`
            });
            return;
        }
        if (invoiceNumber) {
            const byInvoiceSerial = await db_1.prisma.warrantyRegistration.findFirst({
                where: { invoiceNumber, serialNumber }
            });
            if (byInvoiceSerial) {
                res.status(200).json({
                    success: true,
                    isDuplicate: true,
                    message: `This product is already registered under invoice "${invoiceNumber}".`
                });
                return;
            }
        }
        res.status(200).json({
            success: true,
            isDuplicate: false,
            message: "Details are available for registration."
        });
    }
    catch (error) {
        console.error("Duplicate Check Error:", error);
        res.status(500).json({ success: false, message: "Failed to perform duplicate check" });
    }
};
exports.checkDuplicate = checkDuplicate;
/**
 * Get all registrations (Admins only)
 */
const getWarrantyRegistrations = async (req, res) => {
    try {
        const user = req.user;
        if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN" && user.role !== "admin" && user.role !== "superadmin")) {
            res.status(403).json({ success: false, message: "Access Denied: Admins only" });
            return;
        }
        const { search, status, category } = req.query;
        const filters = {};
        if (status) {
            filters.status = status;
        }
        if (category) {
            filters.productCategory = category;
        }
        if (search) {
            const cleanSearch = search.trim();
            filters.OR = [
                { customerName: { contains: cleanSearch, mode: "insensitive" } },
                { customerEmail: { contains: cleanSearch, mode: "insensitive" } },
                { customerPhone: { contains: cleanSearch, mode: "insensitive" } },
                { serialNumber: { contains: cleanSearch, mode: "insensitive" } },
                { invoiceNumber: { contains: cleanSearch, mode: "insensitive" } },
                { registrationId: { contains: cleanSearch, mode: "insensitive" } }
            ];
        }
        const data = await db_1.prisma.warrantyRegistration.findMany({
            where: filters,
            include: {
                attachments: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });
        res.status(200).json({
            success: true,
            data
        });
    }
    catch (error) {
        console.error("Fetch Warranty Registrations Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch warranty registrations" });
    }
};
exports.getWarrantyRegistrations = getWarrantyRegistrations;
/**
 * Get registration details by ID (Admins or Owner)
 */
const getWarrantyRegistrationById = async (req, res) => {
    try {
        const user = req.user;
        const id = req.params.id;
        if (!user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const reg = await db_1.prisma.warrantyRegistration.findUnique({
            where: { id },
            include: {
                attachments: true
            }
        });
        if (!reg) {
            res.status(404).json({ success: false, message: "Warranty registration details not found" });
            return;
        }
        // Access control: admins, superadmins, or the registered user account owner
        const role = user.role.toUpperCase();
        const isOwner = reg.userId === user.id;
        const isAdmin = role === "ADMIN" || role === "SUPERADMIN";
        if (!isAdmin && !isOwner) {
            res.status(403).json({ success: false, message: "Access Denied" });
            return;
        }
        res.status(200).json({
            success: true,
            data: reg
        });
    }
    catch (error) {
        console.error("Fetch Registration Detail Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch registration details" });
    }
};
exports.getWarrantyRegistrationById = getWarrantyRegistrationById;
/**
 * Update verification status (Admins only)
 */
const updateWarrantyRegistrationStatus = async (req, res) => {
    try {
        const user = req.user;
        if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN" && user.role !== "admin" && user.role !== "superadmin")) {
            res.status(403).json({ success: false, message: "Access Denied: Admins only" });
            return;
        }
        const id = req.params.id;
        const { status, remarks } = req.body;
        if (!status || !["PENDING_VERIFICATION", "VERIFIED", "REJECTED", "EXPIRED"].includes(status)) {
            res.status(400).json({ success: false, message: "Invalid or missing status type" });
            return;
        }
        const reg = await db_1.prisma.warrantyRegistration.findUnique({
            where: { id }
        });
        if (!reg) {
            res.status(404).json({ success: false, message: "Registration not found" });
            return;
        }
        const updated = await db_1.prisma.warrantyRegistration.update({
            where: { id },
            data: {
                status,
                rejectionReason: status === "REJECTED" ? remarks || "Details could not be verified." : null
            },
            include: {
                attachments: true
            }
        });
        res.status(200).json({
            success: true,
            message: `Warranty registration status updated to ${status}`,
            data: updated
        });
    }
    catch (error) {
        console.error("Update Registration Status Error:", error);
        res.status(500).json({ success: false, message: "Failed to update registration status" });
    }
};
exports.updateWarrantyRegistrationStatus = updateWarrantyRegistrationStatus;
