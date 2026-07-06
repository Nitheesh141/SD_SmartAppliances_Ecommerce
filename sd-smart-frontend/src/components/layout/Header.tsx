"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, User, ShoppingCart, ChevronDown, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink } from "../../app/LandingPage/types";
import { THEME_CLASSES } from "@/config/themes";
import { useAuth } from "@/providers/AuthProvider";
import { useCart } from "@/providers/CartProvider";
import { useDynamicProducts } from "@/hooks/useDynamicProducts";
import { matchProduct } from "../../utils/search";

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
  { label: "Appliances", href: "/shop" },
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
  const { isAuthenticated: contextIsAuthenticated, user: contextUser, logout } = useAuth();

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
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const pathname = usePathname() || "";

  const router = useRouter();
  const allProducts = useDynamicProducts();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [currentHash, setCurrentHash] = useState("");
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentHash(window.location.hash);
      const handleHashChange = () => {
        setCurrentHash(window.location.hash);
      };
      window.addEventListener("hashchange", handleHashChange);
      return () => window.removeEventListener("hashchange", handleHashChange);
    }
  }, []);

  useEffect(() => {
    if (!profileDropdownOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const dropdownEl = document.getElementById("profile-dropdown-menu");
      const buttonEl = document.getElementById("profile-menu-button");

      if (
        dropdownEl && !dropdownEl.contains(target) &&
        buttonEl && !buttonEl.contains(target)
      ) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [profileDropdownOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isHomePage = pathname === "/" || pathname === "/sd-smart-ecommerce" || pathname === "";
    if (!isHomePage) {
      setActiveSection("");
      return;
    }

    const sections = ["categories", "best-sellers", "why-choose-us", "timeline"];
    let observer: IntersectionObserver | null = null;

    const setupObserver = () => {
      const elements = sections
        .map(id => document.getElementById(id))
        .filter(el => el !== null) as HTMLElement[];

      if (elements.length === 0) return false;

      const observerOptions = {
        root: null,
        rootMargin: "-30% 0px -50% 0px",
        threshold: 0,
      };

      const observerCallback = (entries: IntersectionObserverEntry[]) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      };

      observer = new IntersectionObserver(observerCallback, observerOptions);
      elements.forEach(el => observer?.observe(el));
      return true;
    };

    const hasObserved = setupObserver();
    let retryTimer: NodeJS.Timeout;

    if (!hasObserved) {
      retryTimer = setTimeout(() => {
        setupObserver();
      }, 800);
    }

    const handleScroll = () => {
      if (window.scrollY < 180) {
        setActiveSection("");
      }
    };
    window.addEventListener("scroll", handleScroll);

    return () => {
      if (observer) observer.disconnect();
      if (retryTimer) clearTimeout(retryTimer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [pathname]);

  const isLinkActive = (href: string) => {
    const currentPath = pathname;
    const isHomePage = currentPath === "/" || currentPath === "/sd-smart-ecommerce" || currentPath === "";

    if (isHomePage) {
      if (href === "/") {
        return activeSection === "";
      }
      if (href.includes("#")) {
        const [, hHash] = href.split("#");
        return activeSection === hHash;
      }
    }

    // Fallback path matching
    const hasMatchingHashLink = navLinks.some((link) => {
      if (link.href.includes("#")) {
        const [, hHash] = link.href.split("#");
        return currentHash === `#${hHash}`;
      }
      return false;
    });

    if (href.includes("#")) {
      const [hPath, hHash] = href.split("#");
      const targetPath = hPath === "" ? "/" : hPath;
      const cleanCurrentPath = currentPath === "" ? "/" : currentPath;

      const pathMatches =
        cleanCurrentPath === targetPath ||
        (targetPath === "/" && cleanCurrentPath === "/sd-smart-ecommerce");

      return pathMatches && currentHash === `#${hHash}`;
    }

    if (currentHash && hasMatchingHashLink) {
      return false;
    }

    return (
      currentPath === href ||
      (href === "/" &&
        (currentPath === "/" || currentPath === "/sd-smart-ecommerce"))
    );
  };

  useEffect(() => {
    setIsLoaded(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [mobileOpen]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim().length >= 2) {
      const filtered = allProducts.filter((product) => matchProduct(product, value));
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
      "sticky top-0 z-50 transition-all duration-500 will-change-transform py-1 md:py-2 border-b",
      isScrolled
        ? "bg-red-50/95 dark:bg-[#1A090A]/95 border-neutral-200/80 shadow-[0_15px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.7)]"
        : "bg-red-50 dark:bg-[#1A090A] border-neutral-200/40 shadow-[0_6px_25px_rgba(0,0,0,0.1)] dark:shadow-[0_6px_25px_rgba(0,0,0,0.45)]",
      isLoaded ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
    )}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Desktop View (Visible on xl breakpoint and up) */}
        <div className="hidden xl:flex items-center h-16 gap-3 sm:gap-4 xl:gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sd-smart-ecommerce/SD-logo.png"
              alt="SD Smart Appliances"
              className="h-10 sm:h-12 md:h-14 w-auto object-contain mix-blend-multiply"
            />
          </Link>

          {/* Nav — desktop */}
          <nav className="flex items-center gap-1 xl:gap-1.5 2xl:gap-2.5 ml-3 xl:ml-6 2xl:ml-8">
            {navLinks.map((link) =>
              link.hasDropdown ? (
                <div key={link.label} className="relative group">
                  <button
                    className="flex items-center gap-1 px-2 py-1.5 xl:px-2.5 xl:py-2 text-xs xl:text-[13px] 2xl:text-sm font-semibold text-[#1C1C1C] dark:text-neutral-200 hover:text-[#D71920] dark:hover:text-red-400 rounded-lg hover:bg-red-100/60 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                    onMouseEnter={() => setShopOpen(true)}
                    onMouseLeave={() => setShopOpen(false)}
                  >
                    {link.label}
                    <ChevronDown size={14} />
                  </button>
                  {/* Dropdown */}
                  <div
                    className={cn(
                      "absolute top-full left-0 mt-1 w-52 bg-white dark:bg-[#1A090A] border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl py-2 z-50 transition-all duration-150",
                      shopOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-1"
                    )}
                    onMouseEnter={() => setShopOpen(true)}
                    onMouseLeave={() => setShopOpen(false)}
                  >
                    {shopDropdownLinks.map((l) => (
                      <Link
                        key={l.href}
                        href={l.href}
                        className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-350 hover:text-[#D71920] dark:hover:text-red-400 hover:bg-red-100/60 dark:hover:bg-red-950/40 transition-colors text-left"
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
                    "px-2 py-1.5 xl:px-2.5 xl:py-2 text-xs xl:text-[13px] 2xl:text-sm font-semibold rounded-lg transition-all duration-300 relative",
                    isLinkActive(link.href)
                      ? "text-[#D71920]"
                      : "text-[#1C1C1C] dark:text-neutral-200 hover:text-[#D71920] dark:hover:text-red-400 hover:bg-red-100/60 dark:hover:bg-red-950/40"
                  )}
                >
                  {link.label}
                  {isLinkActive(link.href) && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#D71920] rounded-full" />
                  )}
                </Link>
              )
            )}
          </nav>

          {/* Search & Actions Group (Desktop) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 ml-auto flex-shrink-0">
            {/* Search Input inline */}
            <div className="hidden md:block relative w-36 lg:w-44 xl:w-52 2xl:w-72 transition-all duration-300">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search pressure cookers, wet grinders..."
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm font-semibold border border-[#D71920] dark:border-[#D71920]/80 rounded-xl bg-white dark:bg-neutral-900 focus:outline-none focus:ring-4 focus:ring-[#D71920]/15 text-slate-800 dark:text-neutral-100 shadow-sm focus:border-[#D71920] transition-colors placeholder-neutral-400 dark:placeholder-neutral-500"
              />
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D71920] dark:text-[#D71920]" />

              {/* Suggestions List dropdown */}
              {suggestions.length > 0 && (
                <div className="absolute top-full right-0 mt-2 w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl py-2 z-50 max-h-60 overflow-y-auto">
                  {suggestions.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleSuggestionClick(product.name)}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-red-50/50 dark:hover:bg-red-950/20 text-neutral-700 dark:text-neutral-350 hover:text-[#D71920] dark:hover:text-red-400 flex items-center justify-between border-b border-neutral-50 dark:border-neutral-800/40 last:border-0 cursor-pointer"
                    >
                      <span className="truncate">{product.name}</span>
                      <span className="text-[10px] text-neutral-400 font-bold bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">{product.categoryLabel}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auth Actions */}
            {isAuthenticated ? (
              <>
                {/* Authenticated: Profile Dropdown, Wishlist, Cart */}
                {userProfile && (userProfile.role === "admin" || userProfile.role === "superadmin" || userProfile.role === "ADMIN" || userProfile.role === "SUPERADMIN") && (
                  <Link href="/admin/dashboard" className="px-2 py-1.5 bg-[#D71920] text-white text-xs font-bold rounded-lg hover:bg-[#B91520] transition-colors flex items-center mr-1" title="Admin Dashboard">
                    <span className="hidden xl:inline">Admin Panel</span>
                    <span className="xl:hidden">Admin</span>
                  </Link>
                )}

                {/* Profile dropdown container */}
                <div className="relative">
                  <button
                    id="profile-menu-button"
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 text-neutral-650 hover:text-[#D71920] hover:bg-red-100/60 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                    aria-label="Account Menu"
                  >
                    <User size={20} className="text-neutral-700 dark:text-neutral-300" />
                    <span className="text-xs xl:text-sm font-semibold text-neutral-800 dark:text-neutral-200 max-w-[100px] truncate hidden xl:inline-block">
                      {userProfile?.name?.split(" ")[0] || "Account"}
                    </span>
                    <ChevronDown size={14} className={cn("transition-transform text-neutral-400", profileDropdownOpen && "rotate-180")} />
                  </button>

                  {/* Profile Dropdown */}
                  {profileDropdownOpen && (
                    <div
                      id="profile-dropdown-menu"
                      className="absolute right-0 mt-1 w-56 bg-white dark:bg-[#1A090A] border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    >
                      <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800/60 mb-1">
                        <p className="text-sm font-bold text-neutral-800 dark:text-neutral-100 truncate">{userProfile?.name || "User"}</p>
                        <p className="text-xs text-neutral-455 dark:text-neutral-500 truncate">{userProfile?.email}</p>
                      </div>
                      <Link
                        href="/account?tab=profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="block px-5 py-2.5 text-sm font-semibold text-neutral-700 dark:text-neutral-350 hover:text-[#D71920] hover:bg-red-100/60 dark:hover:bg-red-950/40 transition-colors text-left"
                      >
                        Profile
                      </Link>
                      <Link
                        href="/wishlist"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="block px-5 py-2.5 text-sm font-semibold text-neutral-700 dark:text-neutral-350 hover:text-[#D71920] hover:bg-red-100/60 dark:hover:bg-red-950/40 transition-colors text-left"
                      >
                        Wishlist
                      </Link>
                      <Link
                        href="/account?tab=orders"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="block px-5 py-2.5 text-sm font-semibold text-neutral-700 dark:text-neutral-350 hover:text-[#D71920] hover:bg-red-100/60 dark:hover:bg-red-950/40 transition-colors text-left"
                      >
                        My Orders
                      </Link>
                      <hr className="border-neutral-100 dark:border-neutral-800/60 my-1" />
                      <button
                        onClick={async () => {
                          setProfileDropdownOpen(false);
                          try {
                            await logout();
                            router.push("/");
                          } catch (err) {
                            console.error("Logout failed:", err);
                          }
                        }}
                        className="w-full text-left px-5 py-2.5 text-sm font-semibold text-[#D71920] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>

                <Link href="/cart" className="relative p-2 text-neutral-600 hover:text-[#D71920] hover:bg-red-100/60 dark:hover:bg-red-950/40 rounded-lg transition-colors" aria-label="Cart">
                  <ShoppingCart size={20} className="text-neutral-700 dark:text-neutral-300" />
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-[#D71920] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
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
                  className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-semibold text-[#1C1C1C] dark:text-neutral-200 hover:text-[#D71920] dark:hover:text-red-400 transition-colors hidden sm:block"
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-[#D71920] rounded-lg hover:bg-[#B91520] transition-colors hidden sm:block"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Header View (Visible below xl breakpoint) */}
        <div className="flex xl:hidden items-center justify-between h-12 w-full gap-2">
          {/* Hamburger Menu Toggle (Far Left) */}
          <button
            onClick={() => {
              setMobileOpen(!mobileOpen);
              if (searchOpen) setSearchOpen(false);
            }}
            className="p-1.5 text-neutral-650 dark:text-neutral-355 hover:text-[#D71920] rounded-lg transition-colors cursor-pointer shrink-0"
            aria-label="Menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Centered Brand Logo */}
          <div className="flex-grow flex items-center justify-center">
            <Link href="/" onClick={() => setMobileOpen(false)}>
              <img
                src="/sd-smart-ecommerce/SD-logo.png"
                alt="SD Smart Appliances"
                className="h-10 w-auto object-contain scale-x-[1.12] origin-center mix-blend-multiply"
              />
            </Link>
          </div>

          {/* Search Icon & Cart Icon (Far Right) */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Search Icon button */}
            <button
              onClick={() => {
                if (pathname.includes("/shop")) {
                  const clickSearchInput = document.querySelector(".cursor-pointer input") as HTMLInputElement;
                  if (clickSearchInput) {
                    clickSearchInput.click();
                  } else {
                    setSearchOpen(!searchOpen);
                    if (mobileOpen) setMobileOpen(false);
                  }
                } else {
                  setSearchOpen(!searchOpen);
                  if (mobileOpen) setMobileOpen(false);
                }
              }}
              className="p-1.5 text-neutral-655 dark:text-neutral-300 hover:text-[#D71920] rounded-lg transition-colors cursor-pointer"
              aria-label="Toggle Search"
            >
              {searchOpen ? <X size={18} className="text-[#D71920]" /> : <Search size={18} />}
            </button>

            {/* Cart Icon button with Badge */}
            <Link
              href="/cart"
              onClick={() => setMobileOpen(false)}
              className="relative p-1.5 text-neutral-655 dark:text-neutral-300 hover:text-[#D71920] rounded-lg transition-colors"
              aria-label="Cart"
            >
              <ShoppingCart size={18} className="text-neutral-700 dark:text-neutral-350" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-[#D71920] text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Search Bar (Expandable, Mobile/Tablet only) */}
        {searchOpen && (
          <div className="md:hidden px-4 py-3 border-t border-neutral-200/10 dark:border-neutral-800/60 bg-red-50/95 dark:bg-[#1A090A]/95 animate-in slide-in-from-top-2 duration-200 relative">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search pressure cookers, wet grinders..."
                className="w-full pl-10 pr-10 py-2 text-sm font-semibold border border-[#D71920] dark:border-[#D71920]/80 rounded-xl bg-white dark:bg-neutral-900 focus:outline-none focus:ring-4 focus:ring-[#D71920]/15 text-slate-800 dark:text-neutral-100 shadow-sm focus:border-[#D71920] transition-colors placeholder-neutral-400 dark:placeholder-neutral-500"
              />
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D71920]" />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSuggestions([]);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#D71920]"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Suggestions for Mobile Search */}
            {suggestions.length > 0 && (
              <div className="absolute left-4 right-4 top-full mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl py-2 z-50 max-h-60 overflow-y-auto">
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

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="xl:hidden fixed inset-x-0 top-[56px] bottom-0 z-50 py-6 px-5 flex flex-col gap-2 bg-white dark:bg-slate-950 overflow-y-auto border-t border-neutral-100 dark:border-neutral-900/60 shadow-xl animate-in slide-in-from-top duration-300">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="px-3 py-2.5 text-sm font-semibold text-[#1C1C1C] dark:text-neutral-200 hover:text-[#D71920] dark:hover:text-red-400 rounded-lg hover:bg-red-100/60 dark:hover:bg-red-950/40 transition-colors text-left"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 pt-2 border-t border-neutral-200/10 dark:border-neutral-800/60 flex flex-col gap-1">
              {shopDropdownLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="px-3 py-2 text-sm text-neutral-600 dark:text-neutral-455 hover:text-[#D71920] dark:hover:text-red-400 rounded-lg hover:bg-red-100/60 dark:hover:bg-red-950/40 text-left"
                  onClick={() => setMobileOpen(false)}
                >
                  — {l.label}
                </Link>
              ))}
            </div>

            {/* Mobile Profile & Account (if authenticated) */}
            {isAuthenticated ? (
              <div className="mt-4 pt-4 border-t border-neutral-200/10 dark:border-neutral-800/60 flex flex-col gap-1">
                <div className="px-3 py-2.5 mb-2 bg-red-100/35 dark:bg-red-950/10 rounded-xl text-left">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">Hello, {userProfile?.name || "User"}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{userProfile?.email}</p>
                </div>
                <Link
                  href="/account?tab=profile"
                  className="px-3 py-2.5 text-sm font-semibold text-[#1C1C1C] dark:text-neutral-200 hover:text-[#D71920] dark:hover:text-red-400 rounded-lg hover:bg-red-100/60 dark:hover:bg-red-950/40 transition-colors text-left"
                  onClick={() => setMobileOpen(false)}
                >
                  My Profile
                </Link>
                <Link
                  href="/wishlist"
                  className="px-3 py-2.5 text-sm font-semibold text-[#1C1C1C] dark:text-neutral-200 hover:text-[#D71920] dark:hover:text-red-400 rounded-lg hover:bg-red-100/60 dark:hover:bg-red-950/40 transition-colors text-left"
                  onClick={() => setMobileOpen(false)}
                >
                  Wishlist
                </Link>
                <Link
                  href="/account?tab=orders"
                  className="px-3 py-2.5 text-sm font-semibold text-[#1C1C1C] dark:text-neutral-200 hover:text-[#D71920] dark:hover:text-red-400 rounded-lg hover:bg-red-100/60 dark:hover:bg-red-950/40 transition-colors text-left"
                  onClick={() => setMobileOpen(false)}
                >
                  My Orders
                </Link>
                {userProfile && (userProfile.role === "admin" || userProfile.role === "superadmin" || userProfile.role === "ADMIN" || userProfile.role === "SUPERADMIN") && (
                  <Link
                    href="/admin/dashboard"
                    className="px-3 py-2.5 text-sm font-semibold text-[#D71920] dark:text-red-400 rounded-lg hover:bg-red-100/60 dark:hover:bg-red-950/40 transition-colors text-left"
                    onClick={() => setMobileOpen(false)}
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={async () => {
                    setMobileOpen(false);
                    try {
                      await logout();
                      router.push("/");
                    } catch (err) {
                      console.error("Logout failed:", err);
                    }
                  }}
                  className="w-full text-left px-3 py-2.5 text-sm font-semibold text-[#D71920] dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              /* Mobile Auth Section (if not authenticated) */
              <div className="mt-4 pt-4 border-t border-neutral-200/10 dark:border-neutral-800/60 flex flex-col gap-2">
                <Link
                  href="/auth/login"
                  className="px-3 py-2.5 text-sm font-semibold text-[#1C1C1C] dark:text-neutral-200 hover:text-[#D71920] dark:hover:text-red-400 rounded-lg hover:bg-red-100/60 dark:hover:bg-red-950/40 transition-colors text-center"
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
