import { prisma } from "./db";

export const seedCategories = async () => {
  try {
    const count = await prisma.category.count();
    if (count === 0) {
      const defaultCategories = [
        { name: "Pressure Cookers", slug: "pressure-cookers" },
        { name: "Non-Stick Cookware", slug: "non-stick" },
        { name: "LPG Stoves", slug: "gas-stoves" },
        { name: "Wet Grinders", slug: "wet-grinders" },
        { name: "Commercial Wet Grinders", slug: "commercial" }
      ];
      await prisma.category.createMany({
        data: defaultCategories
      });
      console.log("[SeedCategories] ✅ Hardcoded default categories seeded successfully.");
    }
  } catch (error) {
    console.error("[SeedCategories] ❌ Error seeding default categories:", error);
  }
};
