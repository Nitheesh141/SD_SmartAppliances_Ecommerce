import { Router } from "express";
import { getInvoiceSettings, updateInvoiceSettings } from "../controllers/setting.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

// GET endpoint (Any logged-in user needs this to render their order invoice details)
router.get("/", authenticateToken, getInvoiceSettings);

// PATCH/PUT endpoint (Admin only)
router.patch("/", authenticateToken, updateInvoiceSettings);

export default router;
