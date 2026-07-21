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

    const page = req.query.page ? parseInt(req.query.page as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const search = req.query.search as string | undefined;

    const startOfCurrentMonth = new Date();
    startOfCurrentMonth.setDate(1);
    startOfCurrentMonth.setHours(0, 0, 0, 0);

    const endOfCurrentMonth = new Date(startOfCurrentMonth);
    endOfCurrentMonth.setMonth(endOfCurrentMonth.getMonth() + 1);

    const currentMonth = startOfCurrentMonth.getMonth() + 1;
    const currentYear = startOfCurrentMonth.getFullYear();

    const where: any = {};
    if (search) {
      const cleanSearch = String(search).trim();
      where.OR = [
        { fullName: { contains: cleanSearch, mode: "insensitive" } },
        { employeeId: { contains: cleanSearch, mode: "insensitive" } },
        { email: { contains: cleanSearch, mode: "insensitive" } },
        { mobileNumber: { contains: cleanSearch } },
        { assignedDistrict: { contains: cleanSearch, mode: "insensitive" } },
        { assignedState: { contains: cleanSearch, mode: "insensitive" } },
      ];
    }

    if (page && limit) {
      const skip = (page - 1) * limit;
      
      const [salesPersons, totalRecords] = await prisma.$transaction([
        prisma.salesPerson.findMany({
          where,
          orderBy: { createdAt: "desc" },
          include: {
            distributors: {
              select: {
                id: true,
                companyName: true,
                firstName: true,
                lastName: true
              }
            },
            targets: {
              where: {
                month: currentMonth,
                year: currentYear
              }
            }
          },
          skip,
          take: limit
        }),
        prisma.salesPerson.count({ where })
      ]);

      // Collect all distributor IDs
      const allDistributorIds: string[] = [];
      salesPersons.forEach(sp => {
        sp.distributors.forEach(d => {
          allDistributorIds.push(d.id);
        });
      });

      // Fetch all current month orders for these distributors
      const orders = allDistributorIds.length > 0 ? await prisma.order.findMany({
        where: {
          userId: { in: allDistributorIds },
          createdAt: { gte: startOfCurrentMonth, lt: endOfCurrentMonth },
          status: { notIn: ["CANCELLED", "REJECTED"] }
        },
        include: {
          items: true
        }
      }) : [];

      // Map orders by distributor ID for fast lookup
      const ordersByDistributor: Record<string, typeof orders> = {};
      orders.forEach(order => {
        let list = ordersByDistributor[order.userId];
        if (!list) {
          list = [];
          ordersByDistributor[order.userId] = list;
        }
        list.push(order);
      });

      const salesPersonsWithStats = salesPersons.map(sp => {
        const currentTarget = sp.targets[0] || null;
        const targetType = currentTarget?.targetType || "REVENUE";
        const targetValue = currentTarget?.targetValue || 0;

        // Collect all orders for this salesperson's distributors
        const spOrders: typeof orders = [];
        sp.distributors.forEach(d => {
          const distOrders = ordersByDistributor[d.id] || [];
          spOrders.push(...distOrders);
        });

        // Calculate achievements
        let achievement = 0;
        if (targetType === "REVENUE") {
          achievement = spOrders.reduce((sum, order) => sum + order.grandTotal, 0);
        } else if (targetType === "UNITS_SOLD") {
          achievement = spOrders.reduce((sum, order) => {
            const itemsCount = order.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
            return sum + itemsCount;
          }, 0);
        }

        const progressPercent = targetValue > 0 ? Math.min(Math.round((achievement / targetValue) * 100), 100) : 0;

        return {
          id: sp.id,
          employeeId: sp.employeeId,
          fullName: sp.fullName,
          email: sp.email,
          mobileNumber: sp.mobileNumber,
          assignedRegion: sp.assignedRegion,
          assignedState: sp.assignedState,
          assignedDistrict: sp.assignedDistrict,
          status: sp.status,
          remarks: sp.remarks,
          createdAt: sp.createdAt,
          updatedAt: sp.updatedAt,
          distributors: sp.distributors,
          currentTarget: currentTarget ? {
            targetType,
            targetValue,
            month: currentMonth,
            year: currentYear
          } : null,
          achievement,
          progressPercent
        };
      });

      res.json({
        success: true,
        data: salesPersonsWithStats,
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

    const salesPersons = await prisma.salesPerson.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        distributors: {
          select: {
            id: true,
            companyName: true,
            firstName: true,
            lastName: true
          }
        },
        targets: {
          where: {
            month: currentMonth,
            year: currentYear
          }
        }
      }
    });

    // Collect all distributor IDs
    const allDistributorIds: string[] = [];
    salesPersons.forEach(sp => {
      sp.distributors.forEach(d => {
        allDistributorIds.push(d.id);
      });
    });

    // Fetch all current month orders for these distributors
    const orders = allDistributorIds.length > 0 ? await prisma.order.findMany({
      where: {
        userId: { in: allDistributorIds },
        createdAt: { gte: startOfCurrentMonth, lt: endOfCurrentMonth },
        status: { notIn: ["CANCELLED", "REJECTED"] }
      },
      include: {
        items: true
      }
    }) : [];

    // Map orders by distributor ID for fast lookup
    const ordersByDistributor: Record<string, typeof orders> = {};
    orders.forEach(order => {
      let list = ordersByDistributor[order.userId];
      if (!list) {
        list = [];
        ordersByDistributor[order.userId] = list;
      }
      list.push(order);
    });

    const salesPersonsWithStats = salesPersons.map(sp => {
      const currentTarget = sp.targets[0] || null;
      const targetType = currentTarget?.targetType || "REVENUE";
      const targetValue = currentTarget?.targetValue || 0;

      // Collect all orders for this salesperson's distributors
      const spOrders: typeof orders = [];
      sp.distributors.forEach(d => {
        const distOrders = ordersByDistributor[d.id] || [];
        spOrders.push(...distOrders);
      });

      // Calculate achievements
      let achievement = 0;
      if (targetType === "REVENUE") {
        achievement = spOrders.reduce((sum, order) => sum + order.grandTotal, 0);
      } else if (targetType === "UNITS_SOLD") {
        achievement = spOrders.reduce((sum, order) => {
          const itemsCount = order.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
          return sum + itemsCount;
        }, 0);
      }

      const progressPercent = targetValue > 0 ? Math.min(Math.round((achievement / targetValue) * 100), 100) : 0;

      return {
        id: sp.id,
        employeeId: sp.employeeId,
        fullName: sp.fullName,
        email: sp.email,
        mobileNumber: sp.mobileNumber,
        assignedRegion: sp.assignedRegion,
        assignedState: sp.assignedState,
        assignedDistrict: sp.assignedDistrict,
        status: sp.status,
        remarks: sp.remarks,
        createdAt: sp.createdAt,
        updatedAt: sp.updatedAt,
        distributors: sp.distributors,
        currentTarget: currentTarget ? {
          targetType,
          targetValue,
          month: currentMonth,
          year: currentYear
        } : null,
        achievement,
        progressPercent
      };
    });

    res.json({ success: true, salesPersons: salesPersonsWithStats });
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

      // Disassociate distributor enquiries
      await tx.distributorEnquiry.updateMany({
        where: { salesPersonId: id },
        data: { salesPersonId: null, status: "New" }
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

// Get Sales Person performance details for a specific month and year
export const getSalesPersonPerformance = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!verifyAdmin(req, res)) return;

    const id = req.params.id as string;
    const month = parseInt(req.query.month as string) || (new Date().getMonth() + 1);
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const salesPerson = await prisma.salesPerson.findUnique({
      where: { id },
      include: {
        distributors: {
          select: { id: true, companyName: true, firstName: true, lastName: true }
        }
      }
    });

    if (!salesPerson) {
      res.status(404).json({ success: false, message: "Sales Person not found" });
      return;
    }

    // Find target for that month/year
    const target = await prisma.salesTarget.findUnique({
      where: {
        salesPersonId_month_year: {
          salesPersonId: id,
          month,
          year
        }
      }
    });

    // Calculate orders & achievements in that month/year
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 1);

    const distIds = salesPerson.distributors.map(d => d.id);

    const orders = distIds.length > 0 ? await prisma.order.findMany({
      where: {
        userId: { in: distIds },
        createdAt: { gte: startOfMonth, lt: endOfMonth },
        status: { notIn: ["CANCELLED", "REJECTED"] }
      },
      include: {
        items: true
      }
    }) : [];

    const ordersCount = orders.length;
    const revenueAchieved = orders.reduce((sum, o) => sum + o.grandTotal, 0);
    const unitsSold = orders.reduce((sum, o) => sum + o.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

    const targetType = target?.targetType || "REVENUE";
    const targetValue = target?.targetValue || 0;

    let achievement = 0;
    if (targetType === "REVENUE") {
      achievement = revenueAchieved;
    } else if (targetType === "UNITS_SOLD") {
      achievement = unitsSold;
    }

    const progressPercent = targetValue > 0 ? Math.min(Math.round((achievement / targetValue) * 100), 100) : 0;
    const remainingTarget = Math.max(targetValue - achievement, 0);

    res.json({
      success: true,
      performance: {
        totalDistributors: salesPerson.distributors.length,
        ordersCount,
        revenueAchieved,
        unitsSold,
        targetType,
        targetValue,
        achievement,
        progressPercent,
        remainingTarget,
        remarks: salesPerson.remarks || ""
      }
    });
  } catch (error: any) {
    console.error("Get performance stats error:", error);
    res.status(500).json({ success: false, message: "Failed to load performance statistics" });
  }
};

