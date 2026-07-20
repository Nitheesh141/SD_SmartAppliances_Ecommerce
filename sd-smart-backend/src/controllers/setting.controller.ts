import { Request, Response } from "express";
import { prisma } from "../utils/db";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

// Get dynamic invoice settings
export const getInvoiceSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await prisma.systemSetting.findMany();
    const settingsMap = settings.reduce((acc: any, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    // Return dynamic invoice seller details or predefined defaults
    res.json({
      success: true,
      settings: {
        seller_name: settingsMap.seller_name || "SD Smart Appliances Pvt. Ltd.",
        seller_address_line1: settingsMap.seller_address_line1 || "Plot No. 42, B2B Industrial Area",
        seller_address_line2: settingsMap.seller_address_line2 || "Phase II, Bangalore, Karnataka - 560001",
        seller_gstin: settingsMap.seller_gstin || "29AAAAA1111A1Z1",
        seller_email: settingsMap.seller_email || "billing@sdsmartappliances.com",
        seller_phone: settingsMap.seller_phone || "+91 80 4455 6677",
        seller_signature: settingsMap.seller_signature || "",
        freeShippingThreshold: settingsMap.freeShippingThreshold || "10000"
      }
    });
  } catch (error: any) {
    console.error("Fetch invoice settings error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch settings" });
  }
};

// Update invoice settings
export const updateInvoiceSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const roleUpper = user?.role?.toUpperCase();
    if (!user || (roleUpper !== "ADMIN" && roleUpper !== "SUPERADMIN")) {
      res.status(403).json({ success: false, message: "Access denied. Admin role required." });
      return;
    }

    const {
      seller_name,
      seller_address_line1,
      seller_address_line2,
      seller_gstin,
      seller_email,
      seller_phone,
      seller_signature,
      freeShippingThreshold
    } = req.body;

    const dataToSave: any = {};
    if (seller_name !== undefined) dataToSave.seller_name = seller_name;
    if (seller_address_line1 !== undefined) dataToSave.seller_address_line1 = seller_address_line1;
    if (seller_address_line2 !== undefined) dataToSave.seller_address_line2 = seller_address_line2;
    if (seller_gstin !== undefined) dataToSave.seller_gstin = seller_gstin;
    if (seller_email !== undefined) dataToSave.seller_email = seller_email;
    if (seller_phone !== undefined) dataToSave.seller_phone = seller_phone;
    if (seller_signature !== undefined) dataToSave.seller_signature = seller_signature;
    if (freeShippingThreshold !== undefined) dataToSave.freeShippingThreshold = String(freeShippingThreshold);

    // Upsert each key
    await prisma.$transaction(
      Object.entries(dataToSave).map(([key, value]) => {
        return prisma.systemSetting.upsert({
          where: { key },
          update: { value: String(value || "") },
          create: { key, value: String(value || "") }
        });
      })
    );

    res.json({
      success: true,
      message: "Settings updated successfully"
    });
  } catch (error: any) {
    console.error("Update invoice settings error:", error);
    res.status(500).json({ success: false, message: "Failed to update settings" });
  }
};
