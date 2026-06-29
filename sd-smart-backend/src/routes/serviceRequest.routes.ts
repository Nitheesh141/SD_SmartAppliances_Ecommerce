import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import {
  createServiceRequest,
  getServiceRequests,
  getServiceRequestById,
  getPurchasedProducts,
  updateServiceRequestStatus
} from "../controllers/serviceRequest.controller";

const router = Router();

// Protect all service request routes
router.use(authenticateToken);

router.post("/", createServiceRequest);
router.get("/", getServiceRequests);
router.get("/purchased-products", getPurchasedProducts);
router.get("/:id", getServiceRequestById);
router.patch("/:id/status", updateServiceRequestStatus);

export default router;
