import "dotenv/config";
import app from "./app";
import { prisma } from "./utils/db";
import { seedSuperAdmin } from "./utils/seedSuperAdmin";

const PORT = process.env.PORT || 5001;

// Auto-seed superadmin from .env on every startup (non-fatal if it fails)
seedSuperAdmin().then(() => {
  app.listen(PORT, () => {
    console.log(`[server]: Backend server is running on http://localhost:${PORT}`);
  });
});
