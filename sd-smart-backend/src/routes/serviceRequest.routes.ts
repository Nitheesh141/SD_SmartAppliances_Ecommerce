import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import {
  createServiceRequest,
  getServiceRequests,
  getServiceRequestById,
  getPurchasedProducts,
  updateServiceRequestStatus,
  respondToEstimate
} from "../controllers/serviceRequest.controller";
import { markServiceRequestsAsRead } from "../controllers/order.controller";

const router = Router();

// Protect all service request routes
router.use(authenticateToken);

router.post("/", createServiceRequest);
router.get("/", getServiceRequests);
router.get("/purchased-products", getPurchasedProducts);
router.post("/mark-read", markServiceRequestsAsRead);
router.get("/:id", getServiceRequestById);
router.patch("/:id/status", updateServiceRequestStatus);
router.patch("/:id/customer-response", respondToEstimate);

export default router;
