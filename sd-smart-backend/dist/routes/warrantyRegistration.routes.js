"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const warrantyRegistration_controller_1 = require("../controllers/warrantyRegistration.controller");
const router = (0, express_1.Router)();
// Public routes
router.post("/", warrantyRegistration_controller_1.createWarrantyRegistration);
router.get("/check-duplicate", warrantyRegistration_controller_1.checkDuplicate);
// Protected routes (Admin role checked in controller)
router.get("/", auth_middleware_1.authenticateToken, warrantyRegistration_controller_1.getWarrantyRegistrations);
router.get("/:id", auth_middleware_1.authenticateToken, warrantyRegistration_controller_1.getWarrantyRegistrationById);
router.patch("/:id/status", auth_middleware_1.authenticateToken, warrantyRegistration_controller_1.updateWarrantyRegistrationStatus);
exports.default = router;
