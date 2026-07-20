import "dotenv/config";
import app from "./app";
import { prisma } from "./utils/db";
import { seedSuperAdmin } from "./utils/seedSuperAdmin";
import { seedCategories } from "./utils/seedCategories";

const PORT = process.env.PORT || 5001;

// Auto-seed startup helpers (non-fatal if they fail)
Promise.all([
  seedSuperAdmin(),
  seedCategories()
]).then(() => {
  app.listen(PORT, () => {
    console.log(`[server]: Backend server is running on http://localhost:${PORT}`);
  });
});
