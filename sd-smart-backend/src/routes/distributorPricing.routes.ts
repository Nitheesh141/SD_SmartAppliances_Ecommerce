import { Router } from "express";
import {
  getDistributorPricings,
  createDistributorPricing,
  updateDistributorPricing,
  deleteDistributorPricing,
} from "../controllers/distributorPricing.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticateToken, getDistributorPricings);
router.post("/", authenticateToken, createDistributorPricing);
router.put("/:id", authenticateToken, updateDistributorPricing);
router.delete("/:id", authenticateToken, deleteDistributorPricing);

export default router;
