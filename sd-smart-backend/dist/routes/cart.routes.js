"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cart_controller_1 = require("../controllers/cart.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All cart routes require authentication
router.use(auth_middleware_1.authenticateToken);
router.get("/", cart_controller_1.getCart);
router.delete("/", cart_controller_1.clearCart);
router.post("/items", cart_controller_1.addToCart);
router.patch("/items/:id", cart_controller_1.updateCartItem);
router.delete("/items/:id", cart_controller_1.removeFromCart);
exports.default = router;
