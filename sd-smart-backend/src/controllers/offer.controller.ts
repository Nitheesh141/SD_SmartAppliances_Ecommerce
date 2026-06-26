import { Request, Response } from "express";
import { prisma } from "../utils/db";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

// Helper function to extract a product's brand from specs or fallback
const getProductBrand = (product: any): string => {
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
};

// Helper function to calculate a user's loyalty tier
const getUserTier = (orders: any[]): "SILVER" | "GOLD" | "PLATINUM" => {
  const completedOrders = orders.filter(
    (o: any) =>
      o.status?.toLowerCase() === "delivered" ||
      o.status?.toLowerCase() === "completed"
  );
  const totalSpent = completedOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  if (totalSpent >= 20000 || completedOrders.length >= 6) {
    return "PLATINUM";
  } else if (totalSpent >= 5000 || completedOrders.length >= 3) {
    return "GOLD";
  }
  return "SILVER";
};

// 1. Get all offers (Admin & Public)
export const getOffers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, type } = req.query;
    const whereClause: any = {};

    if (status) {
      whereClause.status = String(status);
    }
    if (type) {
      whereClause.offerType = String(type);
    }

    const offers = await prisma.offer.findMany({
      where: whereClause,
      orderBy: { priority: "asc" },
    });

    res.json({ success: true, offers });
  } catch (error: any) {
    console.error("Get offers error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch offers" });
  }
};

// 2. Get single offer by ID
export const getOfferById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const offer = await prisma.offer.findUnique({
      where: { id },
    });

    if (!offer) {
      res.status(404).json({ success: false, message: "Offer not found" });
      return;
    }

    res.json({ success: true, offer });
  } catch (error: any) {
    console.error("Get offer error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch offer details" });
  }
};

// 3. Create an offer (Admin only)
export const createOffer = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const roleUpper = user?.role?.toUpperCase();
    if (!user || (roleUpper !== "ADMIN" && roleUpper !== "SUPERADMIN")) {
      res.status(403).json({ success: false, message: "Admin role required." });
      return;
    }

    const {
      name,
      code,
      description,
      offerType,
      bannerImage,
      priority,
      status,
      startDate,
      endDate,
      applyAutomatically,
      stackable,
      maxUsageLimit,
      usagePerCustomer,
      displayBadgeText,
      badgeColor,
      termsConditions,
      configuration,
    } = req.body;

    if (!name || !code || !offerType || !startDate || !endDate) {
      res.status(400).json({ success: false, message: "Missing required offer fields" });
      return;
    }

    // Verify code uniqueness
    const existing = await prisma.offer.findUnique({ where: { code } });
    if (existing) {
      res.status(400).json({ success: false, message: "An offer with this code already exists" });
      return;
    }

    const offer = await prisma.offer.create({
      data: {
        name,
        code,
        description,
        offerType,
        bannerImage,
        priority: Number(priority || 0),
        status: status || "ACTIVE",
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        applyAutomatically: applyAutomatically ?? true,
        stackable: stackable ?? false,
        maxUsageLimit: maxUsageLimit ? Number(maxUsageLimit) : null,
        usagePerCustomer: Number(usagePerCustomer || 1),
        displayBadgeText,
        badgeColor: badgeColor || "red",
        termsConditions,
        configuration: configuration || {},
        createdBy: user.email,
      },
    });

    res.status(201).json({ success: true, offer });
  } catch (error: any) {
    console.error("Create offer error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to create offer" });
  }
};

// 4. Update an offer (Admin only)
export const updateOffer = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const roleUpper = user?.role?.toUpperCase();
    if (!user || (roleUpper !== "ADMIN" && roleUpper !== "SUPERADMIN")) {
      res.status(403).json({ success: false, message: "Admin role required." });
      return;
    }

    const id = req.params.id as string;
    const {
      name,
      code,
      description,
      offerType,
      bannerImage,
      priority,
      status,
      startDate,
      endDate,
      applyAutomatically,
      stackable,
      maxUsageLimit,
      usagePerCustomer,
      displayBadgeText,
      badgeColor,
      termsConditions,
      configuration,
    } = req.body;

    const existingOffer = await prisma.offer.findUnique({ where: { id } });
    if (!existingOffer) {
      res.status(404).json({ success: false, message: "Offer not found" });
      return;
    }

    const offer = await prisma.offer.update({
      where: { id },
      data: {
        name,
        code,
        description,
        offerType,
        bannerImage,
        priority: priority !== undefined ? Number(priority) : undefined,
        status,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        applyAutomatically,
        stackable,
        maxUsageLimit: maxUsageLimit !== undefined ? (maxUsageLimit ? Number(maxUsageLimit) : null) : undefined,
        usagePerCustomer: usagePerCustomer !== undefined ? Number(usagePerCustomer) : undefined,
        displayBadgeText,
        badgeColor,
        termsConditions,
        configuration: configuration !== undefined ? configuration : undefined,
        lastModifiedBy: user.email,
      },
    });

    res.json({ success: true, offer });
  } catch (error: any) {
    console.error("Update offer error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to update offer" });
  }
};

