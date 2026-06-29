"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelOrder = exports.getOrderInvoice = exports.updateOrderStatus = exports.getAllOrders = exports.getOrderById = exports.getOrders = exports.createOrder = void 0;
const db_1 = require("../utils/db");
const offer_controller_1 = require("./offer.controller");
// Create a new order (Checkout)
const createOrder = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        // Guard: Block unapproved distributors from ordering
        const orderingUser = await db_1.prisma.user.findUnique({
            where: { id: user.id }
        });
        if (orderingUser && orderingUser.role === "DISTRIBUTOR") {
            if (orderingUser.approvalStatus === "PENDING") {
                res.status(403).json({
                    success: false,
                    message: "Your distributor account is currently under review. Please wait for admin approval before placing orders."
                });
                return;
            }
            if (orderingUser.approvalStatus === "REJECTED") {
                res.status(403).json({
                    success: false,
                    message: "Your distributor application has been rejected. Please contact support."
                });
                return;
            }
        }
        const { addressId, paymentMethod, poNumber, couponCode } = req.body;
        if (!addressId || !paymentMethod) {
            res.status(400).json({ success: false, message: "Address and Payment Method are required" });
            return;
        }
        // 1. Fetch Cart
        const cart = await db_1.prisma.cart.findUnique({
            where: { userId: user.id },
            include: {
                items: {
                    include: { product: true }
                }
            }
        });
        if (!cart || cart.items.length === 0) {
            res.status(400).json({ success: false, message: "Cart is empty" });
            return;
        }
        // 2. Validate Address
        const address = await db_1.prisma.address.findFirst({
            where: { id: addressId, userId: user.id }
        });
        if (!address) {
            res.status(404).json({ success: false, message: "Address not found" });
            return;
        }
        // 3. Calculate Totals using pricing engine (only for in-stock items)
        const activeCartItems = cart.items.filter(item => item.product.inStock && item.product.availableStock > 0);
        if (activeCartItems.length === 0) {
            res.status(400).json({ success: false, message: "No in-stock items to place order" });
            return;
        }
        const pricingItems = activeCartItems.map(item => ({
            productId: item.productId,
            quantity: Math.min(item.quantity, item.product.availableStock)
        }));
        const pricingResult = await (0, offer_controller_1.runPricingEngine)(user, pricingItems, couponCode);
        const subtotal = pricingResult.summary.originalSubtotal;
        const discount = pricingResult.summary.totalDiscounts;
        const cgst = pricingResult.summary.cgst;
        const sgst = pricingResult.summary.sgst;
        const igst = pricingResult.summary.igst;
        const deliveryCharges = pricingResult.summary.deliveryCharges;
        const grandTotal = pricingResult.summary.grandTotal;
        // Generate Order Number
        const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const dbUser = await db_1.prisma.user.findUnique({
            where: { id: user.id }
        });
        const userName = dbUser ? `${dbUser.firstName} ${dbUser.lastName}` : user.email;
        // 4. Perform Transaction
        const order = await db_1.prisma.$transaction(async (tx) => {
            // a. Create Order
            const newOrder = await tx.order.create({
                data: {
                    orderNumber,
                    userId: user.id,
                    addressId,
                    poNumber: poNumber || null,
                    paymentMethod,
                    status: "PENDING_APPROVAL",
                    subtotal,
                    cgst,
                    sgst,
                    igst,
                    deliveryCharges,
                    discount,
                    grandTotal,
                    statusHistory: {
                        create: {
                            status: "PENDING_APPROVAL",
                            remarks: "Order submitted and pending admin approval.",
                            updatedBy: userName
                        }
                    },
                    items: {
                        create: [
                            ...activeCartItems.map(item => {
                                const matchedItem = pricingResult.items.find((i) => i.productId === item.productId);
                                return {
                                    productId: item.productId,
                                    quantity: matchedItem ? matchedItem.quantity : Math.min(item.quantity, item.product.availableStock),
                                    unitPrice: matchedItem ? matchedItem.unitPrice : item.product.price
                                };
                            }),
                            ...pricingResult.freeGiftItems.map((gift) => ({
                                productId: gift.productId,
                                quantity: gift.quantity,
                                unitPrice: 0
                            }))
                        ]
                    }
                },
                include: { items: true }
            });
            // b. Update Product Stock and Record Transactions
            const allOrderItems = [
                ...activeCartItems.map(item => {
                    const matchedItem = pricingResult.items.find((i) => i.productId === item.productId);
                    return {
                        productId: item.productId,
                        quantity: matchedItem ? matchedItem.quantity : Math.min(item.quantity, item.product.availableStock)
                    };
                }),
                ...pricingResult.freeGiftItems.map((gift) => ({ productId: gift.productId, quantity: gift.quantity }))
            ];
            for (const item of allOrderItems) {
                // Update product cumulatives
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        availableStock: { decrement: item.quantity },
                        stockOut: { increment: item.quantity }
                    }
                });
                // Create Inventory Transaction
                await tx.inventoryTransaction.create({
                    data: {
                        productId: item.productId,
                        type: "OUT",
                        quantity: item.quantity
                    }
                });
            }
            // c. Clear active ordered items from Cart (leave out-of-stock items)
            const activeCartItemIds = activeCartItems.map(item => item.id);
            await tx.cartItem.deleteMany({
                where: { id: { in: activeCartItemIds } }
            });
            // d. Auto-generate Invoice
            const invoiceCount = await tx.invoice.count();
            const nextInvoiceNum = `INV-2026-${String(invoiceCount + 1).padStart(6, '0')}`;
            const taxAmount = (newOrder.cgst || 0) + (newOrder.sgst || 0) + (newOrder.igst || 0);
            await tx.invoice.create({
                data: {
                    invoiceNumber: nextInvoiceNum,
                    orderId: newOrder.id,
                    distributorId: user.id,
                    subtotal: newOrder.subtotal,
                    discountAmount: newOrder.discount,
                    taxAmount,
                    shippingAmount: newOrder.deliveryCharges,
                    grandTotal: newOrder.grandTotal,
                    generatedBy: userName,
                    pdfUrl: `/api/orders/${newOrder.id}/invoice/pdf`
                }
            });
            return newOrder;
        });
        res.status(201).json({ success: true, order });
    }
    catch (error) {
        console.error("Create order error:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to place order" });
    }
};
exports.createOrder = createOrder;
// Get user orders
const getOrders = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const orders = await db_1.prisma.order.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            include: {
                address: true,
                items: {
                    include: { product: true }
                },
                statusHistory: {
                    orderBy: { updatedAt: "asc" }
                },
                invoice: true
            }
        });
        res.json({ success: true, orders });
    }
    catch (error) {
        console.error("Get orders error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch orders" });
    }
};
exports.getOrders = getOrders;
// Get single order details
const getOrderById = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const id = req.params.id;
        const order = await db_1.prisma.order.findFirst({
            where: {
                OR: [
                    { id },
                    { orderNumber: id }
                ],
                userId: user.id
            },
            include: {
                address: true,
                items: {
                    include: { product: true }
                },
                statusHistory: {
                    orderBy: { updatedAt: "asc" }
                },
                invoice: true
            }
        });
        if (!order) {
            res.status(404).json({ success: false, message: "Order not found" });
            return;
        }
        if (!order.invoice) {
            const invoiceCount = await db_1.prisma.invoice.count();
            const nextInvoiceNum = `INV-2026-${String(invoiceCount + 1).padStart(6, '0')}`;
            const taxAmount = (order.cgst || 0) + (order.sgst || 0) + (order.igst || 0);
            const newInvoice = await db_1.prisma.invoice.create({
                data: {
                    invoiceNumber: nextInvoiceNum,
                    orderId: order.id,
                    distributorId: order.userId,
                    subtotal: order.subtotal,
                    discountAmount: order.discount,
                    taxAmount,
                    shippingAmount: order.deliveryCharges,
                    grandTotal: order.grandTotal,
                    generatedBy: "System",
                    pdfUrl: `/api/orders/${order.id}/invoice/pdf`
                }
            });
            // @ts-ignore
            order.invoice = newInvoice;
        }
        res.json({ success: true, order });
    }
    catch (error) {
        console.error("Get order by id error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch order details" });
    }
};
exports.getOrderById = getOrderById;
// Get all orders (Admin only)
const getAllOrders = async (req, res) => {
    try {
        const user = req.user;
        const roleUpper = user?.role?.toUpperCase();
        if (!user || (roleUpper !== "ADMIN" && roleUpper !== "SUPERADMIN")) {
            res.status(403).json({ success: false, message: "Access denied. Admin role required." });
            return;
        }
        const orders = await db_1.prisma.order.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phoneNumber: true,
                    }
                },
                address: true,
                items: {
                    include: { product: true }
                },
                statusHistory: {
                    orderBy: { updatedAt: "asc" }
                },
                invoice: true
            }
        });
        res.json({ success: true, orders });
    }
    catch (error) {
        console.error("Get all orders error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch orders" });
    }
};
exports.getAllOrders = getAllOrders;
// Update order status & manual tracking (Admin only, Payment Status is Super Admin only)
const updateOrderStatus = async (req, res) => {
    try {
        const user = req.user;
        const roleUpper = user?.role?.toUpperCase();
        if (!user || (roleUpper !== "ADMIN" && roleUpper !== "SUPERADMIN")) {
            res.status(403).json({ success: false, message: "Access denied. Admin role required." });
            return;
        }
        const id = req.params.id;
        const { status, remarks, paymentStatus } = req.body;
        const validStatuses = [
            "PENDING_APPROVAL",
            "APPROVED",
            "PROCESSING",
            "PACKED",
            "SHIPPED",
            "IN_TRANSIT",
            "OUT_FOR_DELIVERY",
            "DELIVERED",
            "REJECTED",
            "CANCELLED"
        ];
        if (status) {
            if (!validStatuses.includes(status)) {
                res.status(400).json({ success: false, message: "Invalid status value" });
                return;
            }
        }
        if (paymentStatus) {
            const roleUpper = user.role.toUpperCase();
            if (roleUpper !== "ADMIN" && user.role !== "superadmin") {
                res.status(403).json({ success: false, message: "Access denied. Only Super Admin can update payment status." });
                return;
            }
            const validPaymentStatuses = ["PENDING", "PAID", "UNPAID", "REFUNDED"];
            if (!validPaymentStatuses.includes(paymentStatus)) {
                res.status(400).json({ success: false, message: "Invalid payment status value" });
                return;
            }
        }
        if (!status && !paymentStatus) {
            res.status(400).json({ success: false, message: "No status or payment status provided to update" });
            return;
        }
        const order = await db_1.prisma.order.findUnique({
            where: { id },
            include: { items: true, invoice: true }
        });
        if (!order) {
            res.status(404).json({ success: false, message: "Order not found" });
            return;
        }
        const oldStatus = order.status;
        const dbUser = await db_1.prisma.user.findUnique({
            where: { id: user.id }
        });
        const userName = dbUser ? `${dbUser.firstName} ${dbUser.lastName}` : user.email;
        // Transition flags
        const isRestoring = status && (status === "CANCELLED" || status === "REJECTED") &&
            (oldStatus !== "CANCELLED" && oldStatus !== "REJECTED");
        const isReducing = status && (oldStatus === "CANCELLED" || oldStatus === "REJECTED") &&
            (status !== "CANCELLED" && status !== "REJECTED");
        const updatedOrder = await db_1.prisma.$transaction(async (tx) => {
            const now = new Date();
            const updateData = {};
            if (status) {
                updateData.status = status;
                if (status === "APPROVED") {
                    updateData.approvedAt = now;
                    updateData.approvedBy = userName;
                }
                else if (status === "REJECTED") {
                    updateData.rejectionReason = remarks || "Order rejected by admin.";
                }
            }
            if (paymentStatus) {
                updateData.paymentStatus = paymentStatus;
            }
            // Update Order Status
            const updated = await tx.order.update({
                where: { id },
                data: updateData,
                include: {
                    items: {
                        include: { product: true }
                    },
                    user: true,
                    address: true,
                    statusHistory: true,
                    invoice: true
                }
            });
            // Record Status History
            if (status) {
                await tx.orderStatusHistory.create({
                    data: {
                        orderId: id,
                        status,
                        remarks: remarks || `Order status updated to ${status}.`,
                        updatedBy: userName
                    }
                });
                // Handle stock adjustments
                if (isRestoring) {
                    for (const item of order.items) {
                        await tx.product.update({
                            where: { id: item.productId },
                            data: {
                                availableStock: { increment: item.quantity },
                                stockOut: { decrement: item.quantity }
                            }
                        });
                        await tx.inventoryTransaction.create({
                            data: {
                                productId: item.productId,
                                type: "IN",
                                quantity: item.quantity
                            }
                        });
                    }
                }
                else if (isReducing) {
                    for (const item of order.items) {
                        await tx.product.update({
                            where: { id: item.productId },
                            data: {
                                availableStock: { decrement: item.quantity },
                                stockOut: { increment: item.quantity }
                            }
                        });
                        await tx.inventoryTransaction.create({
                            data: {
                                productId: item.productId,
                                type: "OUT",
                                quantity: item.quantity
                            }
                        });
                    }
                }
                // Generate invoice automatically if status is APPROVED and no invoice exists yet
                if (status === "APPROVED" && !order.invoice) {
                    const invoiceCount = await tx.invoice.count();
                    const nextInvoiceNum = `INV-2026-${String(invoiceCount + 1).padStart(6, '0')}`;
                    const taxAmount = (order.cgst || 0) + (order.sgst || 0) + (order.igst || 0);
                    await tx.invoice.create({
                        data: {
                            invoiceNumber: nextInvoiceNum,
                            orderId: id,
                            distributorId: order.userId,
                            subtotal: order.subtotal,
                            discountAmount: order.discount,
                            taxAmount,
                            shippingAmount: order.deliveryCharges,
                            grandTotal: order.grandTotal,
                            generatedBy: userName,
                            pdfUrl: `/api/orders/${id}/invoice/pdf`
                        }
                    });
                }
            }
            if (paymentStatus) {
                await tx.orderStatusHistory.create({
                    data: {
                        orderId: id,
                        status: updated.status,
                        remarks: remarks || `Payment status updated to ${paymentStatus}.`,
                        updatedBy: userName
                    }
                });
            }
            return updated;
        });
        res.json({ success: true, order: updatedOrder });
    }
    catch (error) {
        console.error("Update order status error:", error);
        res.status(500).json({ success: false, message: "Failed to update order status" });
    }
};
exports.updateOrderStatus = updateOrderStatus;
// Get detailed invoice for an order
const getOrderInvoice = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const orderId = req.params.id;
        const order = await db_1.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phoneNumber: true,
                    }
                },
                address: true,
                items: {
                    include: { product: true }
                },
                invoice: true
            }
        });
        if (!order) {
            res.status(404).json({ success: false, message: "Order not found" });
            return;
        }
        // Access control: distributor must own order, or be an admin
        const roleUpper = user.role.toUpperCase();
        if (order.userId !== user.id && roleUpper !== "ADMIN" && roleUpper !== "SUPERADMIN") {
            res.status(403).json({ success: false, message: "Access denied" });
            return;
        }
        if (!order.invoice) {
            const invoiceCount = await db_1.prisma.invoice.count();
            const nextInvoiceNum = `INV-2026-${String(invoiceCount + 1).padStart(6, '0')}`;
            const taxAmount = (order.cgst || 0) + (order.sgst || 0) + (order.igst || 0);
            const userName = order.user ? `${order.user.firstName} ${order.user.lastName}` : "System";
            const newInvoice = await db_1.prisma.invoice.create({
                data: {
                    invoiceNumber: nextInvoiceNum,
                    orderId: order.id,
                    distributorId: order.userId,
                    subtotal: order.subtotal,
                    discountAmount: order.discount,
                    taxAmount,
                    shippingAmount: order.deliveryCharges,
                    grandTotal: order.grandTotal,
                    generatedBy: userName,
                    pdfUrl: `/api/orders/${order.id}/invoice/pdf`
                }
            });
            // @ts-ignore
            order.invoice = newInvoice;
        }
        res.json({ success: true, invoice: order.invoice, order });
    }
    catch (error) {
        console.error("Get order invoice error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch invoice" });
    }
};
exports.getOrderInvoice = getOrderInvoice;
// Cancel order (User self-cancel)
const cancelOrder = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const id = req.params.id;
        const order = await db_1.prisma.order.findUnique({
            where: { id },
            include: { items: true }
        });
        if (!order) {
            res.status(404).json({ success: false, message: "Order not found" });
            return;
        }
        // Check ownership
        if (order.userId !== user.id) {
            res.status(403).json({ success: false, message: "Access denied. You can only cancel your own orders." });
            return;
        }
        // Check cancellable statuses (before shipping/out for delivery)
        const cancellableStatuses = ["PENDING_APPROVAL", "APPROVED", "PROCESSING", "PACKED"];
        if (!cancellableStatuses.includes(order.status)) {
            res.status(400).json({ success: false, message: `Cannot cancel order at '${order.status}' stage.` });
            return;
        }
        const dbUser = await db_1.prisma.user.findUnique({
            where: { id: user.id }
        });
        const userName = dbUser ? `${dbUser.firstName} ${dbUser.lastName}` : user.email;
        const updatedOrder = await db_1.prisma.$transaction(async (tx) => {
            // Update order status to CANCELLED
            const updated = await tx.order.update({
                where: { id },
                data: { status: "CANCELLED" },
                include: {
                    items: { include: { product: true } },
                    user: true,
                    address: true,
                    statusHistory: true,
                    invoice: true
                }
            });
            // Record status history
            await tx.orderStatusHistory.create({
                data: {
                    orderId: id,
                    status: "CANCELLED",
                    remarks: "Order cancelled by customer.",
                    updatedBy: userName
                }
            });
            // Restore stock
            for (const item of order.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        availableStock: { increment: item.quantity },
                        stockOut: { decrement: item.quantity }
                    }
                });
                await tx.inventoryTransaction.create({
                    data: {
                        productId: item.productId,
                        type: "IN",
                        quantity: item.quantity
                    }
                });
            }
            return updated;
        });
        res.json({ success: true, message: "Order cancelled successfully", order: updatedOrder });
    }
    catch (error) {
        console.error("Cancel order error:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to cancel order" });
    }
};
exports.cancelOrder = cancelOrder;
