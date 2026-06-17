"use client";

import { useEffect, useState } from "react";
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

  // Featured-specific Fields
  const [eyebrow, setEyebrow] = useState("");
  const [description, setDescription] = useState("");
  const [specs, setSpecs] = useState<SpecItem[]>([]);
  const [newSpecLabel, setNewSpecLabel] = useState("");
  const [newSpecValue, setNewSpecValue] = useState("");
  const [imagePosition, setImagePosition] = useState("left");

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
      if (!isAuthenticated || !user || (user.role !== "admin" && user.role !== "superadmin")) {
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
      router.push("/admin/dashboard");
    } finally {
      setLoading(false);
    }
  };

  // Sync categoryLabel when category changes
  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
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
      case "mixer-grinders":
        setCategoryLabel("Mixer Grinders");
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
      router.push("/admin/dashboard");
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
      router.push("/admin/dashboard");
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
            onClick={() => router.push("/admin/dashboard")}
            className={cn(
              "px-3.5 py-2 border rounded-lg text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer",
              isDark
                ? "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800"
                : "bg-white border-neutral-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </button>
        </header>

        {/* Form Body Container */}
        <main className="flex-grow p-6 flex justify-center">
          <div className={cn(
            "w-full max-w-3xl border rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-md transition-all",
            isDark ? "bg-neutral-950/60 border-neutral-800/80" : "bg-white border-neutral-200"
          )}>
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* General Specs */}
              <div className="space-y-4">
                <h3 className={cn(
                  "text-xs font-bold uppercase tracking-widest border-b pb-2 flex items-center gap-1.5",
                  isDark ? "text-neutral-400 border-neutral-800/60" : "text-slate-500 border-neutral-200"
                )}>
                  <Settings size={14} />
                  <span>General Specifications</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      placeholder="e.g. SD Intelli-Flame 3-Burner LPG Stove"
                      className={cn(
                        "w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#D71920] focus:border-[#D71920] transition-all",
                        isDark
                          ? "bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600"
                          : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                      )}
                    />
                  </div>

                  {/* Model Number and Product ID */}
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Model Number */}
                    <div>
                      <label className={cn(
                        "block text-xs font-bold uppercase tracking-wider mb-1.5",
                        isDark ? "text-neutral-400" : "text-slate-600"
                      )}>
                        Model Number *
                      </label>
                      <input
                        type="text"
                        value={modelNumber}
                        onChange={(e) => setModelNumber(e.target.value)}
                        required
                        placeholder="e.g. SD-IF-3B"
                        className={cn(
                          "w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#D71920] focus:border-[#D71920] transition-all",
                          isDark
                            ? "bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600"
                            : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                        )}
                      />
                    </div>

                    {/* Product ID */}
                    <div>
                      <label className={cn(
                        "block text-xs font-bold uppercase tracking-wider mb-1.5",
                        isDark ? "text-neutral-400" : "text-slate-600"
                      )}>
                        Product ID *
                      </label>
                      <input
                        type="text"
                        value={product_id}
                        onChange={(e) => setproduct_id(e.target.value)}
                        required
                        placeholder="e.g. APPL-COOK-001"
                        className={cn(
                          "w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#D71920] focus:border-[#D71920] transition-all",
                          isDark
                            ? "bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600"
                            : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                        )}
                      />
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div>
                    <label className={cn(
                      "block text-xs font-bold uppercase tracking-wider mb-1.5",
                      isDark ? "text-neutral-400" : "text-slate-600"
                    )}>
                      Appliance Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className={cn(
                        "w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#D71920] focus:border-[#D71920] transition-all cursor-pointer",
                        isDark
                          ? "bg-neutral-900 border-neutral-800 text-white"
                          : "bg-white border-slate-300 text-slate-900"
                      )}
                    >
                      <option value="pressure-cookers">Pressure Cookers</option>
                      <option value="non-stick">Non-Stick Cookware</option>
                      <option value="mixer-grinders">Mixer Grinders</option>
                      <option value="gas-stoves">LPG Stoves</option>
                      <option value="wet-grinders">Wet Grinders</option>
                      <option value="commercial">Commercial Wet Grinders</option>
                    </select>
                  </div>

                  {/* Image Upload Area */}
                  <div className="md:col-span-2 space-y-3">
                    <label className={cn(
                      "block text-xs font-bold uppercase tracking-wider mb-1.5",
                      isDark ? "text-neutral-400" : "text-slate-600"
                    )}>
                      Appliance Images *
                    </label>

                    {/* Drag and drop upload zone */}
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
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
                          if (e.target.files) handleFiles(e.target.files);
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
                  <div>
                    <label className={cn(
                      "block text-xs font-bold uppercase tracking-wider mb-1.5",
                      isDark ? "text-neutral-400" : "text-slate-600"
                    )}>
                      Appliance Pill Badge
                    </label>
                    <select
                      value={badge}
                      onChange={(e) => setBadge(e.target.value)}
                      className={cn(
                        "w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#D71920] focus:border-[#D71920] transition-all cursor-pointer",
                        isDark
                          ? "bg-neutral-900 border-neutral-800 text-white"
                          : "bg-white border-slate-300 text-slate-900"
                      )}
                    >
                      <option value="">No Badge</option>
                      <option value="Best Seller">Best Seller</option>
                      <option value="Top Rated">Top Rated</option>
                      <option value="New">New Arrival</option>
                      <option value="Sale">Special Sale</option>
                    </select>
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
                    <div>
                      <label className={cn(
                        "block text-xs font-bold uppercase tracking-wider mb-1.5",
                        isDark ? "text-neutral-400" : "text-slate-600"
                      )}>
                        Image Side *
                      </label>
                      <select
                        value={imagePosition}
                        onChange={(e) => setImagePosition(e.target.value)}
                        className={cn(
                          "w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#D71920] focus:border-[#D71920] transition-all cursor-pointer",
                          isDark
                            ? "bg-neutral-900 border-neutral-800 text-white"
                            : "bg-white border-slate-300 text-slate-900"
                        )}
                      >
                        <option value="left">Left Side (Text Right)</option>
                        <option value="right">Right Side (Text Left)</option>
                      </select>
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

                    {/* Specs List Builder */}
                    <div className="md:col-span-2 space-y-3">
                      <label className={cn(
                        "block text-xs font-bold uppercase tracking-wider border-b pb-1.5",
                        isDark ? "text-neutral-400 border-neutral-850" : "text-slate-600 border-slate-100"
                      )}>
                        Appliance Specs Key-Value Table
                      </label>

                      {/* Existing Specs */}
                      {specs.length > 0 && (
                        <div className="flex flex-wrap gap-2 py-1">
                          {specs.map((item, index) => (
                            <div
                              key={index}
                              className={cn(
                                "px-2.5 py-1 border rounded-lg flex items-center gap-2 text-xs font-medium",
                                isDark
                                  ? "bg-neutral-900 border-neutral-850 text-neutral-300"
                                  : "bg-slate-100 border-slate-200 text-slate-700"
                              )}
                            >
                              <span className="text-neutral-500">{item.label}:</span>
                              <span>{item.value}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSpec(index)}
                                className="text-neutral-500 hover:text-red-500 cursor-pointer"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Specs Builder Inputs */}
                      <div className="flex gap-3 items-center">
                        <input
                          type="text"
                          value={newSpecLabel}
                          onChange={(e) => setNewSpecLabel(e.target.value)}
                          placeholder="Spec Name (e.g. Sensors)"
                          className={cn(
                            "flex-1 px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#D71920] transition-all",
                            isDark
                              ? "bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600"
                              : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                          )}
                        />
                        <input
                          type="text"
                          value={newSpecValue}
                          onChange={(e) => setNewSpecValue(e.target.value)}
                          placeholder="Spec Value (e.g. Temp & Pressure)"
                          className={cn(
                            "flex-1 px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#D71920] transition-all",
                            isDark
                              ? "bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600"
                              : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                          )}
                        />
                        <button
                          type="button"
                          onClick={handleAddSpec}
                          className={cn(
                            "px-3 py-2 border rounded-lg text-xs font-bold hover:text-white transition-all flex items-center gap-1 cursor-pointer flex-shrink-0",
                            isDark
                              ? "bg-neutral-900 border-neutral-800 text-[#D71920] hover:bg-neutral-800"
                              : "bg-slate-50 border-slate-200 text-[#D71920] hover:bg-[#D71920]"
                          )}
                        >
                          <Plus size={14} />
                          <span>Add</span>
                        </button>
                      </div>
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
                    onClick={() => router.push("/admin/dashboard")}
                    className={cn(
                      "px-4.5 py-2.5 border rounded-lg text-sm font-semibold transition-all cursor-pointer",
                      isDark
                        ? "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800"
                        : "bg-white border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitLoading}
                    className="px-5.5 py-2.5 bg-[#D71920] hover:bg-[#B91520] rounded-lg text-sm font-bold text-white transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-[#D71920]/15"
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
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
