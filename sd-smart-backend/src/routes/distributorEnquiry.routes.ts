import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import {
  createEnquiry,
  listAllEnquiries,
  assignSalesPerson,
  listSalesPersonEnquiries,
  addFollowUpLog,
  getNotifications,
  markNotificationsRead,
  markAllEnquiriesRead
} from "../controllers/distributorEnquiry.controller";

const router = Router();

// Submit Distributor Price Enquiry
router.post("/create", authenticateToken, createEnquiry);

// Notifications endpoints
router.get("/notifications/list", authenticateToken, getNotifications);
router.post("/notifications/read", authenticateToken, markNotificationsRead);

// Admin-only endpoints
router.get("/admin/list", authenticateToken, listAllEnquiries);
router.post("/admin/assign", authenticateToken, assignSalesPerson);
router.post("/admin/mark-read", authenticateToken, markAllEnquiriesRead);

// Sales Person endpoints
router.get("/sales/list", authenticateToken, listSalesPersonEnquiries);
router.post("/sales/follow-up", authenticateToken, addFollowUpLog);

export default router;
