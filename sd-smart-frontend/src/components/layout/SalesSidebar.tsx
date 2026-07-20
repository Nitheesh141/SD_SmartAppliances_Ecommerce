"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { 
  LayoutDashboard, LogOut, Home, Shield, Menu, X, ArrowLeftRight, Package, Headphones,
  FileText, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ENV } from "@/config/env";

interface SalesSidebarProps {
  currentPath: string;
}

export default function SalesSidebar({ currentPath }: SalesSidebarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      label: "Sales Dashboard",
      icon: LayoutDashboard,
      href: "/sales/dashboard",
    },
    {
      label: "My Distributors",
      icon: Shield,
      href: "/sales/distributors",
    },
    {
      label: "Orders",
      icon: FileText,
      href: "/sales/orders",
    },
    {
      label: "Daily Sales Activity",
      icon: Calendar,
      href: "/sales/daily-activity",
    },
    {
      label: "Product Catalog",
      icon: Package,
      href: "/sales/products",
    }
  ];



  const handleLogout = () => {
    logout();
    router.push("/auth/login");
    toast.success("Logged out successfully");
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b bg-white border-neutral-200 text-slate-900 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <Link href="/?bypass=true">
            <img
              src="/SD-logo.png"
              alt="SD Smart Appliances"
              className="h-8 w-auto object-contain cursor-pointer"
            />
          </Link>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer text-slate-700"
          aria-label="Toggle Menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 flex flex-col w-64 border-r bg-white border-neutral-200 transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo Branding */}
        <div className="h-20 flex items-center px-6 border-b border-neutral-200 bg-white">
          <Link href="/?bypass=true" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <img
              src="/SD-logo.png"
              alt="SD Smart Appliances"
              className="h-10 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Profile Card Summary */}
        <div className="p-4 border-b border-neutral-200 bg-white">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-neutral-50/80 border border-neutral-200/50">
            <div className="h-9 w-9 rounded-full bg-[#D71920]/10 flex items-center justify-center font-bold text-[#D71920]">
              {user?.name?.slice(0, 2).toUpperCase() || "SR"}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <h4 className="text-sm font-bold truncate">{user?.name || "Sales Representative"}</h4>
              <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
            </div>
          </div>

        </div>

        {/* Main Navigation Links */}
        <nav className="flex-1 overflow-y-auto sidebar-scrollbar px-4 py-6 space-y-1.5 bg-white">
          <p className="px-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">Navigation</p>
          {menuItems.map((item) => {
            const isActive = currentPath === item.href;

            return (
              <Link
                key={item.label}
                href={item.href as any}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group cursor-pointer",
                  isActive
                    ? "bg-[#D71920] text-white shadow-lg shadow-[#D71920]/20"
                    : "text-neutral-600 hover:text-[#D71920] hover:bg-red-50/50 border border-transparent"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} className={cn(
                    "transition-transform group-hover:scale-110",
                    isActive ? "text-white" : "text-neutral-500 group-hover:text-[#D71920]"
                  )} />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}

          <p className="px-3 pt-6 text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">Actions</p>
          
          {/* Storefront Link */}
          <Link
            href="/?bypass=true"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group cursor-pointer text-neutral-600 hover:text-[#D71920] hover:bg-red-50/50"
          >
            <Home size={18} className="text-neutral-500 group-hover:text-[#D71920] transition-colors" />
            <span>Storefront Home</span>
          </Link>
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-200 space-y-3 bg-white">
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-red-500 transition-all hover:bg-red-500/10 cursor-pointer"
          >
            <LogOut size={16} />
            <span>Logout Account</span>
          </button>
        </div>
      </aside>

      {/* Sidebar Backdrop on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-neutral-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
