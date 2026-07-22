import { Request, Response } from "express";
import { prisma } from "../utils/db";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

// Helper to check if caller is admin
const verifyAdmin = (req: Request, res: Response): boolean => {
  const user = (req as AuthenticatedRequest).user;
  const roleUpper = user?.role?.toUpperCase();
  if (!user || (roleUpper !== "ADMIN" && roleUpper !== "SUPERADMIN")) {
    res.status(403).json({ success: false, message: "Access denied. Admin role required." });
    return false;
  }
  return true;
};

// Helper to verify Sales Person
const verifySalesPerson = (req: Request, res: Response): string | null => {
  const user = (req as AuthenticatedRequest).user;
  if (!user || user.role?.toUpperCase() !== "SALESPERSON") {
    res.status(403).json({ success: false, message: "Access denied. Sales Person only." });
    return null;
  }
  return user.id;
};

// Helper to verify Distributor
const verifyDistributor = (req: Request, res: Response): string | null => {
  const user = (req as AuthenticatedRequest).user;
  if (!user || user.role?.toUpperCase() !== "DISTRIBUTOR") {
    res.status(403).json({ success: false, message: "Access denied. Distributor only." });
    return null;
  }
  return user.id;
};

// 1. Create a new Distributor Enquiry
export const createEnquiry = async (req: Request, res: Response): Promise<void> => {
  try {
    const distributorId = verifyDistributor(req, res);
    if (!distributorId) return;

    const { productId, quantity, message } = req.body;

    if (!productId) {
      res.status(400).json({ success: false, message: "productId is required" });
      return;
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    const distributor = await prisma.user.findUnique({ where: { id: distributorId } });
    if (!distributor) {
      res.status(404).json({ success: false, message: "Distributor profile not found" });
      return;
    }

    const enquiry = await prisma.distributorEnquiry.create({
      data: {
        distributorId,
        productId,
        quantity: parseInt(quantity) || 1,
        message: message || "",
        status: "New"
      },
      include: {
        product: true
      }
    });

    // Create Notification for Admin
    await prisma.notification.create({
      data: {
        recipientId: "admin",
        userType: "ADMIN",
        title: "New Price Enquiry",
        message: `A new Distributor Price Enquiry has been submitted for "${product.name}" (Qty: ${enquiry.quantity}) by distributor "${distributor.companyName || `${distributor.firstName} ${distributor.lastName}`}".`
      }
    });

    res.status(201).json({ success: true, message: "Price enquiry submitted successfully!", enquiry });
  } catch (error: any) {
    console.error("Create distributor enquiry error:", error);
    res.status(500).json({ success: false, message: "Failed to submit price enquiry" });
  }
};

// 2. List all Distributor Enquiries (Admin only)
export const listAllEnquiries = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!verifyAdmin(req, res)) return;

    const page = req.query.page ? parseInt(req.query.page as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;

    const where: any = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (search) {
      const cleanSearch = search.trim();
      where.OR = [
        { distributor: { companyName: { contains: cleanSearch, mode: "insensitive" } } },
        { distributor: { firstName: { contains: cleanSearch, mode: "insensitive" } } },
        { distributor: { lastName: { contains: cleanSearch, mode: "insensitive" } } },
        { product: { name: { contains: cleanSearch, mode: "insensitive" } } },
        { salesPerson: { fullName: { contains: cleanSearch, mode: "insensitive" } } },
      ];
    }

    // Mark all as read by admin when listing them
    await prisma.distributorEnquiry.updateMany({
      where: { viewedByAdmin: false },
      data: { viewedByAdmin: true }
    });

    if (page && limit) {
      const skip = (page - 1) * limit;
      const [enquiries, totalRecords] = await prisma.$transaction([
        prisma.distributorEnquiry.findMany({
          where,
          include: {
            distributor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
                companyName: true
              }
            },
            product: {
              select: {
                id: true,
                name: true,
                category: true,
                categoryLabel: true,
                image: true,
                price: true
              }
            },
            salesPerson: {
              select: {
                id: true,
                fullName: true,
                employeeId: true,
                email: true,
                mobileNumber: true
              }
            }
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit
        }),
        prisma.distributorEnquiry.count({ where })
      ]);

      res.json({
        success: true,
        data: enquiries,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalRecords / limit),
          totalRecords,
          pageSize: limit,
          hasNext: page * limit < totalRecords,
          hasPrevious: page > 1
        }
      });
      return;
    }

    const enquiries = await prisma.distributorEnquiry.findMany({
      where,
      include: {
        distributor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            companyName: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            categoryLabel: true,
            image: true,
            price: true
          }
        },
        salesPerson: {
          select: {
            id: true,
            fullName: true,
            employeeId: true,
            email: true,
            mobileNumber: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json({ success: true, enquiries });
  } catch (error: any) {
    console.error("List enquiries error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch enquiries list" });
  }
};

