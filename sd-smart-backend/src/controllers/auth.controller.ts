import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/db";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { sendPasswordResetEmail } from "../utils/email";

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_sd_smart_123!";
const JWT_EXPIRES_IN = "7d";

const isPasswordValid = (pw: string): boolean => {
  return pw.length >= 8 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]/.test(pw);
};

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, phoneNumber } = req.body;

    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({ success: false, message: "All fields are required" });
      return;
    }

    if (!isPasswordValid(password)) {
      res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number."
      });
      return;
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      res.status(400).json({ success: false, message: "Email is already registered" });
      return;
    }

    // Check if phone number already exists
    if (phoneNumber) {
      const existingPhone = await prisma.user.findUnique({
        where: { phoneNumber },
      });
      if (existingPhone) {
        res.status(400).json({ success: false, message: "Phone number is already registered" });
        return;
      }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        phoneNumber: phoneNumber || null,
        password: hashedPassword,
        firstName,
        lastName,
        role: "user",
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    res.status(500).json({ success: false, message: "Server error during registration" });
  }
};

export const adminSignup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, phoneNumber } = req.body;

    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({ success: false, message: "All fields are required" });
      return;
    }

    if (!isPasswordValid(password)) {
      res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number."
      });
      return;
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      res.status(400).json({ success: false, message: "Email is already registered" });
      return;
    }

    // Check if phone number already exists
    if (phoneNumber) {
      const existingPhone = await prisma.user.findUnique({
        where: { phoneNumber },
      });
      if (existingPhone) {
        res.status(400).json({ success: false, message: "Phone number is already registered" });
        return;
      }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with admin role
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        phoneNumber: phoneNumber || null,
        password: hashedPassword,
        firstName,
        lastName,
        role: "admin",
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("Admin signup error:", error);
    res.status(500).json({ success: false, message: "Server error during admin registration" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, username, password } = req.body;
    const loginInput = email || username; // Support email or username as parameters

    if (!loginInput || !password) {
      res.status(400).json({ success: false, message: "Login input and password are required" });
      return;
    }

    let user = null;
    const isEmail = loginInput.includes("@");

    if (isEmail) {
      user = await prisma.user.findUnique({
        where: { email: loginInput.toLowerCase() },
      });
    } else {
      user = await prisma.user.findUnique({
        where: { phoneNumber: loginInput },
      });
    }

    if (!user) {
      res.status(400).json({ success: false, message: "Invalid login credentials" });
      return;
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ success: false, message: "Invalid login credentials" });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyName: user.companyName,
        gstin: user.gstin,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error during login" });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Not authenticated" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyName: user.companyName,
        gstin: user.gstin,
      },
    });
  } catch (error: any) {
    console.error("GetMe error:", error);
    res.status(500).json({ success: false, message: "Server error retrieving profile" });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ success: false, message: "Email is required" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      res.status(404).json({ success: false, message: "No user found with this email address" });
      return;
    }

    // Generate 6-digit random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes validity

    // Save or update PasswordReset record
    await prisma.passwordReset.upsert({
      where: { email: email.toLowerCase() },
      update: { code, expiresAt },
      create: { email: email.toLowerCase(), code, expiresAt },
    });

    // Send real password reset email
    const userName = `${user.firstName} ${user.lastName}`;
    try {
      await sendPasswordResetEmail(email.toLowerCase(), userName, code);
      console.log(`[EMAIL] Password reset code sent to ${email}`);
    } catch (emailError: any) {
      console.error("Email send error:", emailError.message);
      // Fallback: log to console if email sending fails
      console.log(`\n================================================================`);
      console.log(`[FALLBACK] Password Reset Code for ${email}: ${code}`);
      console.log(`================================================================\n`);
    }

    res.json({ success: true, message: "Verification code sent to your email" });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    res.status(500).json({ success: false, message: "Server error sending reset code" });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      res.status(400).json({ success: false, message: "All fields are required" });
      return;
    }

    if (!isPasswordValid(newPassword)) {
      res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number."
      });
      return;
    }

    // Find the password reset record
    const record = await prisma.passwordReset.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!record || record.code !== code) {
      res.status(400).json({ success: false, message: "Invalid verification code" });
      return;
    }

    // Check expiry
    if (new Date() > record.expiresAt) {
      res.status(400).json({ success: false, message: "Verification code has expired" });
      return;
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    // Ensure new password is not the same as old password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      res.status(400).json({ success: false, message: "New password must be different from your current password" });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Delete the reset record
    await prisma.passwordReset.delete({
      where: { email: email.toLowerCase() },
    });

    res.json({ success: true, message: "Password has been reset successfully" });
  } catch (error: any) {
    console.error("Reset password error:", error);
    res.status(500).json({ success: false, message: "Server error during password reset" });
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Not authenticated" });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: "Current password and new password are required" });
      return;
    }

    if (!isPasswordValid(newPassword)) {
      res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number."
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    // Compare existing password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ success: false, message: "Incorrect current password" });
      return;
    }

    // Ensure new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      res.status(400).json({ success: false, message: "New password must be different from your current password" });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error: any) {
    console.error("Change password error:", error);
    res.status(500).json({ success: false, message: "Server error during password update" });
  }
};

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.body;

    if (!phone) {
      res.status(400).json({ success: false, message: "Phone number is required" });
      return;
    }

    // Check if phone belongs to a user
    const user = await prisma.user.findUnique({
      where: { phoneNumber: phone },
    });

    if (!user) {
      res.status(404).json({ success: false, message: "No user found with this phone number" });
      return;
    }

    // Generate 6-digit random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    // Save or update OtpVerification
    await prisma.otpVerification.upsert({
      where: { phone },
      update: { code, expiresAt },
      create: { phone, code, expiresAt },
    });

    // Mock sending code by logging to console
    console.log(`\n==========================================`);
    console.log(`[SMS] Verification Code for ${phone}: ${code}`);
    console.log(`==========================================\n`);

    res.json({ success: true, message: "OTP sent successfully" });
  } catch (error: any) {
    console.error("Send OTP error:", error);
    res.status(500).json({ success: false, message: "Server error sending OTP" });
  }
};

