import "dotenv/config";
import app from "./app";
import cron from "node-cron";
import { prisma } from "./utils/db";

const PORT = process.env.PORT || 5000;

// Run every day at 12:00 AM (midnight)
cron.schedule("0 0 * * *", async () => {
    console.log("[cron]: Resetting daily stockIn and stockOut values...");
    try {
        await prisma.product.updateMany({
            data: {
                stockIn: 0,
                stockOut: 0
            }
        });
        console.log("[cron]: Successfully reset daily stock values.");
    } catch (error) {
        console.error("[cron]: Failed to reset daily stock values:", error);
    }
});

app.listen(PORT, () => {
    console.log(`[server]: Backend server is running on http://localhost:${PORT}`);
});