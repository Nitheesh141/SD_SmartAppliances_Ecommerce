import { Client } from "pg";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, "../.env") });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL is not set in .env");
  process.exit(1);
}

async function run() {
  console.log("Connecting to database to migrate role values...");
  const client = new Client({ connectionString });
  await client.connect();

  try {
    // 1. Check if the User table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'User'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log("ℹ️ User table does not exist yet. Skipping role migration.");
      return;
    }

    // 2. Map existing roles to new enum values
    console.log("Updating role values in User table...");
    
    // Update 'user' -> 'CUSTOMER'
    const resUser = await client.query(`
      UPDATE "User" 
      SET role = 'CUSTOMER' 
      WHERE role = 'user';
    `);
    console.log(`Updated 'user' to 'CUSTOMER': ${resUser.rowCount} rows`);

    // Update 'admin' -> 'ADMIN'
    const resAdmin = await client.query(`
      UPDATE "User" 
      SET role = 'ADMIN' 
      WHERE role = 'admin';
    `);
    console.log(`Updated 'admin' to 'ADMIN': ${resAdmin.rowCount} rows`);

    // Update 'superadmin' -> 'ADMIN'
    const resSuper = await client.query(`
      UPDATE "User" 
      SET role = 'ADMIN' 
      WHERE role = 'superadmin';
    `);
    console.log(`Updated 'superadmin' to 'ADMIN': ${resSuper.rowCount} rows`);

    // Update 'distributor' -> 'DISTRIBUTOR'
    const resDist = await client.query(`
      UPDATE "User" 
      SET role = 'DISTRIBUTOR' 
      WHERE role = 'distributor';
    `);
    console.log(`Updated 'distributor' to 'DISTRIBUTOR': ${resDist.rowCount} rows`);

    console.log("✅ Database role migration successful!");
  } catch (err: any) {
    console.error("❌ Error during database role migration:", err.message);
  } finally {
    await client.end();
  }
}

run();
