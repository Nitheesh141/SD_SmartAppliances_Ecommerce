import { Router } from "express";
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from "../controllers/cart.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

// All cart routes require authentication
router.use(authenticateToken);

router.get("/", getCart);
router.delete("/", clearCart);
router.post("/items", addToCart);
router.patch("/items/:id", updateCartItem);
router.delete("/items/:id", removeFromCart);

export default router;
