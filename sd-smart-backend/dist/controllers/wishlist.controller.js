"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFromWishlist = exports.addToWishlist = exports.getWishlist = void 0;
const db_1 = require("../utils/db");
const getWishlist = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        let wishlist = await db_1.prisma.wishlist.findUnique({
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
            wishlist = await db_1.prisma.wishlist.create({
                data: { userId },
                include: { items: { include: { product: true } } }
            });
        }
        res.json({ success: true, data: wishlist });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error fetching wishlist" });
    }
};
exports.getWishlist = getWishlist;
const addToWishlist = async (req, res) => {
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
        let wishlist = await db_1.prisma.wishlist.findUnique({ where: { userId } });
        if (!wishlist) {
            wishlist = await db_1.prisma.wishlist.create({ data: { userId } });
        }
        const existingItem = await db_1.prisma.wishlistItem.findUnique({
            where: {
                wishlistId_productId: {
                    wishlistId: wishlist.id,
                    productId
                }
            }
        });
        if (!existingItem) {
            await db_1.prisma.wishlistItem.create({
                data: {
                    wishlistId: wishlist.id,
                    productId
                }
            });
        }
        const updatedWishlist = await db_1.prisma.wishlist.findUnique({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error adding to wishlist" });
    }
};
exports.addToWishlist = addToWishlist;
const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const productId = req.params.productId;
        const wishlist = await db_1.prisma.wishlist.findUnique({ where: { userId } });
        if (!wishlist) {
            res.status(404).json({ success: false, message: "Wishlist not found" });
            return;
        }
        const existingItem = await db_1.prisma.wishlistItem.findUnique({
            where: {
                wishlistId_productId: {
                    wishlistId: wishlist.id,
                    productId
                }
            }
        });
        if (existingItem) {
            await db_1.prisma.wishlistItem.delete({
                where: { id: existingItem.id }
            });
        }
        const updatedWishlist = await db_1.prisma.wishlist.findUnique({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error removing wishlist item" });
    }
};
exports.removeFromWishlist = removeFromWishlist;
