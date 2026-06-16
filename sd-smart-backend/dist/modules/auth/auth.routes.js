"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post("/signup", auth_controller_1.signup);
router.post("/login", auth_controller_1.login);
router.get("/me", auth_middleware_1.authenticateToken, auth_controller_1.getMe);
router.post("/reset-password", auth_controller_1.resetPassword);
router.post("/send-otp", auth_controller_1.sendOtp);
router.post("/verify-otp", auth_controller_1.loginWithOtp);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map