"use client";
import { ENV } from "@/config/env";

import Link from "next/link";
import { MapPin, Phone, Mail, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { FooterColumn, SocialLink } from "../../app/LandingPage/types";

interface CustomIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

// Custom Lucide-style SVG components for social media since they aren't in lucide-react
const Facebook = ({ size = 24, ...props }: CustomIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const Instagram = ({ size = 24, ...props }: CustomIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const Youtube = ({ size = 24, ...props }: CustomIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z" />
    <polygon points="10 15 15 12 10 9" />
  </svg>
);

const Twitter = ({ size = 24, ...props }: CustomIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

interface FooterProps {
  footerColumns?: FooterColumn[];
  socialLinks?: SocialLink[];
}

const defaultFooterColumns = [
  {
    heading: "Products",
    links: [
      { label: "Pressure Cookers", href: "/shop?category=pressure-cookers" },
      { label: "Wet Grinders", href: "/shop?category=wet-grinders" },
      { label: "Gas Stoves", href: "/shop?category=gas-stoves" },
      { label: "Non-Stick Cookware", href: "/shop?category=non-stick" },
      { label: "Commercial Products", href: "/shop?category=commercial" },
      { label: "Kitchen Accessories", href: "/shop?category=accessories" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Customer Support", href: "/support" },
      { label: "Warranty Registration", href: "/warranty-registration" },
      { label: "Service Request", href: "/service-request" },
      { label: "Track Your Order", href: "/track-order" },
      { label: "Return Policy", href: "/return-policy" },
      { label: "FAQs", href: "/faqs" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About SD SMART", href: "/about" },
      { label: "Manufacturing Unit", href: "/manufacturing" },
      { label: "Quality Process", href: "/quality" },
      { label: "Dealer Network", href: "/dealers" },
      { label: "Careers", href: "/careers" },
      { label: "Privacy Policy", href: "/privacy-policy" },
    ],
  },
];

const defaultSocialLinks = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Youtube, href: "#", label: "YouTube" },
  { icon: Twitter, href: "#", label: "Twitter" },
];

const getSocialIconComponent = (platformOrIcon: string) => {
  const normalized = (platformOrIcon || "").toLowerCase();
  if (normalized.includes("facebook")) return Facebook;
  if (normalized.includes("instagram")) return Instagram;
  if (normalized.includes("youtube")) return Youtube;
  if (normalized.includes("twitter")) return Twitter;
  return Facebook; // fallback
};

export default function Footer({ footerColumns, socialLinks }: FooterProps) {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [contactInfo, setContactInfo] = useState({
    phone: "+91 80000 00000",
    email: "support@sdsmart.in"
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${ENV.API_BASE_URL}/settings`);
        const data = await res.json();
        if (data.success && data.settings) {
          setContactInfo({
            phone: data.settings.seller_phone || "+91 80000 00000",
            email: data.settings.seller_email || "support@sdsmart.in"
          });
        }
      } catch (err) {
        console.warn("Failed to fetch settings for footer:", err);
      }
    };
    fetchSettings();
  }, []);

  if (pathname !== "/") {
    return null;
  }

  const activeFooterColumns = footerColumns || defaultFooterColumns;
  const activeSocialLinks = socialLinks
    ? socialLinks.map((link) => ({
        label: link.platform,
        href: link.href,
        icon: getSocialIconComponent(link.icon || link.platform),
      }))
    : defaultSocialLinks;

  return (
    <footer className="bg-[#1C1C1C] text-white">
      {/* Main footer */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-2 text-left">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-[#D71920] rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-extrabold">SD</span>
              </div>
              <div className="leading-none text-left">
                <p className="text-sm font-extrabold text-white tracking-wide">SD SMART</p>
                <p className="text-[9px] text-neutral-500 font-medium tracking-widest uppercase">Appliances</p>
              </div>
            </Link>

            <p className="text-sm text-neutral-400 leading-relaxed mb-5 max-w-xs text-left">
              Crafting premium kitchen appliances for Indian households since decades.{" "}
              <span className="font-semibold text-white">Assured Quality & Service</span>{" "}
              — our promise to every customer.
            </p>

            <div className="flex flex-col gap-3 mb-6 text-left">
              <div className="flex items-start gap-3 text-sm text-neutral-400">
                <MapPin size={14} className="text-[#D71920] mt-0.5 flex-shrink-0" />
                <span>SD SMART Appliances Pvt. Ltd., Industrial Area, Coimbatore, Tamil Nadu – 641 001</span>
              </div>
              <div className="flex flex-col gap-1 text-sm text-neutral-400">
                <div className="flex items-center gap-3">
                  <Phone size={14} className="text-[#D71920] flex-shrink-0" />
                  <span>Support: {contactInfo.phone}</span>
                </div>
                <div className="flex items-center gap-3 pl-6.5">
                  <span className="text-neutral-500 text-xs font-bold uppercase">Toll-Free:</span>
                  <a href="tel:18001239397" className="hover:text-white transition-colors">1800 123 9397</a>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-400">
                <Mail size={14} className="text-[#D71920] flex-shrink-0" />
                <span>{contactInfo.email}</span>
              </div>
            </div>

            {/* Social */}
            <div className="flex items-center gap-2">
              {activeSocialLinks.map(({ icon: Icon, href, label }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 bg-neutral-800 hover:bg-[#D71920] rounded-full flex items-center justify-center transition-colors duration-200"
                >
                  <Icon size={15} />
                </Link>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {activeFooterColumns.map((col, idx) => (
            <div key={`${col.heading}-${idx}`} className="text-left">
              <h4 className="text-sm font-bold text-white mb-4">{col.heading}</h4>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-neutral-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter strip */}
      <div className="border-t border-neutral-800">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-left">
              <p className="text-sm font-bold text-white">Stay Updated with SD SMART</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Get exclusive offers, new product launches and cooking tips.
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 sm:w-64 px-4 py-2.5 text-sm bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 outline-none focus:border-[#D71920] transition-colors"
              />
              <button className="flex items-center gap-2 px-5 py-2.5 bg-[#D71920] hover:bg-[#b8141a] text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap cursor-pointer">
                Subscribe <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-neutral-800">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-neutral-500 text-left">
            © 2026 SD SMART Appliances Pvt. Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {["Terms of Use", "Privacy Policy", "Sitemap"].map((item) => (
              <Link key={item} href="#" className="text-xs text-neutral-500 hover:text-white transition-colors">
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
