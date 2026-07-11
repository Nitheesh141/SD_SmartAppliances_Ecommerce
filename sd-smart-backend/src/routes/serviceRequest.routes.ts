import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import {
  createServiceRequest,
  getServiceRequests,
  getServiceRequestById,
  getPurchasedProducts,
  updateServiceRequestStatus,
  respondToEstimate,
  trackServiceRequest
} from "../controllers/serviceRequest.controller";
import { markServiceRequestsAsRead } from "../controllers/order.controller";

const router = Router();

// Public routes to submit a service request and view ticket details
router.post("/", createServiceRequest);
router.get("/:id", getServiceRequestById);
router.post("/track", trackServiceRequest);

// Protect all other routes
router.use(authenticateToken);

router.get("/", getServiceRequests);
router.get("/purchased-products", getPurchasedProducts);
router.post("/mark-read", markServiceRequestsAsRead);
router.patch("/:id/status", updateServiceRequestStatus);
router.patch("/:id/customer-response", respondToEstimate);

export default router;
