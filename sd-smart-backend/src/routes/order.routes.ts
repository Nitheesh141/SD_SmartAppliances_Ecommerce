import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import { createOrder, getOrders, getOrderById } from "../controllers/order.controller";

const router = Router();

// Protect all order routes
router.use(authenticateToken);

router.post("/", createOrder);
router.get("/", getOrders);
router.get("/:id", getOrderById);

export default router;
