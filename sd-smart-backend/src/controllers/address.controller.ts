import { Request, Response } from "express";
import { prisma } from "../utils/db";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

// Get all addresses for user
export const getAddresses = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [
        { isDefault: "desc" },
        { createdAt: "desc" }
      ]
    });

    res.json({ success: true, addresses });
  } catch (error: any) {
    console.error("Get addresses error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch addresses" });
  }
};

// Create a new address
export const createAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const {
      fullName,
      emailAddress,
      mobileNumber,
      companyName,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      pincode,
      isDefault
    } = req.body;

    if (!fullName || !mobileNumber || !addressLine1 || !city || !state || !pincode) {
      res.status(400).json({ success: false, message: "Missing required fields" });
      return;
    }

    // If this is the first address or set to default, we might need to unset others
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false }
      });
    }

    // Check if user has no addresses
    const existingCount = await prisma.address.count({ where: { userId: user.id } });

    const address = await prisma.address.create({
      data: {
        userId: user.id,
        fullName,
        emailAddress: emailAddress || null,
        mobileNumber,
        companyName: companyName || null,
        addressLine1,
        addressLine2: addressLine2 || null,
        landmark: landmark || null,
        city,
        state,
        pincode,
        isDefault: existingCount === 0 ? true : Boolean(isDefault)
      }
    });

    res.status(201).json({ success: true, address });
  } catch (error: any) {
    console.error("Create address error:", error);
    res.status(500).json({ success: false, message: "Failed to create address" });
  }
};

// Update address
export const updateAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Updating address...");
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const id = req.params.id as string;
    const { isDefault, ...updateData } = req.body;

    const existingAddress = await prisma.address.findFirst({
      where: { id, userId: user.id }
    });

    if (!existingAddress) {
      res.status(404).json({ success: false, message: "Address not found" });
      return;
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false }
      });
    }

    const updatedAddress = await prisma.address.update({
      where: { id },
      data: {
        ...updateData,
        isDefault: isDefault !== undefined ? isDefault : existingAddress.isDefault
      }
    });

    res.json({ success: true, address: updatedAddress });
  } catch (error: any) {
    console.error("Update address error:", error);
    res.status(500).json({ success: false, message: "Failed to update address" });
  }
};
