"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const serviceRequest_controller_1 = require("../controllers/serviceRequest.controller");
const router = (0, express_1.Router)();
// Protect all service request routes
router.use(auth_middleware_1.authenticateToken);
router.post("/", serviceRequest_controller_1.createServiceRequest);
router.get("/", serviceRequest_controller_1.getServiceRequests);
router.get("/purchased-products", serviceRequest_controller_1.getPurchasedProducts);
router.get("/:id", serviceRequest_controller_1.getServiceRequestById);
router.patch("/:id/status", serviceRequest_controller_1.updateServiceRequestStatus);
router.patch("/:id/customer-response", serviceRequest_controller_1.respondToEstimate);
exports.default = router;
