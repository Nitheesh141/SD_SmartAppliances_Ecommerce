import { Request, Response } from "express";
import { prisma } from "../utils/db";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

// Helper to generate URL-safe slugs
const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// GET /api/categories
export const listCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

    if (page && limit) {
      const skip = (page - 1) * limit;
      const [categories, totalRecords] = await prisma.$transaction([
        prisma.category.findMany({
          orderBy: { name: "asc" },
          skip,
          take: limit
        }),
        prisma.category.count()
      ]);

      res.json({
        success: true,
        data: categories,
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

    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" }
    });
    res.json({ success: true, categories });
  } catch (error: any) {
    console.error("List categories error:", error);
    res.status(500).json({ success: false, message: "Server error while listing categories" });
  }
};

// POST /api/categories
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const roleUpper = user?.role?.toUpperCase();
    if (!user || (roleUpper !== "ADMIN" && roleUpper !== "SUPERADMIN")) {
      res.status(403).json({ success: false, message: "Access denied. Admin role required." });
      return;
    }

    const { name, slug } = req.body;

    if (!name || name.trim() === "") {
      res.status(400).json({ success: false, message: "Category name is required" });
      return;
    }

    const resolvedSlug = slug && slug.trim() !== "" ? generateSlug(slug) : generateSlug(name);

    if (resolvedSlug === "") {
      res.status(400).json({ success: false, message: "Invalid category slug" });
      return;
    }

    // Check duplicate name
    const duplicateName = await prisma.category.findUnique({
      where: { name: name.trim() }
    });
    if (duplicateName) {
      res.status(400).json({ success: false, message: "Category name already exists" });
      return;
    }

    // Check duplicate slug
    const duplicateSlug = await prisma.category.findUnique({
      where: { slug: resolvedSlug }
    });
    if (duplicateSlug) {
      res.status(400).json({ success: false, message: "Category slug already exists" });
      return;
    }

    // Create category
    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug: resolvedSlug
      }
    });

    res.status(201).json({ success: true, message: "Category created successfully", category });
  } catch (error: any) {
    console.error("Create category error:", error);
    res.status(500).json({ success: false, message: "Server error while creating category" });
  }
};

// DELETE /api/categories/:id
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const roleUpper = user?.role?.toUpperCase();
    if (!user || (roleUpper !== "ADMIN" && roleUpper !== "SUPERADMIN")) {
      res.status(403).json({ success: false, message: "Access denied. Admin role required." });
      return;
    }

    const id = req.params.id as string;

    const category = await prisma.category.findUnique({
      where: { id }
    });

    if (!category) {
      res.status(404).json({ success: false, message: "Category not found" });
      return;
    }

    // Run cascade delete within a Prisma transaction
    await prisma.$transaction(async (tx) => {
      // 1. Delete all products belonging to this category slug
      await tx.product.deleteMany({
        where: { category: category.slug }
      });

      // 2. Delete the category
      await tx.category.delete({
        where: { id }
      });
    });

    res.json({ success: true, message: "Category and all its products deleted successfully" });
  } catch (error: any) {
    console.error("Delete category error:", error);
    res.status(500).json({ success: false, message: "Server error while deleting category" });
  }
};

