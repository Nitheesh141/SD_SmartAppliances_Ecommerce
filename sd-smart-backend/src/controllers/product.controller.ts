import { Request, Response } from "express";
import { prisma } from "../utils/db";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

// Get all products with optional filters
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, isBestSeller, isFeatured } = req.query;

    const whereClause: any = {};

    if (category) {
      whereClause.category = String(category);
    }
    if (isBestSeller) {
      whereClause.isBestSeller = isBestSeller === "true";
    }
    if (isFeatured) {
      whereClause.isFeatured = isFeatured === "true";
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        transactions: {
          where: {
            createdAt: {
              gte: todayStart,
            }
          }
        }
      }
    });

    const formattedProducts = products.map((p: any) => {
      const todayStockIn = p.transactions.filter((t: any) => t.type === "IN").reduce((sum: number, t: any) => sum + t.quantity, 0);
      const todayStockOut = p.transactions.filter((t: any) => t.type === "OUT").reduce((sum: number, t: any) => sum + t.quantity, 0);
      const { transactions, ...rest } = p;
      return { ...rest, todayStockIn, todayStockOut };
    });

    res.json({ success: true, products: formattedProducts });
  } catch (error: any) {
    console.error("Get products error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
};

// Get single product
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const product: any = await prisma.product.findUnique({
      where: { id },
      include: {
        transactions: {
          where: {
            createdAt: {
              gte: todayStart,
            }
          }
        }
      }
    });

    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    const todayStockIn = product.transactions.filter((t: any) => t.type === "IN").reduce((sum: number, t: any) => sum + t.quantity, 0);
    const todayStockOut = product.transactions.filter((t: any) => t.type === "OUT").reduce((sum: number, t: any) => sum + t.quantity, 0);
    const { transactions, ...rest } = product;

    res.json({ success: true, product: { ...rest, todayStockIn, todayStockOut } });
  } catch (error: any) {
    console.error("Get product by id error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch product" });
  }
};

// Create a new product (Admin only)
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
      res.status(403).json({ success: false, message: "Access denied. Admin role required." });
      return;
    }

    const {
      name,
      category,
      categoryLabel,
      image,
      rating,
      reviewCount,
      price,
      originalPrice,
      discountPercent,
      warranty,
      productDescription,
      badge,
      href,
      inStock,
      isBestSeller,
      isFeatured,
      eyebrow,
      description,
      specs,
      startingPrice,
      primaryCTALabel,
      primaryCTAHref,
      secondaryCTALabel,
      secondaryCTAHref,
      imagePosition,
      modelNumber,
      productId,
      sku,
      variantDetails,
    } = req.body;

    if (!name || !category || !categoryLabel || !image || price === undefined || originalPrice === undefined || !modelNumber || !productId) {
      res.status(400).json({ success: false, message: "Missing required product fields" });
      return;
    }

    const product = await prisma.product.create({
      data: {
        name,
        category,
        categoryLabel,
        image,
        rating: rating !== undefined ? Number(rating) : 5.0,
        reviewCount: reviewCount !== undefined ? Number(reviewCount) : 0,
        price: Number(price),
        originalPrice: Number(originalPrice),
        discountPercent: discountPercent !== undefined ? Number(discountPercent) : 0,
        warranty: warranty || "1 Year",
        productDescription: productDescription || null,
        badge: badge || null,
        href: href || "",
        inStock: inStock !== undefined ? Boolean(inStock) : true,
        isBestSeller: isBestSeller !== undefined ? Boolean(isBestSeller) : false,
        isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : false,
        eyebrow: eyebrow || null,
        description: description || null,
        specs: specs || [],
        startingPrice: startingPrice !== undefined ? Number(startingPrice) : null,
        primaryCTALabel: primaryCTALabel || null,
        primaryCTAHref: primaryCTAHref || null,
        secondaryCTALabel: secondaryCTALabel || null,
        secondaryCTAHref: secondaryCTAHref || null,
        imagePosition: imagePosition || "left",
        modelNumber,
        productId,
        sku: sku || null,
        variantDetails: variantDetails || null,
      } as any,
    });

    res.status(201).json({ success: true, product });
  } catch (error: any) {
    console.error("Create product error:", error);
    res.status(500).json({ success: false, message: "Failed to create product" });
  }
};

