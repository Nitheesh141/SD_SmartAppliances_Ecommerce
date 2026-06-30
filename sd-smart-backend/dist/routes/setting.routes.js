"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const setting_controller_1 = require("../controllers/setting.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// GET endpoint (Any logged-in user needs this to render their order invoice details)
router.get("/", auth_middleware_1.authenticateToken, setting_controller_1.getInvoiceSettings);
// PATCH/PUT endpoint (Admin only)
router.patch("/", auth_middleware_1.authenticateToken, setting_controller_1.updateInvoiceSettings);
exports.default = router;
