"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";
import {
  Check, X, Loader2, ArrowLeft, Trash2, Plus, Settings, Layers, UploadCloud
} from "lucide-react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { cn } from "@/lib/utils";

interface SpecItem {
  label: string;
  value: string;
}

// Preset attributes and values based on category to assist data entry
const attributePresets: Record<string, Array<{ name: string; values: string[] }>> = {
  "pressure-cookers": [
    { name: "Capacity", values: ["2L", "3L", "5L", "7L", "10L", "12L"] },
    { name: "Material", values: ["Aluminium", "Stainless Steel"] },
    { name: "Base Type", values: ["Induction Base", "Standard Base"] }
  ],
  "gas-stoves": [
    { name: "Burner Count", values: ["2B", "3B", "4B"] },
    { name: "Top Type", values: ["Glass Top", "Steel"] },
    { name: "Ignition Type", values: ["Manual", "Auto Ignition"] }
  ],

  "wet-grinders": [
    { name: "Capacity", values: ["2L", "3L"] },
    { name: "Type", values: ["Tilting", "Table Top", "Short Body", "Height Body"] }
  ],
  "commercial": [
    { name: "Capacity", values: ["3L", "5L", "7L", "10L", "15L", "20L", "25L", "30L", "40L", "50L"] },
    { name: "Type", values: ["Tilting", "Table Top", "Commercial"] }
  ],
  "non-stick": [
    { name: "Size", values: ["200mm", "240mm", "280mm"] },
    { name: "Material", values: ["Aluminium", "Non-Stick Coated"] }
  ]
};

// Preset model names based on category
const categoryModels: Record<string, string[]> = {
  "pressure-cookers": ["Deluxe", "Lexus", "Max", "Suxus"],
  "gas-stoves": ["Jumbo", "Lexus"],

  "wet-grinders": ["Smart Lakshmi", "Java", "Bullet", "Short Body", "Height Body"],
  "commercial": ["Standard Commercial", "Tilting Commercial"],
  "non-stick": ["Yummy"]
};

const categoryOptions = [
  { value: "pressure-cookers", label: "Pressure Cookers" },
  { value: "non-stick", label: "Non-Stick Cookware" },

  { value: "gas-stoves", label: "LPG Stoves" },
  { value: "wet-grinders", label: "Wet Grinders" },
  { value: "commercial", label: "Commercial Wet Grinders" }
];

const badgeOptions = [
  { value: "", label: "No Badge" },
  { value: "Best Seller", label: "Best Seller" },
  { value: "Top Rated", label: "Top Rated" },
  { value: "New", label: "New Arrival" },
  { value: "Sale", label: "Special Sale" }
];

const imagePositionOptions = [
  { value: "left", label: "Left Side (Text Right)" },
  { value: "right", label: "Right Side (Text Left)" }
];

