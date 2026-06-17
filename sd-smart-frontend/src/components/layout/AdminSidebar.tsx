"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { 
  LayoutDashboard, PlusCircle, LogOut, Sun, Moon, 
  Home, Shield, Menu, X, ArrowLeftRight, Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AdminSidebarProps {
  currentPath: string;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

export default function AdminSidebar({ currentPath, theme, toggleTheme }: AdminSidebarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin/dashboard",
    },
    {
      label: "Products",
      icon: Package,
      href: "/admin/products",
    },
  ];

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
    toast.success("Logged out successfully");
  };

  const isDark = theme === "dark";

  return (
    <>
      {/* Mobile Top Bar */}
      <div className={cn(
        "lg:hidden flex items-center justify-between px-6 py-4 border-b transition-colors duration-300",
        isDark ? "bg-[#0d0d0d] border-neutral-800 text-white" : "bg-white border-neutral-200 text-slate-900"
      )}>
        <div className="flex items-center gap-3">
          <Link href="/">
            <img
              src="/sd-smart-ecommerce/SD-logo.png"
              alt="SD Smart Appliances"
              className="h-8 w-auto object-contain cursor-pointer"
            />
          </Link>
          <span className={cn("h-4 w-[1px]", isDark ? "bg-neutral-800" : "bg-neutral-200")}></span>
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#D71920] flex items-center gap-1">
            <Shield size={12} />
            <span>Admin</span>
          </span>
        </div>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "p-2 rounded-lg border transition-all",
            isDark ? "border-neutral-800 hover:bg-neutral-900" : "border-neutral-200 hover:bg-neutral-50"
          )}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col w-64 border-r transition-all duration-300 transform lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        isDark ? "bg-[#0d0d0d] border-neutral-800 text-white" : "bg-white border-neutral-200 text-slate-900"
      )}>
        {/* Brand Header */}
        <div className={cn(
          "px-6 py-5 border-b flex items-center justify-between",
          isDark ? "border-neutral-800" : "border-neutral-200"
        )}>
          <div className="flex items-center gap-3">
            <Link href="/" onClick={() => setIsOpen(false)}>
              <img
                src="/sd-smart-ecommerce/SD-logo.png"
                alt="SD Smart Appliances"
                className="h-10 w-auto object-contain cursor-pointer"
              />
            </Link>
            <span className={cn("h-6 w-[1px]", isDark ? "bg-neutral-800" : "bg-neutral-200")}></span>
            <div className="flex flex-col">
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Super Admin</span>
              <span className="text-xs font-bold text-[#D71920] flex items-center gap-0.5">
                <Shield size={10} />
                <span>Panel</span>
              </span>
            </div>
          </div>
          
          {/* Close button on mobile */}
          <button 
            onClick={() => setIsOpen(false)} 
            className={cn(
              "lg:hidden p-1.5 rounded-lg border",
              isDark ? "border-neutral-800" : "border-neutral-200"
            )}
          >
            <X size={16} />
          </button>
        </div>

        {/* Profile Card */}
        <div className={cn(
          "px-6 py-5 border-b flex flex-col gap-1",
          isDark ? "border-neutral-800" : "border-neutral-200"
        )}>
          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Signed in as</p>
          <div className="flex items-center gap-3 mt-1">
            <div className="w-9 h-9 rounded-full bg-[#D71920]/15 text-[#D71920] border border-[#D71920]/30 flex items-center justify-center font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold truncate">{user?.name || "Administrator"}</h4>
              <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Main Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <p className="px-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">Management</p>
          {menuItems.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group cursor-pointer",
                  isActive
                    ? "bg-[#D71920] text-white shadow-lg shadow-[#D71920]/20"
                    : isDark
                      ? "text-neutral-400 hover:text-white hover:bg-neutral-900 border border-transparent"
                      : "text-neutral-600 hover:text-[#D71920] hover:bg-red-50/50 border border-transparent"
                )}
              >
                <item.icon size={18} className={cn(
                  "transition-transform group-hover:scale-110",
                  isActive ? "text-white" : "text-neutral-500 group-hover:text-[#D71920]"
                )} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <p className="px-3 pt-6 text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">Actions</p>
          
          {/* Storefront Link */}
          <Link
            href="/"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group cursor-pointer",
              isDark 
                ? "text-neutral-400 hover:text-white hover:bg-neutral-900" 
                : "text-neutral-600 hover:text-[#D71920] hover:bg-red-50/50"
            )}
          >
            <Home size={18} className="text-neutral-500 group-hover:text-[#D71920] transition-colors" />
            <span>Storefront Home</span>
          </Link>
        </nav>

        {/* Footer Actions / Theme Toggle */}
        <div className={cn(
          "p-4 border-t space-y-3",
          isDark ? "border-neutral-800" : "border-neutral-200"
        )}>
          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className={cn(
              "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer",
              isDark
                ? "border-neutral-800 hover:bg-neutral-900 text-neutral-300"
                : "border-neutral-200 hover:bg-neutral-50 text-neutral-700"
            )}
          >
            <div className="flex items-center gap-2.5">
              {isDark ? (
                <>
                  <Moon size={16} className="text-yellow-500 animate-pulse" />
                  <span>Dark Theme</span>
                </>
              ) : (
                <>
                  <Sun size={16} className="text-orange-500 animate-spin-slow" />
                  <span>Light Theme</span>
                </>
              )}
            </div>
            <ArrowLeftRight size={14} className="text-neutral-500" />
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-red-500 transition-all hover:bg-red-500/10 cursor-pointer"
            )}
          >
            <LogOut size={16} />
            <span>Logout Account</span>
          </button>
        </div>
      </aside>

      {/* Sidebar Backdrop on mobile */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}
    </>
  );
}
