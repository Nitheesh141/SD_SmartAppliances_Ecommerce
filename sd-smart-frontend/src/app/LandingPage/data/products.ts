import { Product, FeaturedProduct } from "../types";

export const bestSellingProducts: Product[] = [
  {
    id: "prod-bestseller-1",
    name: "SD Smart IoT Pressure Cooker Pro",
    category: "pressure-cookers",
    categoryLabel: "Pressure Cookers",
    image: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?q=80&w=400&auto=format&fit=crop",
    rating: 4.8,
    reviewCount: 342,
    price: 6499,
    originalPrice: 8499,
    discountPercent: 23,
    warranty: "10 Years",
    capacity: "5 Litres",
    badge: "Best Seller",
    href: "#smart-cooker",
    inStock: true
  },
  {
    id: "prod-bestseller-2",
    name: "SD Ultra-Silent Wet Grinder Pro",
    category: "wet-grinders",
    categoryLabel: "Wet Grinders",
    image: "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?q=80&w=400&auto=format&fit=crop",
    rating: 4.9,
    reviewCount: 189,
    price: 7999,
    originalPrice: 9999,
    discountPercent: 20,
    warranty: "5 Years",
    capacity: "2 Litres",
    badge: "Top Rated",
    href: "#wet-grinders",
    inStock: true
  },
  {
    id: "prod-bestseller-3",
    name: "SD Intelli-Flame 3-Burner LPG Stove",
    category: "gas-stoves",
    categoryLabel: "LPG Stoves",
    image: "https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?q=80&w=400&auto=format&fit=crop",
    rating: 4.7,
    reviewCount: 275,
    price: 5499,
    originalPrice: 7999,
    discountPercent: 31,
    warranty: "5 Years",
    badge: "Sale",
    href: "#gas-stoves",
    inStock: true
  },
  {
    id: "prod-bestseller-4",
    name: "SD Quad-Blade Mixer Grinder (1000W)",
    category: "mixer-grinders",
    categoryLabel: "Mixer Grinders",
    image: "https://images.unsplash.com/photo-1578643463396-0997cb5328c1?q=80&w=400&auto=format&fit=crop",
    rating: 4.6,
    reviewCount: 512,
    price: 4599,
    originalPrice: 5999,
    discountPercent: 23,
    warranty: "2 Years",
    capacity: "1.5 Litres",
    badge: "New",
    href: "#mixer-grinders",
    inStock: true
  }
];

export const featuredProducts: FeaturedProduct[] = [
  {
    id: "prod-featured-1",
    eyebrow: "APP CONTROLLED",
    name: "SD Smart Pressure Cooker Pro (IoT Edition)",
    description: "Our flagship smart cooker combines safety, efficiency, and smart connectivity. Designed for modern Indian kitchens, it syncs with our mobile app to automatically execute recipes. The multi-layer thermal design retains nutrients, while safety sensors monitor pressure in real-time.",
    startingPrice: 6499,
    image: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?q=80&w=600&auto=format&fit=crop",
    primaryCTA: { label: "Buy Now", href: "/product/prod-featured-1" },
    secondaryCTA: { label: "Compare Specs", href: "/product/prod-featured-1" },
    imagePosition: "left",
    specs: [
      { label: "Capacity", value: "5 Litres" },
      { label: "Body", value: "Tri-Ply Stainless Steel" },
      { label: "Sensors", value: "Dual Temp & Pressure" },
      { label: "Safety", value: "9-Level Redundant" },
      { label: "App", value: "iOS & Android Support" }
    ]
  },
  {
    id: "prod-featured-2",
    eyebrow: "ULTRA-QUIET",
    name: "SD Premium Silent Wet Grinder",
    description: "Redefining wet grinding. Operating under 55dB, this grinder lets you prepare fresh batters in peace. Equipped with premium black granite grinding stones and a digital timer with auto-cut-off, it guarantees perfect consistency for fluffy idlis and crispy dosas.",
    startingPrice: 7999,
    image: "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?q=80&w=600&auto=format&fit=crop",
    primaryCTA: { label: "Buy Now", href: "/product/prod-featured-2" },
    secondaryCTA: { label: "Compare Specs", href: "/product/prod-featured-2" },
    imagePosition: "right",
    specs: [
      { label: "Stones", value: "Dual Granite Rollers" },
      { label: "Motor", value: "150W Induction Motor" },
      { label: "Timer", value: "0-45 Mins Digital" },
      { label: "Material", value: "Polycarbonate Drum" }
    ]
  }
];
