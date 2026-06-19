import { Response } from "express";
import { prisma } from "../utils/db";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

export const getWishlist = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    let wishlist = await prisma.wishlist.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: { userId },
        include: { items: { include: { product: true } } }
      });
    }

    res.json({ success: true, data: wishlist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error fetching wishlist" });
  }
};

export const addToWishlist = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { productId } = req.body;
    if (!productId) {
      res.status(400).json({ success: false, message: "Product ID is required" });
      return;
    }

    let wishlist = await prisma.wishlist.findUnique({ where: { userId } });
    if (!wishlist) {
      wishlist = await prisma.wishlist.create({ data: { userId } });
    }

    const existingItem = await prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId
        }
      }
    });

    if (!existingItem) {
      await prisma.wishlistItem.create({
        data: {
          wishlistId: wishlist.id,
          productId
        }
      });
    }

    const updatedWishlist = await prisma.wishlist.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    res.json({ success: true, data: updatedWishlist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error adding to wishlist" });
  }
};

export const removeFromWishlist = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const productId = req.params.productId as string;
    
    const wishlist = await prisma.wishlist.findUnique({ where: { userId } });
    if (!wishlist) {
      res.status(404).json({ success: false, message: "Wishlist not found" });
      return;
    }

    const existingItem = await prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId
        }
      }
    });

    if (existingItem) {
      await prisma.wishlistItem.delete({
        where: { id: existingItem.id }
      });
    }

    const updatedWishlist = await prisma.wishlist.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    res.json({ success: true, data: updatedWishlist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error removing wishlist item" });
  }
};
