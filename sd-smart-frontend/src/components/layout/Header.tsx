"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, User, Heart, ShoppingCart, ChevronDown, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink } from "../../app/LandingPage/types";
import { THEME_CLASSES } from "@/config/themes";
import { useAuth } from "@/providers/AuthProvider";
import { useCart } from "@/providers/CartProvider";
import { useDynamicProducts } from "@/hooks/useDynamicProducts";

interface HeaderProps {
  navLinks?: NavLink[];
  isAuthenticated?: boolean;
  userProfile?: { name: string; email: string; role?: string } | null;
}

const defaultNavLinks = [
  { label: "Home", href: "/" },
  { label: "Categories", href: "/shop", hasDropdown: true },
  { label: "Bestsellers", href: "/shop" },
  { label: "Why Us", href: "/about" },
  { label: "Our Story", href: "/about" },
  { label: "Commercial", href: "/shop/commercial" },
];

const shopDropdownLinks = [
  { label: "Pressure Cookers", href: "/shop?category=pressure-cookers" },
  { label: "Wet Grinders", href: "/shop?category=wet-grinders" },
  { label: "Gas Stoves", href: "/shop?category=gas-stoves" },
  { label: "Non-Stick Cookware", href: "/shop?category=non-stick" },
  { label: "Kitchen Accessories", href: "/shop?category=accessories" },
  { label: "Commercial Products", href: "/shop?category=commercial" },
];

