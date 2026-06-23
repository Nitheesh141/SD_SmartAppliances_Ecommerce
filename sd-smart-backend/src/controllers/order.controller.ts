import { Request, Response } from "express";
import { prisma } from "../utils/db";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

// Create a new order (Checkout)
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { addressId, paymentMethod, poNumber } = req.body;

    if (!addressId || !paymentMethod) {
      res.status(400).json({ success: false, message: "Address and Payment Method are required" });
      return;
    }

    // 1. Fetch Cart
    const cart = await prisma.cart.findUnique({
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
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId: user.id }
    });

    if (!address) {
      res.status(404).json({ success: false, message: "Address not found" });
      return;
    }

    // 3. Calculate Totals
    let subtotal = 0;
    cart.items.forEach(item => {
      subtotal += item.product.price * item.quantity;
    });

    const cgst = subtotal * 0.09;
    const sgst = subtotal * 0.09;
    const igst = 0;
    const discount = 0; // Keeping 0 for now as per design

    let deliveryCharges = 200;
    if (subtotal > 10000) {
      deliveryCharges = 0;
    }

    const grandTotal = subtotal + cgst + sgst + igst + deliveryCharges - discount;

    // Generate Order Number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 4. Perform Transaction
    const order = await prisma.$transaction(async (tx) => {
      // a. Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          addressId,
          poNumber: poNumber || null,
          paymentMethod,
          status: "Pending",
          subtotal,
          cgst,
          sgst,
          igst,
          deliveryCharges,
          discount,
          grandTotal,
          items: {
            create: cart.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.product.price
            }))
          }
        },
        include: { items: true }
      });

      // b. Update Product Stock and Record Transactions
      for (const item of cart.items) {
        // Update product cumulatives
        await tx.product.update({
          where: { id: item.productId },
          data: {
            availableStock: { decrement: item.quantity },
            stockOut: { increment: item.quantity }
          }
        });

        // Create Inventory Transaction
        await (tx as any).inventoryTransaction.create({
          data: {
            productId: item.productId,
            type: "OUT",
            quantity: item.quantity
          }
        });
      }

      // c. Clear Cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id }
      });

      return newOrder;
    });

    res.status(201).json({ success: true, order });
  } catch (error: any) {
    console.error("Create order error:", error);
    res.status(500).json({ success: false, message: "Failed to place order" });
  }
};

// Get user orders
export const getOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        address: true,
        items: {
          include: { product: true }
        }
      }
    });

    res.json({ success: true, orders });
  } catch (error: any) {
    console.error("Get orders error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

// Get single order details
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: { id, userId: user.id },
      include: {
        address: true,
        items: {
          include: { product: true }
        }
      }
    });

    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    res.json({ success: true, order });
  } catch (error: any) {
    console.error("Get order by id error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch order details" });
  }
};
