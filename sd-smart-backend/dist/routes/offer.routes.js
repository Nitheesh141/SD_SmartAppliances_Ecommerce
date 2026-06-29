"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const offer_controller_1 = require("../controllers/offer.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_sd_smart_123!";
// Optional authentication middleware for guest checkout pricing calculations
const optionalAuthenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            req.user = decoded;
        }
        catch (error) {
            // Ignore token decode errors for guest visitors
        }
    }
    next();
};
const router = (0, express_1.Router)();
// Public / Guest endpoints
router.get("/", offer_controller_1.getOffers);
router.get("/:id", offer_controller_1.getOfferById);
router.post("/calculate", optionalAuthenticateToken, offer_controller_1.calculateOrderPricing);
// Protected Admin endpoints
router.post("/", auth_middleware_1.authenticateToken, offer_controller_1.createOffer);
router.put("/:id", auth_middleware_1.authenticateToken, offer_controller_1.updateOffer);
router.delete("/:id", auth_middleware_1.authenticateToken, offer_controller_1.deleteOffer);
exports.default = router;
