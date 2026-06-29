"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateInvoiceSettings = exports.getInvoiceSettings = void 0;
const db_1 = require("../utils/db");
// Get dynamic invoice settings
const getInvoiceSettings = async (req, res) => {
    try {
        const settings = await db_1.prisma.systemSetting.findMany();
        const settingsMap = settings.reduce((acc, curr) => {
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
                seller_signature: settingsMap.seller_signature || ""
            }
        });
    }
    catch (error) {
        console.error("Fetch invoice settings error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch settings" });
    }
};
exports.getInvoiceSettings = getInvoiceSettings;
// Update invoice settings
const updateInvoiceSettings = async (req, res) => {
    try {
        const user = req.user;
        const roleUpper = user?.role?.toUpperCase();
        if (!user || (roleUpper !== "ADMIN" && roleUpper !== "SUPERADMIN")) {
            res.status(403).json({ success: false, message: "Access denied. Admin role required." });
            return;
        }
        const { seller_name, seller_address_line1, seller_address_line2, seller_gstin, seller_email, seller_phone, seller_signature } = req.body;
        const dataToSave = {
            seller_name,
            seller_address_line1,
            seller_address_line2,
            seller_gstin,
            seller_email,
            seller_phone,
            seller_signature
        };
        // Upsert each key
        await db_1.prisma.$transaction(Object.entries(dataToSave).map(([key, value]) => {
            return db_1.prisma.systemSetting.upsert({
                where: { key },
                update: { value: value || "" },
                create: { key, value: value || "" }
            });
        }));
        res.json({
            success: true,
            message: "Invoice settings updated successfully"
        });
    }
    catch (error) {
        console.error("Update invoice settings error:", error);
        res.status(500).json({ success: false, message: "Failed to update settings" });
    }
};
exports.updateInvoiceSettings = updateInvoiceSettings;
