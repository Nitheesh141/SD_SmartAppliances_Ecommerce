"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const order_controller_1 = require("../controllers/order.controller");
const router = (0, express_1.Router)();
// Protect all order routes
router.use(auth_middleware_1.authenticateToken);
router.post("/", order_controller_1.createOrder);
router.get("/", order_controller_1.getOrders);
router.get("/all", order_controller_1.getAllOrders);
router.get("/unread-counts", order_controller_1.getUnreadCounts);
router.post("/mark-read", order_controller_1.markOrdersAsRead);
router.get("/:id", order_controller_1.getOrderById);
router.patch("/:id/status", order_controller_1.updateOrderStatus);
router.post("/:id/cancel", order_controller_1.cancelOrder);
router.get("/:id/invoice", order_controller_1.getOrderInvoice);
exports.default = router;
