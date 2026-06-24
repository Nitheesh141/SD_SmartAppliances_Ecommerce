import { Router } from "express";
import { signup, adminSignup, login, getMe, forgotPassword, resetPassword, changePassword, sendOtp, loginWithOtp, updateProfile, convertToDistributor } from "../controllers/auth.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.post("/signup", signup);
router.post("/admin/signup", adminSignup);
router.post("/login", login);
router.get("/me", authenticateToken, getMe);
router.put("/update", authenticateToken, updateProfile);
router.post("/convert-distributor", authenticateToken, convertToDistributor);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", authenticateToken, changePassword);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", loginWithOtp);

export default router;