// 5. Delete an offer (Admin only)
export const deleteOffer = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const roleUpper = user?.role?.toUpperCase();
    if (!user || (roleUpper !== "ADMIN" && roleUpper !== "SUPERADMIN")) {
      res.status(403).json({ success: false, message: "Admin role required." });
      return;
    }

    const id = req.params.id as string;
    await prisma.offer.delete({ where: { id } });

    res.json({ success: true, message: "Offer deleted successfully" });
  } catch (error: any) {
    console.error("Delete offer error:", error);
    res.status(500).json({ success: false, message: "Failed to delete offer" });
  }
};

// Helper function to check if an offer is applicable based on auto-apply and coupon code rules
const isOfferApplicable = (offer: any, couponCode?: string): boolean => {
  if (offer.status !== "ACTIVE") return false;
  
  // 1. If set to apply automatically, it's always applicable
  if (offer.applyAutomatically) return true;
  
  // 2. If not automatic, it is only applicable if the user provided a matching coupon code
  if (couponCode) {
    const codeToMatch = String(couponCode).trim().toLowerCase();
    const offerCode = String(offer.code).trim().toLowerCase();
    const configCouponCode = String((offer.configuration as any)?.couponCode || "").trim().toLowerCase();
    
    return offerCode === codeToMatch || (configCouponCode !== "" && configCouponCode === codeToMatch);
  }
  
  return false;
};

