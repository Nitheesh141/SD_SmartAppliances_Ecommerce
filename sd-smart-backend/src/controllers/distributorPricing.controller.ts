import { Request, Response } from "express";
import { prisma } from "../utils/db";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

// Helper to check if user is admin or superadmin
const verifyAdmin = (req: Request, res: Response): boolean => {
  const user = (req as AuthenticatedRequest).user;
  const roleUpper = user?.role?.toUpperCase();
  if (!user || (roleUpper !== "ADMIN" && roleUpper !== "SUPERADMIN")) {
    res.status(403).json({ success: false, message: "Access denied. Admin role required." });
    return false;
  }
  return true;
};

// 1. Get Distributor Pricings (with filters & pagination)
export const getDistributorPricings = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!verifyAdmin(req, res)) return;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;
    const search = (req.query.search as string) || "";

    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { skuCode: { contains: search, mode: "insensitive" } },
        {
          product: {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { category: { contains: search, mode: "insensitive" } },
              { categoryLabel: { contains: search, mode: "insensitive" } },
              { modelNumber: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const [pricings, total] = await prisma.$transaction([
      prisma.distributorPricing.findMany({
        where: whereClause,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              category: true,
              categoryLabel: true,
              image: true,
              modelNumber: true,
              sku: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.distributorPricing.count({ where: whereClause }),
    ]);

    res.json({
      success: true,
      pricings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: pricings,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        pageSize: limit,
        hasNext: page * limit < total,
        hasPrevious: page > 1
      }
    });
  } catch (error: any) {
    console.error("Get distributor pricings error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch distributor pricing" });
  }
};

// 2. Create Distributor Pricing
export const createDistributorPricing = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!verifyAdmin(req, res)) return;

    const {
      productId,
      basePrice,
      marginPercentage,
      marginAmount,
      netPrice,
      gstPercentage,
      gstAmount,
      dealerPrice,
      mrp,
      packageQuantity,
      scheme,
      status,
    } = req.body;

    if (!productId || basePrice === undefined || marginPercentage === undefined || gstPercentage === undefined || mrp === undefined || !packageQuantity || !scheme) {
      res.status(400).json({ success: false, message: "Missing required fields" });
      return;
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    // Check if distributor pricing already exists for this product
    const existing = await prisma.distributorPricing.findUnique({
      where: { productId },
    });

    if (existing) {
      res.status(400).json({ success: false, message: "Distributor pricing already exists for this product. Edit the existing record instead." });
      return;
    }

    const pricing = await prisma.distributorPricing.create({
      data: {
        productId,
        skuCode: product.sku || product.productId || "",
        basePrice: parseFloat(basePrice),
        marginPercentage: parseFloat(marginPercentage),
        marginAmount: parseFloat(marginAmount),
        netPrice: parseFloat(netPrice),
        gstPercentage: parseFloat(gstPercentage),
        gstAmount: parseFloat(gstAmount),
        dealerPrice: parseFloat(dealerPrice),
        mrp: parseFloat(mrp),
        packageQuantity: String(packageQuantity),
        scheme: String(scheme),
        status: status || "ACTIVE",
      },
      include: {
        product: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Distributor pricing created successfully",
      pricing,
    });
  } catch (error: any) {
    console.error("Create distributor pricing error:", error);
    res.status(500).json({ success: false, message: "Failed to create distributor pricing" });
  }
};

// 3. Update Distributor Pricing
export const updateDistributorPricing = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!verifyAdmin(req, res)) return;

    const id = req.params.id as string;

    const {
      basePrice,
      marginPercentage,
      marginAmount,
      netPrice,
      gstPercentage,
      gstAmount,
      dealerPrice,
      mrp,
      packageQuantity,
      scheme,
      status,
    } = req.body;

    // Check if entry exists
    const existing = await prisma.distributorPricing.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: "Distributor pricing record not found" });
      return;
    }

    const updated = await prisma.distributorPricing.update({
      where: { id },
      data: {
        basePrice: basePrice !== undefined ? parseFloat(basePrice) : undefined,
        marginPercentage: marginPercentage !== undefined ? parseFloat(marginPercentage) : undefined,
        marginAmount: marginAmount !== undefined ? parseFloat(marginAmount) : undefined,
        netPrice: netPrice !== undefined ? parseFloat(netPrice) : undefined,
        gstPercentage: gstPercentage !== undefined ? parseFloat(gstPercentage) : undefined,
        gstAmount: gstAmount !== undefined ? parseFloat(gstAmount) : undefined,
        dealerPrice: dealerPrice !== undefined ? parseFloat(dealerPrice) : undefined,
        mrp: mrp !== undefined ? parseFloat(mrp) : undefined,
        packageQuantity: packageQuantity !== undefined ? String(packageQuantity) : undefined,
        scheme: scheme !== undefined ? String(scheme) : undefined,
        status: status || undefined,
      },
      include: {
        product: true,
      },
    });

    res.json({
      success: true,
      message: "Distributor pricing updated successfully",
      pricing: updated,
    });
  } catch (error: any) {
    console.error("Update distributor pricing error:", error);
    res.status(500).json({ success: false, message: "Failed to update distributor pricing" });
  }
};

// 4. Delete Distributor Pricing
export const deleteDistributorPricing = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!verifyAdmin(req, res)) return;

    const id = req.params.id as string;

    const existing = await prisma.distributorPricing.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: "Distributor pricing record not found" });
      return;
    }

    await prisma.distributorPricing.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Distributor pricing record deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete distributor pricing error:", error);
    res.status(500).json({ success: false, message: "Failed to delete distributor pricing" });
  }
};
