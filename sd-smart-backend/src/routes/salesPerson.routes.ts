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
  getDashboardStats,
  getSalesPersonPerformance,
  saveSalesPersonTarget,
  updateSalesPersonRemarks,
  assignSalesPersonDistributors
} from "../controllers/salesPerson.controller";

const router = Router();

// Admin-only routes (sales person management)
router.get("/admin/list", authenticateToken, listSalesPersons);
router.post("/admin/create", authenticateToken, createSalesPerson);
router.put("/admin/edit/:id", authenticateToken, editSalesPerson);
router.patch("/admin/status/:id", authenticateToken, toggleSalesPersonStatus);
router.delete("/admin/delete/:id", authenticateToken, deleteSalesPerson);
router.get("/admin/:id/performance", authenticateToken, getSalesPersonPerformance);
router.post("/admin/:id/target", authenticateToken, saveSalesPersonTarget);
router.patch("/admin/:id/remarks", authenticateToken, updateSalesPersonRemarks);
router.post("/admin/:id/assign-distributors", authenticateToken, assignSalesPersonDistributors);

// Sales Person routes
router.get("/my-distributors", authenticateToken, getMyDistributors);
router.get("/my-distributors/:id/orders", authenticateToken, getDistributorOrders);
router.get("/dashboard-stats", authenticateToken, getDashboardStats);

export default router;