export const loginWithOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      res.status(400).json({ success: false, message: "Phone number and code are required" });
      return;
    }

    const record = await prisma.otpVerification.findUnique({
      where: { phone },
    });

    if (!record || record.code !== code) {
      res.status(400).json({ success: false, message: "Invalid verification code" });
      return;
    }

    // Check expiry
    if (new Date() > record.expiresAt) {
      res.status(400).json({ success: false, message: "Verification code has expired" });
      return;
    }

    // Find user by phone
    const user = await prisma.user.findUnique({
      where: { phoneNumber: phone },
    });

    if (!user) {
      res.status(404).json({ success: false, message: "No user found with this phone number" });
      return;
    }

    // Clean up OTP record
    await prisma.otpVerification.delete({
      where: { phone },
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyName: user.companyName,
        gstin: user.gstin,
      },
    });
  } catch (error: any) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ success: false, message: "Server error during OTP verification" });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Not authenticated" });
      return;
    }

    const { firstName, lastName, email, phoneNumber, companyName, gstin } = req.body;

    if (!firstName || !lastName || !email) {
      res.status(400).json({ success: false, message: "First name, last name, and email are required" });
      return;
    }

    // Check if email is already taken by another user
    const existingEmailUser = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        NOT: { id: userId },
      },
    });

    if (existingEmailUser) {
      res.status(400).json({ success: false, message: "Email is already in use by another account" });
      return;
    }

    // Check if phone number is already taken by another user
    if (phoneNumber) {
      const existingPhoneUser = await prisma.user.findFirst({
        where: {
          phoneNumber,
          NOT: { id: userId },
        },
      });

      if (existingPhoneUser) {
        res.status(400).json({ success: false, message: "Phone number is already in use by another account" });
        return;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        email: email.toLowerCase(),
        phoneNumber: phoneNumber || null,
        companyName: companyName || null,
        gstin: gstin || null,
      },
    });

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: `${updatedUser.firstName} ${updatedUser.lastName}`,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        companyName: updatedUser.companyName,
        gstin: updatedUser.gstin,
      },
    });
  } catch (error: any) {
    console.error("UpdateProfile error:", error);
    res.status(500).json({ success: false, message: "Server error during profile update" });
  }
};

export const convertToDistributor = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Not authenticated" });
      return;
    }

    const {
      companyName,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      gstin,
      mobileNumber
    } = req.body;

    if (!companyName || !addressLine1 || !city || !state || !pincode || !mobileNumber) {
      res.status(400).json({ success: false, message: "Company name, address details, and phone number are required" });
      return;
    }

    // Begin database transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update user role and fields
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          role: "distributor",
          companyName,
          gstin: gstin || null
        }
      });

      // 2. Set all other user addresses isDefault to false
      await tx.address.updateMany({
        where: { userId },
        data: { isDefault: false }
      });

      // 3. Create or update dynamic distributor address as default
      const defaultAddress = await tx.address.create({
        data: {
          userId,
          fullName: `${updatedUser.firstName} ${updatedUser.lastName}`,
          emailAddress: updatedUser.email,
          mobileNumber,
          companyName,
          addressLine1,
          addressLine2: addressLine2 || null,
          city,
          state,
          pincode,
          gstin: gstin || null,
          isDefault: true
        }
      });

      return { updatedUser, defaultAddress };
    });

    res.json({
      success: true,
      message: "Successfully converted to Distributor",
      user: {
        id: result.updatedUser.id,
        name: `${result.updatedUser.firstName} ${result.updatedUser.lastName}`,
        email: result.updatedUser.email,
        phoneNumber: result.updatedUser.phoneNumber,
        firstName: result.updatedUser.firstName,
        lastName: result.updatedUser.lastName,
        role: result.updatedUser.role,
        companyName: result.updatedUser.companyName,
        gstin: result.updatedUser.gstin
      },
      address: result.defaultAddress
    });
  } catch (error: any) {
    console.error("Convert to distributor error:", error);
    res.status(500).json({ success: false, message: "Failed to convert to distributor" });
  }
};

