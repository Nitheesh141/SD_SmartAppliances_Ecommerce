import { Response } from "express";
import { prisma } from "../utils/db";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { applyDynamicPricesToProducts } from "../utils/pricing";

const mapCartPrices = async (cart: any, user?: any) => {
  if (cart && cart.items) {
    for (const item of cart.items) {
      if (item.product) {
        item.product = await applyDynamicPricesToProducts(item.product, user);
      }
    }
  }
  return cart;
};

export const getCart = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const role = req.user?.role?.toUpperCase();
    if (role !== "CUSTOMER" && role !== "DISTRIBUTOR") {
      res.json({
        success: true,
        data: {
          id: `temp-cart-${userId}`,
          userId,
          items: []
        }
      });
      return;
    }

    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                distributorPricing: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: { items: { include: { product: { include: { distributorPricing: true } } } } }
      });
    }

    const finalCart = await mapCartPrices(cart, req.user);
    res.json({ success: true, data: finalCart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error fetching cart" });
  }
};

export const addToCart = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const role = req.user?.role?.toUpperCase();
    if (role !== "CUSTOMER" && role !== "DISTRIBUTOR") {
      res.status(403).json({ success: false, message: "Only customers and distributors can manage carts" });
      return;
    }

    const { productId, quantity = 1 } = req.body;
    if (!productId) {
      res.status(400).json({ success: false, message: "Product ID is required" });
      return;
    }

    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId
        }
      }
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity }
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity
        }
      });
    }

    const updatedCart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                distributorPricing: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    const finalCart = await mapCartPrices(updatedCart, req.user);
    res.json({ success: true, data: finalCart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error adding to cart" });
  }
};

export const updateCartItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const role = req.user?.role?.toUpperCase();
    if (role !== "CUSTOMER" && role !== "DISTRIBUTOR") {
      res.status(403).json({ success: false, message: "Only customers and distributors can manage carts" });
      return;
    }

    const id = req.params.id as string;
    const { quantity } = req.body;

    const item = await prisma.cartItem.findUnique({
      where: { id },
      include: { cart: true }
    });
    if (!item) {
      res.status(404).json({ success: false, message: "Cart item not found" });
      return;
    }

    if (item.cart.userId !== userId) {
      res.status(403).json({ success: false, message: "Forbidden" });
      return;
    }

    await prisma.cartItem.update({
      where: { id },
      data: { quantity }
    });

    const updatedCart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                distributorPricing: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    const finalCart = await mapCartPrices(updatedCart, req.user);
    res.json({ success: true, data: finalCart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error updating cart item" });
  }
};

export const removeFromCart = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const role = req.user?.role?.toUpperCase();
    if (role !== "CUSTOMER" && role !== "DISTRIBUTOR") {
      res.status(403).json({ success: false, message: "Only customers and distributors can manage carts" });
      return;
    }

    const id = req.params.id as string;

    const item = await prisma.cartItem.findUnique({
      where: { id },
      include: { cart: true }
    });
    if (!item) {
      res.status(404).json({ success: false, message: "Cart item not found" });
      return;
    }

    if (item.cart.userId !== userId) {
      res.status(403).json({ success: false, message: "Forbidden" });
      return;
    }

    await prisma.cartItem.delete({
      where: { id }
    });

    const updatedCart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                distributorPricing: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    const finalCart = await mapCartPrices(updatedCart, req.user);
    res.json({ success: true, data: finalCart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error removing cart item" });
  }
};

export const clearCart = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const role = req.user?.role?.toUpperCase();
    if (role !== "CUSTOMER" && role !== "DISTRIBUTOR") {
      res.status(403).json({ success: false, message: "Only customers and distributors can manage carts" });
      return;
    }

    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }

    res.json({ success: true, message: "Cart cleared successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error clearing cart" });
  }
};