// 3. Assign Sales Person to Enquiry (Admin only)
export const assignSalesPerson = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!verifyAdmin(req, res)) return;

    const { enquiryId, salesPersonId } = req.body;

    if (!enquiryId || !salesPersonId) {
      res.status(400).json({ success: false, message: "enquiryId and salesPersonId are required" });
      return;
    }

    const enquiry = await prisma.distributorEnquiry.findUnique({
      where: { id: enquiryId },
      include: { product: true, distributor: true }
    });

    if (!enquiry) {
      res.status(404).json({ success: false, message: "Enquiry not found" });
      return;
    }

    const salesPerson = await prisma.salesPerson.findUnique({ where: { id: salesPersonId } });
    if (!salesPerson) {
      res.status(404).json({ success: false, message: "Sales Person not found" });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // Update Enquiry details
      await tx.distributorEnquiry.update({
        where: { id: enquiryId },
        data: {
          salesPersonId,
          status: "Assigned",
          viewedByAdmin: true
        }
      });

      // Create Follow-up Log
      await tx.enquiryFollowUp.create({
        data: {
          distributorEnquiryId: enquiryId,
          actionType: "STATUS_CHANGE",
          remarks: `Assigned to Sales Person: ${salesPerson.fullName} (${salesPerson.employeeId}).`,
          performedById: salesPersonId
        }
      });

      // Create Notification for the assigned representative
      await tx.notification.create({
        data: {
          recipientId: salesPersonId,
          userType: "SALESPERSON",
          title: "New Enquiry Assigned",
          message: `You have been assigned a new Distributor Price Enquiry for "${enquiry.product.name}" (Qty: ${enquiry.quantity}) from "${enquiry.distributor.companyName || `${enquiry.distributor.firstName} ${enquiry.distributor.lastName}`}".`
        }
      });
    });

    res.json({ success: true, message: `Sales Person assigned successfully and notified.` });
  } catch (error: any) {
    console.error("Assign sales person error:", error);
    res.status(500).json({ success: false, message: "Failed to assign sales person" });
  }
};

