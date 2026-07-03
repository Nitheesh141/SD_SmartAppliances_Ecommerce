"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../utils/db");
async function main() {
    console.log("Starting migration for distributor items...");
    // Fetch all distributor requests that have distributorItems
    const requests = await db_1.prisma.serviceRequest.findMany({
        where: {
            isDistributor: true,
            distributorItems: {
                not: "null", // Prisma JSON filter
            },
        },
    });
    console.log(`Found ${requests.length} distributor requests.`);
    let updatedCount = 0;
    for (const req of requests) {
        if (!req.distributorItems || !Array.isArray(req.distributorItems)) {
            continue;
        }
        let items = req.distributorItems;
        let needsUpdate = false;
        // Check and update items
        const updatedItems = items.map((item) => {
            let updatedItem = { ...item };
            if (!updatedItem.currentStatus) {
                updatedItem.currentStatus = req.currentStatus;
                needsUpdate = true;
            }
            if (!updatedItem.warrantyStatus) {
                updatedItem.warrantyStatus = req.warrantyStatus;
                needsUpdate = true;
            }
            return updatedItem;
        });
        if (needsUpdate) {
            await db_1.prisma.serviceRequest.update({
                where: { id: req.id },
                data: { distributorItems: updatedItems },
            });
            console.log(`Updated request ${req.ticketId} with fallback data.`);
            updatedCount++;
        }
    }
    console.log(`Migration completed successfully. Updated ${updatedCount} requests.`);
}
main()
    .catch((e) => {
    console.error("Migration failed:", e);
})
    .finally(async () => {
    await db_1.prisma.$disconnect();
});
