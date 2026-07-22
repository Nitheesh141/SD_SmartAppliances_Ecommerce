import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env before importing db utility
dotenv.config({ path: path.join(__dirname, "../.env") });

import { prisma } from "../src/utils/db";

async function run() {
  console.log("Connecting to database to migrate role values...");

  try {
    // 1. Check if the User table exists
    const tableCheck = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'User'
      );
    `;

    if (!tableCheck[0] || !tableCheck[0].exists) {
      console.log("ℹ️ User table does not exist yet. Skipping role migration.");
      return;
    }

    // 2. Map existing roles to new enum values
    console.log("Updating role values in User table...");
    
    // Update 'user' -> 'CUSTOMER'
    const resUser = await prisma.$executeRawUnsafe(`
      UPDATE "User" 
      SET role = 'CUSTOMER' 
      WHERE role = 'user';
    `);
    console.log(`Updated 'user' to 'CUSTOMER': ${resUser} rows/matched`);

    // Update 'admin' -> 'ADMIN'
    const resAdmin = await prisma.$executeRawUnsafe(`
      UPDATE "User" 
      SET role = 'ADMIN' 
      WHERE role = 'admin';
    `);
    console.log(`Updated 'admin' to 'ADMIN': ${resAdmin} rows/matched`);

    // Update 'superadmin' -> 'ADMIN'
    const resSuper = await prisma.$executeRawUnsafe(`
      UPDATE "User" 
      SET role = 'ADMIN' 
      WHERE role = 'superadmin';
    `);
    console.log(`Updated 'superadmin' to 'ADMIN': ${resSuper} rows/matched`);

    // Update 'distributor' -> 'DISTRIBUTOR'
    const resDist = await prisma.$executeRawUnsafe(`
      UPDATE "User" 
      SET role = 'DISTRIBUTOR' 
      WHERE role = 'distributor';
    `);
    console.log(`Updated 'distributor' to 'DISTRIBUTOR': ${resDist} rows/matched`);

    console.log("✅ Database role migration successful!");
  } catch (err: any) {
    console.error("❌ Error during database role migration:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