export default function Header({ navLinks = defaultNavLinks, isAuthenticated: propIsAuthenticated, userProfile: propUserProfile }: HeaderProps) {
  const { isAuthenticated: contextIsAuthenticated, user: contextUser } = useAuth();

  const isAuthenticated = propIsAuthenticated !== undefined ? propIsAuthenticated : contextIsAuthenticated;
  const userProfile = propUserProfile !== undefined ? propUserProfile : contextUser;

  // Use optional chaining or try-catch in case it's used outside provider (though it shouldn't be)
  let cartCount = 0;
  try {
    const cartContext = useCart();
    cartCount = cartContext.cartCount;
  } catch (e) {
    console.warn("Header used outside CartProvider");
  }

  const [mobileOpen, setMobileOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const pathname = usePathname() || "";

  const router = useRouter();
  const allProducts = useDynamicProducts();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    setIsLoaded(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim().length >= 2) {
      const filtered = allProducts.filter((product) =>
        product.name.toLowerCase().includes(value.toLowerCase()) ||
        product.categoryLabel?.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };

  const handleSearchSubmit = (query: string) => {
    if (query.trim()) {
      router.push(`/shop?search=${encodeURIComponent(query)}`);
      setSearchOpen(false);
      setSearchQuery("");
      setSuggestions([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearchSubmit(searchQuery);
    }
  };

  const handleSuggestionClick = (productName: string) => {
    handleSearchSubmit(productName);
  };

  return (
    <header className={cn(
      "sticky top-0 z-50 transition-all duration-500 will-change-transform",
      isScrolled
        ? "bg-red-50/95 dark:bg-[#1A090A]/95 border-b-2 border-neutral-200/80 shadow-[0_15px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.7)] py-1.5"
        : "bg-red-50 dark:bg-[#1A090A] border-b border-neutral-200/40 shadow-[0_6px_25px_rgba(0,0,0,0.1)] dark:shadow-[0_6px_25px_rgba(0,0,0,0.45)] py-2",
      isLoaded ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
    )}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex items-center h-16 gap-4 lg:gap-8">

          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0 ml-[-80px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sd-smart-ecommerce/SD-logo.png"
              alt="SD Smart Appliances"
              className="h-14 w-auto object-contain mix-blend-multiply"
            />
          </Link>



          {/* Nav — desktop */}
          <nav className="hidden lg:flex items-center gap-1.2 ml-12">
            {navLinks.map((link) =>
              link.hasDropdown ? (
                <div key={link.label} className="relative group">
                  <button
                    className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-[#1C1C1C] hover:text-[#D71920] rounded-lg hover:bg-red-100/60 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                    onMouseEnter={() => setShopOpen(true)}
                    onMouseLeave={() => setShopOpen(false)}
                  >
                    {link.label}
                    <ChevronDown size={14} />
                  </button>
                  {/* Dropdown */}
                  <div
                    className={cn(
                      "absolute top-full left-0 mt-1 w-52 bg-white border border-neutral-200 rounded-xl shadow-xl py-2 z-50 transition-all duration-150",
                      shopOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-1"
                    )}
                    onMouseEnter={() => setShopOpen(true)}
                    onMouseLeave={() => setShopOpen(false)}
                  >
                    {shopDropdownLinks.map((l) => (
                      <Link
                        key={l.href}
                        href={l.href}
                        className="block px-4 py-2 text-sm text-neutral-700 hover:text-[#D71920] hover:bg-red-100/60 dark:hover:bg-red-950/40 transition-colors text-left"
                      >
                        {l.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className={cn(
                    "px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-300 relative",
                    pathname === link.href || (link.href === "/" && (pathname === "/" || pathname === "/sd-smart-ecommerce"))
                      ? "text-[#D71920]"
                      : "text-[#1C1C1C] hover:text-[#D71920] hover:bg-red-100/60 dark:hover:bg-red-950/40"
                  )}
                >
                  {link.label}
                  {(pathname === link.href || (link.href === "/" && (pathname === "/" || pathname === "/sd-smart-ecommerce"))) && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#D71920] rounded-full" />
                  )}
                </Link>
              )
            )}
          </nav>

          {/* Search & Actions Group */}
          <div className="flex items-center gap-2.5 ml-auto">

            {/* Search Input inline */}
            {searchOpen && (
              <div className="hidden md:block relative w-64 animate-in fade-in slide-in-from-right-4 duration-200">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search pressure cookers, wet grinders..."
                  autoFocus
                  className="w-full pl-9 pr-4 py-1.5 text-xs font-semibold border border-[#D71920] rounded-xl bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 text-slate-800 dark:text-neutral-100 shadow-sm"
                />
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />

                {/* Suggestions List dropdown */}
                {suggestions.length > 0 && (
                  <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl py-2 z-50 max-h-60 overflow-y-auto">
                    {suggestions.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleSuggestionClick(product.name)}
                        className="w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-red-50/50 dark:hover:bg-red-950/20 text-neutral-700 dark:text-neutral-300 hover:text-[#D71920] dark:hover:text-red-400 flex items-center justify-between border-b border-neutral-50 dark:border-neutral-800/40 last:border-0 cursor-pointer"
                      >
                        <span className="truncate">{product.name}</span>
                        <span className="text-[10px] text-neutral-400 font-bold bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">{product.categoryLabel}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Search Icon */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-neutral-600 hover:text-[#D71920] rounded-lg transition-colors cursor-pointer"
              aria-label="Search"
            >
              <Search size={18} />
            </button>

            {/* Auth Actions */}
            {isAuthenticated ? (
              <>
                {/* Authenticated: Profile, Wishlist, Cart */}
                {userProfile && (userProfile.role === "admin" || userProfile.role === "superadmin") && (
                  <Link href="/admin/dashboard" className="px-3 py-1.5 bg-[#D71920] text-white text-xs font-bold rounded-lg hover:bg-[#B91520] transition-colors flex items-center mr-1" title="Admin Dashboard">
                    <span>Admin Panel</span>
                  </Link>
                )}
                <Link href="/account" className="p-2 text-neutral-600 hover:text-[#D71920] hover:bg-red-100/60 dark:hover:bg-red-950/40 rounded-lg transition-colors" aria-label="Account">
                  <User size={18} />
                </Link>
                <Link href="/wishlist" className="p-2 text-neutral-600 hover:text-[#D71920] hover:bg-red-100/60 dark:hover:bg-red-950/40 rounded-lg transition-colors" aria-label="Wishlist">
                  <Heart size={18} />
                </Link>
                <Link href="/cart" className="relative p-2 text-neutral-600 hover:text-[#D71920] hover:bg-red-100/60 dark:hover:bg-red-950/40 rounded-lg transition-colors" aria-label="Cart">
                  <ShoppingCart size={18} />
                  {cartCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-[#D71920] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </Link>
              </>
            ) : (
              <>
                {/* Not Authenticated: Login & Register Buttons */}
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-semibold text-[#1C1C1C] hover:text-[#D71920] transition-colors hidden sm:block"
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#D71920] rounded-lg hover:bg-[#B91520] transition-colors"
                >
                  Register
                </Link>
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              className="lg:hidden p-2 text-neutral-600 hover:text-[#D71920] rounded-lg transition-colors cursor-pointer"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-neutral-100 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="px-3 py-2.5 text-sm font-semibold text-[#1C1C1C] hover:text-[#D71920] rounded-lg hover:bg-red-100/60 dark:hover:bg-red-950/40 transition-colors text-left"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 pt-2 border-t border-neutral-100 flex flex-col gap-1">
              {shopDropdownLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="px-3 py-2 text-sm text-neutral-600 hover:text-[#D71920] rounded-lg hover:bg-red-100/60 dark:hover:bg-red-950/40 text-left"
                  onClick={() => setMobileOpen(false)}
                >
                  — {l.label}
                </Link>
              ))}
            </div>
            {/* Mobile Auth Section */}
            {!isAuthenticated && (
              <div className="mt-4 pt-4 border-t border-neutral-100 flex flex-col gap-2">
                <Link
                  href="/auth/login"
                  className="px-3 py-2.5 text-sm font-semibold text-[#1C1C1C] hover:text-[#D71920] rounded-lg hover:bg-red-100/60 dark:hover:bg-red-950/40 transition-colors text-center"
                  onClick={() => setMobileOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-3 py-2.5 text-sm font-semibold text-white bg-[#D71920] rounded-lg hover:bg-[#B91520] transition-colors text-center"
                  onClick={() => setMobileOpen(false)}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