// Save Monthly Sales Target
export const saveSalesPersonTarget = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!verifyAdmin(req, res)) return;

    const id = req.params.id as string;
    const { targetType, targetValue, month, year } = req.body;

    if (!targetType || targetValue === undefined || !month || !year) {
      res.status(400).json({ success: false, message: "Missing target fields" });
      return;
    }

    const salesPerson = await prisma.salesPerson.findUnique({ where: { id } });
    if (!salesPerson) {
      res.status(404).json({ success: false, message: "Sales Person not found" });
      return;
    }

    const target = await prisma.salesTarget.upsert({
      where: {
        salesPersonId_month_year: {
          salesPersonId: id,
          month,
          year
        }
      },
      update: {
        targetType,
        targetValue: parseFloat(targetValue)
      },
      create: {
        salesPersonId: id,
        targetType,
        targetValue: parseFloat(targetValue),
        month,
        year
      }
    });

    res.json({ success: true, message: "Sales Target saved successfully", target });
  } catch (error: any) {
    console.error("Save sales target error:", error);
    res.status(500).json({ success: false, message: "Failed to save sales target" });
  }
};

// Update Admin Remarks
export const updateSalesPersonRemarks = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!verifyAdmin(req, res)) return;

    const id = req.params.id as string;
    const { remarks } = req.body;

    const salesPerson = await prisma.salesPerson.findUnique({ where: { id } });
    if (!salesPerson) {
      res.status(404).json({ success: false, message: "Sales Person not found" });
      return;
    }

    const updated = await prisma.salesPerson.update({
      where: { id },
      data: { remarks: remarks !== undefined ? remarks : null }
    });

    res.json({ success: true, message: "Admin remarks updated successfully", remarks: updated.remarks || "" });
  } catch (error: any) {
    console.error("Update remarks error:", error);
    res.status(500).json({ success: false, message: "Failed to update remarks" });
  }
};

