"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { 
  LayoutDashboard, LogOut, Home, Shield, Menu, X, ArrowLeftRight, Package, Headphones
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
      label: "Customer Enquiries",
      icon: Headphones,
      href: "/sales/enquiries",
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
              src="/sd-smart-ecommerce/SD-logo.png"
              alt="SD Smart Appliances"
              className="h-8 w-auto object-contain cursor-pointer"
            />
          </Link>
          <span className="h-4 w-[1px] bg-neutral-200"></span>
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#D71920] flex items-center gap-1">
            <LayoutDashboard size={12} />
            <span>Sales Portal</span>
          </span>
        </div>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-all"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col w-64 border-r bg-white border-neutral-200 text-slate-900 transition-all duration-300 transform lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Brand Header */}
        <div className="px-6 py-5 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/?bypass=true" onClick={() => setIsOpen(false)}>
              <img
                src="/sd-smart-ecommerce/SD-logo.png"
                alt="SD Smart Appliances"
                className="h-10 w-auto object-contain cursor-pointer"
              />
            </Link>
            <span className="h-6 w-[1px] bg-neutral-200"></span>
            <div className="flex flex-col">
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Sales Rep</span>
              <span className="text-xs font-bold text-[#D71920] flex items-center gap-0.5">
                <LayoutDashboard size={10} />
                <span>Portal</span>
              </span>
            </div>
          </div>
          
          {/* Close button on mobile */}
          <button 
            onClick={() => setIsOpen(false)} 
            className="lg:hidden p-1.5 rounded-lg border border-neutral-200"
          >
            <X size={16} />
          </button>
        </div>

        {/* Profile Card */}
        <div className="px-6 py-5 border-b border-neutral-200 flex flex-col gap-1">
          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Signed in as</p>
          <div className="flex items-center gap-3 mt-1">
            <div className="w-9 h-9 rounded-full bg-[#D71920]/15 text-[#D71920] border border-[#D71920]/30 flex items-center justify-center font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase() || "S"}
            </div>
            <div className="min-w-0">
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
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}
    </>
  );
}
