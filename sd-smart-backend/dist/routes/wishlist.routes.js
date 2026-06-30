"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const wishlist_controller_1 = require("../controllers/wishlist.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All wishlist routes require authentication
router.use(auth_middleware_1.authenticateToken);
router.get("/", wishlist_controller_1.getWishlist);
router.post("/items", wishlist_controller_1.addToWishlist);
router.delete("/items/:productId", wishlist_controller_1.removeFromWishlist);
exports.default = router;
