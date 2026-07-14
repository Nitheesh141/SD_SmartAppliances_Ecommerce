import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../utils/db";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

// ==========================================
// ADMIN CONTROLLERS (Super Admin only)
// ==========================================

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

// List all sales persons
export const listSalesPersons = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!verifyAdmin(req, res)) return;

    const salesPersons = await prisma.salesPerson.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        distributors: {
          select: {
            id: true,
            companyName: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json({ success: true, salesPersons });
  } catch (error: any) {
    console.error("List sales persons error:", error);
    res.status(500).json({ success: false, message: "Failed to retrieve sales persons" });
  }
};

// Create a new sales person
export const createSalesPerson = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!verifyAdmin(req, res)) return;

    const {
      employeeId,
      fullName,
      email,
      mobileNumber,
      password,
      assignedRegion,
      assignedState,
      assignedDistrict,
      status,
      distributorIds
    } = req.body;

    if (!employeeId || !fullName || !email || !mobileNumber || !password || !assignedRegion || !assignedState || !assignedDistrict) {
      res.status(400).json({ success: false, message: "All fields are required" });
      return;
    }

    // Check unique employeeId
    const existingEmp = await prisma.salesPerson.findUnique({ where: { employeeId } });
    if (existingEmp) {
      res.status(400).json({ success: false, message: "Employee ID must be unique" });
      return;
    }

    // Check unique email
    const existingEmail = await prisma.salesPerson.findUnique({ where: { email: email.toLowerCase() } });
    if (existingEmail) {
      res.status(400).json({ success: false, message: "Email is already registered" });
      return;
    }

    // Check unique mobileNumber
    const existingMobile = await prisma.salesPerson.findUnique({ where: { mobileNumber } });
    if (existingMobile) {
      res.status(400).json({ success: false, message: "Mobile number is already registered" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const salesPerson = await tx.salesPerson.create({
        data: {
          employeeId,
          fullName,
          email: email.toLowerCase(),
          mobileNumber,
          password: hashedPassword,
          assignedRegion,
          assignedState,
          assignedDistrict,
          status: status || "ACTIVE"
        }
      });

      if (distributorIds && distributorIds.length > 0) {
        await tx.user.updateMany({
          where: { id: { in: distributorIds }, role: "DISTRIBUTOR" },
          data: { salesPersonId: salesPerson.id }
        });
      }

      return salesPerson;
    });

    res.status(201).json({ success: true, message: "Sales Person created successfully", salesPerson: result });
  } catch (error: any) {
    console.error("Create sales person error:", error);
    res.status(500).json({ success: false, message: "Failed to create sales person" });
  }
};

// Edit sales person details
export const editSalesPerson = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!verifyAdmin(req, res)) return;

    const id = req.params.id as string;
    const {
      employeeId,
      fullName,
      email,
      mobileNumber,
      password,
      assignedRegion,
      assignedState,
      assignedDistrict,
      status,
      distributorIds
    } = req.body;

    const currentSalesPerson = await prisma.salesPerson.findUnique({ where: { id } });
    if (!currentSalesPerson) {
      res.status(404).json({ success: false, message: "Sales Person not found" });
      return;
    }

    // Checks for unique fields
    if (employeeId && employeeId !== currentSalesPerson.employeeId) {
      const check = await prisma.salesPerson.findUnique({ where: { employeeId } });
      if (check) {
        res.status(400).json({ success: false, message: "Employee ID must be unique" });
        return;
      }
    }

    if (email && email.toLowerCase() !== currentSalesPerson.email) {
      const check = await prisma.salesPerson.findUnique({ where: { email: email.toLowerCase() } });
      if (check) {
        res.status(400).json({ success: false, message: "Email is already registered" });
        return;
      }
    }

    if (mobileNumber && mobileNumber !== currentSalesPerson.mobileNumber) {
      const check = await prisma.salesPerson.findUnique({ where: { mobileNumber } });
      if (check) {
        res.status(400).json({ success: false, message: "Mobile number is already registered" });
        return;
      }
    }

    const dataToUpdate: any = {
      fullName,
      assignedRegion,
      assignedState,
      assignedDistrict,
      status
    };

    if (employeeId) dataToUpdate.employeeId = employeeId;
    if (email) dataToUpdate.email = email.toLowerCase();
    if (mobileNumber) dataToUpdate.mobileNumber = mobileNumber;

    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    await prisma.$transaction(async (tx) => {
      await tx.salesPerson.update({
        where: { id },
        data: dataToUpdate
      });

      if (distributorIds) {
        // Clear all previously assigned distributors
        await tx.user.updateMany({
          where: { salesPersonId: id },
          data: { salesPersonId: null }
        });

        // Set new distributors
        if (distributorIds.length > 0) {
          await tx.user.updateMany({
            where: { id: { in: distributorIds }, role: "DISTRIBUTOR" },
            data: { salesPersonId: id }
          });
        }
      }
    });

    res.json({ success: true, message: "Sales Person updated successfully" });
  } catch (error: any) {
    console.error("Edit sales person error:", error);
    res.status(500).json({ success: false, message: "Failed to update sales person" });
  }
};

