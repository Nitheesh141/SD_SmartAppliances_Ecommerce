"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.loginWithOtp = exports.sendOtp = exports.changePassword = exports.resetPassword = exports.forgotPassword = exports.getMe = exports.login = exports.adminSignup = exports.signup = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../utils/db");
const email_1 = require("../utils/email");
const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_sd_smart_123!";
const JWT_EXPIRES_IN = "7d";
const isPasswordValid = (pw) => {
    return pw.length >= 8 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]/.test(pw);
};
const signup = async (req, res) => {
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
        const existingUser = await db_1.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (existingUser) {
            res.status(400).json({ success: false, message: "Email is already registered" });
            return;
        }
        // Check if phone number already exists
        if (phoneNumber) {
            const existingPhone = await db_1.prisma.user.findUnique({
                where: { phoneNumber },
            });
            if (existingPhone) {
                res.status(400).json({ success: false, message: "Phone number is already registered" });
                return;
            }
        }
        // Hash the password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Create user
        const user = await db_1.prisma.user.create({
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
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
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
    }
    catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ success: false, message: "Server error during registration" });
    }
};
exports.signup = signup;
const adminSignup = async (req, res) => {
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
        const existingUser = await db_1.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (existingUser) {
            res.status(400).json({ success: false, message: "Email is already registered" });
            return;
        }
        // Check if phone number already exists
        if (phoneNumber) {
            const existingPhone = await db_1.prisma.user.findUnique({
                where: { phoneNumber },
            });
            if (existingPhone) {
                res.status(400).json({ success: false, message: "Phone number is already registered" });
                return;
            }
        }
        // Hash the password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Create user with admin role
        const user = await db_1.prisma.user.create({
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
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
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
    }
    catch (error) {
        console.error("Admin signup error:", error);
        res.status(500).json({ success: false, message: "Server error during admin registration" });
    }
};
exports.adminSignup = adminSignup;
const login = async (req, res) => {
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
            user = await db_1.prisma.user.findUnique({
                where: { email: loginInput.toLowerCase() },
            });
        }
        else {
            user = await db_1.prisma.user.findUnique({
                where: { phoneNumber: loginInput },
            });
        }
        if (!user) {
            res.status(400).json({ success: false, message: "Invalid login credentials" });
            return;
        }
        // Check password
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ success: false, message: "Invalid login credentials" });
            return;
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
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
            },
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: "Server error during login" });
    }
};
exports.login = login;
const getMe = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Not authenticated" });
            return;
        }
        const user = await db_1.prisma.user.findUnique({
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
            },
        });
    }
    catch (error) {
        console.error("GetMe error:", error);
        res.status(500).json({ success: false, message: "Server error retrieving profile" });
    }
};
exports.getMe = getMe;
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ success: false, message: "Email is required" });
            return;
        }
        const user = await db_1.prisma.user.findUnique({
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
        await db_1.prisma.passwordReset.upsert({
            where: { email: email.toLowerCase() },
            update: { code, expiresAt },
            create: { email: email.toLowerCase(), code, expiresAt },
        });
        // Send real password reset email
        const userName = `${user.firstName} ${user.lastName}`;
        try {
            await (0, email_1.sendPasswordResetEmail)(email.toLowerCase(), userName, code);
            console.log(`[EMAIL] Password reset code sent to ${email}`);
        }
        catch (emailError) {
            console.error("Email send error:", emailError.message);
            // Fallback: log to console if email sending fails
            console.log(`\n================================================================`);
            console.log(`[FALLBACK] Password Reset Code for ${email}: ${code}`);
            console.log(`================================================================\n`);
        }
        res.json({ success: true, message: "Verification code sent to your email" });
    }
    catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ success: false, message: "Server error sending reset code" });
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
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
        const record = await db_1.prisma.passwordReset.findUnique({
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
        const user = await db_1.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }
        // Ensure new password is not the same as old password
        const isSamePassword = await bcryptjs_1.default.compare(newPassword, user.password);
        if (isSamePassword) {
            res.status(400).json({ success: false, message: "New password must be different from your current password" });
            return;
        }
        // Hash new password
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        // Update password
        await db_1.prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });
        // Delete the reset record
        await db_1.prisma.passwordReset.delete({
            where: { email: email.toLowerCase() },
        });
        res.json({ success: true, message: "Password has been reset successfully" });
    }
    catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ success: false, message: "Server error during password reset" });
    }
};
exports.resetPassword = resetPassword;
const changePassword = async (req, res) => {
    try {
        const userId = req.user?.id;
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
        const user = await db_1.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }
        // Compare existing password
        const isMatch = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isMatch) {
            res.status(400).json({ success: false, message: "Incorrect current password" });
            return;
        }
        // Ensure new password is different from current
        const isSamePassword = await bcryptjs_1.default.compare(newPassword, user.password);
        if (isSamePassword) {
            res.status(400).json({ success: false, message: "New password must be different from your current password" });
            return;
        }
        // Hash new password
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        // Update user's password
        await db_1.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
        res.json({ success: true, message: "Password changed successfully" });
    }
    catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({ success: false, message: "Server error during password update" });
    }
};
exports.changePassword = changePassword;
const sendOtp = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) {
            res.status(400).json({ success: false, message: "Phone number is required" });
            return;
        }
        // Check if phone belongs to a user
        const user = await db_1.prisma.user.findUnique({
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
        await db_1.prisma.otpVerification.upsert({
            where: { phone },
            update: { code, expiresAt },
            create: { phone, code, expiresAt },
        });
        // Mock sending code by logging to console
        console.log(`\n==========================================`);
        console.log(`[SMS] Verification Code for ${phone}: ${code}`);
        console.log(`==========================================\n`);
        res.json({ success: true, message: "OTP sent successfully" });
    }
    catch (error) {
        console.error("Send OTP error:", error);
        res.status(500).json({ success: false, message: "Server error sending OTP" });
    }
};
exports.sendOtp = sendOtp;
const loginWithOtp = async (req, res) => {
    try {
        const { phone, code } = req.body;
        if (!phone || !code) {
            res.status(400).json({ success: false, message: "Phone number and code are required" });
            return;
        }
        const record = await db_1.prisma.otpVerification.findUnique({
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
        const user = await db_1.prisma.user.findUnique({
            where: { phoneNumber: phone },
        });
        if (!user) {
            res.status(404).json({ success: false, message: "No user found with this phone number" });
            return;
        }
        // Clean up OTP record
        await db_1.prisma.otpVerification.delete({
            where: { phone },
        });
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
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
            },
        });
    }
    catch (error) {
        console.error("Verify OTP error:", error);
        res.status(500).json({ success: false, message: "Server error during OTP verification" });
    }
};
exports.loginWithOtp = loginWithOtp;
const updateProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Not authenticated" });
            return;
        }
        const { firstName, lastName, email, phoneNumber } = req.body;
        if (!firstName || !lastName || !email) {
            res.status(400).json({ success: false, message: "First name, last name, and email are required" });
            return;
        }
        // Check if email is already taken by another user
        const existingEmailUser = await db_1.prisma.user.findFirst({
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
            const existingPhoneUser = await db_1.prisma.user.findFirst({
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
        const updatedUser = await db_1.prisma.user.update({
            where: { id: userId },
            data: {
                firstName,
                lastName,
                email: email.toLowerCase(),
                phoneNumber: phoneNumber || null,
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
            },
        });
    }
    catch (error) {
        console.error("UpdateProfile error:", error);
        res.status(500).json({ success: false, message: "Server error during profile update" });
    }
};
exports.updateProfile = updateProfile;
