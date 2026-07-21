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
        role: "CUSTOMER",
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
        approvalStatus: user.approvalStatus,
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
        role: "ADMIN",
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
        approvalStatus: user.approvalStatus,
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
    let salesPerson = null;
    const isEmail = loginInput.includes("@");

    if (isEmail) {
      user = await prisma.user.findUnique({
        where: { email: loginInput.toLowerCase() },
      });
      if (!user) {
        salesPerson = await prisma.salesPerson.findUnique({
          where: { email: loginInput.toLowerCase() },
        });
      }
    } else {
      user = await prisma.user.findUnique({
        where: { phoneNumber: loginInput },
      });
      if (!user) {
        salesPerson = await prisma.salesPerson.findUnique({
          where: { mobileNumber: loginInput },
        });
      }
    }

    if (salesPerson) {
      if (salesPerson.status === "INACTIVE" || salesPerson.status === "Inactive") {
        res.status(400).json({ success: false, message: "Your account is deactivated. Please contact administrator." });
        return;
      }

      const isMatch = await bcrypt.compare(password, salesPerson.password);
      if (!isMatch) {
        res.status(400).json({ success: false, message: "Invalid login credentials" });
        return;
      }

      const token = jwt.sign(
        { id: salesPerson.id, email: salesPerson.email, role: "SALESPERSON" },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.json({
        success: true,
        token,
        user: {
          id: salesPerson.id,
          name: salesPerson.fullName,
          email: salesPerson.email,
          phoneNumber: salesPerson.mobileNumber,
          firstName: salesPerson.fullName.split(" ")[0] || "",
          lastName: salesPerson.fullName.split(" ").slice(1).join(" ") || "",
          role: "SALESPERSON",
          approvalStatus: "APPROVED",
        },
      });
      return;
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
        approvalStatus: user.approvalStatus,
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
    const userRole = (req as AuthenticatedRequest).user?.role;
    if (!userId) {
      res.status(401).json({ success: false, message: "Not authenticated" });
      return;
    }

    if (userRole === "SALESPERSON") {
      const salesPerson = await prisma.salesPerson.findUnique({
        where: { id: userId },
      });

      if (!salesPerson) {
        res.status(404).json({ success: false, message: "Sales Person not found" });
        return;
      }

      res.json({
        success: true,
        user: {
          id: salesPerson.id,
          name: salesPerson.fullName,
          email: salesPerson.email,
          phoneNumber: salesPerson.mobileNumber,
          firstName: salesPerson.fullName.split(" ")[0] || "",
          lastName: salesPerson.fullName.split(" ").slice(1).join(" ") || "",
          role: "SALESPERSON",
          approvalStatus: "APPROVED",
        },
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
        approvalStatus: user.approvalStatus,
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

    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    let userName = "";

    if (user) {
      userName = `${user.firstName} ${user.lastName}`;
    } else {
      const salesPerson = await prisma.salesPerson.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (salesPerson) {
        user = salesPerson as any;
        userName = salesPerson.fullName;
      }
    }

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

    // Find user by email (either in User table or SalesPerson table)
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    let isSalesPerson = false;

    if (!user) {
      const salesPerson = await prisma.salesPerson.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (salesPerson) {
        user = {
          id: salesPerson.id,
          password: salesPerson.password,
          email: salesPerson.email,
        } as any;
        isSalesPerson = true;
      }
    }

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

    // Update password in the correct table
    if (isSalesPerson) {
      await prisma.salesPerson.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
    }

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
        approvalStatus: updatedUser.approvalStatus,
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
          role: "DISTRIBUTOR",
          approvalStatus: "PENDING",
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
        gstin: result.updatedUser.gstin,
        approvalStatus: result.updatedUser.approvalStatus,
      },
      address: result.defaultAddress
    });
  } catch (error: any) {
    console.error("Convert to distributor error:", error);
    res.status(500).json({ success: false, message: "Failed to convert to distributor" });
  }
};

// Distributor Signup
export const distributorSignup = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      distributorName,
      contactPersonName,
      email,
      mobileNumber,
      gstNumber,
      businessName,
      businessAddress,
      password,
    } = req.body;

    if (!distributorName || !contactPersonName || !email || !mobileNumber || !businessName || !businessAddress || !password) {
      res.status(400).json({ success: false, message: "All required fields must be filled." });
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
    const existingPhone = await prisma.user.findUnique({
      where: { phoneNumber: mobileNumber },
    });
    if (existingPhone) {
      res.status(400).json({ success: false, message: "Phone number is already registered" });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Perform database transaction to create User and Address
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          phoneNumber: mobileNumber,
          password: hashedPassword,
          firstName: contactPersonName,
          lastName: distributorName, // Using distributorName as lastName
          role: "DISTRIBUTOR",
          approvalStatus: "PENDING",
          companyName: businessName,
          gstin: gstNumber || null,
        },
      });

      // 2. Create Default Address
      const address = await tx.address.create({
        data: {
          userId: user.id,
          fullName: contactPersonName,
          emailAddress: email.toLowerCase(),
          mobileNumber: mobileNumber,
          companyName: businessName,
          addressLine1: businessAddress,
          city: "N/A",
          state: "N/A",
          pincode: "N/A",
          gstin: gstNumber || null,
          isDefault: true,
        },
      });

      return { user, address };
    });

    // Generate JWT token so they can login immediately
    const token = jwt.sign(
      { id: result.user.id, email: result.user.email, role: result.user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: "Distributor registered successfully and pending approval.",
      token,
      user: {
        id: result.user.id,
        name: `${result.user.firstName} ${result.user.lastName}`,
        email: result.user.email,
        phoneNumber: result.user.phoneNumber,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        companyName: result.user.companyName,
        gstin: result.user.gstin,
        approvalStatus: result.user.approvalStatus,
      },
    });
  } catch (error: any) {
    console.error("Distributor signup error:", error);
    res.status(500).json({ success: false, message: "Server error during distributor registration" });
  }
};

