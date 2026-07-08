import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import {
  createWarrantyRegistration,
  checkDuplicate,
  getWarrantyRegistrations,
  getWarrantyRegistrationById,
  updateWarrantyRegistrationStatus
} from "../controllers/warrantyRegistration.controller";

const router = Router();

// Public routes
router.post("/", createWarrantyRegistration);
router.get("/check-duplicate", checkDuplicate);

// Protected routes (Admin role checked in controller)
router.get("/", authenticateToken, getWarrantyRegistrations);
router.get("/:id", authenticateToken, getWarrantyRegistrationById);
router.patch("/:id/status", authenticateToken, updateWarrantyRegistrationStatus);

export default router;
