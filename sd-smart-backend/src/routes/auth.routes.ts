import { Router } from "express";
import {
  signup,
  adminSignup,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
  sendOtp,
  loginWithOtp,
  updateProfile,
  convertToDistributor,
  distributorSignup,
  getDistributors,
  updateDistributorStatus,
  deleteDistributor
} from "../controllers/auth.controller";
import { markDistributorsAsRead } from "../controllers/order.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.post("/signup", signup);
router.post("/admin/signup", adminSignup);
router.post("/distributor/signup", distributorSignup);
router.post("/login", login);
router.get("/me", authenticateToken, getMe);
router.put("/update", authenticateToken, updateProfile);
router.post("/convert-distributor", authenticateToken, convertToDistributor);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", authenticateToken, changePassword);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", loginWithOtp);

// Admin-only distributor management
router.get("/admin/distributors", authenticateToken, getDistributors);
router.post("/admin/distributors/mark-read", authenticateToken, markDistributorsAsRead);
router.put("/admin/distributors/:id/status", authenticateToken, updateDistributorStatus);
router.delete("/admin/distributors/:id", authenticateToken, deleteDistributor);

export default router;
