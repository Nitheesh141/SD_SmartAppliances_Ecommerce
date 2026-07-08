import { NavLink, FooterColumn, SocialLink, CommercialSection } from "../types";

export const navLinks: NavLink[] = [
  { label: "Home", href: "/", hasDropdown: false },
  { label: "Categories", href: "/#categories", hasDropdown: false },
  { label: "Why Us", href: "/#why-choose-us", hasDropdown: false },
  { label: "Appliances", href: "/shop", hasDropdown: false },
];

export const footerColumns: FooterColumn[] = [
  {
    heading: "Shop Range",
    links: [
      { label: "Pressure Cookers", href: "/shop?category=pressure-cookers" },
      { label: "Wet Grinders", href: "/shop?category=wet-grinders" },
      { label: "LPG Stoves", href: "/shop?category=gas-stoves" },
      { label: "Stainless Steel Wet Grinders", href: "/shop?category=wet-grinders" }
    ]
  },
  {
    heading: "Support Center",
    links: [
      { label: "Product Warranty", href: "/warranty-registration" },
      { label: "Service Centers", href: "/service-request" },
      { label: "User Manuals", href: "/support" },
      { label: "Customer Care", href: "/contact" },
      { label: "Replacement Parts", href: "/support" }
    ]
  },
  {
    heading: "Company Info",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Manufacturing Facility", href: "/about" },
      { label: "Commercial kitchen solutions", href: "/shop?category=commercial" },
      { label: "Corporate Careers", href: "/about" },
      { label: "Media Kit", href: "/about" }
    ]
  }
];

export const socialLinks: SocialLink[] = [
  { platform: "Facebook", href: "#", icon: "FacebookLogo" },
  { platform: "Instagram", href: "#", icon: "InstagramLogo" },
  { platform: "Youtube", href: "#", icon: "YoutubeLogo" },
  { platform: "Twitter", href: "#", icon: "TwitterLogo" }
];

export const commercialSectionData: CommercialSection = {
  eyebrow: "HEAVY-DUTY LINE",
  heading: "Commercial Kitchen Solutions",
  description: "We manufacture massive capacity commercial wet grinders, bulk pressure cookers, and high-efficiency LPG stoves tailored for restaurants, high-volume caterers, and institutional kitchens. Engineered for continuous operation under demanding conditions.",
  bullets: [
    "Rugged Build: High-grade steel housings",
    "High Capacity: Up to 20-litre wet grinders",
    "Priority Service: On-site technical maintenance"
  ],
  badgeLabel: "COMMERCIAL",
  image: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?q=80&w=1200&auto=format&fit=crop",
  primaryCTA: { label: "Get Commercial Catalog", href: "/sd-smart-ecommerce/2026-SD Smart Catalogue.pdf" }
};
