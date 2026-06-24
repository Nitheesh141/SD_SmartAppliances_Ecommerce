import { Router } from "express";
import jwt from "jsonwebtoken";
import {
  getOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer,
  calculateOrderPricing,
} from "../controllers/offer.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_sd_smart_123!";

// Optional authentication middleware for guest checkout pricing calculations
const optionalAuthenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Ignore token decode errors for guest visitors
    }
  }
  next();
};

const router = Router();

// Public / Guest endpoints
router.get("/", getOffers);
router.get("/:id", getOfferById);
router.post("/calculate", optionalAuthenticateToken, calculateOrderPricing);

// Protected Admin endpoints
router.post("/", authenticateToken, createOffer);
router.put("/:id", authenticateToken, updateOffer);
router.delete("/:id", authenticateToken, deleteOffer);

export default router;
