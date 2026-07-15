import { prisma } from "../utils/db";

// Helper function to extract a product's brand from specs or fallback
function getProductBrand(product: any): string {
  if (product.eyebrow) return product.eyebrow.trim().toLowerCase();
  if (product.specs && Array.isArray(product.specs)) {
    const brandSpec = product.specs.find(
      (s: any) =>
        s.label?.toLowerCase() === "brand" ||
        s.label?.toLowerCase() === "manufacturer"
    );
    if (brandSpec && brandSpec.value) {
      return brandSpec.value.trim().toLowerCase();
    }
  }
  return product.name.split(" ")[0].toLowerCase();
}

/**
 * Reusable pricing utility to calculate the original price, discount amount,
 * discount percentage, and final selling price for a product based on active offers.
 */
export function calculateProductPrice(product: any, activeOffers: any[]) {
  // MRP / strikethrough price
  const baseOriginal = Number(product.originalPrice || product.price || 0);
  // Current selling price before dynamic offers
  let currentPrice = Number(product.price || 0);

  // Filter direct automatically applied offers
  const sortedDirectOffers = activeOffers
    .filter(offer => [
      "FLASH_SALE",
      "PRODUCT_DISCOUNT",
      "CATEGORY_DISCOUNT",
      "BRAND_DISCOUNT",
      "FLAT_DISCOUNT",
      "PERCENTAGE_DISCOUNT",
      "SEASONAL"
    ].includes(offer.offerType) && offer.applyAutomatically)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  let appliedOffer = null;
  let hasAppliedNonStackable = false;
  const appliedList: any[] = [];
  const productBrand = getProductBrand(product);

  for (const offer of sortedDirectOffers) {
    const config = offer.configuration || {};

    // Check stackability rules
    if (hasAppliedNonStackable) continue;
    if (appliedList.some(o => !o.stackable)) continue;
    if (!offer.stackable && appliedList.length > 0) continue;

    // Check if offer targets this product
    let isApplicable = false;
    const type = offer.offerType;

    if (type === "PRODUCT_DISCOUNT") {
      isApplicable = Array.isArray(config.productIds) && config.productIds.includes(product.id);
    } else if (type === "CATEGORY_DISCOUNT") {
      isApplicable = Array.isArray(config.categoryIds) && config.categoryIds.includes(product.category);
    } else if (type === "BRAND_DISCOUNT") {
      isApplicable = String(config.brandName).trim().toLowerCase() === productBrand;
    } else if (type === "FLAT_DISCOUNT" || type === "PERCENTAGE_DISCOUNT") {
      const pMatch = !config.applicableProducts || config.applicableProducts.length === 0 || config.applicableProducts.includes(product.id);
      const cMatch = !config.applicableCategories || config.applicableCategories.length === 0 || config.applicableCategories.includes(product.category);
      isApplicable = pMatch && cMatch;
    } else if (type === "FLASH_SALE") {
      isApplicable = Array.isArray(config.productIds) && config.productIds.includes(product.id);
    } else if (type === "SEASONAL") {
      const pMatch = !config.applicableProducts || config.applicableProducts.length === 0 || config.applicableProducts.includes(product.id);
      const cMatch = !config.applicableCategories || config.applicableCategories.length === 0 || config.applicableCategories.includes(product.category);
      isApplicable = pMatch && cMatch;
    }

    if (!isApplicable) continue;

    // Evaluate discount amount
    let discountAmt = 0;

    if (type === "PRODUCT_DISCOUNT" || type === "CATEGORY_DISCOUNT" || type === "BRAND_DISCOUNT" || type === "FLASH_SALE" || type === "SEASONAL") {
      const discType = config.discountType || "PERCENTAGE";
      const discVal = Number(config.discountValue || 0);
      const maxCap = config.maxDiscountAmount ? Number(config.maxDiscountAmount) : null;

      if (discType === "PERCENTAGE") {
        discountAmt = currentPrice * (discVal / 100);
        if (maxCap) discountAmt = Math.min(discountAmt, maxCap);
      } else {
        discountAmt = discVal;
      }
    } else if (type === "FLAT_DISCOUNT") {
      const minVal = config.minPurchaseValue ? Number(config.minPurchaseValue) : 0;
      if (currentPrice >= minVal) {
        discountAmt = Number(config.flatDiscountAmount || 0);
      }
    } else if (type === "PERCENTAGE_DISCOUNT") {
      const minVal = config.minPurchaseValue ? Number(config.minPurchaseValue) : 0;
      if (currentPrice >= minVal) {
        const val = Number(config.percentageValue || 0);
        const maxCap = config.maxDiscountCap ? Number(config.maxDiscountCap) : null;
        discountAmt = currentPrice * (val / 100);
        if (maxCap) discountAmt = Math.min(discountAmt, maxCap);
      }
    }

    if (discountAmt > 0) {
      currentPrice = Math.max(0, currentPrice - discountAmt);
      appliedList.push(offer);
      if (!offer.stackable) hasAppliedNonStackable = true;
      if (!appliedOffer) {
        appliedOffer = offer;
      }
    }
  }

  const finalPrice = Math.round(currentPrice);
  const discountAmount = Math.max(0, baseOriginal - finalPrice);
  const discountPercentage = baseOriginal > finalPrice ? Math.round(((baseOriginal - finalPrice) / baseOriginal) * 100) : 0;

  return {
    originalPrice: baseOriginal,
    discountAmount,
    discountPercentage,
    finalPrice,
    appliedOffer
  };
}

/**
 * High-level utility to attach dynamic pricing to product list or single product.
 */
export async function applyDynamicPricesToProducts(products: any | any[], user?: any) {
  const isArray = Array.isArray(products);
  const productList = isArray ? products : [products];
  if (productList.length === 0) return products;

  const isDistUser = user && (user.role?.toUpperCase() === "DISTRIBUTOR" || user.role === "distributor");

  // Fetch active offers (Distributors are not eligible for dynamic category/product/brand offers)
  const now = new Date();
  const activeOffers = isDistUser ? [] : await prisma.offer.findMany({
    where: {
      status: "ACTIVE",
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: { createdAt: "asc" },
  });

  const updatedList = await Promise.all(productList.map(async product => {
    let baseProduct = { ...product };

    if (isDistUser) {
      let distPricing = product.distributorPricing;
      if (!distPricing) {
        distPricing = await prisma.distributorPricing.findFirst({
          where: { productId: product.id, status: "ACTIVE" }
        });
      }

      if (distPricing && distPricing.status === "ACTIVE") {
        baseProduct.originalPrice = distPricing.mrp;
        baseProduct.price = distPricing.dealerPrice;
      }
    }

    const calc = calculateProductPrice(baseProduct, activeOffers);
    return {
      ...product,
      price: calc.finalPrice,
      originalPrice: calc.originalPrice,
      discountPercent: calc.discountPercentage,
      discountAmount: calc.discountAmount,
      appliedOffer: calc.appliedOffer ? {
        id: calc.appliedOffer.id,
        name: calc.appliedOffer.name,
        code: calc.appliedOffer.code,
        offerType: calc.appliedOffer.offerType,
        displayBadgeText: calc.appliedOffer.displayBadgeText,
        badgeColor: calc.appliedOffer.badgeColor,
      } : null
    };
  }));

  return isArray ? updatedList : updatedList[0];
}
