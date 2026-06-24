"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCart = exports.removeFromCart = exports.updateCartItem = exports.addToCart = exports.getCart = void 0;
const db_1 = require("../utils/db");
const getCart = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        let cart = await db_1.prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: true
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
        if (!cart) {
            cart = await db_1.prisma.cart.create({
                data: { userId },
                include: { items: { include: { product: true } } }
            });
        }
        res.json({ success: true, data: cart });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error fetching cart" });
    }
};
exports.getCart = getCart;
const addToCart = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const { productId, quantity = 1 } = req.body;
        if (!productId) {
            res.status(400).json({ success: false, message: "Product ID is required" });
            return;
        }
        let cart = await db_1.prisma.cart.findUnique({ where: { userId } });
        if (!cart) {
            cart = await db_1.prisma.cart.create({ data: { userId } });
        }
        const existingItem = await db_1.prisma.cartItem.findUnique({
            where: {
                cartId_productId: {
                    cartId: cart.id,
                    productId
                }
            }
        });
        if (existingItem) {
            await db_1.prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: existingItem.quantity + quantity }
            });
        }
        else {
            await db_1.prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId,
                    quantity
                }
            });
        }
        const updatedCart = await db_1.prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: true
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
        res.json({ success: true, data: updatedCart });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error adding to cart" });
    }
};
exports.addToCart = addToCart;
const updateCartItem = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const id = req.params.id;
        const { quantity } = req.body;
        const item = await db_1.prisma.cartItem.findUnique({
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
        await db_1.prisma.cartItem.update({
            where: { id },
            data: { quantity }
        });
        const updatedCart = await db_1.prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: true
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
        res.json({ success: true, data: updatedCart });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error updating cart item" });
    }
};
exports.updateCartItem = updateCartItem;
const removeFromCart = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const id = req.params.id;
        const item = await db_1.prisma.cartItem.findUnique({
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
        await db_1.prisma.cartItem.delete({
            where: { id }
        });
        const updatedCart = await db_1.prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: true
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
        res.json({ success: true, data: updatedCart });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error removing cart item" });
    }
};
exports.removeFromCart = removeFromCart;
const clearCart = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const cart = await db_1.prisma.cart.findUnique({ where: { userId } });
        if (cart) {
            await db_1.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
        }
        res.json({ success: true, message: "Cart cleared successfully" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error clearing cart" });
    }
};
exports.clearCart = clearCart;
