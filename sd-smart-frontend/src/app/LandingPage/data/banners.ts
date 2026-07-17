import { Banner } from "../types";

export const banners: Banner[] = [
  {
    id: "banner-1",
    badge: "NEW ARRIVAL",
    heading: "Smart Kitchen. Smart Living.",
    subheading: "Experience effortless grinding with SD SMART Wet Grinders. Built for smooth performance, durability, and authentic taste in every home.",
    primaryCTA: { label: "Shop Wet Grinders", href: "/shop?category=wet-grinders" },
    secondaryCTA: { label: "Explore Collection", href: "/shop" },
    bgColor: "from-slate-950/80 via-slate-900/40 to-slate-950/80",
    image: "/LandingBanner 1.png"
  },
  {
    id: "banner-2",
    badge: "BEST SELLER",
    heading: "Cook with Confidence. Cook with Style.",
    subheading: "Premium non-stick cookware designed for everyday cooking with superior durability, even heat distribution, and long-lasting performance.",
    primaryCTA: { label: "Shop Cookware", href: "/shop?category=non-stick" },
    secondaryCTA: { label: "View Collection", href: "/shop" },
    bgColor: "from-slate-950/80 via-slate-900/40 to-slate-950/80",
    image: "/LandingBanner 2.png"
  },
  {
    id: "banner-3",
    badge: "TOP CHOICE",
    heading: "Built for Every Flame.",
    subheading: "High-performance LPG stoves crafted for efficiency, safety, and everyday cooking excellence.",
    primaryCTA: { label: "Shop LPG Stoves", href: "/shop?category=gas-stoves" },
    secondaryCTA: { label: "Learn More", href: "/shop" },
    bgColor: "from-slate-950/80 via-slate-900/40 to-slate-950/80",
    image: "/LandingBanner 3.png"
  }
];
