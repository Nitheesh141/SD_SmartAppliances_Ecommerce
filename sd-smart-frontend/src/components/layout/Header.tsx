"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, User, Heart, ShoppingCart, ChevronDown, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink } from "../../app/LandingPage/types";
import { THEME_CLASSES } from "@/config/themes";

interface HeaderProps {
  navLinks?: NavLink[];
  isAuthenticated?: boolean;
  userProfile?: { name: string; email: string } | null;
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
  { label: "Pressure Cookers", href: "/shop/pressure-cookers" },
  { label: "Wet Grinders", href: "/shop/wet-grinders" },
  { label: "Gas Stoves", href: "/shop/gas-stoves" },
  { label: "Non-Stick Cookware", href: "/shop/non-stick" },
  { label: "Kitchen Accessories", href: "/shop/accessories" },
  { label: "Commercial Products", href: "/shop/commercial" },
];

export default function Header({ navLinks = defaultNavLinks, isAuthenticated = false, userProfile = null }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-neutral-200 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex items-center h-16 gap-4 lg:gap-8">

          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0 ml-[-80px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sd-smart-ecommerce/SD-logo.png"
              alt="SD Smart Appliances"
              className="h-11.5 w-auto object-contain"
            />
          </Link>



          {/* Nav — desktop */}
          <nav className="hidden lg:flex items-center gap-1.2 ml-12">
            {navLinks.map((link) =>
              link.hasDropdown ? (
                <div key={link.label} className="relative group">
                  <button
                    className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-[#1C1C1C] hover:text-[#D71920] rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
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
                        className="block px-4 py-2 text-sm text-neutral-700 hover:text-[#D71920] hover:bg-neutral-50 transition-colors text-left"
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
                  className="px-3 py-2 text-sm font-semibold text-[#1C1C1C] hover:text-[#D71920] rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>

          {/* Search — desktop (Icon Only) */}
          <div className="hidden md:flex ml-auto">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-neutral-600 hover:text-[#D71920] rounded-lg transition-colors"
              aria-label="Search"
            >
              <Search size={18} />
            </button>
          </div>

          {/* Auth Actions */}
          <div className="flex items-center gap-2 ml-auto lg:ml-2">
            {isAuthenticated ? (
              <>
                {/* Authenticated: Profile, Wishlist, Cart */}
                <Link href="/account" className="p-2 text-neutral-600 hover:text-[#D71920] hover:bg-neutral-50 rounded-lg transition-colors" aria-label="Account">
                  <User size={18} />
                </Link>
                <Link href="/wishlist" className="p-2 text-neutral-600 hover:text-[#D71920] hover:bg-neutral-50 rounded-lg transition-colors" aria-label="Wishlist">
                  <Heart size={18} />
                </Link>
                <Link href="/cart" className="relative p-2 text-neutral-600 hover:text-[#D71920] hover:bg-neutral-50 rounded-lg transition-colors" aria-label="Cart">
                  <ShoppingCart size={18} />
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#D71920] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    0
                  </span>
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
              className="lg:hidden p-2 text-neutral-600 hover:text-[#D71920] rounded-lg transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Search Bar (Hidden, Shows on Click) */}
        {searchOpen && (
          <div className="hidden md:flex py-3 border-t border-neutral-100">
            <div className="relative w-full max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search pressure cookers, wet grinders..."
                autoFocus
                className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-200 rounded-md bg-neutral-50 outline-none focus:ring-2 focus:ring-[#D71920]/20 focus:border-[#D71920] transition-all"
              />
            </div>
          </div>
        )}

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-neutral-100 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="px-3 py-2.5 text-sm font-semibold text-[#1C1C1C] hover:text-[#D71920] rounded-lg hover:bg-neutral-50 transition-colors text-left"
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
                  className="px-3 py-2 text-sm text-neutral-600 hover:text-[#D71920] rounded-lg hover:bg-neutral-50 text-left"
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
                  className="px-3 py-2.5 text-sm font-semibold text-[#1C1C1C] hover:text-[#D71920] rounded-lg hover:bg-neutral-50 transition-colors text-center"
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
