import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import {
  createOrder,
  getOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  getOrderInvoice,
  cancelOrder,
  getUnreadCounts,
  markOrdersAsRead,
} from "../controllers/order.controller";

const router = Router();

// Protect all order routes
router.use(authenticateToken);

router.post("/", createOrder);
router.get("/", getOrders);
router.get("/all", getAllOrders);
router.get("/unread-counts", getUnreadCounts);
router.post("/mark-read", markOrdersAsRead);
router.get("/:id", getOrderById);
router.patch("/:id/status", updateOrderStatus);
router.post("/:id/cancel", cancelOrder);
router.get("/:id/invoice", getOrderInvoice);

export default router;
