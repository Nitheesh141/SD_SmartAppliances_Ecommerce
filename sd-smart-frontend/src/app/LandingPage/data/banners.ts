import { Banner } from "../types";

export const banners: Banner[] = [
  {
    id: "banner-1",
    badge: "Cookware — Now Available",
    heading: "Cook with Confidence, Cook with Style",
    subheading: "Premium Non-Stick Cookware with PFOA-free coating. Healthy cooking for every Indian family.",
    primaryCTA: { label: "Shop Collection", href: "/shop" },
    secondaryCTA: { label: "Explore Cookware", href: "/shop" },
    bgColor: "from-slate-950/80 via-slate-900/40 to-slate-950/80",
    image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=1600&auto=format&fit=crop"
  },
  {
    id: "banner-2",
    badge: "NEW LAUNCH",
    heading: "Smart Kitchen. Smart Living.",
    subheading: "Introducing SD SMART IoT Pressure Cooker. Automated safety and precision for daily cooking.",
    primaryCTA: { label: "Shop Smart Cooker", href: "/shop/pressure-cookers" },
    secondaryCTA: { label: "Learn More", href: "/shop" },
    bgColor: "from-slate-950/80 via-teal-950/40 to-slate-950/80",
    image: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?q=80&w=1600&auto=format&fit=crop"
  },
  {
    id: "banner-3",
    badge: "BESTSELLER",
    heading: "Silence is Powerful.",
    subheading: "SD Ultra-Silent Wet Grinder Pro. Grind batters smoothly with minimal noise.",
    primaryCTA: { label: "Explore Grinders", href: "/shop/wet-grinders" },
    secondaryCTA: { label: "Learn More", href: "/shop" },
    bgColor: "from-slate-950/80 via-amber-950/40 to-slate-950/80",
    image: "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?q=80&w=1600&auto=format&fit=crop"
  }
];
