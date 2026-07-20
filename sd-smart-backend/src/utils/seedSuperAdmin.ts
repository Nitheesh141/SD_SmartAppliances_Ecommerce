import bcrypt from "bcryptjs";
import { prisma } from "./db";

/**
 * Automatically seeds or syncs the superadmin user on server startup.
 * Credentials are read exclusively from SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD in .env.
 * No credentials are hardcoded in this file.
 */
export const seedSuperAdmin = async (): Promise<void> => {
  const email = process.env.SUPERADMIN_EMAIL?.toLowerCase();
  const password = process.env.SUPERADMIN_PASSWORD;

  // Skip entirely if credentials are not configured in .env
  if (!email || !password) {
    console.warn("[SeedSuperAdmin] ⚠️  SUPERADMIN_EMAIL or SUPERADMIN_PASSWORD not set in .env — skipping.");
    return;
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const existing = await prisma.user.findUnique({ where: { email } });

    if (!existing) {
      await prisma.user.create({
        data: {
          email,
          firstName: "Super",
          lastName: "Admin",
          password: hashedPassword,
          role: "ADMIN",
        },
      });
      console.log(`[SeedSuperAdmin] ✅ Superadmin account created.`);
    } else {
      // Always sync password + role so .env changes are applied on restart
      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword, role: "ADMIN" },
      });
      console.log(`[SeedSuperAdmin] ✅ Superadmin credentials synced from .env.`);
    }
  } catch (err: any) {
    // Non-fatal — server continues to start even if this fails
    console.error("[SeedSuperAdmin] ❌ Failed:", err.message);
  }
};