export default function AdminManagePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [productId, setProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Load theme from localStorage on client side mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("admin-theme") as "light" | "dark" || "dark";
    setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("admin-theme", nextTheme);
  };

  // Form Fields State
  const [name, setName] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [product_id, setproduct_id] = useState("");
  const [category, setCategory] = useState("pressure-cookers");
  const [categoryLabel, setCategoryLabel] = useState("Pressure Cookers");
  const [image, setImage] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [warranty, setWarranty] = useState("1 Year");
  const [productDescription, setProductDescription] = useState("");
  const [badge, setBadge] = useState("");
  const [inStock, setInStock] = useState(true);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [variantGroup, setVariantGroup] = useState("");
  const [colorName, setColorName] = useState("");
  const [colorHex, setColorHex] = useState("#ffffff");
  const [groupVariants, setGroupVariants] = useState<any[]>([]);

  const fetchGroupVariants = async (vg: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/products?variantGroup=${vg}`);
      if (response.ok) {
        const data = await response.json();
        setGroupVariants(data.products || []);
      }
    } catch (err) {
      console.error("Failed to fetch group variants:", err);
    }
  };

  const handleAddNewColorVariant = () => {
    setProductId(null);
    setName(name + " - New Variant");
    setImage("");
    setImages([]);
    setPrice("");
    setOriginalPrice("");
    setColorName("");
    setColorHex("#ffffff");
    setGeneratedSku("");
    router.push("/admin/manage-product");
    toast.info("Variant fields reset. You can now define a new color variant.");
  };

  // Featured-specific Fields
  const [eyebrow, setEyebrow] = useState("");
  const [description, setDescription] = useState("");
  const [specs, setSpecs] = useState<SpecItem[]>([]);
  const [newSpecLabel, setNewSpecLabel] = useState("");
  const [newSpecValue, setNewSpecValue] = useState("");
  const [imagePosition, setImagePosition] = useState("left");

  // Variant & Multi-Step Fields
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [attributes, setAttributes] = useState<Array<{ name: string; value: string }>>([]);
  const [generatedSku, setGeneratedSku] = useState("");
  const [dynamicModels, setDynamicModels] = useState<string[]>([]);
  const [deletedPresetModels, setDeletedPresetModels] = useState<Array<{ category: string; name: string }>>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isBadgeDropdownOpen, setIsBadgeDropdownOpen] = useState(false);
  const [isImagePositionDropdownOpen, setIsImagePositionDropdownOpen] = useState(false);

  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const badgeDropdownRef = useRef<HTMLDivElement>(null);
  const imagePositionDropdownRef = useRef<HTMLDivElement>(null);

  // Helper to get category initials for SKU prefix
  const getCategoryCode = (cat: string) => {
    if (!cat) return "XX";
    if (cat === "pressure-cookers") return "PC";
    if (cat === "gas-stoves") return "GS";

    if (cat === "wet-grinders") return "WG";
    if (cat === "non-stick") return "NS";
    if (cat === "commercial") return "CM";
    
    // Fallback: Split by hyphens/spaces and take first letters
    const parts = cat.split(/[^a-zA-Z0-9]+/);
    const initials = parts
      .map(part => part.charAt(0))
      .filter(Boolean)
      .join("")
      .toUpperCase();
    return initials || "XX";
  };

  // Helper to sanitize attribute values for SKU
  const sanitizeValueForSku = (val: string) => {
    if (!val) return "";
    const trimmed = val.trim();
    if (trimmed.toLowerCase() === "glass top") return "GT";
    if (trimmed.toLowerCase() === "steel") return "ST";
    
    return trimmed
      .replace(/\s+/g, "")
      .replace(/[^a-zA-Z0-9-]/g, "")
      .substring(0, 2)
      .toUpperCase();
  };

  // SKU & Variant Group Auto-generation logic
  useEffect(() => {
    let sku = "SD";
    const catCode = getCategoryCode(category);
    sku += `${catCode}001`;

    const modelPart = modelNumber ? modelNumber.trim().substring(0, 2).toUpperCase() : "XX";
    sku += `-${modelPart}`;

    // Append each defined attribute's sanitized value
    attributes.forEach(attr => {
      const sanitized = sanitizeValueForSku(attr.value);
      if (sanitized) {
        sku += `-${sanitized}`;
      }
    });

    if (colorName) {
      const sanitizedColor = sanitizeValueForSku(colorName);
      if (sanitizedColor) {
        sku += `-${sanitizedColor}`;
      }
    }

    setGeneratedSku(sku);
    setproduct_id(sku); // Sync with product_id (used as SKU in backend)
    
    // Auto-generate Variant Group: <Category Code>-<Model Name>
    const modelNameSafe = modelNumber ? modelNumber.trim().toUpperCase().replace(/\s+/g, "-").replace(/[^A-Z0-9-]/g, "") : "UNKNOWN";
    setVariantGroup(`${catCode}-${modelNameSafe}`);
  }, [category, modelNumber, attributes, colorName]);

  // Fetch all existing models in the database for the selected category & deleted models
  useEffect(() => {
    const fetchCategoryModels = async () => {
      try {
        // Fetch all products to extract dynamic models
        const prodResponse = await fetch("http://localhost:5000/api/products");
        if (prodResponse.ok) {
          const data = await prodResponse.json();
          const list = data.products || [];
          const catModels = list
            .filter((p: any) => p.category === category)
            .map((p: any) => p.modelNumber)
            .filter(Boolean)
            .map((m: string) => m.trim());
          const uniqueModels = Array.from(new Set(catModels)) as string[];
          setDynamicModels(uniqueModels);
        }

        // Fetch deleted models
        const delResponse = await fetch("http://localhost:5000/api/products/deleted-models");
        if (delResponse.ok) {
          const data = await delResponse.json();
          setDeletedPresetModels(data.deletedModels || []);
        }
      } catch (err) {
        console.error("Failed to load category models:", err);
      }
    };
    fetchCategoryModels();
  }, [category]);

  // Click outside listener for custom dropdown menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
      if (badgeDropdownRef.current && !badgeDropdownRef.current.contains(event.target as Node)) {
        setIsBadgeDropdownOpen(false);
      }
      if (imagePositionDropdownRef.current && !imagePositionDropdownRef.current.contains(event.target as Node)) {
        setIsImagePositionDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle Delete Model Name from UI & Database
  const handleDeleteModel = async (modelName: string) => {
    if (!window.confirm(`Are you sure you want to delete the model "${modelName}"? This will disassociate the model name from all products, but will NOT delete the products themselves.`)) {
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:5000/api/products/models", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          category,
          modelName,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to delete model name");
      }

      toast.success(`Model "${modelName}" deleted successfully`);

      // Add to local state of deleted models
      setDeletedPresetModels((prev) => [...prev, { category, name: modelName }]);
      // If the currently selected model is the one deleted, clear it
      if (modelNumber === modelName) {
        setModelNumber("");
        setIsCustomModel(false);
      }
      
      // Update dynamicModels to remove the deleted model
      setDynamicModels((prev) => prev.filter((m) => m !== modelName));
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to delete model name");
    }
  };

  // Keep the primary image synced with the first element of images list
  useEffect(() => {
    setImage(images[0] || "");
  }, [images]);

  // Image helpers
  const handleFiles = async (files: FileList) => {
    const fileArray = Array.from(files);

    const formData = new FormData();
    fileArray.forEach(file => {
      console.log("Appending file:", file.name, file.size, file.type);
      formData.append("files", file);
    });

    console.log("FormData entries:");
    for (let pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    try {
      toast.info(`Uploading ${fileArray.length} image(s)...`);
      const response = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload images");
      }

      const data = await response.json();
      if (data.success && data.urls) {
        setImages((prev) => [...prev, ...data.urls]);
        toast.success(`${data.urls.length} image(s) uploaded successfully`);
      } else {
        throw new Error(data.message || "Upload failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload one or more images");
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    toast.success("Image removed");
  };

  const makePrimary = (index: number) => {
    setImages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      return [item, ...copy];
    });
    toast.success("Image set as primary");
  };

  const compressAndConvertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);

          const compressed = canvas.toDataURL("image/jpeg", 0.75);
          resolve(compressed);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  // Route protection & Query param check
  useEffect(() => {
    if (!authLoading) {
      const role = user?.role?.toUpperCase();
      if (!isAuthenticated || !user || (role !== "ADMIN" && role !== "SUPERADMIN" && user.role !== "admin" && user.role !== "superadmin")) {
        toast.error("Access Denied. Admins only.");
        router.push("/auth/login");
        return;
      }

      // Check query params in client
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      if (id) {
        setProductId(id);
        fetchProduct(id);
      }
    }
  }, [isAuthenticated, user, authLoading, router]);

  // Fetch product for editing
  const fetchProduct = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}`);
      if (!response.ok) throw new Error("Product not found");
      const data = await response.json();
      const product = data.product;

      setName(product.name);
      setModelNumber(product.modelNumber || "");
      
      const models = categoryModels[product.category] || [];
      if (product.modelNumber && !models.includes(product.modelNumber)) {
        setIsCustomModel(true);
      } else {
        setIsCustomModel(false);
      }

      setproduct_id(product.productId || "");
      setCategory(product.category);
      setCategoryLabel(product.categoryLabel);
      setImage(product.image);
      if (product.images && product.images.length > 0) {
        setImages(product.images);
      } else if (product.image) {
        setImages([product.image]);
      } else {
        setImages([]);
      }
      setPrice(String(product.price));
      setOriginalPrice(String(product.originalPrice));
      setWarranty(product.warranty);
      setProductDescription(product.productDescription || "");
      setBadge(product.badge || "");
      setInStock(product.inStock);
      setIsBestSeller(product.isBestSeller);
      setIsFeatured(product.isFeatured);
      setEyebrow(product.eyebrow || "");
      setDescription(product.description || "");
      setImagePosition(product.imagePosition || "left");
      
      const vDetails = product.variantDetails || {};
      const loadedColorName = vDetails.colorName || vDetails.Color || "";
      const loadedColorHex = vDetails.colorHex || vDetails.ColorHex || "#ffffff";
      setColorName(loadedColorName);
      setColorHex(loadedColorHex);

      const loadedAttributes: Array<{ name: string; value: string }> = [];
      const legacyKeys = {
        capacity: "Capacity",
        burners: "Burner Count",
        topType: "Top Type",
        wattage: "Wattage",
        jars: "Jar Count"
      };
      Object.entries(vDetails).forEach(([key, val]) => {
        if (val) {
          const lowerKey = key.toLowerCase();
          if (lowerKey === "color" || lowerKey === "colorhex" || lowerKey === "colour" || lowerKey === "colourhex") {
            return;
          }
          const name = legacyKeys[key as keyof typeof legacyKeys] || key;
          loadedAttributes.push({ name, value: String(val) });
        }
      });
      setAttributes(loadedAttributes);
      if (product.sku) setGeneratedSku(product.sku);
      setVariantGroup(product.variantGroup || "");
      if (product.variantGroup) {
        fetchGroupVariants(product.variantGroup);
      }

      let parsedSpecs: SpecItem[] = [];
      if (product.specs) {
        if (typeof product.specs === "string") {
          try {
            parsedSpecs = JSON.parse(product.specs);
          } catch {
            parsedSpecs = [];
          }
        } else if (Array.isArray(product.specs)) {
          parsedSpecs = product.specs;
        }
      }
      setSpecs(parsedSpecs);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to load product details");
      router.push("/admin/products");
    } finally {
      setLoading(false);
    }
  };

  // Sync categoryLabel when category changes
  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setModelNumber("");
    setIsCustomModel(false);
    switch (cat) {
      case "pressure-cookers":
        setCategoryLabel("Pressure Cookers");
        break;
      case "wet-grinders":
        setCategoryLabel("Wet Grinders");
        break;
      case "gas-stoves":
        setCategoryLabel("LPG Stoves");
        break;

      case "non-stick":
        setCategoryLabel("Non-Stick Cookware");
        break;
      case "commercial":
        setCategoryLabel("Commercial Wet Grinders");
        break;
      default:
        setCategoryLabel("Appliances");
    }
  };

  // Specs helpers
  const handleAddSpec = () => {
    if (!newSpecLabel || !newSpecValue) {
      toast.warning("Enter both label and value for spec");
      return;
    }
    setSpecs([...specs, { label: newSpecLabel, value: newSpecValue }]);
    setNewSpecLabel("");
    setNewSpecValue("");
  };

  const handleRemoveSpec = (index: number) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !image || !price || !originalPrice || !modelNumber || !product_id) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const priceNum = Number(price);
    const originalPriceNum = Number(originalPrice);
    const discountPercent = originalPriceNum > 0
      ? Math.round(((originalPriceNum - priceNum) / originalPriceNum) * 100)
      : 0;

    const payload: any = {
      name,
      modelNumber,
      productId: product_id,
      category,
      categoryLabel,
      image,
      images: images.length > 0 ? images : (image ? [image] : []),
      price: priceNum,
      originalPrice: originalPriceNum,
      discountPercent: discountPercent > 0 ? discountPercent : 0,
      warranty,
      productDescription: productDescription || null,
      badge: badge || null,
      inStock,
      isBestSeller,
      isFeatured,
      href: `#product-${Date.now()}`,
      sku: generatedSku || product_id,
      variantGroup: variantGroup || null,
      variantDetails: {
        ...attributes.reduce((acc, curr) => {
          if (curr.name.trim()) {
            acc[curr.name.trim()] = curr.value.trim();
          }
          return acc;
        }, {} as Record<string, string>),
        ...(colorName ? {
          colorName: colorName.trim(),
          Color: colorName.trim(),
          colorHex: colorHex,
          ColorHex: colorHex
        } : {})
      },
    };

    if (isFeatured) {
      payload.eyebrow = eyebrow || "FEATURED PRODUCT";
      payload.description = description || `Experience the ultimate cooking with ${name}`;
      payload.specs = specs;
      payload.startingPrice = priceNum;
      payload.primaryCTALabel = "Buy Now";
      payload.primaryCTAHref = "#buy-now";
      payload.secondaryCTALabel = "Compare Specs";
      payload.secondaryCTAHref = "#compare";
      payload.imagePosition = imagePosition;
    }

    setIsSubmitLoading(true);
    const token = localStorage.getItem("authToken");

    try {
      const url = productId
        ? `http://localhost:5000/api/products/${productId}`
        : "http://localhost:5000/api/products";
      const method = productId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
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

      toast.success(productId ? "Product updated successfully" : "Product added successfully");
      router.push("/admin/products");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to save product");
    } finally {
      setIsSubmitLoading(false);
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!productId) return;
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    setIsDeleteLoading(true);
    const token = localStorage.getItem("authToken");

    try {
      const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Delete failed");
      }

      toast.success("Product deleted successfully");
      router.push("/admin/products");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to delete product");
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const isDark = theme === "dark";

  if (authLoading || loading) {
    return (
      <div className={cn(
        "min-h-screen flex flex-col items-center justify-center font-sans",
        isDark ? "bg-[#0d0d0d] text-white" : "bg-[#fafafa] text-slate-950"
      )}>
        <Loader2 className="w-10 h-10 text-[#D71920] animate-spin" />
        <p className={cn("mt-4 font-sans text-sm", isDark ? "text-neutral-400" : "text-neutral-500")}>
          Loading details...
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen flex flex-col lg:flex-row transition-colors duration-300 font-sans selection:bg-[#D71920]/30 selection:text-white",
      isDark ? "dark bg-[#0d0d0d] text-white" : "bg-[#fafafa] text-slate-900"
    )}>
      {/* Shared Sidebar Component */}
      <AdminSidebar currentPath="/admin/manage-product" theme={theme} toggleTheme={toggleTheme} />

      {/* Main Panel Content Area */}
      <div className="flex-grow lg:pl-64 flex flex-col min-h-screen">

        {/* Dynamic Inner Page Header */}
        <header className={cn(
          "px-6 py-6 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors duration-300",
          isDark ? "border-neutral-800 bg-[#0d0d0d]/80" : "border-neutral-200 bg-white"
        )}>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#D71920] uppercase tracking-wider mb-1">
              <Layers size={14} />
              <span>Smart Appliances</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              {productId ? "Edit Smart Appliance" : "Add New Appliance"}
            </h1>
            <p className={cn("text-xs mt-0.5", isDark ? "text-neutral-500" : "text-neutral-400")}>
              {productId ? "Update appliance specifications, prices, and visual hero properties." : "Publish a new smart kitchen product catalog appliance."}
            </p>
          </div>

          <button
            onClick={() => router.push("/admin/products")}
            className={cn(
              "px-3.5 py-2 border rounded-lg text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer",
              isDark
                ? "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800"
                : "bg-white border-neutral-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            <ArrowLeft size={14} />
            <span>Back to Products</span>
          </button>
        </header>

        {/* Form Body Container */}
        <main className="flex-grow p-6 flex justify-center">
          <div className={cn(
            "w-full max-w-3xl border rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-md transition-all",
            isDark ? "bg-neutral-950/60 border-neutral-800/80" : "bg-white border-neutral-200"
          )}>
            <form onSubmit={handleSubmit} className="space-y-6">

              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* General Specs Header */}
                  <h3 className={cn(
                    "text-xs font-bold uppercase tracking-widest border-b pb-2 flex items-center gap-1.5",
                    isDark ? "text-neutral-400 border-neutral-800/60" : "text-slate-500 border-neutral-200"
                  )}>
                    <Settings size={14} />
                    <span>Step 1: Appliance & Variant Details</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Category Selection */}
                    <div ref={categoryDropdownRef} className="md:col-span-2 relative">
                      <label className={cn(
                        "block text-xs font-bold uppercase tracking-wider mb-1.5",
                        isDark ? "text-neutral-400" : "text-slate-600"
                      )}>
                        Appliance Category *
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                          className={cn(
                            "w-full px-4 py-2.5 border rounded-lg text-sm flex items-center justify-between transition-all cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-[#D71920] focus:border-[#D71920]",
                            isDark
                              ? "bg-neutral-900 border-neutral-800 text-white"
                              : "bg-white border-slate-300 text-slate-900"
                          )}
                        >
                          <span className="truncate">
                            {categoryOptions.find(o => o.value === category)?.label || "Select Category"}
                          </span>
                          <span className={cn("transition-transform duration-200 shrink-0 ml-2 text-xs", isCategoryDropdownOpen ? "rotate-180" : "")}>
                            ▼
                          </span>
                        </button>

                        {isCategoryDropdownOpen && (
                          <div
                            className={cn(
                              "absolute z-10 mt-1.5 w-full border rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150 py-1",
                              isDark
                                ? "bg-neutral-950 border-neutral-800 text-white"
                                : "bg-white border-slate-300 text-slate-900"
                            )}
                          >
                            {categoryOptions.map((opt) => (
                              <div
                                key={opt.value}
                                onClick={() => {
                                  handleCategoryChange(opt.value);
                                  setIsCategoryDropdownOpen(false);
                                }}
                                className={cn(
                                  "px-4 py-2 text-sm cursor-pointer transition-colors text-left select-none",
                                  isDark ? "hover:bg-neutral-900" : "hover:bg-slate-50",
                                  category === opt.value
                                    ? (isDark ? "bg-[#D71920]/10 text-[#D71920] font-semibold" : "bg-slate-100 text-[#D71920] font-semibold")
                                    : ""
                                )}
                              >
                                {opt.label}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Name */}
                    <div className="md:col-span-2">
                      <label className={cn(
                        "block text-xs font-bold uppercase tracking-wider mb-1.5",
                        isDark ? "text-neutral-400" : "text-slate-600"
                      )}>
                        Appliance Name *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="e.g. SD Smart Pressure Cooker"
                        className={cn(
                          "w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#D71920] focus:border-[#D71920] transition-all",
                          isDark
                            ? "bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600"
                            : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                        )}
                      />
                    </div>

                    {/* Model Name */}
                    <div className="md:col-span-2">
                      <label className={cn(
                        "block text-xs font-bold uppercase tracking-wider mb-1.5",
                        isDark ? "text-neutral-400" : "text-slate-600"
                      )}>
                        Model Name *
                      </label>
                      {(() => {
                        const presets = categoryModels[category] || [];
                        const activePresets = presets.filter(
                          (p) => !deletedPresetModels.some((dm) => dm.category === category && dm.name.toLowerCase() === p.toLowerCase())
                        );
                        const allAvailableModels = Array.from(new Set([...activePresets, ...dynamicModels])).filter(Boolean);
                        
                        if (allAvailableModels.length > 0) {
                          return (
                            <div ref={dropdownRef} className="space-y-3 relative">
                              <div className="relative">
                                {/* Trigger Button */}
                                <button
                                  type="button"
                                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                  className={cn(
                                    "w-full px-4 py-2.5 border rounded-lg text-sm flex items-center justify-between transition-all cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-[#D71920] focus:border-[#D71920]",
                                    isDark
                                      ? "bg-neutral-900 border-neutral-800 text-white"
                                      : "bg-white border-slate-300 text-slate-900"
                                  )}
                                >
                                  <span className="truncate">
                                    {isCustomModel ? "Custom..." : (modelNumber || "Select Model")}
                                  </span>
                                  <span className={cn("transition-transform duration-200 shrink-0 ml-2 text-xs", isDropdownOpen ? "rotate-180" : "")}>
                                    ▼
                                  </span>
                                </button>

                                {/* Dropdown Menu Panel */}
                                {isDropdownOpen && (
                                  <div
                                    className={cn(
                                      "absolute z-10 mt-1.5 w-full border rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150 py-1",
                                      isDark
                                        ? "bg-neutral-950 border-neutral-800 text-white"
                                        : "bg-white border-slate-300 text-slate-900"
                                    )}
                                  >
                                    {/* Default Select Option */}
                                    <div
                                      onClick={() => {
                                        setIsCustomModel(false);
                                        setModelNumber("");
                                        setIsDropdownOpen(false);
                                      }}
                                      className={cn(
                                        "px-4 py-2 text-sm cursor-pointer transition-colors text-left",
                                        isDark ? "hover:bg-neutral-900 text-neutral-500" : "hover:bg-slate-50 text-slate-400"
                                      )}
                                    >
                                      Select Model
                                    </div>

                                    {/* Available Model Options */}
                                    {allAvailableModels.map((m) => (
                                      <div
                                        key={m}
                                        className={cn(
                                          "px-4 py-2 text-sm flex items-center justify-between cursor-pointer transition-colors text-left select-none group/item",
                                          isDark ? "hover:bg-neutral-900" : "hover:bg-slate-50",
                                          modelNumber === m && !isCustomModel
                                            ? (isDark ? "bg-[#D71920]/10 text-[#D71920] font-semibold" : "bg-slate-100 text-[#D71920] font-semibold")
                                            : ""
                                        )}
                                      >
                                        <span
                                          onClick={() => {
                                            setIsCustomModel(false);
                                            setModelNumber(m);
                                            setIsDropdownOpen(false);
                                          }}
                                          className="flex-grow py-0.5"
                                        >
                                          {m}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteModel(m);
                                          }}
                                          className="text-neutral-450 hover:text-red-500 hover:bg-red-500/10 p-1 rounded-full transition-colors cursor-pointer shrink-0"
                                          title={`Delete Model ${m}`}
                                        >
                                          <X size={14} />
                                        </button>
                                      </div>
                                    ))}

                                    {/* Custom... Option */}
                                    <div
                                      onClick={() => {
                                        setIsCustomModel(true);
                                        setModelNumber("");
                                        setIsDropdownOpen(false);
                                      }}
                                      className={cn(
                                        "px-4 py-2 text-sm cursor-pointer transition-colors border-t text-left",
                                        isDark ? "hover:bg-neutral-900 border-neutral-850" : "hover:bg-slate-50 border-slate-100",
                                        isCustomModel ? (isDark ? "bg-neutral-900/50" : "bg-slate-100") : ""
                                      )}
                                    >
                                      Custom...
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Show custom input if "Custom..." is selected */}
                              {isCustomModel && (
                                <input
                                  type="text"
                                  value={modelNumber}
                                  onChange={(e) => setModelNumber(e.target.value)}
                                  required
                                  placeholder="Enter custom model name (e.g. Deluxe)"
                                  className={cn(
                                    "w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#D71920] focus:border-[#D71920] transition-all animate-in fade-in slide-in-from-top-1 duration-200",
                                    isDark
                                      ? "bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600"
                                      : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                                  )}
                                />
                              )}
                            </div>
                          );
                        } else {
                          return (
                            <div className="space-y-3">
                              <input
                                type="text"
                                value={modelNumber}
                                onChange={(e) => setModelNumber(e.target.value)}
                                required
                                placeholder="e.g. Deluxe"
                                className={cn(
                                  "w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#D71920] focus:border-[#D71920] transition-all",
                                  isDark
                                    ? "bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600"
                                    : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                                )}
                              />
                            </div>
                          );
                        }
                      })()}
                    </div>

                    {/* Variant Group */}
                    <div className="md:col-span-2">
                      <label className={cn(
                        "block text-xs font-bold uppercase tracking-wider mb-1.5",
                        isDark ? "text-neutral-400" : "text-slate-600"
                      )}>
                        Variant Group Name (Auto-Generated)
                      </label>
                      <input
                        type="text"
                        value={variantGroup}
                        readOnly
                        disabled
                        placeholder="Auto-generated from Category and Model Name"
                        className={cn(
                          "w-full px-4 py-2.5 border rounded-lg text-sm transition-all cursor-not-allowed opacity-70",
                          isDark
                            ? "bg-neutral-800 border-neutral-700 text-neutral-400"
                            : "bg-slate-100 border-slate-200 text-slate-500"
                        )}
                      />
                      <p className="text-[10px] mt-1 text-slate-500">
                        This is the single source of truth for linking variants together. It is calculated automatically.
                      </p>
                    </div>

                    {/* Visual Color Variant Picker */}
                    <div className={cn(
                      "md:col-span-2 p-5 border rounded-2xl space-y-4",
                      isDark ? "bg-neutral-900/20 border-neutral-800" : "bg-slate-50/50 border-slate-200"
                    )}>
                      <div className="flex items-center justify-between border-b pb-2 border-neutral-800/40">
                        <label className={cn(
                          "block text-xs font-bold uppercase tracking-wider",
                          isDark ? "text-neutral-300" : "text-slate-700"
                        )}>
                          Product Color Variant Info
                        </label>
                        {productId && (
                          <button
                            type="button"
                            onClick={handleAddNewColorVariant}
                            className="px-2 py-0.5 border border-[#D71920] rounded-lg text-[10px] font-bold text-[#D71920] hover:bg-[#D71920]/10 transition-all cursor-pointer"
                          >
                            + Add New Color Variant
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Left column: Swatch selector & picker */}
                        <div className="space-y-4">
                          <label className={cn(
                            "block text-[11px] font-bold uppercase tracking-wider",
                            isDark ? "text-neutral-500" : "text-slate-550"
                          )}>
                            Choose Color Swatch
                          </label>
                          <div className="flex flex-wrap gap-2.5">
                            {[
                              { name: "Black", hex: "#111111" },
                              { name: "White", hex: "#FFFFFF" },
                              { name: "Blue", hex: "#4169E1" },
                              { name: "Red", hex: "#D62828" },
                              { name: "Silver", hex: "#C0C0C0" },
                              { name: "Gold", hex: "#F6E7C8" },
                              { name: "Green", hex: "#2E7D32" },
                              { name: "Grey", hex: "#757575" },
                              { name: "Brown", hex: "#8D6E63" },
                              { name: "Pink", hex: "#EC407A" }
                            ].map((preset) => (
                              <button
                                key={preset.name}
                                type="button"
                                onClick={() => {
                                  setColorName(preset.name);
                                  setColorHex(preset.hex);
                                }}
                                className={cn(
                                  "w-9 h-9 rounded-full border-2 transition-all duration-300 shadow-sm relative group cursor-pointer hover:scale-110",
                                  colorHex.toLowerCase() === preset.hex.toLowerCase()
                                    ? "border-[#D71920] scale-105"
                                    : (isDark ? "border-neutral-700 hover:border-neutral-500" : "border-white hover:border-slate-300")
                                )}
                                style={{ backgroundColor: preset.hex }}
                                title={preset.name}
                              >
                                {colorHex.toLowerCase() === preset.hex.toLowerCase() && (
                                  <span className="absolute inset-0 flex items-center justify-center text-white bg-black/20 rounded-full">
                                    <Check size={14} className={preset.hex === "#FFFFFF" ? "text-black" : "text-white"} />
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>

                          {/* Custom Color Picker input */}
                          <div className="flex items-center gap-3 pt-2">
                            <input
                              type="color"
                              value={colorHex}
                              onChange={(e) => setColorHex(e.target.value)}
                              className="w-10 h-10 p-0.5 border-0 rounded-lg cursor-pointer bg-transparent"
                            />
                            <div className="text-xs">
                              <span className={isDark ? "text-neutral-400" : "text-slate-650"}>Custom Hex: </span>
                              <input
                                type="text"
                                value={colorHex}
                                onChange={(e) => setColorHex(e.target.value)}
                                className={cn(
                                  "w-24 px-2 py-1 text-center font-mono border rounded-lg text-xs uppercase focus:outline-none focus:ring-1 focus:ring-[#D71920]",
                                  isDark ? "bg-neutral-950 border-neutral-800 text-white" : "bg-white border-slate-350 text-slate-900"
                                )}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Right column: Color Display Name */}
                        <div className="space-y-4">
                          <div>
                            <label className={cn(
                              "block text-[11px] font-bold uppercase tracking-wider mb-1.5",
                              isDark ? "text-neutral-500" : "text-slate-550"
                            )}>
                              Color Display Name
                            </label>
                            <input
                              type="text"
                              value={colorName}
                              onChange={(e) => setColorName(e.target.value)}
                              placeholder="e.g. Royal Blue, Rose Gold"
                              className={cn(
                                "w-full px-4 py-2.5 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#D71920] focus:border-[#D71920] transition-all",
                                isDark
                                  ? "bg-neutral-950 border-neutral-800 text-white placeholder-neutral-700"
                                  : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                              )}
                            />
                          </div>

                          <div className="text-[11px] text-slate-500 leading-relaxed">
                            Specify the color name and hex code for this variant. If other products in the database share the same model name, they will be dynamically linked as swatches on the product details page.
                          </div>
                        </div>
                      </div>

                      {groupVariants.length > 1 && (
                        <div className="border-t pt-4 border-neutral-850/60">
                          <label className={cn(
                            "block text-[11px] font-bold uppercase tracking-wider mb-2",
                            isDark ? "text-neutral-500" : "text-slate-550"
                          )}>
                            Other Variants in this Group ({groupVariants.length})
                          </label>
                          <div className="flex flex-wrap gap-3">
                            {groupVariants.map((v) => {
                              const vColorName = v.variantDetails?.colorName || v.variantDetails?.Color || "Default";
                              const vColorHex = v.variantDetails?.colorHex || v.variantDetails?.ColorHex || "#CCCCCC";
                              const isActive = v.id === productId;
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() => {
                                    if (v.id !== productId) {
                                      router.push(`/admin/manage-product?id=${v.id}`);
                                    }
                                  }}
                                  className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 border rounded-xl text-xs transition-all cursor-pointer",
                                    isActive
                                      ? "border-[#D71920] bg-[#D71920]/10 text-[#D71920]"
                                      : (isDark ? "bg-neutral-900 border-neutral-850 text-neutral-350 hover:bg-neutral-800" : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50")
                                  )}
                                >
                                  <span className="w-3.5 h-3.5 rounded-full border border-neutral-400" style={{ backgroundColor: vColorHex }} />
                                  <span>{vColorName} ({v.sku || "No SKU"})</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Dynamic Variant Attributes System */}
                    <div className="md:col-span-2 space-y-4">
                      <div className="flex items-center justify-between border-b pb-2 border-neutral-800/60">
                        <label className={cn(
                          "block text-xs font-bold uppercase tracking-wider",
                          isDark ? "text-neutral-400" : "text-slate-600"
                        )}>
                          Appliance Attributes / Variants
                        </label>
                        <button
                          type="button"
                          onClick={() => setAttributes([...attributes, { name: "", value: "" }])}
                          className={cn(
                            "px-2.5 py-1 border rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer",
                            isDark
                              ? "bg-neutral-900 border-neutral-800 text-[#D71920] hover:bg-neutral-800"
                              : "bg-slate-50 border-slate-200 text-[#D71920] hover:bg-[#D71920]"
                          )}
                        >
                          <Plus size={12} />
                          <span>Add Attribute</span>
                        </button>
                      </div>

                      {attributes.length === 0 ? (
                        <div className={cn(
                          "p-6 text-center border-2 border-dashed rounded-xl",
                          isDark ? "border-neutral-900 text-neutral-500" : "border-slate-200 text-slate-450"
                        )}>
                          <p className="text-xs">No attributes defined yet.</p>
                          <p className="text-[10px] mt-1">Attributes will be used to dynamically generate the SKU.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {attributes.map((attr, idx) => {
                            // Get suggested values based on attribute name
                            const presets = attributePresets[category] || [];
                            const matchedPreset = presets.find(p => p.name.toLowerCase() === attr.name.toLowerCase());
                            const suggestedValues = matchedPreset ? matchedPreset.values : [];
                            
                            // Get suggested names that are not already added
                            const suggestedNames = presets
                              .map(p => p.name)
                              .filter(name => !attributes.some((a, aIdx) => aIdx !== idx && a.name.toLowerCase() === name.toLowerCase()));

                            return (
                              <div
                                key={idx}
                                className={cn(
                                  "p-4 border rounded-xl space-y-3 relative group transition-all",
                                  isDark ? "bg-neutral-900/30 border-neutral-850" : "bg-slate-50/50 border-slate-200"
                                )}
                              >
                                {/* Remove button */}
                                <button
                                  type="button"
                                  onClick={() => setAttributes(attributes.filter((_, i) => i !== idx))}
                                  className="absolute top-3 right-3 text-neutral-500 hover:text-red-500 transition-colors cursor-pointer"
                                  title="Remove attribute"
                                >
                                  <Trash2 size={14} />
                                </button>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-6">
                                  {/* Attribute Name Input */}
                                  <div>
                                    <label className={cn(
                                      "block text-[10px] font-bold uppercase tracking-wider mb-1",
                                      isDark ? "text-neutral-500" : "text-slate-500"
                                    )}>
                                      Attribute Name
                                    </label>
                                    <input
                                      type="text"
                                      value={attr.name}
                                      onChange={(e) => {
                                        const newAttrs = [...attributes];
                                        newAttrs[idx].name = e.target.value;
                                        setAttributes(newAttrs);
                                      }}
                                      placeholder="e.g. Capacity, Size, Material"
                                      className={cn(
                                        "w-full px-3 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#D71920] focus:border-[#D71920] transition-all",
                                        isDark
                                          ? "bg-neutral-950 border-neutral-800 text-white placeholder-neutral-700"
                                          : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                                      )}
                                    />
                                    {/* Suggested Names */}
                                    {suggestedNames.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        <span className="text-[9px] text-neutral-500 mr-1 self-center">Suggestions:</span>
                                        {suggestedNames.map(name => (
                                          <button
                                            key={name}
                                            type="button"
                                            onClick={() => {
                                              const newAttrs = [...attributes];
                                              newAttrs[idx].name = name;
                                              const p = presets.find(pr => pr.name === name);
                                              if (p && p.values.length > 0) {
                                                newAttrs[idx].value = p.values[0];
                                              }
                                              setAttributes(newAttrs);
                                            }}
                                            className={cn(
                                              "px-1.5 py-0.5 rounded text-[9px] font-semibold transition-all border",
                                              isDark
                                                ? "bg-neutral-900 border-neutral-800 text-neutral-450 hover:text-white hover:bg-neutral-800"
                                                : "bg-white border-slate-200 text-slate-650 hover:bg-slate-100 hover:text-slate-900"
                                            )}
                                          >
                                            {name}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Attribute Value Input */}
                                  <div>
                                    <label className={cn(
                                      "block text-[10px] font-bold uppercase tracking-wider mb-1",
                                      isDark ? "text-neutral-500" : "text-slate-500"
                                    )}>
                                      Attribute Value
                                    </label>
                                    <input
                                      type="text"
                                      value={attr.value}
                                      onChange={(e) => {
                                        const newAttrs = [...attributes];
                                        newAttrs[idx].value = e.target.value;
                                        setAttributes(newAttrs);
                                      }}
                                      placeholder="e.g. 3L, 280mm, Glass Top"
                                      className={cn(
                                        "w-full px-3 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#D71920] focus:border-[#D71920] transition-all",
                                        isDark
                                          ? "bg-neutral-950 border-neutral-800 text-white placeholder-neutral-700"
                                          : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                                      )}
                                    />
                                    {/* Suggested Values */}
                                    {suggestedValues.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        <span className="text-[9px] text-neutral-500 mr-1 self-center">Suggestions:</span>
                                        {suggestedValues.map(val => (
                                          <button
                                            key={val}
                                            type="button"
                                            onClick={() => {
                                              const newAttrs = [...attributes];
                                              newAttrs[idx].value = val;
                                              setAttributes(newAttrs);
                                            }}
                                            className={cn(
                                              "px-1.5 py-0.5 rounded text-[9px] font-semibold transition-all border",
                                              isDark
                                                ? "bg-neutral-900 border-neutral-800 text-neutral-450 hover:text-white hover:bg-neutral-800"
                                                : "bg-white border-slate-200 text-slate-650 hover:bg-slate-100 hover:text-slate-900"
                                            )}
                                          >
                                            {val}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Auto-Generated SKU */}
                    <div className="md:col-span-2 mt-2">
                      <label className={cn(
                        "block text-xs font-bold uppercase tracking-wider mb-1.5",
                        isDark ? "text-neutral-400" : "text-slate-600"
                      )}>
                        Generated SKU (Auto)
                      </label>
                      <input
                        type="text"
                        value={generatedSku}
                        readOnly
                        className={cn(
                          "w-full px-4 py-2.5 border rounded-lg text-sm opacity-70 cursor-not-allowed",
                          isDark
                            ? "bg-neutral-900 border-neutral-800 text-neutral-400"
                            : "bg-neutral-100 border-slate-300 text-slate-500"
                        )}
                      />
                    </div>
                  </div>

                  {/* Summary Preview */}
                  {name && modelNumber && generatedSku !== "SDXX001-XX" && (
                    <div className={cn(
                      "mt-6 p-4 border rounded-xl shadow-sm",
                      isDark ? "bg-neutral-900/50 border-neutral-800" : "bg-slate-50 border-slate-200"
                    )}>
                      <h4 className={cn("text-xs font-bold uppercase tracking-wider mb-3", isDark ? "text-neutral-400" : "text-slate-500")}>
                        Variant Summary Preview
                      </h4>
                      <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <span className={isDark ? "text-neutral-500" : "text-slate-500"}>Category:</span>
                        <span className="font-semibold">{categoryLabel}</span>
                        
                        <span className={isDark ? "text-neutral-500" : "text-slate-500"}>Appliance Name:</span>
                        <span className="font-semibold">{name}</span>
                        
                        <span className={isDark ? "text-neutral-500" : "text-slate-500"}>Model Name:</span>
                        <span className="font-semibold">{modelNumber}</span>

                        <span className={isDark ? "text-neutral-500" : "text-slate-500"}>Variant Details:</span>
                        <span className="font-semibold">
                          {attributes.map(a => `${a.name}: ${a.value}`).join(" | ") || "N/A"}
                        </span>
                        
                        <span className={isDark ? "text-neutral-500" : "text-slate-500"}>Generated SKU:</span>
                        <span className="font-bold text-[#D71920]">{generatedSku}</span>
                      </div>
                    </div>
                  )}

                  {/* Next Button */}
                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="px-6 py-2.5 bg-[#D71920] hover:bg-[#B91520] rounded-lg text-sm font-bold text-white transition-all shadow-lg shadow-[#D71920]/15"
                    >
                      Next Step &rarr;
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                  {/* Step 2 Section Wrapper */}
                  <div className="space-y-4">
                    <h3 className={cn(
                      "text-xs font-bold uppercase tracking-widest border-b pb-2 flex items-center gap-1.5",
                      isDark ? "text-neutral-400 border-neutral-800/60" : "text-slate-500 border-neutral-200"
                    )}>
                      <Settings size={14} />
                      <span>Step 2: Media & Pricing Configuration</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Image Upload Area */}
                  <div
                    className="md:col-span-2 space-y-3"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const files = e.dataTransfer.files;
                      if (files) handleFiles(files);
                    }}
                  >
                    <label className={cn(
                      "block text-xs font-bold uppercase tracking-wider mb-1.5",
                      isDark ? "text-neutral-400" : "text-slate-600"
                    )}>
                      Appliance Images *
                    </label>

                    {/* Drag and drop upload zone */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const files = e.dataTransfer.files;
                        if (files) handleFiles(files);
                      }}
                      onClick={() => document.getElementById("file-upload-input")?.click()}
                      className={cn(
                        "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5",
                        isDark
                          ? "bg-neutral-900/40 border-neutral-800 hover:border-[#D71920]/50 hover:bg-neutral-900/60"
                          : "bg-neutral-50/55 border-slate-300 hover:border-[#D71920]/50 hover:bg-neutral-50/80"
                      )}
                    >
                      <input
                        id="file-upload-input"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files) {
                            handleFiles(e.target.files);
                            e.target.value = "";
                          }
                        }}
                        className="hidden"
                      />
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-300 hover:scale-110",
                        isDark ? "bg-neutral-800 text-neutral-400" : "bg-slate-100 text-slate-500"
                      )}>
                        <UploadCloud className="w-6 h-6 text-[#D71920]" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">
                          Click to upload or drag & drop
                        </p>
                        <p className={cn("text-xs", isDark ? "text-neutral-500" : "text-slate-400")}>
                          SVG, PNG, JPG or WEBP (Max width/height 800px)
                        </p>
                      </div>
                    </div>

                    {/* Preview list */}
                    {images.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 animate-fade-in">
                        {images.map((imgSrc, index) => (
                          <div
                            key={index}
                            className={cn(
                              "group relative aspect-square rounded-xl overflow-hidden border transition-all duration-300 shadow-md",
                              index === 0
                                ? "border-[#D71920] ring-2 ring-[#D71920]/20"
                                : isDark ? "border-neutral-800 bg-neutral-900" : "border-slate-200 bg-white"
                            )}
                          >
                            <img
                              src={imgSrc}
                              alt={`Appliance image ${index + 1}`}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />

                            {/* Overlay Controls */}
                            <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-2">
                              {/* Top Bar: Delete action */}
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeImage(index);
                                  }}
                                  className="w-7 h-7 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-colors shadow cursor-pointer"
                                  title="Delete image"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>

                              {/* Bottom Bar: Primary / Make Primary action */}
                              <div>
                                {index === 0 ? (
                                  <span className="w-full block text-center py-1 bg-[#D71920] text-white text-[10px] font-bold uppercase tracking-wider rounded-md">
                                    Primary
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      makePrimary(index);
                                    }}
                                    className="w-full py-1 bg-white hover:bg-slate-100 text-slate-900 text-[10px] font-bold uppercase tracking-wider rounded-md shadow transition-colors cursor-pointer"
                                  >
                                    Set Primary
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Non-hover Badges */}
                            {index === 0 && (
                              <div className="absolute top-2 left-2 pointer-events-none">
                                <span className="px-1.5 py-0.5 bg-[#D71920] text-white text-[9px] font-bold uppercase tracking-wider rounded">
                                  Primary
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Price (Selling Price) */}
                  <div>
                    <label className={cn(
                      "block text-xs font-bold uppercase tracking-wider mb-1.5",
                      isDark ? "text-neutral-400" : "text-slate-600"
                    )}>
                      Selling Price (INR) *
                    </label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                      min="0"
                      placeholder="6499"
                      className={cn(
                        "w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#D71920] focus:border-[#D71920] transition-all",
                        isDark
                          ? "bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600"
                          : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                      )}
                    />
                  </div>

                  {/* Original Price */}
                  <div>
                    <label className={cn(
                      "block text-xs font-bold uppercase tracking-wider mb-1.5",
                      isDark ? "text-neutral-400" : "text-slate-600"
                    )}>
                      Original Price (INR) *
                    </label>
                    <input
                      type="number"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      required
                      min="0"
                      placeholder="8499"
                      className={cn(
                        "w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#D71920] focus:border-[#D71920] transition-all",
                        isDark
                          ? "bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600"
                          : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                      )}
                    />
                  </div>

                  {/* Warranty */}
                  <div>
                    <label className={cn(
                      "block text-xs font-bold uppercase tracking-wider mb-1.5",
                      isDark ? "text-neutral-400" : "text-slate-600"
                    )}>
                      Warranty Period
                    </label>
                    <input
                      type="text"
                      value={warranty}
                      onChange={(e) => setWarranty(e.target.value)}
                      placeholder="e.g. 5 Years"
                      className={cn(
                        "w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#D71920] focus:border-[#D71920] transition-all",
                        isDark
                          ? "bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600"
                          : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                      )}
                    />
                  </div>

                  {/* Product-description */}
                  <div>
                    <label className={cn(
                      "block text-xs font-bold uppercase tracking-wider mb-1.5",
                      isDark ? "text-neutral-400" : "text-slate-600"
                    )}>
                      Product-description <span className="text-[10px] text-neutral-500 font-semibold"></span>
                    </label>
                    <textarea
                      value={productDescription}
                      onChange={(e) => setProductDescription(e.target.value)}
                      placeholder="Enter product-description"
                      className={cn(
                        "w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#D71920] focus:border-[#D71920] transition-all",
                        isDark
                          ? "bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600"
                          : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                      )}
                    />
                  </div>

                  {/* Badge Text */}
                  <div ref={badgeDropdownRef} className="relative">
                    <label className={cn(
                      "block text-xs font-bold uppercase tracking-wider mb-1.5",
                      isDark ? "text-neutral-400" : "text-slate-600"
                    )}>
                      Appliance Pill Badge
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsBadgeDropdownOpen(!isBadgeDropdownOpen)}
                        className={cn(
                          "w-full px-4 py-2.5 border rounded-lg text-sm flex items-center justify-between transition-all cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-[#D71920] focus:border-[#D71920]",
                          isDark
                            ? "bg-neutral-900 border-neutral-800 text-white"
                            : "bg-white border-slate-300 text-slate-900"
                        )}
                      >
                        <span className="truncate">
                          {badgeOptions.find(o => o.value === badge)?.label || "No Badge"}
                        </span>
                        <span className={cn("transition-transform duration-200 shrink-0 ml-2 text-xs", isBadgeDropdownOpen ? "rotate-180" : "")}>
                          ▼
                        </span>
                      </button>

                      {isBadgeDropdownOpen && (
                        <div
                          className={cn(
                            "absolute z-10 mt-1.5 w-full border rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150 py-1",
                            isDark
                              ? "bg-neutral-950 border-neutral-800 text-white"
                              : "bg-white border-slate-300 text-slate-900"
                          )}
                        >
                          {badgeOptions.map((opt) => (
                            <div
                              key={opt.value}
                              onClick={() => {
                                setBadge(opt.value);
                                setIsBadgeDropdownOpen(false);
                              }}
                              className={cn(
                                "px-4 py-2 text-sm cursor-pointer transition-colors text-left select-none",
                                isDark ? "hover:bg-neutral-900" : "hover:bg-slate-50",
                                badge === opt.value
                                  ? (isDark ? "bg-[#D71920]/10 text-[#D71920] font-semibold" : "bg-slate-100 text-[#D71920] font-semibold")
                                  : ""
                              )}
                            >
                              {opt.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>


                  {/* Checkboxes */}
                  <div className="flex flex-wrap items-center gap-6 py-2 col-span-1 md:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={inStock}
                        onChange={(e) => setInStock(e.target.checked)}
                        className="w-4 h-4 rounded border text-[#D71920] focus:ring-[#D71920] accent-[#D71920] cursor-pointer"
                      />
                      <span className={isDark ? "text-neutral-400" : "text-slate-600"}>In Stock</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={isBestSeller}
                        onChange={(e) => setIsBestSeller(e.target.checked)}
                        className="w-4 h-4 rounded border text-[#D71920] focus:ring-[#D71920] accent-[#D71920] cursor-pointer"
                      />
                      <span className={isDark ? "text-neutral-400" : "text-slate-600"}>Best Seller List</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="w-4 h-4 rounded border text-[#D71920] focus:ring-[#D71920] accent-[#D71920] cursor-pointer"
                      />
                      <span className={isDark ? "text-neutral-400" : "text-slate-600"}>Feature Showcase Section</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Featured Showcase Specific Fields */}
              {isFeatured && (
                <div className={cn(
                  "space-y-4 p-4 border rounded-xl animate-fade-in transition-all",
                  isDark ? "bg-neutral-900/30 border-neutral-800" : "bg-neutral-50/50 border-neutral-200"
                )}>
                  <h3 className="text-xs font-bold text-[#D71920] uppercase tracking-widest border-b pb-2 flex items-center gap-1.5 border-neutral-800/60">
                    <Settings size={13} />
                    <span>Featured Hero Panel Fields</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Eyebrow */}
                    <div>
                      <label className={cn(
                        "block text-xs font-bold uppercase tracking-wider mb-1.5",
                        isDark ? "text-neutral-400" : "text-slate-600"
                      )}>
                        Hero Eyebrow *
                      </label>
                      <input
                        type="text"
                        value={eyebrow}
                        onChange={(e) => setEyebrow(e.target.value)}
                        required={isFeatured}
                        placeholder="e.g. APP CONTROLLED"
                        className={cn(
                          "w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#D71920] focus:border-[#D71920] transition-all",
                          isDark
                            ? "bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600"
                            : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                        )}
                      />
                    </div>

                    {/* Image Position */}
                    <div ref={imagePositionDropdownRef} className="relative">
                      <label className={cn(
                        "block text-xs font-bold uppercase tracking-wider mb-1.5",
                        isDark ? "text-neutral-400" : "text-slate-600"
                      )}>
                        Image Side *
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsImagePositionDropdownOpen(!isImagePositionDropdownOpen)}
                          className={cn(
                            "w-full px-4 py-2.5 border rounded-lg text-sm flex items-center justify-between transition-all cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-[#D71920] focus:border-[#D71920]",
                            isDark
                              ? "bg-neutral-900 border-neutral-800 text-white"
                              : "bg-white border-slate-300 text-slate-900"
                          )}
                        >
                          <span className="truncate">
                            {imagePositionOptions.find(o => o.value === imagePosition)?.label || "Left Side (Text Right)"}
                          </span>
                          <span className={cn("transition-transform duration-200 shrink-0 ml-2 text-xs", isImagePositionDropdownOpen ? "rotate-180" : "")}>
                            ▼
                          </span>
                        </button>

                        {isImagePositionDropdownOpen && (
                          <div
                            className={cn(
                              "absolute z-10 mt-1.5 w-full border rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150 py-1",
                              isDark
                                ? "bg-neutral-950 border-neutral-800 text-white"
                                : "bg-white border-slate-300 text-slate-900"
                            )}
                          >
                            {imagePositionOptions.map((opt) => (
                              <div
                                key={opt.value}
                                onClick={() => {
                                  setImagePosition(opt.value);
                                  setIsImagePositionDropdownOpen(false);
                                }}
                                className={cn(
                                  "px-4 py-2 text-sm cursor-pointer transition-colors text-left select-none",
                                  isDark ? "hover:bg-neutral-900" : "hover:bg-slate-50",
                                  imagePosition === opt.value
                                    ? (isDark ? "bg-[#D71920]/10 text-[#D71920] font-semibold" : "bg-slate-100 text-[#D71920] font-semibold")
                                    : ""
                                )}
                              >
                                {opt.label}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                      <label className={cn(
                        "block text-xs font-bold uppercase tracking-wider mb-1.5",
                        isDark ? "text-neutral-400" : "text-slate-600"
                      )}>
                        Hero Description Text *
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required={isFeatured}
                        rows={3}
                        placeholder="Our flagship smart cooker combines safety, efficiency, and smart connectivity..."
                        className={cn(
                          "w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#D71920] focus:border-[#D71920] transition-all resize-none",
                          isDark
                            ? "bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600"
                            : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                        )}
                      />
                    </div>


                  </div>
                </div>
              )}

              {/* Form Action Buttons */}
              <div className={cn(
                "pt-5 border-t flex flex-wrap items-center justify-between gap-4",
                isDark ? "border-neutral-800" : "border-neutral-200"
              )}>
                <div>
                  {productId && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleteLoading}
                      className="px-4 py-2.5 bg-red-950/20 hover:bg-red-900 border border-red-900/40 text-red-500 hover:text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isDeleteLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                      <span>Delete Appliance</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => router.push("/admin/products")}
                    className={cn(
                      "px-6 py-2.5 border rounded-lg text-sm font-semibold transition-all cursor-pointer",
                      isDark
                        ? "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800"
                        : "bg-white border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className={cn(
                      "px-6 py-2.5 border rounded-lg text-sm font-semibold transition-all cursor-pointer",
                      isDark
                        ? "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800"
                        : "bg-white border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    &larr; Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitLoading}
                    className="px-6 py-2.5 bg-[#D71920] hover:bg-[#B91520] rounded-lg text-sm font-bold text-white transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-[#D71920]/15"
                  >
                    {isSubmitLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>{productId ? "Save Changes" : "Create Appliance"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            )}
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