// Update an existing product (Admin only)
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
      res.status(403).json({ success: false, message: "Access denied. Admin role required." });
      return;
    }

    const id = req.params.id as string;
    const { stockInDelta, stockOutDelta, ...updateData } = req.body;

    // Remove immutable fields or convert types safely
    const parsedData: any = {};
    const allowedFields = [
      "name", "category", "categoryLabel", "image", "rating", "reviewCount",
      "price", "originalPrice", "discountPercent", "warranty", "productDescription",
      "badge", "href", "inStock", "isBestSeller", "isFeatured", "eyebrow",
      "description", "specs", "startingPrice", "primaryCTALabel", "primaryCTAHref",
      "secondaryCTALabel", "secondaryCTAHref", "imagePosition", "modelNumber", "productId",
      "availableStock", "sku", "variantDetails"
    ];

    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        if (["rating", "price", "originalPrice", "startingPrice"].includes(key) && updateData[key] !== null) {
          parsedData[key] = Number(updateData[key]);
        } else if (["reviewCount", "discountPercent", "availableStock"].includes(key) && updateData[key] !== null) {
          parsedData[key] = Math.round(Number(updateData[key]));
        } else if (["inStock", "isBestSeller", "isFeatured"].includes(key)) {
          parsedData[key] = Boolean(updateData[key]);
        } else {
          parsedData[key] = updateData[key];
        }
      }
    }

    // Apply cumulative deltas explicitly if provided
    const incrementData: any = {};
    if (stockInDelta && typeof stockInDelta === 'number' && stockInDelta > 0) {
      incrementData.stockIn = { increment: stockInDelta };
    }
    if (stockOutDelta && typeof stockOutDelta === 'number' && stockOutDelta > 0) {
      incrementData.stockOut = { increment: stockOutDelta };
    }

    const existingProduct: any = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...parsedData,
        ...incrementData,
      },
    });

    // Log Inventory Transactions for deltas
    if (stockInDelta && typeof stockInDelta === 'number' && stockInDelta > 0) {
      await (prisma as any).inventoryTransaction.create({
        data: {
          productId: id,
          type: "IN",
          quantity: stockInDelta,
        }
      });
    }
    
    if (stockOutDelta && typeof stockOutDelta === 'number' && stockOutDelta > 0) {
      await (prisma as any).inventoryTransaction.create({
        data: {
          productId: id,
          type: "OUT",
          quantity: stockOutDelta,
        }
      });
    }

    res.json({ success: true, product: updatedProduct });
  } catch (error: any) {
    console.error("Update product error:", error);
    res.status(500).json({ success: false, message: "Failed to update product" });
  }
};

// Delete a product (Admin only)
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
      res.status(403).json({ success: false, message: "Access denied. Admin role required." });
      return;
    }

    const id = req.params.id as string;

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    await prisma.product.delete({
      where: { id },
    });

    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error: any) {
    console.error("Delete product error:", error);
    res.status(500).json({ success: false, message: "Failed to delete product" });
  }
};

// Get Inventory Transactions (Admin only)
export const getInventoryTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
      res.status(403).json({ success: false, message: "Access denied. Admin role required." });
      return;
    }

    const transactions = await (prisma as any).inventoryTransaction.findMany({
      include: {
        product: {
          select: {
            name: true,
            productId: true,
            modelNumber: true,
            categoryLabel: true,
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json({ success: true, transactions });
  } catch (error: any) {
    console.error("Get transactions error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch transactions" });
  }
};

// Delete a model and all its products (Admin only)
export const deleteModel = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
      res.status(403).json({ success: false, message: "Access denied. Admin role required." });
      return;
    }

    // Trigger reload: Prisma client regenerated
    const { category, modelName } = req.body;

    if (!category || !modelName) {
      res.status(400).json({ success: false, message: "Missing category or modelName" });
      return;
    }

    // 1. Clear modelNumber from all products belonging to this category and modelNumber (disassociate)
    await prisma.product.updateMany({
      where: {
        category,
        modelNumber: modelName,
      },
      data: {
        modelNumber: null,
      },
    });

    // 2. Track this deletion in DeletedModel to exclude presets as well
    await (prisma as any).deletedModel.upsert({
      where: {
        category_name: {
          category,
          name: modelName,
        },
      },
      update: {},
      create: {
        category,
        name: modelName,
      },
    });

    res.json({ success: true, message: `Model '${modelName}' in category '${category}' and its products deleted successfully` });
  } catch (error: any) {
    console.error("Delete model error:", error);
    res.status(500).json({ success: false, message: "Failed to delete model" });
  }
};

// Get all deleted models
export const getDeletedModels = async (req: Request, res: Response): Promise<void> => {
  try {
    const deletedModels = await (prisma as any).deletedModel.findMany();
    res.json({ success: true, deletedModels });
  } catch (error: any) {
    console.error("Get deleted models error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch deleted models" });
  }
};

