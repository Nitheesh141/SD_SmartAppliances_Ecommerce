"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedSuperAdmin = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("./db");
/**
 * Automatically seeds or syncs the superadmin user on server startup.
 * Credentials are read exclusively from SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD in .env.
 * No credentials are hardcoded in this file.
 */
const seedSuperAdmin = async () => {
    const email = process.env.SUPERADMIN_EMAIL?.toLowerCase();
    const password = process.env.SUPERADMIN_PASSWORD;
    // Skip entirely if credentials are not configured in .env
    if (!email || !password) {
        console.warn("[SeedSuperAdmin] ⚠️  SUPERADMIN_EMAIL or SUPERADMIN_PASSWORD not set in .env — skipping.");
        return;
    }
    try {
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const existing = await db_1.prisma.user.findUnique({ where: { email } });
        if (!existing) {
            await db_1.prisma.user.create({
                data: {
                    email,
                    firstName: "Super",
                    lastName: "Admin",
                    password: hashedPassword,
                    role: "ADMIN",
                },
            });
            console.log(`[SeedSuperAdmin] ✅ Superadmin account created.`);
        }
        else {
            // Always sync password + role so .env changes are applied on restart
            await db_1.prisma.user.update({
                where: { email },
                data: { password: hashedPassword, role: "ADMIN" },
            });
            console.log(`[SeedSuperAdmin] ✅ Superadmin credentials synced from .env.`);
        }
    }
    catch (err) {
        // Non-fatal — server continues to start even if this fails
        console.error("[SeedSuperAdmin] ❌ Failed:", err.message);
    }
};
exports.seedSuperAdmin = seedSuperAdmin;
