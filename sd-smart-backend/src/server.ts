import "dotenv/config";
import app from "./app";
import { prisma } from "./utils/db";
import { seedSuperAdmin } from "./utils/seedSuperAdmin";
import { seedCategories } from "./utils/seedCategories";

const PORT = process.env.PORT || 5001;

// Auto-seed startup helpers sequentially (non-fatal if they fail)
async function startServer() {
  try {
    await seedSuperAdmin();
    await seedCategories();
  } catch (err) {
    console.error("[server] ❌ Startup seeding failed:", err);
  }

  app.listen(PORT, () => {
    console.log(`[server]: Backend server is running on http://localhost:${PORT}`);
  });
}

startServer();

