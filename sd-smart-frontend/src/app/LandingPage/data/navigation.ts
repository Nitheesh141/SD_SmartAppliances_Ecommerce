import { NavLink, FooterColumn, SocialLink, CommercialSection } from "../types";

export const navLinks: NavLink[] = [
  { label: "Home", href: "#", hasDropdown: false },
  { label: "Categories", href: "#categories", hasDropdown: false },
  { label: "Bestsellers", href: "#best-sellers", hasDropdown: false },
  { label: "Why Us", href: "#why-choose-us", hasDropdown: false },
  { label: "Our Story", href: "#timeline", hasDropdown: false },
  { label: "Commercial", href: "#commercial", hasDropdown: false },
];

export const footerColumns: FooterColumn[] = [
  {
    heading: "Shop Range",
    links: [
      { label: "Pressure Cookers", href: "#pressure-cookers" },
      { label: "Wet Grinders", href: "#wet-grinders" },
      { label: "Kitchen Chimneys", href: "#chimneys" },
      { label: "Mixer Grinders", href: "#mixer-grinders" },
      { label: "Induction Cooktops", href: "#induction-cooktops" }
    ]
  },
  {
    heading: "Support Center",
    links: [
      { label: "Product Warranty", href: "#" },
      { label: "Service Centers", href: "#" },
      { label: "User Manuals", href: "#" },
      { label: "Customer Care", href: "#" },
      { label: "Replacement Parts", href: "#" }
    ]
  },
  {
    heading: "Support Center", // Repeating support for consistency
    links: [
      { label: "About Us", href: "#timeline" },
      { label: "Manufacturing Facility", href: "#" },
      { label: "Commercial kitchen solutions", href: "#commercial" },
      { label: "Corporate Careers", href: "#" },
      { label: "Media Kit", href: "#" }
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
  description: "We manufacture massive capacity grinders, chimneys, and energy-optimized electromagnetic induction systems tailored for restaurants, high-volume caterers, and institutional kitchens. Engineered for continuous operation under demanding conditions.",
  bullets: [
    "Rugged Build: High-grade steel housings",
    "High Capacity: Up to 20-litre wet grinders",
    "Priority Service: On-site technical maintenance"
  ],
  badgeLabel: "COMMERCIAL",
  image: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?q=80&w=1200&auto=format&fit=crop",
  primaryCTA: { label: "Get Commercial Catalog", href: "#catalog" },
  secondaryCTA: { label: "Consult an Engineer", href: "#consult" }
};
