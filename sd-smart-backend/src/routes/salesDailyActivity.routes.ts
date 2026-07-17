import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import {
  submitActivity,
  getMyActivities,
  getPendingReminder,
  getActivityDetails,
  getAdminActivities,
  updateActivityStatus,
  getAdminStats,
  markActivitiesAsRead
} from "../controllers/salesDailyActivity.controller";

const router = Router();

// Protect all daily activity routes
router.use(authenticateToken);

// Sales Person routes
router.post("/", submitActivity);
router.get("/my", getMyActivities);
router.get("/reminder", getPendingReminder);

// Admin routes
router.get("/admin/list", getAdminActivities);
router.get("/admin/stats", getAdminStats);
router.patch("/admin/:id/status", updateActivityStatus);
router.post("/admin/mark-read", markActivitiesAsRead);

// Shared details route
router.get("/:id", getActivityDetails);

export default router;
