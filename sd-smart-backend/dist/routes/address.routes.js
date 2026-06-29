"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const address_controller_1 = require("../controllers/address.controller");
const router = (0, express_1.Router)();
// Protect all address routes
router.use(auth_middleware_1.authenticateToken);
router.get("/", address_controller_1.getAddresses);
router.post("/", address_controller_1.createAddress);
router.put("/:id", address_controller_1.updateAddress);
exports.default = router;