// 4. List Sales Person's Assigned Enquiries (Sales Person only)
export const listSalesPersonEnquiries = async (req: Request, res: Response): Promise<void> => {
  try {
    const salesPersonId = verifySalesPerson(req, res);
    if (!salesPersonId) return;

    const enquiries = await prisma.distributorEnquiry.findMany({
      where: { salesPersonId },
      include: {
        distributor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            companyName: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            categoryLabel: true,
            image: true,
            price: true
          }
        },
        followUps: {
          include: {
            performedBy: {
              select: {
                id: true,
                fullName: true,
                employeeId: true
              }
            }
          },
          orderBy: { createdAt: "desc" }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    res.json({ success: true, enquiries });
  } catch (error: any) {
    console.error("List salesperson enquiries error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch enquiries list" });
  }
};

// 5. Add Follow-Up Log / Action / Update Status (Sales Person only)
export const addFollowUpLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const salesPersonId = verifySalesPerson(req, res);
    if (!salesPersonId) return;

    const { enquiryId, actionType, remarks, newStatus } = req.body;

    if (!enquiryId || !actionType || !remarks) {
      res.status(400).json({ success: false, message: "enquiryId, actionType, and remarks are required" });
      return;
    }

    const enquiry = await prisma.distributorEnquiry.findUnique({ where: { id: enquiryId } });
    if (!enquiry) {
      res.status(404).json({ success: false, message: "Enquiry not found" });
      return;
    }

    if (enquiry.salesPersonId !== salesPersonId) {
      res.status(403).json({ success: false, message: "Access denied. Enquiry not assigned to you." });
      return;
    }

    const validActions = ["CALL", "EMAIL", "REMARK", "STATUS_CHANGE"];
    if (!validActions.includes(actionType)) {
      res.status(400).json({ success: false, message: `Invalid actionType. Valid values: ${validActions.join(", ")}` });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // Create Follow-up Log
      await tx.enquiryFollowUp.create({
        data: {
          distributorEnquiryId: enquiryId,
          actionType,
          remarks,
          performedById: salesPersonId
        }
      });

      // Update status if provided
      if (newStatus && newStatus !== enquiry.status) {
        await tx.distributorEnquiry.update({
          where: { id: enquiryId },
          data: { status: newStatus }
        });

        // Log the status change explicitly
        await tx.enquiryFollowUp.create({
          data: {
            distributorEnquiryId: enquiryId,
            actionType: "STATUS_CHANGE",
            remarks: `Status updated from "${enquiry.status}" to "${newStatus}".`,
            performedById: salesPersonId
          }
        });
      }
    });

    res.json({ success: true, message: "Follow-up logged successfully!" });
  } catch (error: any) {
    console.error("Add follow up log error:", error);
    res.status(500).json({ success: false, message: "Failed to add follow-up log" });
  }
};

// 6. Get Notifications for current User/Admin
export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    let recipientId = "";
    let userType = "";

    const roleUpper = user.role?.toUpperCase();
    if (roleUpper === "ADMIN" || roleUpper === "SUPERADMIN") {
      recipientId = "admin";
      userType = "ADMIN";
    } else if (roleUpper === "SALESPERSON") {
      recipientId = user.id;
      userType = "SALESPERSON";
    } else {
      res.json({ success: true, notifications: [], unreadCount: 0 });
      return;
    }

    const notifications = await prisma.notification.findMany({
      where: { recipientId, userType },
      orderBy: { createdAt: "desc" },
      take: 20
    });

    const unreadCount = await prisma.notification.count({
      where: { recipientId, userType, isRead: false }
    });

    res.json({ success: true, notifications, unreadCount });
  } catch (error: any) {
    console.error("Get notifications error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
};

// 7. Mark Notifications as Read
export const markNotificationsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    let recipientId = "";
    let userType = "";

    const roleUpper = user.role?.toUpperCase();
    if (roleUpper === "ADMIN" || roleUpper === "SUPERADMIN") {
      recipientId = "admin";
      userType = "ADMIN";
    } else if (roleUpper === "SALESPERSON") {
      recipientId = user.id;
      userType = "SALESPERSON";
    } else {
      res.json({ success: true, message: "No notifications updated" });
      return;
    }

    await prisma.notification.updateMany({
      where: { recipientId, userType, isRead: false },
      data: { isRead: true }
    });

    res.json({ success: true, message: "Notifications marked as read successfully!" });
  } catch (error: any) {
    console.error("Mark notifications read error:", error);
    res.status(500).json({ success: false, message: "Failed to dismiss notifications" });
  }
};

// 8. Admin mark all distributor enquiries as read
export const markAllEnquiriesRead = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!verifyAdmin(req, res)) return;
    await prisma.distributorEnquiry.updateMany({
      where: { viewedByAdmin: false },
      data: { viewedByAdmin: true }
    });
    res.json({ success: true, message: "Marked all enquiries as read" });
  } catch (error: any) {
    console.error("Mark enquiries read error:", error);
    res.status(500).json({ success: false, message: "Failed to mark as read" });
  }
};
