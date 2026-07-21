import { Request, Response } from "express";
import { prisma } from "../utils/db";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import jwt from "jsonwebtoken";

/**
 * Generate unique Warranty Registration Ticket ID in format: WR-YYYY-XXXXXX
 */
const generateRegistrationId = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const yearPrefix = `WR-${year}-`;

  // Find the last registration of this year
  const lastRegistration = await prisma.warrantyRegistration.findFirst({
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
export const createWarrantyRegistration = async (req: Request, res: Response): Promise<void> => {
  try {
    // Optional Authentication: attempt to link registration if logged in
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    let userId: string | null = null;
    if (token) {
      try {
        const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_sd_smart_123!";
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
        userId = decoded.id;
      } catch (e) {
        // invalid token is ignored for optional auth
      }
    }

    const {
      customerName,
      customerEmail,
      customerPhone,
      customerAltPhone,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      productCategory,
      productName,
      modelNumber,
      serialNumber,
      skuCode,
      productCapacity,
      purchaseDate,
      invoiceNumber,
      dealerName,
      placeOfPurchase,
      attachments // Array of { fileUrl: string, fileType: "PURCHASE_INVOICE" | "WARRANTY_CARD" | "PRODUCT_IMAGE", fileName: string }
    } = req.body;

    // Required fields check
    if (
      !customerName ||
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
      !placeOfPurchase
    ) {
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
    const existingBySerial = await prisma.warrantyRegistration.findUnique({
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
    const existingByInvoiceSerial = await prisma.warrantyRegistration.findFirst({
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
    const hasInvoice = uploadedAttachments.some((att: any) => att.fileType === "PURCHASE_INVOICE");
    const hasWarrantyCard = uploadedAttachments.some((att: any) => att.fileType === "WARRANTY_CARD");
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
    const result = await prisma.$transaction(async (tx) => {
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
          data: uploadedAttachments.map((att: any) => ({
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

  } catch (error: any) {
    console.error("Warranty Registration Error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to process warranty registration" });
  }
};

/**
 * Check if details are duplicate before submission
 */
export const checkDuplicate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { serialNumber, invoiceNumber } = req.query as { serialNumber?: string; invoiceNumber?: string };

    if (!serialNumber) {
      res.status(400).json({ success: false, message: "Serial number is required" });
      return;
    }

    // Check serial duplicate
    const bySerial = await prisma.warrantyRegistration.findUnique({
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
      const byInvoiceSerial = await prisma.warrantyRegistration.findFirst({
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

  } catch (error: any) {
    console.error("Duplicate Check Error:", error);
    res.status(500).json({ success: false, message: "Failed to perform duplicate check" });
  }
};

/**
 * Get all registrations (Admins only)
 */
export const getWarrantyRegistrations = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN" && user.role !== "admin" && user.role !== "superadmin")) {
      res.status(403).json({ success: false, message: "Access Denied: Admins only" });
      return;
    }

    const { search, status, category } = req.query as { search?: string; status?: string; category?: string };
    const page = req.query.page ? parseInt(req.query.page as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

    const filters: any = {};

    if (status && status !== "ALL") {
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

    if (page && limit) {
      const skip = (page - 1) * limit;
      const [data, totalRecords] = await prisma.$transaction([
        prisma.warrantyRegistration.findMany({
          where: filters,
          include: {
            attachments: true
          },
          orderBy: {
            createdAt: "desc"
          },
          skip,
          take: limit
        }),
        prisma.warrantyRegistration.count({ where: filters })
      ]);

      res.status(200).json({
        success: true,
        data,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalRecords / limit),
          totalRecords,
          pageSize: limit,
          hasNext: page * limit < totalRecords,
          hasPrevious: page > 1
        }
      });
      return;
    }

    const data = await prisma.warrantyRegistration.findMany({
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

  } catch (error: any) {
    console.error("Fetch Warranty Registrations Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch warranty registrations" });
  }
};

/**
 * Get registration details by ID (Admins or Owner)
 */
export const getWarrantyRegistrationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const id = req.params.id as string;

    if (!user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const reg = await prisma.warrantyRegistration.findUnique({
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

  } catch (error: any) {
    console.error("Fetch Registration Detail Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch registration details" });
  }
};

/**
 * Update verification status (Admins only)
 */
export const updateWarrantyRegistrationStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN" && user.role !== "admin" && user.role !== "superadmin")) {
      res.status(403).json({ success: false, message: "Access Denied: Admins only" });
      return;
    }

    const id = req.params.id as string;
    const { status, remarks } = req.body as { status: string; remarks?: string };

    if (!status || !["PENDING_VERIFICATION", "VERIFIED", "REJECTED", "EXPIRED"].includes(status)) {
      res.status(400).json({ success: false, message: "Invalid or missing status type" });
      return;
    }

    const reg = await prisma.warrantyRegistration.findUnique({
      where: { id }
    });

    if (!reg) {
      res.status(404).json({ success: false, message: "Registration not found" });
      return;
    }

    const updated = await prisma.warrantyRegistration.update({
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

  } catch (error: any) {
    console.error("Update Registration Status Error:", error);
    res.status(500).json({ success: false, message: "Failed to update registration status" });
  }
};
