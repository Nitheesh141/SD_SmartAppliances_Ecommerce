import { Request, Response } from "express";
import { prisma } from "../utils/db";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

// Helper to check and get Sales Person details
const verifySalesPerson = (req: Request, res: Response): string | null => {
  const user = (req as AuthenticatedRequest).user;
  if (!user || user.role !== "SALESPERSON") {
    res.status(403).json({ success: false, message: "Access denied. Sales Person role required." });
    return null;
  }
  return user.id;
};

// Helper to check if Admin
const verifyAdmin = (req: Request, res: Response): boolean => {
  const user = (req as AuthenticatedRequest).user;
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
    res.status(403).json({ success: false, message: "Access denied. Admin role required." });
    return false;
  }
  return true;
};

// Submit or save Daily Sales Activity (Sales Person only)
export const submitActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const salesPersonId = verifySalesPerson(req, res);
    if (!salesPersonId) return;

    const {
      id,
      activityDate,
      startTime,
      endTime,
      workingStatus,
      currentLocation,
      distributorId,
      visitType,
      visitStatus,
      orderCollected,
      orderAmount,
      productsOrdered,
      expectedDeliveryDate,
      newEnquiry,
      enquiryDistributorName,
      enquiryMobile,
      enquiryLocation,
      interestedProducts,
      numberOfVisits,
      numberOfOrders,
      numberOfEnquiries,
      numberOfFollowUps,
      distanceTravelled,
      achievements,
      challenges,
      tomorrowPlan,
      remarks,
      attachment,
      status // "DRAFT" or "PENDING"
    } = req.body;

    const isSubmitted = status === "PENDING";
    const finalStatus = isSubmitted ? "PENDING" : "DRAFT";
    const submittedAt = isSubmitted ? new Date() : null;

    const parsedDate = activityDate ? new Date(activityDate) : new Date();

    const activityData: any = {
      salesPersonId,
      activityDate: parsedDate,
      startTime: startTime || "",
      endTime: endTime || "",
      workingStatus: workingStatus || "Office Work",
      currentLocation: currentLocation || "",
      distributorId: distributorId || null,
      visitType: visitType || null,
      visitStatus: visitStatus || null,
      orderCollected: !!orderCollected,
      orderAmount: orderAmount ? parseFloat(orderAmount) : null,
      productsOrdered: productsOrdered || null,
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
      newEnquiry: !!newEnquiry,
      enquiryDistributorName: enquiryDistributorName || null,
      enquiryMobile: enquiryMobile || null,
      enquiryLocation: enquiryLocation || null,
      interestedProducts: interestedProducts || null,
      numberOfVisits: numberOfVisits ? parseInt(numberOfVisits) : 0,
      numberOfOrders: numberOfOrders ? parseInt(numberOfOrders) : 0,
      numberOfEnquiries: numberOfEnquiries ? parseInt(numberOfEnquiries) : 0,
      numberOfFollowUps: numberOfFollowUps ? parseInt(numberOfFollowUps) : 0,
      distanceTravelled: distanceTravelled ? parseFloat(distanceTravelled) : null,
      achievements: achievements || null,
      challenges: challenges || null,
      tomorrowPlan: tomorrowPlan || null,
      remarks: remarks || null,
      attachment: attachment || null,
      status: finalStatus,
      submittedAt
    };

    let result;
    if (id) {
      // Make sure the report belongs to this sales person and is in draft/correction status
      const existing = await prisma.salesDailyActivity.findFirst({
        where: { id, salesPersonId }
      });
      if (!existing) {
        res.status(404).json({ success: false, message: "Activity report not found or unauthorized" });
        return;
      }
      result = await prisma.salesDailyActivity.update({
        where: { id },
        data: activityData
      });
    } else {
      result = await prisma.salesDailyActivity.create({
        data: activityData
      });
    }

    res.status(201).json({
      success: true,
      message: `Daily activity report saved as ${finalStatus.toLowerCase()} successfully`,
      activity: result
    });
  } catch (error: any) {
    console.error("Submit activity report error:", error);
    res.status(500).json({ success: false, message: "Failed to submit activity report" });
  }
};

// View current Sales Person's list of reports
export const getMyActivities = async (req: Request, res: Response): Promise<void> => {
  try {
    const salesPersonId = verifySalesPerson(req, res);
    if (!salesPersonId) return;

    const activities = await prisma.salesDailyActivity.findMany({
      where: { salesPersonId },
      orderBy: { activityDate: "desc" },
      include: {
        distributor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true
          }
        }
      }
    });

    res.json({ success: true, activities });
  } catch (error: any) {
    console.error("Get my activities error:", error);
    res.status(500).json({ success: false, message: "Failed to load activity reports" });
  }
};

// Check if today's activity is submitted (Reminder logic)
export const getPendingReminder = async (req: Request, res: Response): Promise<void> => {
  try {
    const salesPersonId = verifySalesPerson(req, res);
    if (!salesPersonId) return;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const report = await prisma.salesDailyActivity.findFirst({
      where: {
        salesPersonId,
        activityDate: {
          gte: todayStart,
          lte: todayEnd
        },
        status: { not: "DRAFT" }
      }
    });

    res.json({
      success: true,
      showReminder: !report
    });
  } catch (error: any) {
    console.error("Get pending reminder error:", error);
    res.status(500).json({ success: false, showReminder: false });
  }
};

