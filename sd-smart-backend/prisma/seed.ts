import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is missing");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding started...");

  // Seed Super Admin
  const superAdminEmail = process.env.SUPERADMIN_EMAIL || "superadmin@sdsmart.com";
  const superAdminPassword = process.env.SUPERADMIN_PASSWORD || "SuperAdmin2026!";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: superAdminEmail }
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(superAdminPassword, 10);
    await prisma.user.create({
      data: {
        email: superAdminEmail,
        firstName: "Super",
        lastName: "Admin",
        password: hashedPassword,
        role: "superadmin"
      }
    });
    console.log("Super Admin seeded successfully: " + superAdminEmail);
  } else {
    console.log("Super Admin user already exists: " + superAdminEmail);
  }
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
