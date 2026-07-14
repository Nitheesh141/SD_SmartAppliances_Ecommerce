import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import {
  listSalesPersons,
  createSalesPerson,
  editSalesPerson,
  toggleSalesPersonStatus,
  deleteSalesPerson,
  getMyDistributors,
  getDistributorOrders,
  getMyEnquiries,
  updateEnquiry,
  getDashboardStats,
  createPublicEnquiry
} from "../controllers/salesPerson.controller";

const router = Router();

// Public routes (submit contact/price queries)
router.post("/public/enquiry", createPublicEnquiry);

// Admin-only routes (sales person management)
router.get("/admin/list", authenticateToken, listSalesPersons);
router.post("/admin/create", authenticateToken, createSalesPerson);
router.put("/admin/edit/:id", authenticateToken, editSalesPerson);
router.patch("/admin/status/:id", authenticateToken, toggleSalesPersonStatus);
router.delete("/admin/delete/:id", authenticateToken, deleteSalesPerson);

// Sales Person routes
router.get("/my-distributors", authenticateToken, getMyDistributors);
router.get("/my-distributors/:id/orders", authenticateToken, getDistributorOrders);
router.get("/my-enquiries", authenticateToken, getMyEnquiries);
router.put("/my-enquiries/:id", authenticateToken, updateEnquiry);
router.get("/dashboard-stats", authenticateToken, getDashboardStats);

export default router;
