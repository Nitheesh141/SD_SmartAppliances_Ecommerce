import { Router } from "express";
import { getWishlist, addToWishlist, removeFromWishlist } from "../controllers/wishlist.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

// All wishlist routes require authentication
router.use(authenticateToken);

router.get("/", getWishlist);
router.post("/items", addToWishlist);
router.delete("/items/:productId", removeFromWishlist);

export default router;
