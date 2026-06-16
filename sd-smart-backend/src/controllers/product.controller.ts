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

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, products });
  } catch (error: any) {
    console.error("Get products error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
};

// Get single product
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    res.json({ success: true, product });
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
      capacity,
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
    } = req.body;

    if (!name || !category || !categoryLabel || !image || price === undefined || originalPrice === undefined) {
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
        capacity: capacity || null,
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
      },
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
    const updateData = req.body;

    // Remove immutable fields or convert types safely
    const parsedData: any = {};
    const allowedFields = [
      "name", "category", "categoryLabel", "image", "rating", "reviewCount",
      "price", "originalPrice", "discountPercent", "warranty", "capacity",
      "badge", "href", "inStock", "isBestSeller", "isFeatured", "eyebrow",
      "description", "specs", "startingPrice", "primaryCTALabel", "primaryCTAHref",
      "secondaryCTALabel", "secondaryCTAHref", "imagePosition"
    ];

    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        if (["rating", "price", "originalPrice", "startingPrice"].includes(key) && updateData[key] !== null) {
          parsedData[key] = Number(updateData[key]);
        } else if (["reviewCount", "discountPercent"].includes(key) && updateData[key] !== null) {
          parsedData[key] = Math.round(Number(updateData[key]));
        } else if (["inStock", "isBestSeller", "isFeatured"].includes(key)) {
          parsedData[key] = Boolean(updateData[key]);
        } else {
          parsedData[key] = updateData[key];
        }
      }
    }

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: parsedData,
    });

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
