import { Router } from "express";
import { listCategories, createCategory } from "../controllers/category.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.get("/", listCategories);
router.post("/", authenticateToken, createCategory);

export default router;
