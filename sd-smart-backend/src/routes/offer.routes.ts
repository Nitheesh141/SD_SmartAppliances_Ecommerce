import { Router } from "express";
import {
  getOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer,
  calculateOrderPricing,
} from "../controllers/offer.controller";
import { authenticateToken, optionalAuthenticateToken } from "../middleware/auth.middleware";

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