// Toggle Sales Person status (Active/Inactive)
export const toggleSalesPersonStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!verifyAdmin(req, res)) return;

    const id = req.params.id as string;
    const { status } = req.body; // ACTIVE or INACTIVE

    if (status !== "ACTIVE" && status !== "INACTIVE") {
      res.status(400).json({ success: false, message: "Invalid status value" });
      return;
    }

    await prisma.salesPerson.update({
      where: { id },
      data: { status }
    });

    res.json({ success: true, message: `Sales Person status updated to ${status}` });
  } catch (error: any) {
    console.error("Toggle status error:", error);
    res.status(500).json({ success: false, message: "Failed to update status" });
  }
};

// Delete a sales person
export const deleteSalesPerson = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!verifyAdmin(req, res)) return;

    const id = req.params.id as string;

    await prisma.$transaction(async (tx) => {
      // Disassociate distributors
      await tx.user.updateMany({
        where: { salesPersonId: id },
        data: { salesPersonId: null }
      });

      // Disassociate enquiries
      await tx.enquiry.updateMany({
        where: { salesPersonId: id },
        data: { salesPersonId: null }
      });

      // Delete sales person
      await tx.salesPerson.delete({ where: { id } });
    });

    res.json({ success: true, message: "Sales Person deleted successfully" });
  } catch (error: any) {
    console.error("Delete sales person error:", error);
    res.status(500).json({ success: false, message: "Failed to delete sales person" });
  }
};

// ==========================================
// SALES PERSON CONTROLLERS (Sales Person only)
// ==========================================

// Helper to check and get Sales Person details
const verifySalesPerson = (req: Request, res: Response): string | null => {
  const user = (req as AuthenticatedRequest).user;
  if (!user || user.role !== "SALESPERSON") {
    res.status(403).json({ success: false, message: "Access denied. Sales Person role required." });
    return null;
  }
  return user.id;
};

// View assigned distributors
export const getMyDistributors = async (req: Request, res: Response): Promise<void> => {
  try {
    const salesPersonId = verifySalesPerson(req, res);
    if (!salesPersonId) return;

    const distributors = await prisma.user.findMany({
      where: {
        role: "DISTRIBUTOR",
        salesPersonId: salesPersonId
      },
      orderBy: { createdAt: "desc" },
      include: {
        addresses: {
          where: { isDefault: true }
        }
      }
    });

    res.json({
      success: true,
      distributors: distributors.map(d => ({
        id: d.id,
        email: d.email,
        phoneNumber: d.phoneNumber,
        firstName: d.firstName,
        lastName: d.lastName,
        companyName: d.companyName,
        gstin: d.gstin,
        approvalStatus: d.approvalStatus,
        createdAt: d.createdAt,
        businessAddress: d.addresses[0]?.addressLine1 || "N/A"
      }))
    });
  } catch (error: any) {
    console.error("Get my distributors error:", error);
    res.status(500).json({ success: false, message: "Failed to retrieve distributors" });
  }
};

// View assigned distributor's order history
export const getDistributorOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const salesPersonId = verifySalesPerson(req, res);
    if (!salesPersonId) return;

    const distributorId = req.params.id as string;

    // Guard: Verify if the distributor is indeed assigned to this Sales Person
    const distributor = await prisma.user.findFirst({
      where: { id: distributorId, role: "DISTRIBUTOR", salesPersonId }
    });

    if (!distributor) {
      res.status(403).json({ success: false, message: "Access denied. This distributor is not assigned to you." });
      return;
    }

    const orders = await prisma.order.findMany({
      where: { userId: distributorId },
      orderBy: { createdAt: "desc" },
      include: {
        address: true,
        items: {
          include: { product: true }
        },
        invoice: true
      }
    });

    res.json({ success: true, orders });
  } catch (error: any) {
    console.error("Get distributor orders error:", error);
    res.status(500).json({ success: false, message: "Failed to retrieve order history" });
  }
};