// Assign Distributors
export const assignSalesPersonDistributors = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!verifyAdmin(req, res)) return;

    const id = req.params.id as string;
    const { distributorIds } = req.body;

    if (!Array.isArray(distributorIds)) {
      res.status(400).json({ success: false, message: "distributorIds must be an array" });
      return;
    }

    const salesPerson = await prisma.salesPerson.findUnique({ where: { id } });
    if (!salesPerson) {
      res.status(404).json({ success: false, message: "Sales Person not found" });
      return;
    }

    await prisma.$transaction(async (tx) => {
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
    });

    res.json({ success: true, message: "Distributors assigned successfully" });
  } catch (error: any) {
    console.error("Assign distributors error:", error);
    res.status(500).json({ success: false, message: "Failed to assign distributors" });
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
    const month = parseInt(req.query.month as string) || (new Date().getMonth() + 1);
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 1);

    // Fetch the salesperson's current month target
    const target = await prisma.salesTarget.findUnique({
      where: {
        salesPersonId_month_year: {
          salesPersonId,
          month,
          year
        }
      }
    });

    const salesPerson = await prisma.salesPerson.findUnique({
      where: { id: salesPersonId },
      select: { remarks: true }
    });

    // Compute orders and items this month
    const ordersWithItems = distIds.length > 0 ? await prisma.order.findMany({
      where: {
        userId: { in: distIds },
        createdAt: { gte: startOfMonth, lt: endOfMonth },
        status: { notIn: ["CANCELLED", "REJECTED"] }
      },
      include: {
        items: true
      }
    }) : [];

    const salesValue = ordersWithItems.reduce((sum, order) => sum + order.grandTotal, 0);
    const ordersCount = ordersWithItems.length;
    const unitsSold = ordersWithItems.reduce((sum, order) => {
      const itemsCount = order.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
      return sum + itemsCount;
    }, 0);

    const targetType = target?.targetType || "REVENUE";
    const targetValue = target?.targetValue || 0;

    let achievement = 0;
    if (targetType === "REVENUE") {
      achievement = salesValue;
    } else if (targetType === "UNITS_SOLD") {
      achievement = unitsSold;
    }

    const progressPercent = targetValue > 0 ? Math.min(Math.round((achievement / targetValue) * 100), 100) : 0;
    const remainingTarget = Math.max(targetValue - achievement, 0);

    // Dynamic Distributor Enquiry Counts
    const assignedEnquiriesCount = await prisma.distributorEnquiry.count({
      where: { salesPersonId }
    });

    const activeEnquiriesCount = await prisma.distributorEnquiry.count({
      where: { salesPersonId, status: { in: ["Assigned", "Contacted", "Negotiation"] } }
    });

    const quotationSentCount = await prisma.distributorEnquiry.count({
      where: { salesPersonId, status: "Quotation Sent" }
    });

    const convertedOrdersCount = await prisma.distributorEnquiry.count({
      where: { salesPersonId, status: "Converted to Order" }
    });

    const closedEnquiriesCount = await prisma.distributorEnquiry.count({
      where: { salesPersonId, status: "Closed" }
    });

    // Recent orders
    const recentOrders = distIds.length > 0 ? await prisma.order.findMany({
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
    }) : [];

    // Recent Distributor Enquiries
    const recentEnquiries = await prisma.distributorEnquiry.findMany({
      where: { salesPersonId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        distributor: {
          select: {
            companyName: true,
            firstName: true,
            lastName: true
          }
        },
        product: {
          select: {
            name: true
          }
        }
      }
    });

    res.json({
      success: true,
      stats: {
        assignedDistributorsCount: distributors.length,
        ordersThisMonthCount: ordersCount,
        salesValueThisMonth: salesValue,
        unitsSoldThisMonth: unitsSold,
        assignedEnquiriesCount,
        activeEnquiriesCount,
        quotationSentCount,
        convertedOrdersCount,
        closedEnquiriesCount,
        currentTarget: target ? {
          targetType,
          targetValue,
          month,
          year
        } : null,
        achievement,
        progressPercent,
        remainingTarget,
        remarks: salesPerson?.remarks || ""
      },
      recentOrders,
      recentEnquiries
    });
  } catch (error: any) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({ success: false, message: "Failed to compute stats" });
  }
};
