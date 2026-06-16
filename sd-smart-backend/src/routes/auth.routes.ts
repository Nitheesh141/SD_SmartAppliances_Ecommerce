import { Router } from "express";
import { signup, adminSignup, login, getMe, resetPassword, sendOtp, loginWithOtp, updateProfile } from "../controllers/auth.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.post("/signup", signup);
router.post("/admin/signup", adminSignup);
router.post("/login", login);
router.get("/me", authenticateToken, getMe);
router.put("/update", authenticateToken, updateProfile);
router.post("/reset-password", resetPassword);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", loginWithOtp);

export default router;