// View customer & distributor enquiries assigned to them
export const getMyEnquiries = async (req: Request, res: Response): Promise<void> => {
  try {
    const salesPersonId = verifySalesPerson(req, res);
    if (!salesPersonId) return;

    const enquiries = await prisma.enquiry.findMany({
      where: { salesPersonId },
      orderBy: { createdAt: "desc" }
    });

    res.json({ success: true, enquiries });
  } catch (error: any) {
    console.error("Get my enquiries error:", error);
    res.status(500).json({ success: false, message: "Failed to retrieve enquiries" });
  }
};

// Add follow-up remarks & update enquiry status
export const updateEnquiry = async (req: Request, res: Response): Promise<void> => {
  try {
    const salesPersonId = verifySalesPerson(req, res);
    if (!salesPersonId) return;

    const id = req.params.id as string;
    const { status, remarks } = req.body;

    const enquiry = await prisma.enquiry.findUnique({ where: { id } });

    if (!enquiry) {
      res.status(404).json({ success: false, message: "Enquiry not found" });
      return;
    }

    if (enquiry.salesPersonId !== salesPersonId) {
      res.status(403).json({ success: false, message: "Access denied. This enquiry is not assigned to you." });
      return;
    }

    const validStatuses = ["PENDING", "CONTACTED", "QUOTATION_SENT", "CLOSED"];
    if (status && !validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: "Invalid status value" });
      return;
    }

    const updated = await prisma.enquiry.update({
      where: { id },
      data: {
        status: status || enquiry.status,
        remarks: remarks !== undefined ? remarks : enquiry.remarks
      }
    });

    res.json({ success: true, message: "Enquiry updated successfully", enquiry: updated });
  } catch (error: any) {
    console.error("Update enquiry error:", error);
    res.status(500).json({ success: false, message: "Failed to update enquiry" });
  }
};

// Get Dashboard Stats for Sales Person
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const salesPersonId = verifySalesPerson(req, res);
    if (!salesPersonId) return;

    // Get list of assigned distributors
    const distributors = await prisma.user.findMany({
      where: { role: "DISTRIBUTOR", salesPersonId }
    });
    const distIds = distributors.map(d => d.id);

    // Compute calendar month details
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Compute orders this month
    const ordersThisMonth = await prisma.order.findMany({
      where: {
        userId: { in: distIds },
        createdAt: { gte: startOfMonth },
        status: { notIn: ["CANCELLED", "REJECTED"] }
      }
    });

    const salesValue = ordersThisMonth.reduce((sum, order) => sum + order.grandTotal, 0);
    const ordersCount = ordersThisMonth.length;

    // Pending enquiries assigned to them
    const pendingEnquiriesCount = await prisma.enquiry.count({
      where: { salesPersonId, status: "PENDING" }
    });

    // Recent orders
    const recentOrders = await prisma.order.findMany({
      where: { userId: { in: distIds } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true
          }
        }
      }
    });

    // Recent Enquiries
    const recentEnquiries = await prisma.enquiry.findMany({
      where: { salesPersonId },
      orderBy: { updatedAt: "desc" },
      take: 5
    });

    res.json({
      success: true,
      stats: {
        assignedDistributorsCount: distributors.length,
        ordersThisMonthCount: ordersCount,
        salesValueThisMonth: salesValue,
        pendingEnquiriesCount
      },
      recentOrders,
      recentEnquiries
    });
  } catch (error: any) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({ success: false, message: "Failed to compute stats" });
  }
};

// ==========================================
// PUBLIC CONTROLLERS (Unauthenticated)
// ==========================================

// Create a new contact/price enquiry
export const createPublicEnquiry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, message, userId } = req.body;

    if (!name || !email || !phone || !message) {
      res.status(400).json({ success: false, message: "All fields are required" });
      return;
    }

    // Try to auto-assign a sales person
    // If userId (distributor/customer) is provided, see if they are assigned to a SalesPerson.
    let assignedSalesPersonId: string | null = null;

    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user && user.salesPersonId) {
        assignedSalesPersonId = user.salesPersonId;
      }
    }

    // Fallback: assign to the first active sales person, or null
    if (!assignedSalesPersonId) {
      const salesPersons = await prisma.salesPerson.findMany({
        where: { status: "ACTIVE" },
        take: 1
      });
      const firstSalesPerson = salesPersons[0];
      if (firstSalesPerson) {
        assignedSalesPersonId = firstSalesPerson.id;
      }
    }

    const enquiry = await prisma.enquiry.create({
      data: {
        name,
        email,
        phone,
        message,
        userId: userId || null,
        salesPersonId: assignedSalesPersonId
      }
    });

    res.status(201).json({ success: true, message: "Enquiry submitted successfully", enquiry });
  } catch (error: any) {
    console.error("Create public enquiry error:", error);
    res.status(500).json({ success: false, message: "Failed to submit enquiry" });
  }
};
