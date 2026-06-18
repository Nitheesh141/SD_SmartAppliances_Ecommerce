import { Router } from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getInventoryTransactions,
  deleteModel,
  getDeletedModels,
} from "../controllers/product.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

// Protected analytics route
router.get("/transactions", authenticateToken, getInventoryTransactions);

// Public routes
router.get("/", getProducts);
router.get("/deleted-models", getDeletedModels);
router.get("/:id", getProductById);

// Protected routes (controllers check for admin role)
router.post("/", authenticateToken, createProduct);
router.delete("/models", authenticateToken, deleteModel);
router.put("/:id", authenticateToken, updateProduct);
router.delete("/:id", authenticateToken, deleteProduct);

export default router;

