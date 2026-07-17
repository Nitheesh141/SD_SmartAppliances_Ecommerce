import { Router } from "express";
import { listCategories, createCategory, deleteCategory } from "../controllers/category.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.get("/", listCategories);
router.post("/", authenticateToken, createCategory);
router.delete("/:id", authenticateToken, deleteCategory);

export default router;
