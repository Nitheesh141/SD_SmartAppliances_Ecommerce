"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";
import {
  Percent, Plus, Edit2, Trash2, Loader2, RefreshCw, Megaphone,
  Tag, Calendar, Sparkles, AlertCircle, ShoppingBag, Award, Truck, Check, HelpCircle
} from "lucide-react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { cn } from "@/lib/utils";

interface OfferType {
  id: string;
  name: string;
  code: string;
  description: string | null;
  offerType: string;
  bannerImage: string | null;
  priority: number;
  status: string;
  startDate: string;
  endDate: string;
  applyAutomatically: boolean;
  stackable: boolean;
  maxUsageLimit: number | null;
  usagePerCustomer: number;
  displayBadgeText: string | null;
  badgeColor: string | null;
  termsConditions: string | null;
  configuration: any;
  createdAt: string;
}

interface ProductType {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  price: number;
  originalPrice: number;
  modelNumber?: string | null;
}

export default function AdminMarketingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [isPending, startTransition] = useTransition();
  const [offers, setOffers] = useState<OfferType[]>([]);
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Tab Management
  const currentTab = searchParams.get("tab") || "discounts";

  // Modal & Builder Form State
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingOffer, setEditingOffer] = useState<OfferType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState<string | null>(null);

  // Form Field States
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formOfferType, setFormOfferType] = useState("PRODUCT_DISCOUNT");
  const [formBannerImage, setFormBannerImage] = useState("");
  const [formPriority, setFormPriority] = useState(0);
  const [formStatus, setFormStatus] = useState("ACTIVE");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formApplyAutomatically, setFormApplyAutomatically] = useState(true);
  const [formStackable, setFormStackable] = useState(false);
  const [formMaxUsageLimit, setFormMaxUsageLimit] = useState("");
  const [formUsagePerCustomer, setFormUsagePerCustomer] = useState(1);
  const [formDisplayBadgeText, setFormDisplayBadgeText] = useState("");
  const [formBadgeColor, setFormBadgeColor] = useState("red");
  const [formTermsConditions, setFormTermsConditions] = useState("");

  // Sub-configuration Builder States (Dynamically constructed)
  const [configDiscountType, setConfigDiscountType] = useState("PERCENTAGE");
  const [configDiscountValue, setConfigDiscountValue] = useState("");
  const [configMaxDiscountAmount, setConfigMaxDiscountAmount] = useState("");
  const [configMinPurchaseQty, setConfigMinPurchaseQty] = useState(1);
  const [configMinCartValue, setConfigMinCartValue] = useState("");
  const [configBrandName, setConfigBrandName] = useState("");
  const [configEligibility, setConfigEligibility] = useState("ALL");
  const [configFlatDiscountAmount, setConfigFlatDiscountAmount] = useState("");
  const [configMinPurchaseValue, setConfigMinPurchaseValue] = useState("");
  const [configPercentageValue, setConfigPercentageValue] = useState("");
  const [configMaxDiscountCap, setConfigMaxDiscountCap] = useState("");

  // BOGO / Combo / Bundle products selectors
  const [configBuyProductId, setConfigBuyProductId] = useState("");
  const [configBuyQty, setConfigBuyQty] = useState(1);
  const [configGetProductId, setConfigGetProductId] = useState("");
  const [configGetQty, setConfigGetQty] = useState(1);
  const [configBogoType, setConfigBogoType] = useState("SAME");
  const [configMaxFreeQty, setConfigMaxFreeQty] = useState("");

  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [configComboName, setConfigComboName] = useState("");
  const [configFinalComboPrice, setConfigFinalComboPrice] = useState("");
  const [configBundleName, setConfigBundleName] = useState("");
  const [configBundlePrice, setConfigBundlePrice] = useState("");
  const [configStockLimit, setConfigStockLimit] = useState("");
  const [configCustomerLimit, setConfigCustomerLimit] = useState(1);
  const [configCampaignName, setConfigCampaignName] = useState("");
  const [configFestivalType, setConfigFestivalType] = useState("CUSTOM");
  const [configMembershipTier, setConfigMembershipTier] = useState("SILVER");
  const [configMinOrderValue, setConfigMinOrderValue] = useState("");
  const [configMaxShippingWaiver, setConfigMaxShippingWaiver] = useState("");

  // Dynamic Bulk Quantity Rules state
  const [bulkRules, setBulkRules] = useState<Array<{ minQty: number; discountType: string; discountValue: number }>>([
    { minQty: 2, discountType: "PERCENTAGE", discountValue: 5 }
  ]);

  // Cascading dropdown state for Target Products
  const [targetSelCategory, setTargetSelCategory] = useState("");
  const [targetSelModel, setTargetSelModel] = useState("");
  const [targetSelProductId, setTargetSelProductId] = useState("");

  // Load theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("admin-theme") as "light" | "dark" || "dark";
    setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("admin-theme", nextTheme);
  };

  // Route protection
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user || (user.role !== "admin" && user.role !== "superadmin")) {
        toast.error("Access Denied. Admins only.");
        router.push("/auth/login");
      } else {
        fetchData();
      }
    }
  }, [isAuthenticated, user, authLoading, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Offers
      const offersRes = await fetch("http://localhost:5000/api/offers");
      if (!offersRes.ok) throw new Error("Failed to load marketing offers");
      const offersData = await offersRes.json();
      setOffers(offersData.offers || []);

      // 2. Fetch Catalog Products (For select dropdown mappings)
      const productsRes = await fetch("http://localhost:5000/api/products");
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData.products || []);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    startTransition(() => {
      router.push(`/admin/marketing?tab=${tab}`);
    });
  };

  // Automated Code Generator
  const generateOfferCode = () => {
    const prefixes: Record<string, string> = {
      PRODUCT_DISCOUNT: "PROD",
      CATEGORY_DISCOUNT: "CAT",
      BRAND_DISCOUNT: "BRND",
      QUANTITY_DISCOUNT: "BULK",
      CART_VALUE_DISCOUNT: "CART",
      COUPON: "COUP",
      FLAT_DISCOUNT: "FLAT",
      PERCENTAGE_DISCOUNT: "PCT",
      BOGO: "BOGO",
      COMBO: "COMB",
      BUNDLE: "BNDL",
      FLASH_SALE: "FLSH",
      SEASONAL: "SEAS",
      NEW_USER: "NEW",
      LOYALTY: "LOYAL",
      FREE_SHIPPING: "SHIP",
    };
    const prefix = prefixes[formOfferType] || "OFFER";
    const rand = Math.floor(1000 + Math.random() * 9000);
    setFormCode(`${prefix}-${rand}`);
  };

  // Open builder form (Create)
  const handleOpenCreate = () => {
    setEditingOffer(null);
    setFormName("");
    setFormCode("");
    setFormDescription("");
    setFormOfferType("PRODUCT_DISCOUNT");
    setFormBannerImage("");
    setFormPriority(0);
    setFormStatus("ACTIVE");
    // Default dates (today to next month)
    const today = new Date().toISOString().split("T")[0] || "";
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().split("T")[0] || "";
    setFormStartDate(today);
    setFormEndDate(nextMonthStr);
    setFormApplyAutomatically(true);
    setFormStackable(false);
    setFormMaxUsageLimit("");
    setFormUsagePerCustomer(1);
    setFormDisplayBadgeText("");
    setFormBadgeColor("red");
    setFormTermsConditions("");

    // Clear config
    setConfigDiscountValue("");
    setConfigMaxDiscountAmount("");
    setConfigMinPurchaseQty(1);
    setConfigMinCartValue("");
    setConfigBrandName("");
    setConfigEligibility("ALL");
    setConfigFlatDiscountAmount("");
    setConfigMinPurchaseValue("");
    setConfigPercentageValue("");
    setConfigMaxDiscountCap("");
    setConfigBuyProductId("");
    setConfigBuyQty(1);
    setConfigGetProductId("");
    setConfigGetQty(1);
    setConfigBogoType("SAME");
    setConfigMaxFreeQty("");
    setSelectedProductIds([]);
    setSelectedCategories([]);
    setConfigComboName("");
    setConfigFinalComboPrice("");
    setConfigBundleName("");
    setConfigBundlePrice("");
    setConfigStockLimit("");
    setConfigCustomerLimit(1);
    setConfigCampaignName("");
    setConfigFestivalType("CUSTOM");
    setConfigMembershipTier("SILVER");
    setConfigMinOrderValue("");
    setConfigMaxShippingWaiver("");
    setBulkRules([{ minQty: 2, discountType: "PERCENTAGE", discountValue: 5 }]);

    setTargetSelCategory("");
    setTargetSelModel("");
    setTargetSelProductId("");

    setShowBuilder(true);
  };

  // Open builder form (Edit)
  const handleOpenEdit = (offer: OfferType) => {
    setEditingOffer(offer);
    setFormName(offer.name);
    setFormCode(offer.code);
    setFormDescription(offer.description || "");
    setFormOfferType(offer.offerType);
    setFormBannerImage(offer.bannerImage || "");
    setFormPriority(offer.priority);
    setFormStatus(offer.status);
    setFormStartDate(offer.startDate.split("T")[0] || "");
    setFormEndDate(offer.endDate.split("T")[0] || "");
    setFormApplyAutomatically(offer.applyAutomatically);
    setFormStackable(offer.stackable);
    setFormMaxUsageLimit(offer.maxUsageLimit ? String(offer.maxUsageLimit) : "");
    setFormUsagePerCustomer(offer.usagePerCustomer);
    setFormDisplayBadgeText(offer.displayBadgeText || "");
    setFormBadgeColor(offer.badgeColor || "red");
    setFormTermsConditions(offer.termsConditions || "");

    const config = offer.configuration || {};

    // Populate config fields based on type
    setConfigDiscountType(config.discountType || "PERCENTAGE");
    setConfigDiscountValue(config.discountValue !== undefined ? String(config.discountValue) : "");
    setConfigMaxDiscountAmount(config.maxDiscountAmount ? String(config.maxDiscountAmount) : "");
    setConfigMinPurchaseQty(config.minPurchaseQty || 1);
    setConfigMinCartValue(config.minCartValue ? String(config.minCartValue) : "");
    setConfigBrandName(config.brandName || "");
    setConfigEligibility(config.eligibility || "ALL");
    setConfigFlatDiscountAmount(config.flatDiscountAmount ? String(config.flatDiscountAmount) : "");
    setConfigMinPurchaseValue(config.minPurchaseValue ? String(config.minPurchaseValue) : "");
    setConfigPercentageValue(config.percentageValue ? String(config.percentageValue) : "");
    setConfigMaxDiscountCap(config.maxDiscountCap ? String(config.maxDiscountCap) : "");

    setConfigBuyProductId(config.buyProductId || "");
    setConfigBuyQty(config.buyQty || 1);
    setConfigGetProductId(config.getProductId || "");
    setConfigGetQty(config.getQty || 1);
    setConfigBogoType(config.offerType || "SAME");
    setConfigMaxFreeQty(config.maxFreeQty ? String(config.maxFreeQty) : "");

    setSelectedProductIds(config.productIds || config.applicableProducts || config.bundleProducts || []);
    setSelectedCategories(config.categoryIds || config.applicableCategories || config.applicableCategoryIds || []);

    setConfigComboName(config.comboName || "");
    setConfigFinalComboPrice(config.finalComboPrice ? String(config.finalComboPrice) : "");
    setConfigBundleName(config.bundleName || "");
    setConfigBundlePrice(config.bundlePrice ? String(config.bundlePrice) : "");
    setConfigStockLimit(config.stockLimit ? String(config.stockLimit) : "");
    setConfigCustomerLimit(config.customerPurchaseLimit || 1);

    setConfigCampaignName(config.campaignName || "");
    setConfigFestivalType(config.festivalType || "CUSTOM");
    setConfigMembershipTier(config.membershipTier || "SILVER");

    setConfigMinOrderValue(config.minOrderValue ? String(config.minOrderValue) : "");
    setConfigMaxShippingWaiver(config.maxShippingWaiver ? String(config.maxShippingWaiver) : "");

    if (config.rules) {
      setBulkRules(config.rules);
    } else {
      setBulkRules([{ minQty: 2, discountType: "PERCENTAGE", discountValue: 5 }]);
    }

    setTargetSelCategory("");
    setTargetSelModel("");
    setTargetSelProductId("");

    setShowBuilder(true);
  };

  // Delete Offer
  const handleDeleteOffer = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this offer?")) return;
    setIsDeleteLoading(id);
    const token = localStorage.getItem("authToken");

    try {
      const response = await fetch(`http://localhost:5000/api/offers/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Delete failed");
      toast.success("Offer deleted successfully");
      fetchData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to delete offer");
    } finally {
      setIsDeleteLoading(null);
    }
  };

  // Submit Builder Form (Save/Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const token = localStorage.getItem("authToken");

    // Construct configuration object dynamically based on selected offer type
    const configuration: any = {};

    if (formOfferType === "PRODUCT_DISCOUNT") {
      configuration.productIds = selectedProductIds;
      configuration.discountType = configDiscountType;
      configuration.discountValue = Number(configDiscountValue);
      configuration.maxDiscountAmount = configMaxDiscountAmount ? Number(configMaxDiscountAmount) : null;
      configuration.minPurchaseQty = Number(configMinPurchaseQty);
    } else if (formOfferType === "CATEGORY_DISCOUNT") {
      configuration.categoryIds = selectedCategories;
      configuration.discountType = configDiscountType;
      configuration.discountValue = Number(configDiscountValue);
      configuration.maxDiscountAmount = configMaxDiscountAmount ? Number(configMaxDiscountAmount) : null;
    } else if (formOfferType === "BRAND_DISCOUNT") {
      configuration.brandName = configBrandName;
      configuration.discountType = configDiscountType;
      configuration.discountValue = Number(configDiscountValue);
      configuration.maxDiscountAmount = configMaxDiscountAmount ? Number(configMaxDiscountAmount) : null;
    } else if (formOfferType === "QUANTITY_DISCOUNT") {
      configuration.productIds = selectedProductIds;
      configuration.categoryIds = selectedCategories;
      configuration.rules = bulkRules;
    } else if (formOfferType === "CART_VALUE_DISCOUNT") {
      configuration.minCartValue = Number(configMinCartValue);
      configuration.discountType = configDiscountType;
      configuration.discountValue = Number(configDiscountValue);
      configuration.maxDiscountCap = configMaxDiscountCap ? Number(configMaxDiscountCap) : null;
      configuration.applicableCategoryIds = selectedCategories;
      configuration.applicableProductIds = selectedProductIds;
    } else if (formOfferType === "COUPON") {
      configuration.couponCode = formCode;
      configuration.couponType = configDiscountType;
      configuration.discountValue = Number(configDiscountValue);
      configuration.maxDiscount = configMaxDiscountCap ? Number(configMaxDiscountCap) : null;
      configuration.minCartValue = configMinCartValue ? Number(configMinCartValue) : null;
      configuration.eligibility = configEligibility;
    } else if (formOfferType === "FLAT_DISCOUNT") {
      configuration.applicableProducts = selectedProductIds;
      configuration.applicableCategories = selectedCategories;
      configuration.flatDiscountAmount = Number(configFlatDiscountAmount);
      configuration.minPurchaseValue = configMinPurchaseValue ? Number(configMinPurchaseValue) : null;
    } else if (formOfferType === "PERCENTAGE_DISCOUNT") {
      configuration.applicableProducts = selectedProductIds;
      configuration.applicableCategories = selectedCategories;
      configuration.percentageValue = Number(configPercentageValue);
      configuration.maxDiscountCap = configMaxDiscountCap ? Number(configMaxDiscountCap) : null;
      configuration.minPurchaseValue = configMinPurchaseValue ? Number(configMinPurchaseValue) : null;
    } else if (formOfferType === "BOGO") {
      configuration.buyProductId = configBuyProductId;
      configuration.buyQty = Number(configBuyQty);
      configuration.getProductId = configGetProductId;
      configuration.getQty = Number(configGetQty);
      configuration.offerType = configBogoType;
      configuration.maxFreeQty = configMaxFreeQty ? Number(configMaxFreeQty) : null;
    } else if (formOfferType === "COMBO") {
      configuration.productIds = selectedProductIds;
      configuration.comboName = configComboName;
      configuration.comboDiscountType = configDiscountType;
      configuration.comboDiscountValue = Number(configDiscountValue);
      configuration.finalComboPrice = Number(configFinalComboPrice);
    } else if (formOfferType === "BUNDLE") {
      configuration.bundleName = configBundleName;
      configuration.bundleProducts = selectedProductIds;
      configuration.bundlePrice = Number(configBundlePrice);
      configuration.discountAmount = configFlatDiscountAmount ? Number(configFlatDiscountAmount) : null;
    } else if (formOfferType === "FLASH_SALE") {
      configuration.saleName = formName;
      configuration.productIds = selectedProductIds;
      configuration.discountType = configDiscountType;
      configuration.discountValue = Number(configDiscountValue);
      configuration.stockLimit = Number(configStockLimit);
      configuration.customerPurchaseLimit = Number(configCustomerLimit);
    } else if (formOfferType === "SEASONAL") {
      configuration.campaignName = configCampaignName;
      configuration.festivalType = configFestivalType;
      configuration.discountType = configDiscountType;
      configuration.discountValue = Number(configDiscountValue);
      configuration.applicableProducts = selectedProductIds;
      configuration.applicableCategories = selectedCategories;
    } else if (formOfferType === "NEW_USER") {
      configuration.discountType = configDiscountType;
      configuration.discountValue = Number(configDiscountValue);
      configuration.maxDiscount = configMaxDiscountCap ? Number(configMaxDiscountCap) : null;
      configuration.minCartValue = configMinCartValue ? Number(configMinCartValue) : null;
    } else if (formOfferType === "LOYALTY") {
      configuration.membershipTier = configMembershipTier;
      configuration.discountType = configDiscountType;
      configuration.discountValue = Number(configDiscountValue);
      configuration.maxDiscount = configMaxDiscountCap ? Number(configMaxDiscountCap) : null;
    } else if (formOfferType === "FREE_SHIPPING") {
      configuration.minOrderValue = Number(configMinOrderValue);
      configuration.applicableCategories = selectedCategories;
      configuration.applicableProducts = selectedProductIds;
      configuration.maxShippingWaiver = configMaxShippingWaiver ? Number(configMaxShippingWaiver) : null;
    }

    const payload = {
      name: formName,
      code: formCode,
      description: formDescription,
      offerType: formOfferType,
      bannerImage: formBannerImage || null,
      priority: Number(formPriority),
      status: formStatus,
      startDate: new Date(formStartDate).toISOString(),
      endDate: new Date(formEndDate).toISOString(),
      applyAutomatically: formApplyAutomatically,
      stackable: formStackable,
      maxUsageLimit: formMaxUsageLimit ? Number(formMaxUsageLimit) : null,
      usagePerCustomer: Number(formUsagePerCustomer),
      displayBadgeText: formDisplayBadgeText || null,
      badgeColor: formBadgeColor,
      termsConditions: formTermsConditions || null,
      configuration,
    };

    try {
      const url = editingOffer
        ? `http://localhost:5000/api/offers/${editingOffer.id}`
        : "http://localhost:5000/api/offers";

      const response = await fetch(url, {
        method: editingOffer ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Operation failed");
      }

      toast.success(editingOffer ? "Offer updated successfully" : "Offer created successfully");
      setShowBuilder(false);
      fetchData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to save offer");
    } finally {
      setIsSaving(false);
    }
  };

  // Helper functions for rendering
  const isDark = theme === "dark";

  // Modal theme-aware helper styles
  const modalInputClass = cn(
    "rounded-lg border px-3 py-2 text-sm outline-none transition-all duration-200 w-full",
    isDark
      ? "bg-neutral-900/60 border-neutral-800 text-white placeholder-neutral-500 focus:border-[#D71920]"
      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#D71920] focus:bg-white"
  );

  const modalSelectClass = cn(
    "rounded-lg border px-3 py-2 text-sm outline-none transition-all duration-200 w-full",
    isDark
      ? "bg-neutral-900 border-neutral-800 text-white focus:border-[#D71920]"
      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-[#D71920] focus:bg-white"
  );

  const modalTextareaClass = cn(
    "rounded-lg border px-3 py-2 text-sm outline-none transition-all duration-200 w-full",
    isDark
      ? "bg-neutral-900/60 border-neutral-800 text-white placeholder-neutral-500 focus:border-[#D71920]"
      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#D71920] focus:bg-white"
  );

  const modalCheckboxWrapperClass = cn(
    "flex flex-wrap gap-6 items-center p-4 border rounded-xl text-xs font-semibold transition-all duration-200",
    isDark
      ? "bg-neutral-900/40 border-neutral-800 text-neutral-300"
      : "bg-slate-50 border-slate-200 text-slate-700"
  );

  const modalCheckboxClass = cn(
    "rounded text-[#D71920] focus:ring-[#D71920] h-4 w-4 transition-all duration-200",
    isDark ? "border-neutral-800 bg-neutral-900" : "border-slate-300 bg-white"
  );

  const modalLabelClass = cn(
    "text-xs font-bold mb-1 transition-colors duration-200",
    isDark ? "text-neutral-300" : "text-slate-700"
  );

  const modalSectionDividerClass = cn(
    "space-y-4 border-t pt-6 transition-all duration-200",
    isDark ? "border-neutral-800" : "border-slate-200"
  );

  const modalInnerListContainerClass = cn(
    "border p-3 rounded-lg max-h-36 overflow-y-auto transition-all duration-200",
    isDark ? "border-neutral-800 bg-neutral-900/60" : "border-slate-200 bg-slate-50/50"
  );

  // Filter offers based on the active tab
  const filteredOffers = offers.filter((offer) => {
    if (currentTab === "discounts") {
      return [
        "PRODUCT_DISCOUNT", "CATEGORY_DISCOUNT", "BRAND_DISCOUNT", "QUANTITY_DISCOUNT",
        "CART_VALUE_DISCOUNT", "FLAT_DISCOUNT", "PERCENTAGE_DISCOUNT", "BOGO", "COMBO", "BUNDLE"
      ].includes(offer.offerType);
    } else if (currentTab === "coupons") {
      return offer.offerType === "COUPON";
    } else if (currentTab === "flash-sales") {
      return offer.offerType === "FLASH_SALE";
    } else if (currentTab === "campaigns") {
      return ["SEASONAL", "NEW_USER", "LOYALTY", "FREE_SHIPPING"].includes(offer.offerType);
    }
    return true; // Analytics tab matches all or doesn't show list
  });

  // Calculate high-level metrics
  const activeCount = offers.filter(o => o.status === "ACTIVE").length;
  const autoAppliedCount = offers.filter(o => o.applyAutomatically).length;
  const couponCount = offers.filter(o => o.offerType === "COUPON").length;

  if (authLoading || (loading && offers.length === 0)) {
    return (
      <div className={cn(
        "min-h-screen flex flex-col items-center justify-center font-sans",
        isDark ? "bg-[#0d0d0d] text-white" : "bg-[#fafafa] text-slate-950"
      )}>
        <Loader2 className="w-10 h-10 text-[#D71920] animate-spin" />
        <p className={cn("mt-4 font-sans text-sm", isDark ? "text-neutral-400" : "text-neutral-500")}>
          Authorizing campaign managers...
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen flex flex-col lg:flex-row transition-colors duration-300 font-sans selection:bg-[#D71920]/30 selection:text-white",
      isDark ? "dark bg-[#0d0d0d] text-white" : "bg-[#fafafa] text-slate-900"
    )}>
      {/* Sidebar Component */}
      <AdminSidebar currentPath="/admin/marketing" theme={theme} toggleTheme={toggleTheme} />

      {/* Main Panel Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">

        {/* Dynamic Inner Dashboard Page Header */}
        <header className={cn(
          "px-6 py-6 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors duration-300",
          isDark ? "border-neutral-800 bg-[#0d0d0d]/80" : "border-neutral-200 bg-white"
        )}>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#D71920] uppercase tracking-wider mb-1">
              <Sparkles size={14} />
              <span>Marketing Panel</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Discounts & Campaigns Manager</h1>
            <p className={cn("text-xs mt-0.5", isDark ? "text-neutral-500" : "text-neutral-400")}>
              Design, activate, or schedule coupons, flash sales, and cart incentives.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className={cn(
                "p-2.5 border rounded-lg transition-all cursor-pointer",
                isDark
                  ? "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800"
                  : "bg-white border-neutral-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              )}
              title="Reload Offers"
            >
              <RefreshCw size={18} className={loading ? "animate-spin text-[#D71920]" : ""} />
            </button>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 bg-[#D71920] hover:bg-[#B91520] rounded-lg text-sm font-bold text-white transition-all flex items-center gap-2 shadow-lg shadow-[#D71920]/20 hover:shadow-[#D71920]/30 cursor-pointer"
            >
              <Plus size={18} />
              <span>Create Campaign Offer</span>
            </button>
          </div>
        </header>

        {/* Dashboard Grid & List */}
        <main className="flex-grow p-6 space-y-6">

          {/* Summary Analytics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={cn("p-5 rounded-2xl border transition-all", isDark ? "bg-neutral-950/60 border-neutral-800/80" : "bg-white border-neutral-200")}>
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Active Offers</span>
                <div className="p-2 bg-green-500/10 text-green-500 rounded-lg"><Check size={16} /></div>
              </div>
              <h3 className="text-2xl font-extrabold">{activeCount}</h3>
              <p className="text-[10px] text-neutral-500 mt-1">Currently live on storefront</p>
            </div>

            <div className={cn("p-5 rounded-2xl border transition-all", isDark ? "bg-neutral-950/60 border-neutral-800/80" : "bg-white border-neutral-200")}>
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Automatic Rules</span>
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Sparkles size={16} /></div>
              </div>
              <h3 className="text-2xl font-extrabold">{autoAppliedCount}</h3>
              <p className="text-[10px] text-neutral-500 mt-1">Applies instantly at checkout</p>
            </div>

            <div className={cn("p-5 rounded-2xl border transition-all", isDark ? "bg-neutral-950/60 border-neutral-800/80" : "bg-white border-neutral-200")}>
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Active Coupons</span>
                <div className="p-2 bg-red-500/10 text-[#D71920] rounded-lg"><Tag size={16} /></div>
              </div>
              <h3 className="text-2xl font-extrabold">{couponCount}</h3>
              <p className="text-[10px] text-neutral-500 mt-1">Requires manual promo codes</p>
            </div>

            <div className={cn("p-5 rounded-2xl border transition-all", isDark ? "bg-neutral-950/60 border-neutral-800/80" : "bg-white border-neutral-200")}>
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Offer Analytics</span>
                <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg"><Percent size={16} /></div>
              </div>
              <h3 className="text-2xl font-extrabold">₹18,450</h3>
              <p className="text-[10px] text-neutral-500 mt-1">Savings distributed this month</p>
            </div>
          </div>

          {/* tab controller */}
          <div className="flex border-b border-neutral-200 dark:border-neutral-800 gap-1 overflow-x-auto pb-px">
            {[
              { id: "discounts", label: "Discounts & Offers" },
              { id: "coupons", label: "Coupons" },
              { id: "flash-sales", label: "Flash Sales" },
              { id: "campaigns", label: "Campaigns" },
              { id: "analytics", label: "Offer Analytics" },
            ].map((tab) => {
              const active = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap cursor-pointer transition-all",
                    active
                      ? "border-[#D71920] text-[#D71920]"
                      : "border-transparent text-neutral-400 hover:text-neutral-200"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Main Tab Views */}
          {currentTab === "analytics" ? (
            <div className={cn("p-8 rounded-2xl border text-center font-sans", isDark ? "bg-neutral-950/60 border-neutral-800/80" : "bg-white border-neutral-200")}>
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-[#D71920]" />
              <h3 className="text-lg font-bold">Marketing Analytics Center</h3>
              <p className="text-sm text-neutral-500 mt-1 max-w-md mx-auto">
                Track conversions, coupon claim percentages, and campaign revenue impact. Data syncs dynamically from completed orders.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 max-w-3xl mx-auto">
                <div className="p-4 border border-neutral-800 bg-neutral-900/30 rounded-xl">
                  <span className="text-xs text-neutral-500 block font-bold mb-1">Coupon Conversion</span>
                  <span className="text-xl font-extrabold text-[#D71920]">24.8%</span>
                </div>
                <div className="p-4 border border-neutral-800 bg-neutral-900/30 rounded-xl">
                  <span className="text-xs text-neutral-500 block font-bold mb-1">Average Discount Value</span>
                  <span className="text-xl font-extrabold text-blue-500">₹1,240</span>
                </div>
                <div className="p-4 border border-neutral-800 bg-neutral-900/30 rounded-xl">
                  <span className="text-xs text-neutral-500 block font-bold mb-1">Repeated Claims Rate</span>
                  <span className="text-xl font-extrabold text-green-500">12.5%</span>
                </div>
              </div>
            </div>
          ) : (
            <div className={cn(
              "border rounded-2xl overflow-hidden shadow-xl backdrop-blur-md transition-all",
              isDark ? "bg-neutral-950/60 border-neutral-800/80" : "bg-white border-neutral-200"
            )}>
              {filteredOffers.length === 0 ? (
                <div className="py-24 text-center">
                  <Megaphone className={cn("w-16 h-16 mx-auto mb-4", isDark ? "text-neutral-800" : "text-neutral-300")} />
                  <p className="text-lg font-bold">No offers found in this category</p>
                  <p className={cn("text-sm mt-1", isDark ? "text-neutral-500" : "text-neutral-400")}>
                    Get started by creating a new promotional offer above.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={cn(
                        "border-b text-xs font-bold uppercase tracking-wider transition-colors",
                        isDark ? "border-neutral-800 bg-neutral-900/30 text-neutral-400" : "border-neutral-200 bg-neutral-50/70 text-slate-500"
                      )}>
                        <th className="py-4 px-6">Offer Info</th>
                        <th className="py-4 px-6">Type</th>
                        <th className="py-4 px-6">Validity Duration</th>
                        <th className="py-4 px-6 text-center">Priority</th>
                        <th className="py-4 px-6 text-center">Status</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={cn(
                      "divide-y transition-colors",
                      isDark ? "divide-neutral-900" : "divide-neutral-100"
                    )}>
                      {filteredOffers.map((offer) => (
                        <tr
                          key={offer.id}
                          className={cn(
                            "group transition-all hover:bg-neutral-900/10"
                          )}
                        >
                          {/* Info */}
                          <td className="py-4 px-6 text-left">
                            <div className="min-w-0">
                              <h3 className={cn("font-bold truncate max-w-[200px]", isDark ? "text-neutral-100" : "text-slate-800")}>
                                {offer.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="font-mono text-xs text-[#D71920] font-extrabold uppercase bg-[#D71920]/10 border border-[#D71920]/20 px-2 py-0.5 rounded">
                                  {offer.code}
                                </span>
                                {offer.displayBadgeText && (
                                  <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white bg-red-600")}>
                                    {offer.displayBadgeText}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="py-4 px-6 text-sm font-semibold">
                            {offer.offerType.replace(/_/g, " ")}
                          </td>

                          {/* Validity */}
                          <td className="py-4 px-6 text-xs text-neutral-400 font-sans">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={12} className="text-[#D71920]" />
                              <span>{new Date(offer.startDate).toLocaleDateString()} - {new Date(offer.endDate).toLocaleDateString()}</span>
                            </div>
                          </td>

                          {/* Priority */}
                          <td className="py-4 px-6 text-center font-bold font-sans">
                            {offer.priority}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-6 text-center">
                            <span className={cn(
                              "px-2.5 py-1 border rounded-full text-[10px] font-bold uppercase tracking-wider",
                              offer.status === "ACTIVE"
                                ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
                                : "bg-neutral-800 border-neutral-700 text-neutral-400"
                            )}>
                              {offer.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEdit(offer)}
                                className={cn(
                                  "p-2 border rounded-lg transition-all cursor-pointer",
                                  isDark
                                    ? "bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 hover:bg-neutral-800"
                                    : "bg-white border-neutral-200 text-slate-600 hover:text-[#D71920] hover:border-neutral-300 hover:bg-slate-50"
                                )}
                                title="Edit Offer"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteOffer(offer.id)}
                                disabled={isDeleteLoading === offer.id}
                                className={cn(
                                  "p-2 border rounded-lg transition-all cursor-pointer disabled:opacity-50",
                                  isDark
                                    ? "bg-neutral-900 border-neutral-800 text-red-500 hover:text-white hover:border-red-900 hover:bg-red-950/20"
                                    : "bg-white border-neutral-200 text-red-500 hover:text-white hover:border-red-600 hover:bg-red-500"
                                )}
                                title="Delete Offer"
                              >
                                {isDeleteLoading === offer.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 size={14} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Multistep Campaign Offer Builder Modal */}
      {showBuilder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className={cn(
            "w-full max-w-5xl rounded-2xl border p-6 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200 my-8 max-h-[95vh] overflow-y-auto transition-all duration-200",
            isDark ? "bg-neutral-950 border-neutral-800 text-white" : "bg-white border-slate-200 text-slate-900"
          )}>

            <div className={cn("flex justify-between items-start mb-6 border-b pb-4 transition-colors", isDark ? "border-neutral-800" : "border-slate-200")}>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">
                  {editingOffer ? "Modify Campaign Offer" : "Design New Campaign Offer"}
                </h2>
                <p className={cn("text-xs mt-1 transition-colors", isDark ? "text-neutral-400" : "text-slate-500")}>
                  Set priorities, stacking behaviors, and target conditions.
                </p>
              </div>
              <button
                onClick={() => setShowBuilder(false)}
                className={cn(
                  "p-1.5 rounded-lg transition-colors cursor-pointer",
                  isDark ? "hover:bg-neutral-800 text-neutral-400" : "hover:bg-slate-100 text-slate-500"
                )}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* 1. Global Setup Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#D71920] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} />
                  <span>1. Global Promotion Settings</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className={modalLabelClass}>Offer Name *</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Diwali Cooktop Clearance"
                      className={modalInputClass}
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className={modalLabelClass}>Offer Code *</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value)}
                        placeholder="e.g. DIWALI-15"
                        className={cn(modalInputClass, "w-full font-mono")}
                      />
                      <button
                        type="button"
                        onClick={generateOfferCode}
                        className={cn(
                          "px-3 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer",
                          isDark
                            ? "bg-neutral-800 hover:bg-neutral-700 text-white"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
                        )}
                      >
                        Auto Code
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col">
                    <label className={modalLabelClass}>Offer Type</label>
                    <select
                      value={formOfferType}
                      onChange={(e) => setFormOfferType(e.target.value)}
                      className={modalSelectClass}
                    >
                      <option value="PRODUCT_DISCOUNT">Product Discount</option>
                      <option value="CATEGORY_DISCOUNT">Category Discount</option>
                      <option value="BRAND_DISCOUNT">Brand Discount</option>
                      <option value="QUANTITY_DISCOUNT">Quantity / Bulk Discount</option>
                      <option value="CART_VALUE_DISCOUNT">Cart Value Discount</option>
                      <option value="COUPON">Promo Code / Coupon</option>
                      <option value="FLAT_DISCOUNT">Flat Amount Discount</option>
                      <option value="PERCENTAGE_DISCOUNT">Percentage Discount</option>
                      <option value="BOGO">Buy One Get One (BOGO)</option>
                      <option value="COMBO">Combo Bundle Deal</option>
                      <option value="BUNDLE">Product Bundle Pack</option>
                      <option value="FLASH_SALE">Time-limited Flash Sale</option>
                      <option value="SEASONAL">Seasonal Campaign</option>
                      <option value="NEW_USER">First Order Discount</option>
                      <option value="LOYALTY">Membership Loyalty Tier</option>
                      <option value="FREE_SHIPPING">Free Shipping Waiver</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className={modalLabelClass}>Priority Rank (1-8 Sequence)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formPriority}
                      onChange={(e) => setFormPriority(Number(e.target.value))}
                      className={modalInputClass}
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className={modalLabelClass}>Duration Dates</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="date"
                        required
                        value={formStartDate}
                        onChange={(e) => setFormStartDate(e.target.value)}
                        className={cn(modalInputClass, "w-1/2 text-xs px-2.5")}
                      />
                      <span className={cn("text-xs font-semibold", isDark ? "text-neutral-500" : "text-slate-400")}>to</span>
                      <input
                        type="date"
                        required
                        value={formEndDate}
                        onChange={(e) => setFormEndDate(e.target.value)}
                        className={cn(modalInputClass, "w-1/2 text-xs px-2.5")}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className={modalLabelClass}>Display Badge Text</label>
                    <input
                      type="text"
                      value={formDisplayBadgeText}
                      onChange={(e) => setFormDisplayBadgeText(e.target.value)}
                      placeholder="e.g. HOT DEAL, 15% OFF"
                      className={modalInputClass}
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className={modalLabelClass}>Badge Theme Color</label>
                    <select
                      value={formBadgeColor}
                      onChange={(e) => setFormBadgeColor(e.target.value)}
                      className={modalSelectClass}
                    >
                      <option value="red">Vibrant Red</option>
                      <option value="orange">Bright Orange</option>
                      <option value="green">Eco Green</option>
                      <option value="blue">Blue Wave</option>
                      <option value="purple">Royal Purple</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className={modalLabelClass}>Campaign Description</label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Short summary detailing eligibility or criteria..."
                    className={modalTextareaClass}
                  />
                </div>

                {/* Behavioral Toggles */}
                <div className={modalCheckboxWrapperClass}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formApplyAutomatically}
                      onChange={(e) => setFormApplyAutomatically(e.target.checked)}
                      className={modalCheckboxClass}
                    />
                    <span>Apply Automatically at Checkout</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formStackable}
                      onChange={(e) => setFormStackable(e.target.checked)}
                      className={modalCheckboxClass}
                    />
                    <span>Stackable with other campaigns</span>
                  </label>
                </div>
              </div>

              {/* 2. Type-Specific Config Rules Section */}
              <div className={modalSectionDividerClass}>
                <h3 className="text-sm font-bold text-blue-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Percent size={14} />
                  <span>2. Promotion Configuration (Rule Engine)</span>
                </h3>

                {/* PRODUCT / CATEGORY / BRAND SELECTORS DEPENDING ON TYPE */}
                {[
                  "PRODUCT_DISCOUNT", "QUANTITY_DISCOUNT", "CART_VALUE_DISCOUNT",
                  "FLAT_DISCOUNT", "PERCENTAGE_DISCOUNT", "COMBO", "BUNDLE", "FLASH_SALE", "SEASONAL", "FREE_SHIPPING"
                ].includes(formOfferType) && (
                    <div className="flex flex-col gap-3">
                      <label className={modalLabelClass}>Target Products Selector</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* 1. Category Selector */}
                        <div className="flex flex-col">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 mb-1">1. Category</span>
                          <select
                            value={targetSelCategory}
                            onChange={(e) => {
                              setTargetSelCategory(e.target.value);
                              setTargetSelModel("");
                              setTargetSelProductId("");
                            }}
                            className={modalSelectClass}
                          >
                            <option value="">-- Select Category --</option>
                            <option value="pressure-cookers">Pressure Cookers</option>
                            <option value="non-stick">Non-Stick Cookware</option>
                            <option value="mixer-grinders">Mixer Grinders</option>
                            <option value="gas-stoves">LPG Stoves</option>
                            <option value="wet-grinders">Wet Grinders</option>
                            <option value="commercial">Commercial Wet Grinders</option>
                          </select>
                        </div>

                        {/* 2. Model Name Selector */}
                        <div className="flex flex-col">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 mb-1">2. Model Name</span>
                          <select
                            value={targetSelModel}
                            disabled={!targetSelCategory}
                            onChange={(e) => {
                              setTargetSelModel(e.target.value);
                              setTargetSelProductId("");
                            }}
                            className={modalSelectClass}
                          >
                            <option value="">-- Select Model Name --</option>
                            {targetSelCategory && Array.from(new Set(products
                              .filter(p => p.category === targetSelCategory)
                              .map(p => p.modelNumber)
                              .filter(Boolean)
                            )).map((model) => (
                              <option key={model} value={model!}>{model}</option>
                            ))}
                          </select>
                        </div>

                        {/* 3. Product Selector */}
                        <div className="flex flex-col">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 mb-1">3. Product</span>
                          <div className="flex gap-2">
                            <select
                              value={targetSelProductId}
                              disabled={!targetSelModel}
                              onChange={(e) => setTargetSelProductId(e.target.value)}
                              className={modalSelectClass}
                            >
                              <option value="">-- Select Product --</option>
                              {targetSelCategory && targetSelModel && products
                                .filter(p => p.category === targetSelCategory && p.modelNumber === targetSelModel)
                                .map((p) => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                if (!targetSelProductId) {
                                  toast.warning("Please select a product first");
                                  return;
                                }
                                if (selectedProductIds.includes(targetSelProductId)) {
                                  toast.info("Product already added");
                                  return;
                                }
                                setSelectedProductIds([...selectedProductIds, targetSelProductId]);
                                setTargetSelProductId("");
                              }}
                              className="px-4 py-2 bg-[#D71920] hover:bg-[#B91520] text-white rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Targeted Products Chips */}
                      {selectedProductIds.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-2 p-3 border border-neutral-800 bg-neutral-900/30 rounded-xl max-h-36 overflow-y-auto">
                          {selectedProductIds.map((id) => {
                            const p = products.find(prod => prod.id === id);
                            if (!p) return null;
                            return (
                              <div key={id} className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 text-[#D71920] rounded-full text-xs font-semibold">
                                <span>{p.name} ({p.modelNumber || "No Model"})</span>
                                <button
                                  type="button"
                                  onClick={() => setSelectedProductIds(selectedProductIds.filter(pid => pid !== id))}
                                  className="hover:text-red-700 transition-colors focus:outline-none"
                                >
                                  ✕
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-500 italic mt-1">No target products selected yet. Use the dropdowns to add products.</p>
                      )}
                    </div>
                  )}

                {["CATEGORY_DISCOUNT", "QUANTITY_DISCOUNT", "CART_VALUE_DISCOUNT", "FLAT_DISCOUNT", "PERCENTAGE_DISCOUNT", "SEASONAL", "FREE_SHIPPING"].includes(formOfferType) && (
                  <div className="flex flex-col">
                    <label className={modalLabelClass}>Target Category labels</label>
                    <div className={modalCheckboxWrapperClass}>
                      {[
                        { value: "pressure-cookers", label: "Pressure Cookers" },
                        { value: "non-stick", label: "Non-Stick Cookware" },
                        { value: "mixer-grinders", label: "Mixer Grinders" },
                        { value: "gas-stoves", label: "LPG Stoves" },
                        { value: "wet-grinders", label: "Wet Grinders" },
                        { value: "commercial", label: "Commercial Wet Grinders" }
                      ].map((cat) => {
                        const checked = selectedCategories.includes(cat.value);
                        return (
                          <label key={cat.value} className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCategories([...selectedCategories, cat.value]);
                                } else {
                                  setSelectedCategories(selectedCategories.filter(c => c !== cat.value));
                                }
                              }}
                              className={modalCheckboxClass}
                            />
                            <span>{cat.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* BRAND NAME CONFIG */}
                {formOfferType === "BRAND_DISCOUNT" && (
                  <div className="flex flex-col">
                    <label className={modalLabelClass}>Target Brand Name</label>
                    <input
                      type="text"
                      value={configBrandName}
                      onChange={(e) => setConfigBrandName(e.target.value)}
                      placeholder="e.g. Dyson, LG, Samsung"
                      className={modalInputClass}
                    />
                  </div>
                )}

                {/* STANDARD DISCOUNT TYPE AND VALUE (FOR PRODUCT/CATEGORY/BRAND/CART/COUPON/FLASH/SEASONAL/NEW/LOYALTY) */}
                {[
                  "PRODUCT_DISCOUNT", "CATEGORY_DISCOUNT", "BRAND_DISCOUNT", "CART_VALUE_DISCOUNT",
                  "COUPON", "COMBO", "FLASH_SALE", "SEASONAL", "NEW_USER", "LOYALTY"
                ].includes(formOfferType) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex flex-col">
                        <label className={modalLabelClass}>Discount Type</label>
                        <select
                          value={configDiscountType}
                          onChange={(e) => setConfigDiscountType(e.target.value)}
                          className={modalSelectClass}
                        >
                          <option value="PERCENTAGE">Percentage (%)</option>
                          <option value="FLAT">Flat Amount (INR)</option>
                        </select>
                      </div>

                      <div className="flex flex-col">
                        <label className={modalLabelClass}>Discount Value *</label>
                        <input
                          type="number"
                          required
                          value={configDiscountValue}
                          onChange={(e) => setConfigDiscountValue(e.target.value)}
                          placeholder="e.g. 15 or 500"
                          className={modalInputClass}
                        />
                      </div>

                      <div className="flex flex-col">
                        <label className={modalLabelClass}>Maximum Discount Cap (Optional)</label>
                        <input
                          type="number"
                          value={configMaxDiscountAmount}
                          onChange={(e) => setConfigMaxDiscountAmount(e.target.value)}
                          placeholder="e.g. 1000"
                          className={modalInputClass}
                        />
                      </div>
                    </div>
                  )}

                {/* BOGO CONFIG SECTION */}
                {formOfferType === "BOGO" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <label className={modalLabelClass}>Buy Product *</label>
                        <select
                          value={configBuyProductId}
                          onChange={(e) => setConfigBuyProductId(e.target.value)}
                          className={modalSelectClass}
                        >
                          <option value="">-- Choose Buy Item --</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>

                      <div className="flex flex-col">
                        <label className={modalLabelClass}>Buy Quantity *</label>
                        <input
                          type="number"
                          min="1"
                          value={configBuyQty}
                          onChange={(e) => setConfigBuyQty(Number(e.target.value))}
                          className={modalInputClass}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <label className={modalLabelClass}>Get Product *</label>
                        <select
                          value={configGetProductId}
                          onChange={(e) => setConfigGetProductId(e.target.value)}
                          className={modalSelectClass}
                        >
                          <option value="">-- Choose Free Item --</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>

                      <div className="flex flex-col">
                        <label className={modalLabelClass}>Get Quantity (Free) *</label>
                        <input
                          type="number"
                          min="1"
                          value={configGetQty}
                          onChange={(e) => setConfigGetQty(Number(e.target.value))}
                          className={modalInputClass}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <label className={modalLabelClass}>BOGO Mode</label>
                        <select
                          value={configBogoType}
                          onChange={(e) => setConfigBogoType(e.target.value)}
                          className={modalSelectClass}
                        >
                          <option value="SAME">Discount the same buy item</option>
                          <option value="DIFFERENT">Give different promotional item</option>
                        </select>
                      </div>

                      <div className="flex flex-col">
                        <label className={modalLabelClass}>Maximum Free Items Cap</label>
                        <input
                          type="number"
                          value={configMaxFreeQty}
                          onChange={(e) => setConfigMaxFreeQty(e.target.value)}
                          placeholder="e.g. 3"
                          className={modalInputClass}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* QUANTITY BULK RULES GRID */}
                {formOfferType === "QUANTITY_DISCOUNT" && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className={modalLabelClass}>Bulk Quantity Discount Tiers</label>
                      <button
                        type="button"
                        onClick={() => setBulkRules([...bulkRules, { minQty: 3, discountType: "PERCENTAGE", discountValue: 10 }])}
                        className={cn(
                          "px-2 py-1 rounded text-xs font-bold transition-all cursor-pointer",
                          isDark
                            ? "bg-neutral-800 hover:bg-neutral-700 text-white"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
                        )}
                      >
                        + Add Tier
                      </button>
                    </div>

                    <div className={cn("space-y-2 border p-3 rounded-lg transition-colors", isDark ? "border-neutral-800 bg-neutral-900/40" : "border-slate-200 bg-slate-50/50")}>
                      {bulkRules.map((rule, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <span className={cn("text-xs font-bold shrink-0", isDark ? "text-neutral-500" : "text-slate-500")}>Min Qty:</span>
                          <input
                            type="number"
                            min="2"
                            value={rule.minQty}
                            onChange={(e) => {
                              const next = [...bulkRules];
                              if (next[idx]) next[idx].minQty = Number(e.target.value);
                              setBulkRules(next);
                            }}
                            className={cn(modalInputClass, "w-16 px-2 py-1 text-xs")}
                          />

                          <span className={cn("text-xs font-bold shrink-0", isDark ? "text-neutral-500" : "text-slate-500")}>Discount:</span>
                          <input
                            type="number"
                            value={rule.discountValue}
                            onChange={(e) => {
                              const next = [...bulkRules];
                              if (next[idx]) next[idx].discountValue = Number(e.target.value);
                              setBulkRules(next);
                            }}
                            className={cn(modalInputClass, "w-20 px-2 py-1 text-xs")}
                          />

                          <select
                            value={rule.discountType}
                            onChange={(e) => {
                              const next = [...bulkRules];
                              if (next[idx]) next[idx].discountType = e.target.value;
                              setBulkRules(next);
                            }}
                            className={cn(modalSelectClass, "px-2 py-1 text-xs w-auto")}
                          >
                            <option value="PERCENTAGE">% Off</option>
                            <option value="FLAT">Flat INR Off</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => setBulkRules(bulkRules.filter((_, i) => i !== idx))}
                            className="p-1 text-red-500 hover:bg-red-500/10 rounded cursor-pointer ml-auto"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SINGLE PRODUCT FLAT / PERCENTAGE FIELDS */}
                {["FLAT_DISCOUNT", "PERCENTAGE_DISCOUNT"].includes(formOfferType) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {formOfferType === "FLAT_DISCOUNT" ? (
                      <div className="flex flex-col">
                        <label className={modalLabelClass}>Flat Discount Amount (INR) *</label>
                        <input
                          type="number"
                          required
                          value={configFlatDiscountAmount}
                          onChange={(e) => setConfigFlatDiscountAmount(e.target.value)}
                          className={modalInputClass}
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col">
                          <label className={modalLabelClass}>Percentage Value (%) *</label>
                          <input
                            type="number"
                            required
                            value={configPercentageValue}
                            onChange={(e) => setConfigPercentageValue(e.target.value)}
                            className={modalInputClass}
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className={modalLabelClass}>Maximum Discount Cap</label>
                          <input
                            type="number"
                            value={configMaxDiscountCap}
                            onChange={(e) => setConfigMaxDiscountCap(e.target.value)}
                            className={modalInputClass}
                          />
                        </div>
                      </>
                    )}
                    <div className="flex flex-col">
                      <label className={modalLabelClass}>Minimum Purchase Value</label>
                      <input
                        type="number"
                        value={configMinPurchaseValue}
                        onChange={(e) => setConfigMinPurchaseValue(e.target.value)}
                        className={modalInputClass}
                      />
                    </div>
                  </div>
                )}

                {/* COMBO FIELDS */}
                {formOfferType === "COMBO" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className={modalLabelClass}>Combo Package Name *</label>
                      <input
                        type="text"
                        required
                        value={configComboName}
                        onChange={(e) => setConfigComboName(e.target.value)}
                        placeholder="e.g. Chimney + Hob combo"
                        className={modalInputClass}
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className={modalLabelClass}>Final Combo Price (INR) *</label>
                      <input
                        type="number"
                        required
                        value={configFinalComboPrice}
                        onChange={(e) => setConfigFinalComboPrice(e.target.value)}
                        placeholder="e.g. 15000"
                        className={modalInputClass}
                      />
                    </div>
                  </div>
                )}

                {/* BUNDLE FIELDS */}
                {formOfferType === "BUNDLE" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className={modalLabelClass}>Bundle Pack Name *</label>
                      <input
                        type="text"
                        required
                        value={configBundleName}
                        onChange={(e) => setConfigBundleName(e.target.value)}
                        placeholder="e.g. Starter Kitchen Suite"
                        className={modalInputClass}
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className={modalLabelClass}>Bundle Set Price (INR) *</label>
                      <input
                        type="number"
                        required
                        value={configBundlePrice}
                        onChange={(e) => setConfigBundlePrice(e.target.value)}
                        placeholder="e.g. 24999"
                        className={modalInputClass}
                      />
                    </div>
                  </div>
                )}

                {/* FLASH SALE SPECIFIC FIELDS */}
                {formOfferType === "FLASH_SALE" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className={modalLabelClass}>Flash Stock Limits (units) *</label>
                      <input
                        type="number"
                        required
                        value={configStockLimit}
                        onChange={(e) => setConfigStockLimit(e.target.value)}
                        placeholder="e.g. 50"
                        className={modalInputClass}
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className={modalLabelClass}>Purchase Limits Per Customer *</label>
                      <input
                        type="number"
                        required
                        value={configCustomerLimit}
                        onChange={(e) => setConfigCustomerLimit(Number(e.target.value))}
                        className={modalInputClass}
                      />
                    </div>
                  </div>
                )}

                {/* SEASONAL CAMPAIGN FIELDS */}
                {formOfferType === "SEASONAL" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className={modalLabelClass}>Festival / Season Name *</label>
                      <input
                        type="text"
                        required
                        value={configCampaignName}
                        onChange={(e) => setConfigCampaignName(e.target.value)}
                        placeholder="e.g. Pongal Special Savings"
                        className={modalInputClass}
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className={modalLabelClass}>Season Tag</label>
                      <select
                        value={configFestivalType}
                        onChange={(e) => setConfigFestivalType(e.target.value)}
                        className={modalSelectClass}
                      >
                        <option value="DIWALI">Diwali Festival</option>
                        <option value="PONGAL">Pongal Festival</option>
                        <option value="NEW_YEAR">New Year Sale</option>
                        <option value="INDEPENDENCE_DAY">Independence Day</option>
                        <option value="CUSTOM">Custom Theme</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* LOYALTY TIER CRITERIA */}
                {formOfferType === "LOYALTY" && (
                  <div className="flex flex-col">
                    <label className={modalLabelClass}>Membership Loyalty Tier *</label>
                    <select
                      value={configMembershipTier}
                      onChange={(e) => setConfigMembershipTier(e.target.value)}
                      className={modalSelectClass}
                    >
                      <option value="SILVER">Silver (0-2 Orders)</option>
                      <option value="GOLD">Gold (3-5 Orders)</option>
                      <option value="PLATINUM">Platinum (6+ Orders)</option>
                    </select>
                  </div>
                )}

                {/* FREE SHIPPING INCENTIVES */}
                {formOfferType === "FREE_SHIPPING" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className={modalLabelClass}>Minimum Order Value (INR) *</label>
                      <input
                        type="number"
                        required
                        value={configMinOrderValue}
                        onChange={(e) => setConfigMinOrderValue(e.target.value)}
                        placeholder="e.g. 5000"
                        className={modalInputClass}
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className={modalLabelClass}>Max Shipping Fee Waived</label>
                      <input
                        type="number"
                        value={configMaxShippingWaiver}
                        onChange={(e) => setConfigMaxShippingWaiver(e.target.value)}
                        placeholder="e.g. 200 (Optional)"
                        className={modalInputClass}
                      />
                    </div>
                  </div>
                )}

                {/* MIN CART VALUE FOR CART/COUPON/NEW_USER */}
                {["CART_VALUE_DISCOUNT", "COUPON", "NEW_USER"].includes(formOfferType) && !["BOGO", "QUANTITY_DISCOUNT"].includes(formOfferType) && (
                  <div className="flex flex-col">
                    <label className={modalLabelClass}>Minimum Cart Subtotal Required (INR)</label>
                    <input
                      type="number"
                      value={configMinCartValue}
                      onChange={(e) => setConfigMinCartValue(e.target.value)}
                      placeholder="e.g. 5000"
                      className={modalInputClass}
                    />
                  </div>
                )}

                {/* ELIGIBILITY CRITERIA FOR COUPONS */}
                {formOfferType === "COUPON" && (
                  <div className="flex flex-col">
                    <label className={modalLabelClass}>Customer Eligibility Group</label>
                    <select
                      value={configEligibility}
                      onChange={(e) => setConfigEligibility(e.target.value)}
                      className={modalSelectClass}
                    >
                      <option value="ALL">All Customers</option>
                      <option value="NEW">New Customers (First Order Only)</option>
                      <option value="EXISTING">Returning Customers (1+ Previous Orders)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* 3. Banner & Terms Section */}
              <div className={modalSectionDividerClass}>
                <h3 className="text-sm font-bold text-orange-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={14} />
                  <span>3. Layout Materials & Rules</span>
                </h3>

                <div className="flex flex-col">
                  <label className={modalLabelClass}>Banner Image URL</label>
                  <input
                    type="text"
                    value={formBannerImage}
                    onChange={(e) => setFormBannerImage(e.target.value)}
                    placeholder="e.g. /uploads/diwali-banner.jpg"
                    className={cn(modalInputClass, "font-mono")}
                  />
                </div>

                <div className="flex flex-col">
                  <label className={modalLabelClass}>Terms & Conditions</label>
                  <textarea
                    rows={3}
                    value={formTermsConditions}
                    onChange={(e) => setFormTermsConditions(e.target.value)}
                    placeholder="Provide details about cancellations, returns, and minimum requirements..."
                    className={modalTextareaClass}
                  />
                </div>
              </div>

              {/* Footer Buttons */}
              <div className={cn("flex justify-end gap-3 border-t pt-5 mt-6 transition-colors", isDark ? "border-neutral-800" : "border-slate-200")}>
                <button
                  type="button"
                  onClick={() => setShowBuilder(false)}
                  className={cn(
                    "px-5 py-2.5 border rounded-lg text-sm font-bold transition-all cursor-pointer",
                    isDark
                      ? "border-neutral-800 hover:bg-neutral-900 text-neutral-400"
                      : "border-slate-200 hover:bg-slate-50 text-slate-600"
                  )}
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-[#D71920] hover:bg-[#B91520] rounded-lg text-sm font-bold text-white transition-all flex items-center gap-2 shadow-lg shadow-[#D71920]/20 hover:shadow-[#D71920]/30 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Offer...</span>
                    </>
                  ) : (
                    <span>Save Promotion</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