// Admin: Get all distributors
export const getDistributors = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const isAdmin = user && (user.role === "ADMIN" || user.role === "admin" || user.role === "superadmin");
    if (!isAdmin) {
      res.status(403).json({ success: false, message: "Access denied. Admin role required." });
      return;
    }

    const page = req.query.page ? parseInt(req.query.page as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const search = req.query.search as string | undefined;

    const whereClause: any = {
      role: "DISTRIBUTOR"
    };

    if (search) {
      const cleanSearch = search.trim();
      whereClause.OR = [
        { firstName: { contains: cleanSearch, mode: "insensitive" } },
        { lastName: { contains: cleanSearch, mode: "insensitive" } },
        { companyName: { contains: cleanSearch, mode: "insensitive" } },
        { email: { contains: cleanSearch, mode: "insensitive" } },
        { phoneNumber: { contains: cleanSearch } },
        { gstin: { contains: cleanSearch, mode: "insensitive" } }
      ];
    }

    if (page && limit) {
      const skip = (page - 1) * limit;
      const [distributors, totalRecords] = await prisma.$transaction([
        prisma.user.findMany({
          where: whereClause,
          orderBy: {
            createdAt: "desc"
          },
          include: {
            addresses: {
              where: {
                isDefault: true
              }
            }
          },
          skip,
          take: limit
        }),
        prisma.user.count({ where: whereClause })
      ]);

      res.json({
        success: true,
        data: distributors.map(d => ({
          id: d.id,
          email: d.email,
          phoneNumber: d.phoneNumber,
          firstName: d.firstName, // Contact Person
          lastName: d.lastName,   // Distributor Name
          companyName: d.companyName, // Business Name
          gstin: d.gstin,
          approvalStatus: d.approvalStatus,
          createdAt: d.createdAt,
          businessAddress: d.addresses[0]?.addressLine1 || "N/A"
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalRecords / limit),
          totalRecords,
          pageSize: limit,
          hasNext: page * limit < totalRecords,
          hasPrevious: page > 1
        }
      });
      return;
    }

    const distributors = await prisma.user.findMany({
      where: {
        role: "DISTRIBUTOR"
      },
      orderBy: {
        createdAt: "desc"
      },
      include: {
        addresses: {
          where: {
            isDefault: true
          }
        }
      }
    });

    res.json({
      success: true,
      distributors: distributors.map(d => ({
        id: d.id,
        email: d.email,
        phoneNumber: d.phoneNumber,
        firstName: d.firstName, // Contact Person
        lastName: d.lastName,   // Distributor Name
        companyName: d.companyName, // Business Name
        gstin: d.gstin,
        approvalStatus: d.approvalStatus,
        createdAt: d.createdAt,
        businessAddress: d.addresses[0]?.addressLine1 || "N/A"
      }))
    });
  } catch (error: any) {
    console.error("Get distributors error:", error);
    res.status(500).json({ success: false, message: "Server error retrieving distributors" });
  }
};

// Admin: Update distributor approval status
export const updateDistributorStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const isAdmin = user && (user.role === "ADMIN" || user.role === "admin" || user.role === "superadmin");
    if (!isAdmin) {
      res.status(403).json({ success: false, message: "Access denied. Admin role required." });
      return;
    }

    const { id } = req.params;
    const targetId = id as string;
    const { status } = req.body; // APPROVED or REJECTED

    if (status !== "APPROVED" && status !== "REJECTED") {
      res.status(400).json({ success: false, message: "Invalid status. Must be APPROVED or REJECTED." });
      return;
    }

    const distributor = await prisma.user.findUnique({
      where: { id: targetId }
    });

    if (!distributor || distributor.role !== "DISTRIBUTOR") {
      res.status(404).json({ success: false, message: "Distributor not found." });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: {
        approvalStatus: status as any
      }
    });

    res.json({
      success: true,
      message: `Distributor status successfully updated to ${status}.`,
      distributor: {
        id: updated.id,
        email: updated.email,
        approvalStatus: updated.approvalStatus
      }
    });
  } catch (error: any) {
    console.error("Update distributor status error:", error);
    res.status(500).json({ success: false, message: "Server error updating distributor status" });
  }
};

// Admin: Delete distributor and all associated data
export const deleteDistributor = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const isAdmin = user && (user.role === "ADMIN" || user.role === "admin" || user.role === "superadmin");
    if (!isAdmin) {
      res.status(403).json({ success: false, message: "Access denied. Admin role required." });
      return;
    }

    const { id } = req.params;
    const targetId = id as string;

    const distributor = await prisma.user.findUnique({
      where: { id: targetId }
    });

    if (!distributor || distributor.role !== "DISTRIBUTOR") {
      res.status(404).json({ success: false, message: "Distributor not found." });
      return;
    }

    // Delete orders and then the user in a transaction
    await prisma.$transaction([
      prisma.order.deleteMany({
        where: { userId: targetId }
      }),
      prisma.user.delete({
        where: { id: targetId }
      })
    ]);

    res.json({
      success: true,
      message: "Distributor and all associated data successfully deleted."
    });
  } catch (error: any) {
    console.error("Delete distributor error:", error);
    res.status(500).json({ success: false, message: "Server error deleting distributor" });
  }
};


