import "dotenv/config"; // Run dotenv immediately on load to prevent import hoisting issues
import { prisma } from "../src/utils/db";
import bcrypt from "bcryptjs";

async function checkAdmin() {
  const email = process.env.SUPERADMIN_EMAIL?.toLowerCase() || "superadmin@sdsmart.com";
  const password = process.env.SUPERADMIN_PASSWORD || "SuperAdmin2026!";

  console.log(`Diagnostic for Admin Login:`);
  console.log(`- Configured Email: "${email}"`);
  console.log(`- Configured Password: "${password}"`);

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log(`❌ User with email "${email}" was NOT found in the database!`);
      return;
    }

    console.log(`✅ User found in database:`);
    console.log(`  - ID: ${user.id}`);
    console.log(`  - Name: ${user.firstName} ${user.lastName}`);
    console.log(`  - Role: "${user.role}"`);
    console.log(`  - Approval Status: "${user.approvalStatus}"`);

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      console.log(`✅ Password comparison match: SUCCESS! The password "SuperAdmin2026!" is correct for this hash.`);
    } else {
      console.log(`❌ Password comparison match: FAILED! The password "SuperAdmin2026!" does NOT match the hash stored in the database.`);
      
      // Let's check if the password in the database matches without quotes if they were mistakenly parsed
      const cleanPassword = password.replace(/^["']|["']$/g, "");
      if (cleanPassword !== password) {
        const isMatchClean = await bcrypt.compare(cleanPassword, user.password);
        if (isMatchClean) {
          console.log(`💡 Note: The password matched when removing surrounding quotes! Your .env parser might be including the quotes in the string.`);
        }
      }
    }
  } catch (err: any) {
    console.error(`❌ Diagnostic error:`, err.message);
  }
}

checkAdmin();
