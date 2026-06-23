import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import { getAddresses, createAddress, updateAddress } from "../controllers/address.controller";

const router = Router();

// Protect all address routes
router.use(authenticateToken);

router.get("/", getAddresses);
router.post("/", createAddress);
router.put("/:id", updateAddress);

export default router;
