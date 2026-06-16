import { Router } from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

// Public routes
router.get("/", getProducts);
router.get("/:id", getProductById);

// Protected routes (controllers check for admin role)
router.post("/", authenticateToken, createProduct);
router.put("/:id", authenticateToken, updateProduct);
router.delete("/:id", authenticateToken, deleteProduct);

export default router;
