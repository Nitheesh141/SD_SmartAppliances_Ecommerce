// ─── Banner / Hero ────────────────────────────────────────────────────────────
export interface Banner {
  id: string;
  badge: string;
  heading: string;
  subheading: string;
  primaryCTA: { label: string; href: string };
  secondaryCTA: { label: string; href: string };
  bgColor: string; // tailwind bg class or hex
  image?: string;
}

// ─── Category ────────────────────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  href: string;
  isActive?: boolean;
}

// ─── Product ─────────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  image: string;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice: number;
  discountPercent: number;
  warranty: string;
  capacity?: string;
  badge?: "Best Seller" | "Top Rated" | "New" | "Sale";
  href: string;
  inStock: boolean;
  modelNumber?: string;
  productId?: string;
  availableStock?: number;
  stockIn?: number;
  stockOut?: number;
  variantDetails?: Record<string, any>;
}

// ─── Feature / Why Choose ────────────────────────────────────────────────────
export interface Feature {
  id: string;
  icon: string; // lucide icon name
  title: string;
  description: string;
}

// ─── Featured Product (showcase) ─────────────────────────────────────────────
export interface FeaturedProduct {
  id: string;
  eyebrow: string;
  name: string;
  description: string;
  specs: { label: string; value: string }[];
  startingPrice: number;
  image: string;
  primaryCTA: { label: string; href: string };
  secondaryCTA: { label: string; href: string };
  imagePosition: "left" | "right";
}

// ─── Timeline ────────────────────────────────────────────────────────────────
export interface TimelineItem {
  id: string;
  year: string;
  title: string;
  description: string;
  side: "left" | "right";
}

// ─── Commercial ──────────────────────────────────────────────────────────────
export interface CommercialSection {
  eyebrow: string;
  heading: string;
  description: string;
  bullets: string[];
  badgeLabel: string;
  image: string;
  primaryCTA: { label: string; href: string };
  secondaryCTA: { label: string; href: string };
}

// ─── Testimonial ─────────────────────────────────────────────────────────────
export interface Testimonial {
  id: string;
  rating: number;
  review: string;
  authorInitials: string;
  authorName: string;
  authorLocation: string;
  productName: string;
}

// ─── Trust Badge ─────────────────────────────────────────────────────────────
export interface TrustBadge {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
}

// ─── Announcement Bar ────────────────────────────────────────────────────────
export interface AnnouncementItem {
  id: string;
  icon: string;
  text: string;
  href?: string;
}

// ─── Nav Link ────────────────────────────────────────────────────────────────
export interface NavLink {
  label: string;
  href: string;
  hasDropdown?: boolean;
}

// ─── Footer ──────────────────────────────────────────────────────────────────
export interface FooterColumn {
  heading: string;
  links: { label: string; href: string }[];
}

export interface SocialLink {
  platform: string;
  href: string;
  icon: string;
}
