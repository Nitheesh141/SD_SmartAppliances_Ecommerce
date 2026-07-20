import { Router } from "express";
import { getInvoiceSettings, updateInvoiceSettings } from "../controllers/setting.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

// GET endpoint (Public details like seller info & shipping threshold)
router.get("/", getInvoiceSettings);

// PATCH/PUT endpoint (Admin only)
router.patch("/", authenticateToken, updateInvoiceSettings);

export default router;