// 6. Dynamic Pricing Priority Engine
// Core pricing engine reusable helper
export const runPricingEngine = async (
  user: any,
  items: any[],
  couponCode?: string
) => {
  // A. Fetch the products details
  const productIds = items.map((i: any) => i.productId);
  const dbProducts = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  if (dbProducts.length === 0) {
    throw new Error("Products not found in store database");
  }

  // B. Fetch active offers in order of priority (lower number = runs first)
  const now = new Date();
  const activeOffers = await prisma.offer.findMany({
    where: {
      status: "ACTIVE",
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: { priority: "asc" },
  });

  // C. Initialize item states
  const calculatedItems = items.map((cartItem: any) => {
    const product = dbProducts.find((p) => p.id === cartItem.productId);
    if (!product) {
      throw new Error(`Product ID ${cartItem.productId} not found in catalog`);
    }
    const mrpPrice = product.originalPrice || product.price;
    const baseSellingPrice = product.price;
    return {
      productId: product.id,
      name: product.name,
      image: product.image,
      category: product.category,
      categoryLabel: product.categoryLabel,
      sku: product.sku,
      originalPrice: mrpPrice,
      defaultDiscountPrice: baseSellingPrice,
      quantity: Number(cartItem.quantity),
      unitPrice: baseSellingPrice,
      totalPrice: baseSellingPrice * Number(cartItem.quantity),
      appliedOffers: [] as any[],
      brand: getProductBrand(product),
    };
  });

  // Track state of stackability
  let hasAppliedNonStackable = false;
  const appliedOffersGlobal: any[] = [];
  const freeItemsToAdd: any[] = [];

  // Helper to evaluate flat vs percentage discount values
  const evaluateDiscount = (
    type: string,
    value: number,
    currentPrice: number,
    maxCap?: number | null
  ) => {
    let amt = 0;
    if (type === "PERCENTAGE") {
      amt = currentPrice * (value / 100);
      if (maxCap) amt = Math.min(amt, maxCap);
    } else {
      amt = value;
    }
    return amt;
  };

  // Helper to verify if an item can accept an offer (checks stackability)
  const canApplyOffer = (item: any, offer: any) => {
    if (hasAppliedNonStackable) return false;
    if (item.appliedOffers.some((o: any) => !o.stackable)) return false;
    if (!offer.stackable && item.appliedOffers.length > 0) return false;
    return true;
  };

  // 1. PRODUCT_DISCOUNT
  const productOffers = activeOffers.filter(
    (o) => o.offerType === "PRODUCT_DISCOUNT" && isOfferApplicable(o, couponCode)
  );
  for (const offer of productOffers) {
    const config = offer.configuration as any;
    const targetIds = config.productIds || [];
    const minPurchaseQty = Number(config.minPurchaseQty || 1);

    for (const item of calculatedItems) {
      if (targetIds.includes(item.productId) && item.quantity >= minPurchaseQty) {
        if (canApplyOffer(item, offer)) {
          const disc = evaluateDiscount(
            config.discountType,
            Number(config.discountValue || 0),
            item.unitPrice,
            config.maxDiscountAmount
          );
          item.unitPrice = Math.max(0, item.unitPrice - disc);
          item.appliedOffers.push({
            offerId: offer.id,
            name: offer.name,
            code: offer.code,
            stackable: offer.stackable,
            discountAmount: disc,
          });
          if (!offer.stackable) hasAppliedNonStackable = true;
          if (!appliedOffersGlobal.some((o) => o.offerId === offer.id)) {
            appliedOffersGlobal.push({ offerId: offer.id, code: offer.code, name: offer.name });
          }
        }
      }
    }
  }

  // 2. CATEGORY_DISCOUNT
  const categoryOffers = activeOffers.filter(
    (o) => o.offerType === "CATEGORY_DISCOUNT" && isOfferApplicable(o, couponCode)
  );
  for (const offer of categoryOffers) {
    const config = offer.configuration as any;
    const allowedCategories = config.categoryIds || [];
    const excludedIds = config.excludedProductIds || [];

    for (const item of calculatedItems) {
      if (
        allowedCategories.includes(item.category) &&
        !excludedIds.includes(item.productId)
      ) {
        if (canApplyOffer(item, offer)) {
          const disc = evaluateDiscount(
            config.discountType,
            Number(config.discountValue || 0),
            item.unitPrice,
            config.maxDiscountAmount
          );
          item.unitPrice = Math.max(0, item.unitPrice - disc);
          item.appliedOffers.push({
            offerId: offer.id,
            name: offer.name,
            code: offer.code,
            stackable: offer.stackable,
            discountAmount: disc,
          });
          if (!offer.stackable) hasAppliedNonStackable = true;
          if (!appliedOffersGlobal.some((o) => o.offerId === offer.id)) {
            appliedOffersGlobal.push({ offerId: offer.id, code: offer.code, name: offer.name });
          }
        }
      }
    }
  }

  // 3. BRAND_DISCOUNT
  const brandOffers = activeOffers.filter(
    (o) => o.offerType === "BRAND_DISCOUNT" && isOfferApplicable(o, couponCode)
  );
  for (const offer of brandOffers) {
    const config = offer.configuration as any;
    const targetBrand = (config.brandName || "").trim().toLowerCase();
    const excludedIds = config.excludedProductIds || [];

    for (const item of calculatedItems) {
      if (item.brand === targetBrand && !excludedIds.includes(item.productId)) {
        if (canApplyOffer(item, offer)) {
          const disc = evaluateDiscount(
            config.discountType,
            Number(config.discountValue || 0),
            item.unitPrice,
            config.maxDiscountAmount
          );
          item.unitPrice = Math.max(0, item.unitPrice - disc);
          item.appliedOffers.push({
            offerId: offer.id,
            name: offer.name,
            code: offer.code,
            stackable: offer.stackable,
            discountAmount: disc,
          });
          if (!offer.stackable) hasAppliedNonStackable = true;
          if (!appliedOffersGlobal.some((o) => o.offerId === offer.id)) {
            appliedOffersGlobal.push({ offerId: offer.id, code: offer.code, name: offer.name });
          }
        }
      }
    }
  }

  // 4. QUANTITY_DISCOUNT
  const qtyOffers = activeOffers.filter(
    (o) => o.offerType === "QUANTITY_DISCOUNT" && isOfferApplicable(o, couponCode)
  );
  for (const offer of qtyOffers) {
    const config = offer.configuration as any;
    const rules = config.rules || [];
    const targetProductIds = config.productIds || [];
    const targetCategoryIds = config.categoryIds || [];

    for (const item of calculatedItems) {
      const matchesProduct = targetProductIds.length === 0 || targetProductIds.includes(item.productId);
      const matchesCategory = targetCategoryIds.length === 0 || targetCategoryIds.includes(item.category);

      if (matchesProduct && matchesCategory) {
        const applicableRules = rules
          .filter((r: any) => item.quantity >= r.minQty)
          .sort((a: any, b: any) => b.minQty - a.minQty);

        if (applicableRules.length > 0 && canApplyOffer(item, offer)) {
          const bestRule = applicableRules[0];
          const disc = evaluateDiscount(
            bestRule.discountType,
            Number(bestRule.discountValue || 0),
            item.unitPrice
          );
          item.unitPrice = Math.max(0, item.unitPrice - disc);
          item.appliedOffers.push({
            offerId: offer.id,
            name: offer.name,
            code: offer.code,
            stackable: offer.stackable,
            discountAmount: disc,
          });
          if (!offer.stackable) hasAppliedNonStackable = true;
          if (!appliedOffersGlobal.some((o) => o.offerId === offer.id)) {
            appliedOffersGlobal.push({ offerId: offer.id, code: offer.code, name: offer.name });
          }
        }
      }
    }
  }

  // 5. FLAT_DISCOUNT / PERCENTAGE_DISCOUNT
  const genericDiscounts = activeOffers.filter(
    (o) => (o.offerType === "FLAT_DISCOUNT" || o.offerType === "PERCENTAGE_DISCOUNT") && isOfferApplicable(o, couponCode)
  );
  for (const offer of genericDiscounts) {
    const config = offer.configuration as any;
    if (offer.offerType === "FLAT_DISCOUNT") {
      const allowedProducts = config.applicableProducts || [];
      const allowedCategories = config.applicableCategories || [];

      for (const item of calculatedItems) {
        const matchesProduct = allowedProducts.length === 0 || allowedProducts.includes(item.productId);
        const matchesCategory = allowedCategories.length === 0 || allowedCategories.includes(item.category);

        if (matchesProduct && matchesCategory) {
          const isPurchaseValueMet = !config.minPurchaseValue || (item.unitPrice * item.quantity) >= Number(config.minPurchaseValue);
          if (isPurchaseValueMet && canApplyOffer(item, offer)) {
            const disc = Number(config.flatDiscountAmount || 0);
            item.unitPrice = Math.max(0, item.unitPrice - disc);
            item.appliedOffers.push({
              offerId: offer.id,
              name: offer.name,
              code: offer.code,
              stackable: offer.stackable,
              discountAmount: disc,
            });
            if (!offer.stackable) hasAppliedNonStackable = true;
            if (!appliedOffersGlobal.some((o) => o.offerId === offer.id)) {
              appliedOffersGlobal.push({ offerId: offer.id, code: offer.code, name: offer.name });
            }
          }
        }
      }
    } else {
      const allowedProducts = config.applicableProducts || [];
      const allowedCategories = config.applicableCategories || [];

      for (const item of calculatedItems) {
        const matchesProduct = allowedProducts.length === 0 || allowedProducts.includes(item.productId);
        const matchesCategory = allowedCategories.length === 0 || allowedCategories.includes(item.category);

        if (matchesProduct && matchesCategory) {
          const isPurchaseValueMet = !config.minPurchaseValue || (item.unitPrice * item.quantity) >= Number(config.minPurchaseValue);
          if (isPurchaseValueMet && canApplyOffer(item, offer)) {
            const disc = evaluateDiscount(
              "PERCENTAGE",
              Number(config.percentageValue || 0),
              item.unitPrice,
              config.maxDiscountCap
            );
            item.unitPrice = Math.max(0, item.unitPrice - disc);
            item.appliedOffers.push({
              offerId: offer.id,
              name: offer.name,
              code: offer.code,
              stackable: offer.stackable,
              discountAmount: disc,
            });
            if (!offer.stackable) hasAppliedNonStackable = true;
            if (!appliedOffersGlobal.some((o) => o.offerId === offer.id)) {
              appliedOffersGlobal.push({ offerId: offer.id, code: offer.code, name: offer.name });
            }
          }
        }
      }
    }
  }

  // 6. BOGO
  const bogoOffers = activeOffers.filter((o) => o.offerType === "BOGO" && isOfferApplicable(o, couponCode));
  for (const offer of bogoOffers) {
    const config = offer.configuration as any;
    const buyItem = calculatedItems.find((i) => i.productId === config.buyProductId);

    if (buyItem) {
      const buyQty = Number(config.buyQty || 1);
      const getQty = Number(config.getQty || 1);

      if (buyItem.quantity >= buyQty) {
        if (config.offerType === "SAME" || config.buyProductId === config.getProductId) {
          // Calculate freeQty based on buyQty purchased
          const multiplier = Math.floor(buyItem.quantity / buyQty);
          let freeQty = multiplier * getQty;
          if (config.maxFreeQty) {
            freeQty = Math.min(freeQty, Number(config.maxFreeQty));
          }

          if (freeQty > 0) {
            // Automatically scale total quantity: user gets original quantity + freeQty
            buyItem.quantity += freeQty;
            
            const unitVal = buyItem.unitPrice;
            buyItem.appliedOffers.push({
              offerId: offer.id,
              name: offer.name,
              code: offer.code,
              stackable: offer.stackable,
              discountAmount: unitVal * freeQty,
              bogoDescription: `BOGO applied: ${freeQty} free unit(s) added automatically!`,
            });
            if (!appliedOffersGlobal.some((o) => o.offerId === offer.id)) {
              appliedOffersGlobal.push({ offerId: offer.id, code: offer.code, name: offer.name });
            }
          }
        } else {
          let rawFreeQty = Math.floor(buyItem.quantity / buyQty) * getQty;
          if (config.maxFreeQty) {
            rawFreeQty = Math.min(rawFreeQty, Number(config.maxFreeQty));
          }

          if (rawFreeQty > 0) {
            const getItem = calculatedItems.find((i) => i.productId === config.getProductId);
            if (getItem) {
              const freeAmount = getItem.unitPrice * Math.min(getItem.quantity, rawFreeQty);
              getItem.appliedOffers.push({
                offerId: offer.id,
                name: offer.name,
                code: offer.code,
                stackable: offer.stackable,
                discountAmount: freeAmount,
                bogoDescription: `Free promotional item matched via BOGO on ${buyItem.name}`,
              });
              if (!appliedOffersGlobal.some((o) => o.offerId === offer.id)) {
                appliedOffersGlobal.push({ offerId: offer.id, code: offer.code, name: offer.name });
              }
            } else {
              const promoProduct = await prisma.product.findUnique({
                where: { id: config.getProductId },
              });
              if (promoProduct) {
                freeItemsToAdd.push({
                  productId: promoProduct.id,
                  name: promoProduct.name,
                  image: promoProduct.image,
                  quantity: rawFreeQty,
                  unitPrice: 0,
                  totalPrice: 0,
                  isFreeItem: true,
                  reason: `Free gift with purchase of ${buyItem.name} (${offer.name})`,
                });
              }
            }
          }
        }
      }
    }
  }

  // 7. COMBO / BUNDLE OFFERS
  const comboOffers = activeOffers.filter((o) => o.offerType === "COMBO" && isOfferApplicable(o, couponCode));
  for (const offer of comboOffers) {
    const config = offer.configuration as any;
    const targetIds = config.productIds || [];

    const presentItems = calculatedItems.filter((i) => targetIds.includes(i.productId));
    if (presentItems.length === targetIds.length) {
      const totalUnitSum = presentItems.reduce((sum, item) => sum + item.unitPrice, 0);
      let discountApplied = 0;

      if (config.comboDiscountType === "PERCENTAGE") {
        discountApplied = totalUnitSum * (Number(config.comboDiscountValue || 0) / 100);
      } else if (config.comboDiscountType === "FLAT") {
        discountApplied = Number(config.comboDiscountValue || 0);
      } else {
        discountApplied = totalUnitSum - Number(config.finalComboPrice || 0);
      }

      const individualDiscount = Math.max(0, discountApplied / presentItems.length);
      for (const item of presentItems) {
        if (canApplyOffer(item, offer)) {
          item.unitPrice = Math.max(0, item.unitPrice - individualDiscount);
          item.appliedOffers.push({
            offerId: offer.id,
            name: offer.name,
            code: offer.code,
            stackable: offer.stackable,
            discountAmount: individualDiscount,
          });
          if (!offer.stackable) hasAppliedNonStackable = true;
        }
      }
      if (!appliedOffersGlobal.some((o) => o.offerId === offer.id)) {
        appliedOffersGlobal.push({ offerId: offer.id, code: offer.code, name: offer.name });
      }
    }
  }

  const bundleOffers = activeOffers.filter((o) => o.offerType === "BUNDLE" && isOfferApplicable(o, couponCode));
  for (const offer of bundleOffers) {
    const config = offer.configuration as any;
    const targetIds = config.bundleProducts || [];

    const presentItems = calculatedItems.filter((i) => targetIds.includes(i.productId));
    if (presentItems.length === targetIds.length) {
      const totalUnitSum = presentItems.reduce((sum, item) => sum + item.unitPrice, 0);
      const discountApplied = config.discountAmount || (totalUnitSum * ((Number(config.discountPercentage || 0)) / 100)) || Math.max(0, totalUnitSum - Number(config.bundlePrice || 0));

      const individualDiscount = Math.max(0, discountApplied / presentItems.length);
      for (const item of presentItems) {
        if (canApplyOffer(item, offer)) {
          item.unitPrice = Math.max(0, item.unitPrice - individualDiscount);
          item.appliedOffers.push({
            offerId: offer.id,
            name: offer.name,
            code: offer.code,
            stackable: offer.stackable,
            discountAmount: individualDiscount,
          });
          if (!offer.stackable) hasAppliedNonStackable = true;
        }
      }
      if (!appliedOffersGlobal.some((o) => o.offerId === offer.id)) {
        appliedOffersGlobal.push({ offerId: offer.id, code: offer.code, name: offer.name });
      }
    }
  }

  // 8. FLASH_SALE
  const flashOffers = activeOffers.filter((o) => o.offerType === "FLASH_SALE" && isOfferApplicable(o, couponCode));
  for (const offer of flashOffers) {
    const config = offer.configuration as any;
    const targetIds = config.productIds || [];

    for (const item of calculatedItems) {
      if (targetIds.includes(item.productId) && canApplyOffer(item, offer)) {
        const eligibleQty = Math.min(item.quantity, Number(config.customerPurchaseLimit || 1), Number(config.stockLimit || 999));
        if (eligibleQty > 0) {
          const disc = evaluateDiscount(config.discountType, Number(config.discountValue || 0), item.unitPrice);
          const weightedDiscount = (disc * eligibleQty) / item.quantity;
          item.unitPrice = Math.max(0, item.unitPrice - weightedDiscount);
          item.appliedOffers.push({
            offerId: offer.id,
            name: offer.name,
            code: offer.code,
            stackable: offer.stackable,
            discountAmount: disc * eligibleQty,
            flashCount: eligibleQty,
          });
          if (!offer.stackable) hasAppliedNonStackable = true;
          if (!appliedOffersGlobal.some((o) => o.offerId === offer.id)) {
            appliedOffersGlobal.push({ offerId: offer.id, code: offer.code, name: offer.name });
          }
        }
      }
    }
  }

  // 9. SEASONAL
  const seasonalOffers = activeOffers.filter((o) => o.offerType === "SEASONAL" && isOfferApplicable(o, couponCode));
  for (const offer of seasonalOffers) {
    const config = offer.configuration as any;
    const allowedProducts = config.applicableProducts || [];
    const allowedCategories = config.applicableCategories || [];

    for (const item of calculatedItems) {
      const matchesProduct = allowedProducts.length === 0 || allowedProducts.includes(item.productId);
      const matchesCategory = allowedCategories.length === 0 || allowedCategories.includes(item.category);

      if (matchesProduct && matchesCategory && canApplyOffer(item, offer)) {
        const disc = evaluateDiscount(config.discountType, Number(config.discountValue || 0), item.unitPrice);
        item.unitPrice = Math.max(0, item.unitPrice - disc);
        item.appliedOffers.push({
          offerId: offer.id,
          name: offer.name,
          code: offer.code,
          stackable: offer.stackable,
          discountAmount: disc,
        });
        if (!offer.stackable) hasAppliedNonStackable = true;
        if (!appliedOffersGlobal.some((o) => o.offerId === offer.id)) {
          appliedOffersGlobal.push({ offerId: offer.id, code: offer.code, name: offer.name });
        }
      }
    }
  }

  // Update item totalPrice
  let subtotal = 0;
  let originalSubtotal = 0;
  calculatedItems.forEach((item: any) => {
    const bogoSame = item.appliedOffers.find((o: any) => o.bogoDescription && o.bogoDescription.includes("BOGO applied"));
    if (bogoSame) {
      item.totalPrice = Math.max(0, item.unitPrice * item.quantity - bogoSame.discountAmount);
    } else {
      item.totalPrice = item.unitPrice * item.quantity;
    }
    subtotal += item.totalPrice;
    originalSubtotal += item.originalPrice * item.quantity;
  });

  let overallDiscountValue = 0;
  let couponDiscountApplied = 0;
  let cartDiscountApplied = 0;
  let newUserDiscountApplied = 0;
  let loyaltyDiscountApplied = 0;

  // 10. CART_VALUE_DISCOUNT
  const cartValueOffers = activeOffers.filter(
    (o) => o.offerType === "CART_VALUE_DISCOUNT" && isOfferApplicable(o, couponCode)
  );
  for (const offer of cartValueOffers) {
    const config = offer.configuration as any;
    if (subtotal >= Number(config.minCartValue || 0)) {
      let isEligible = true;
      const catIds = config.applicableCategoryIds || [];
      const prodIds = config.applicableProductIds || [];
      if (catIds.length > 0 || prodIds.length > 0) {
        isEligible = calculatedItems.some(
          (i: any) => catIds.includes(i.category) || prodIds.includes(i.productId)
        );
      }

      if (isEligible) {
        const disc = evaluateDiscount(
          config.discountType,
          Number(config.discountValue || 0),
          subtotal,
          config.maxDiscountCap
        );
        subtotal = Math.max(0, subtotal - disc);
        cartDiscountApplied += disc;
        if (!appliedOffersGlobal.some((o) => o.offerId === offer.id)) {
          appliedOffersGlobal.push({
            offerId: offer.id,
            code: offer.code,
            name: offer.name,
            discountAmount: disc,
          });
        }
      }
    }
  }

  // 11. COUPON_DISCOUNT
  const couponOffers = activeOffers.filter(
    (o) => o.offerType === "COUPON" && isOfferApplicable(o, couponCode)
  );
  for (const offer of couponOffers) {
    const config = offer.configuration as any;
    const minCartMet = !config.minCartValue || subtotal >= Number(config.minCartValue);

    let eligibilityPassed = true;
    if (user && config.eligibility !== "ALL") {
      const userOrders = await prisma.order.findMany({
        where: { userId: user.id },
      });
      if (config.eligibility === "NEW" && userOrders.length > 0) {
        eligibilityPassed = false;
      } else if (config.eligibility === "EXISTING" && userOrders.length === 0) {
        eligibilityPassed = false;
      }
    }

    if (minCartMet && eligibilityPassed) {
      const disc = evaluateDiscount(config.couponType, Number(config.discountValue || 0), subtotal, config.maxDiscount);
      subtotal = Math.max(0, subtotal - disc);
      couponDiscountApplied += disc;
      if (!appliedOffersGlobal.some((o) => o.offerId === offer.id)) {
        appliedOffersGlobal.push({
          offerId: offer.id,
          code: offer.code,
          name: offer.name,
          discountAmount: disc,
        });
      }
    }
  }

  // 12. NEW_USER_DISCOUNT
  if (user) {
    const userOrdersCount = await prisma.order.count({ where: { userId: user.id } });
    const isNewUser = userOrdersCount === 0;

    if (isNewUser) {
      const newUserOffers = activeOffers.filter((o) => o.offerType === "NEW_USER" && isOfferApplicable(o, couponCode));
      for (const offer of newUserOffers) {
        const config = offer.configuration as any;
        const minCartMet = !config.minCartValue || subtotal >= Number(config.minCartValue);

        if (minCartMet) {
          const disc = evaluateDiscount(config.discountType, Number(config.discountValue || 0), subtotal, config.maxDiscount);
          subtotal = Math.max(0, subtotal - disc);
          newUserDiscountApplied += disc;
          if (!appliedOffersGlobal.some((o) => o.offerId === offer.id)) {
            appliedOffersGlobal.push({
              offerId: offer.id,
              code: offer.code,
              name: offer.name,
              discountAmount: disc,
            });
          }
        }
      }
    }
  }

  // 13. LOYALTY_DISCOUNT
  if (user) {
    const userOrders = await prisma.order.findMany({ where: { userId: user.id } });
    const currentTier = getUserTier(userOrders);

    const loyaltyOffers = activeOffers.filter(
      (o) =>
        o.offerType === "LOYALTY" &&
        (o.configuration as any).membershipTier === currentTier &&
        isOfferApplicable(o, couponCode)
    );

    for (const offer of loyaltyOffers) {
      const config = offer.configuration as any;
      const disc = evaluateDiscount(config.discountType, Number(config.discountValue || 0), subtotal, config.maxDiscount);
      subtotal = Math.max(0, subtotal - disc);
      loyaltyDiscountApplied += disc;
      if (!appliedOffersGlobal.some((o) => o.offerId === offer.id)) {
        appliedOffersGlobal.push({
          offerId: offer.id,
          code: offer.code,
          name: offer.name,
          discountAmount: disc,
        });
      }
    }
  }

  // Taxes
  const cgst = subtotal * 0.09;
  const sgst = subtotal * 0.09;
  const igst = 0;

  // Delivery Charges Model
  // 1. Per-product free shipping: if any cart item has "Free Shipping" badge or spec
  const FREE_DELIVERY_THRESHOLD = 10000;
  const STANDARD_DELIVERY_FEE = 200;

  const freeShippingProductIds: string[] = [];
  for (const item of calculatedItems) {
    const dbProduct = dbProducts.find((p) => p.id === item.productId);
    if (dbProduct) {
      const hasFreeShippingBadge =
        dbProduct.badge?.toLowerCase().includes("free shipping") ||
        dbProduct.badge?.toLowerCase().includes("free delivery");

      const hasFreeShippingSpec =
        Array.isArray(dbProduct.specs) &&
        (dbProduct.specs as any[]).some(
          (s: any) =>
            s.label?.toLowerCase().includes("shipping") &&
            s.value?.toLowerCase().includes("free")
        );

      if (hasFreeShippingBadge || hasFreeShippingSpec) {
        freeShippingProductIds.push(item.productId);
      }
    }
  }

  // 2. Determine base delivery charge
  // Free if: subtotal > threshold, or ALL items have free shipping, or a FREE_SHIPPING offer applies
  const allItemsHaveFreeShipping =
    calculatedItems.length > 0 &&
    calculatedItems.every((item) => freeShippingProductIds.includes(item.productId));

  let deliveryCharges = subtotal >= FREE_DELIVERY_THRESHOLD || allItemsHaveFreeShipping
    ? 0
    : STANDARD_DELIVERY_FEE;

  let freeDeliveryReason: string | null = null;
  if (subtotal >= FREE_DELIVERY_THRESHOLD) {
    freeDeliveryReason = `Order above ₹${FREE_DELIVERY_THRESHOLD.toLocaleString('en-IN')}`;
  } else if (allItemsHaveFreeShipping) {
    freeDeliveryReason = "Free shipping included with product(s)";
  }

  // 3. FREE_SHIPPING offers (offer engine override)
  const freeShippingOffers = activeOffers.filter(
    (o) => o.offerType === "FREE_SHIPPING" && isOfferApplicable(o, couponCode)
  );
  for (const offer of freeShippingOffers) {
    const config = offer.configuration as any;
    
    if (subtotal >= Number(config.minOrderValue || 0)) {
      let isEligible = true;

      const cats = config.applicableCategories || [];
      const prods = config.applicableProducts || [];
      if (cats.length > 0 || prods.length > 0) {
        isEligible = calculatedItems.some(
          (i: any) => cats.includes(i.category) || prods.includes(i.productId)
        );
      }

      if (isEligible) {
        const waiver = config.maxShippingWaiver ? Math.min(deliveryCharges, Number(config.maxShippingWaiver)) : deliveryCharges;
        deliveryCharges = Math.max(0, deliveryCharges - waiver);
        freeDeliveryReason = freeDeliveryReason || `Free Shipping via offer: ${offer.name}`;
        if (!appliedOffersGlobal.some((o) => o.offerId === offer.id)) {
          appliedOffersGlobal.push({
            offerId: offer.id,
            code: offer.code,
            name: offer.name,
            freeShipping: true,
            discountAmount: waiver,
          });
        }
      }
    }
  }

  // 4. Compute how much more the user needs to spend for free delivery
  const amountNeededForFreeDelivery =
    deliveryCharges > 0 ? Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal) : 0;

  const sumProductsDiscounts = calculatedItems.reduce(
    (sum, item) =>
      sum +
      (item.originalPrice * item.quantity - item.totalPrice),
    0
  );
  // Aggregate total discountAmount for each item-level applied offer in appliedOffersGlobal
  appliedOffersGlobal.forEach((globalOffer) => {
    if (globalOffer.discountAmount === undefined) {
      globalOffer.discountAmount = 0;
    }
  });

  calculatedItems.forEach((item: any) => {
    item.appliedOffers.forEach((itemOffer: any) => {
      const globalOffer = appliedOffersGlobal.find((o) => o.offerId === itemOffer.offerId);
      if (globalOffer) {
        if (globalOffer.discountAmount === undefined) {
          globalOffer.discountAmount = 0;
        }
        const isAlreadyAggregated = itemOffer.bogoDescription || itemOffer.flashCount !== undefined;
        if (isAlreadyAggregated) {
          globalOffer.discountAmount += itemOffer.discountAmount;
        } else {
          globalOffer.discountAmount += itemOffer.discountAmount * item.quantity;
        }
      }
    });
  });

  overallDiscountValue =
    sumProductsDiscounts +
    cartDiscountApplied +
    couponDiscountApplied +
    newUserDiscountApplied +
    loyaltyDiscountApplied;

  const grandTotal = subtotal + cgst + sgst + igst + deliveryCharges;

  return {
    summary: {
      originalSubtotal,
      discountedSubtotal: subtotal,
      totalDiscounts: overallDiscountValue,
      cgst,
      sgst,
      igst,
      deliveryCharges,
      grandTotal,
    },
    deliveryInfo: {
      standardFee: STANDARD_DELIVERY_FEE,
      freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
      isFreeDelivery: deliveryCharges === 0,
      freeDeliveryReason,
      amountNeededForFreeDelivery,
      freeShippingProductIds,
    },
    items: calculatedItems,
    freeGiftItems: freeItemsToAdd,
    appliedOffers: appliedOffersGlobal,
  };
};

export const calculateOrderPricing = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { items, couponCode } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: "Cart items are required" });
      return;
    }

    const result = await runPricingEngine(user, items, couponCode);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Calculate pricing error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to calculate pricing" });
  }
};
