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
  getBestsellerProducts,
} from "../controllers/product.controller";
import { authenticateToken, optionalAuthenticateToken } from "../middleware/auth.middleware";

const router = Router();

// Protected analytics route
router.get("/transactions", authenticateToken, getInventoryTransactions);

// Public routes (with optional auth token for distributor pricing calculations)
router.get("/", optionalAuthenticateToken, getProducts);
router.get("/deleted-models", getDeletedModels);
router.get("/bestsellers", optionalAuthenticateToken, getBestsellerProducts);
router.get("/:id", optionalAuthenticateToken, getProductById);

// Protected routes (controllers check for admin role)
router.post("/", authenticateToken, createProduct);
router.delete("/models", authenticateToken, deleteModel);
router.put("/:id", authenticateToken, updateProduct);
router.delete("/:id", authenticateToken, deleteProduct);

export default router;