// Get detail of a specific activity report
export const getActivityDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const activity = await prisma.salesDailyActivity.findUnique({
      where: { id },
      include: {
        salesPerson: {
          select: {
            id: true,
            fullName: true,
            employeeId: true,
            assignedRegion: true
          }
        },
        distributor: {
          select: {
            id: true,
            companyName: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!activity) {
      res.status(404).json({ success: false, message: "Activity report not found" });
      return;
    }

    // Permission: admin or the salesperson who submitted it
    if (user.role === "SALESPERSON" && activity.salesPersonId !== user.id) {
      res.status(403).json({ success: false, message: "Access denied" });
      return;
    }

    res.json({ success: true, activity });
  } catch (error: any) {
    console.error("Get activity details error:", error);
    res.status(500).json({ success: false, message: "Failed to load activity details" });
  }
};

// ==========================================
// ADMIN CONTROLLERS
// ==========================================

// Get all daily activities with filters (Admin only)
export const getAdminActivities = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!verifyAdmin(req, res)) return;

    const { timeRange, salesPersonId, region, distributorId, workingStatus } = req.query;

    const where: any = {};

    if (timeRange) {
      const now = new Date();
      if (timeRange === "today") {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        where.activityDate = { gte: start, lte: new Date() };
      } else if (timeRange === "yesterday") {
        const start = new Date();
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setDate(end.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        where.activityDate = { gte: start, lte: end };
      } else if (timeRange === "week") {
        const start = new Date();
        start.setDate(start.getDate() - 7);
        where.activityDate = { gte: start };
      } else if (timeRange === "month") {
        const start = new Date();
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        where.activityDate = { gte: start };
      }
    }

    if (salesPersonId) {
      where.salesPersonId = salesPersonId as string;
    }

    if (region) {
      where.salesPerson = {
        assignedRegion: region as string
      };
    }

    if (distributorId) {
      where.distributorId = distributorId as string;
    }

    if (workingStatus) {
      where.workingStatus = workingStatus as string;
    }

    // Exclude drafts from admin view unless they are submitted
    where.status = { not: "DRAFT" };

    const activities = await prisma.salesDailyActivity.findMany({
      where,
      orderBy: { activityDate: "desc" },
      include: {
        salesPerson: {
          select: {
            id: true,
            fullName: true,
            employeeId: true,
            assignedRegion: true
          }
        },
        distributor: {
          select: {
            id: true,
            companyName: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json({ success: true, activities });
  } catch (error: any) {
    console.error("Get admin activities error:", error);
    res.status(500).json({ success: false, message: "Failed to load activities list" });
  }
};

// Admin action: Approve, Reject, correction, verify (Admin only)
export const updateActivityStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!verifyAdmin(req, res)) return;

    const id = req.params.id as string;
    const { action, reviewComment } = req.body;

    const activity = await prisma.salesDailyActivity.findUnique({ where: { id } });
    if (!activity) {
      res.status(404).json({ success: false, message: "Activity report not found" });
      return;
    }

    let status = "PENDING";
    if (action === "APPROVE") status = "APPROVED";
    else if (action === "CORRECTION") status = "CORRECTION_REQUESTED";
    else if (action === "REJECT") status = "REJECTED";
    else if (action === "VERIFY") status = "VERIFIED";

    const updated = await prisma.salesDailyActivity.update({
      where: { id },
      data: {
        status,
        reviewComment: reviewComment || null
      }
    });

    res.json({
      success: true,
      message: `Daily activity report marked as ${status.toLowerCase()} successfully`,
      activity: updated
    });
  } catch (error: any) {
    console.error("Update activity status error:", error);
    res.status(500).json({ success: false, message: "Failed to update status" });
  }
};

// Admin dashboard cards statistics (Admin only)
export const getAdminStats = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!verifyAdmin(req, res)) return;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todaySubmitted = await prisma.salesDailyActivity.count({
      where: {
        activityDate: { gte: todayStart, lte: todayEnd },
        status: { not: "DRAFT" }
      }
    });

    const pendingReports = await prisma.salesDailyActivity.count({
      where: { status: "PENDING" }
    });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthActivities = await prisma.salesDailyActivity.findMany({
      where: {
        activityDate: { gte: startOfMonth },
        status: { in: ["APPROVED", "VERIFIED", "PENDING"] }
      },
      select: {
        numberOfVisits: true,
        numberOfOrders: true,
        numberOfEnquiries: true,
        orderAmount: true
      }
    });

    const totalVisits = monthActivities.reduce((sum: number, act: any) => sum + act.numberOfVisits, 0);
    const totalOrders = monthActivities.reduce((sum: number, act: any) => sum + act.numberOfOrders, 0);
    const totalEnquiries = monthActivities.reduce((sum: number, act: any) => sum + act.numberOfEnquiries, 0);
    const totalRevenue = monthActivities.reduce((sum: number, act: any) => sum + (act.orderAmount || 0), 0);

    res.json({
      success: true,
      stats: {
        todaySubmitted,
        pendingReports,
        totalVisits,
        totalOrders,
        totalRevenue,
        totalEnquiries
      }
    });
  } catch (error: any) {
    console.error("Get admin stats error:", error);
    res.status(500).json({ success: false, message: "Failed to compute stats" });
  }
};

// Admin: Mark all daily sales activities as read (Admin only)
export const markActivitiesAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!verifyAdmin(req, res)) return;

    await prisma.salesDailyActivity.updateMany({
      where: { viewedByAdmin: false },
      data: { viewedByAdmin: true }
    });

    res.json({ success: true, message: "All daily activity reports marked as read" });
  } catch (error: any) {
    console.error("Mark activities as read error:", error);
    res.status(500).json({ success: false, message: "Failed to mark activities as read" });
  }
};
