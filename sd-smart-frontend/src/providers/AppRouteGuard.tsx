"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";

function AdminSplashScreen({ label = "Admin Panel", isSales = false }: { label?: string; isSales?: boolean }) {
  return (
    <div 
      suppressHydrationWarning={true}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none font-sans transition-colors duration-300 ${isSales ? "bg-white text-slate-900" : "bg-white dark:bg-[#0d0d0d] text-slate-900 dark:text-white"}`}
    >
      <div className="flex flex-col items-center max-w-sm px-6 text-center animate-fade-in">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center">
          <img
            src="/sd-smart-ecommerce/SD-logo.png"
            alt="SD SMART"
            className="h-16 w-auto object-contain animate-pulse"
            style={{ animationDuration: "2.5s" }}
          />
        </div>
        
        {/* Spinner */}
        <div className="relative w-12 h-12 mb-6">
          <div className={`absolute inset-0 rounded-full border-4 ${isSales ? "border-neutral-200" : "border-neutral-200 dark:border-neutral-800"}`}></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#D71920] border-r-[#D71920] animate-spin"></div>
        </div>

        {/* Loading Text */}
        <h3 className={`text-base font-extrabold tracking-wider uppercase mb-1 ${isSales ? "text-[#1C1C1C]" : "text-[#1C1C1C] dark:text-neutral-100"}`}>
          SD SMART APPLIANCES
        </h3>
        <p className="text-[10px] text-[#D71920] font-black tracking-widest uppercase animate-pulse">
          Loading {label}...
        </p>
      </div>
    </div>
  );
}

export function AppRouteGuard({ 
  children,
  serverUser 
}: { 
  children: React.ReactNode;
  serverUser: any;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // Synchronize document theme class to avoid loading flashes during dynamic page load transitions
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isSales = pathname?.startsWith("/sales");
      const isDistributor = pathname?.startsWith("/distributor") && !pathname?.startsWith("/admin");
      
      if (isSales || isDistributor) {
        document.documentElement.classList.remove("dark");
      } else if (pathname?.startsWith("/admin")) {
        const saved = localStorage.getItem("admin-theme");
        if (saved === "light") {
          document.documentElement.classList.remove("dark");
        } else {
          document.documentElement.classList.add("dark");
        }
      }
    }
  }, [pathname]);

  const isAdminRoute = pathname?.startsWith("/admin");
  const isSalesRoute = pathname?.startsWith("/sales");
  const isRootRoute = pathname === "/";

  // Check if server-side user is an admin
  const isServerAdmin = serverUser && (
    serverUser.role?.toUpperCase() === "ADMIN" || 
    serverUser.role?.toUpperCase() === "SUPERADMIN" || 
    serverUser.role === "admin" || 
    serverUser.role === "superadmin"
  );

  const isServerSales = serverUser && (
    serverUser.role?.toUpperCase() === "SALESPERSON" || 
    serverUser.role === "salesperson"
  );

  // Initialize state based on server-side check to prevent hydration mismatch and flash
  const [showAdminSplash, setShowAdminSplash] = useState(() => {
    if (isAdminRoute && isServerAdmin) {
      return true;
    }
    if (isSalesRoute && isServerSales) {
      return true;
    }
    return false;
  });
  const [isAuthorized, setIsAuthorized] = useState(true);

  // Synchronous checks on mount or pathname change
  useEffect(() => {
    if (!isAdminRoute && !isSalesRoute && !isRootRoute) {
      setShowAdminSplash(false);
      setIsAuthorized(true);
      return;
    }

    const checkRedirectAndSplash = () => {
      const cachedProfile = localStorage.getItem("userProfile");
      const loggedUser = cachedProfile ? JSON.parse(cachedProfile) : null;
      const role = loggedUser?.role?.toUpperCase();
      const isAdmin = loggedUser && (role === "ADMIN" || role === "SUPERADMIN" || loggedUser.role === "admin" || loggedUser.role === "superadmin");
      const isSales = loggedUser && (role === "SALESPERSON" || loggedUser.role === "salesperson");
      
      const isBypassUrl = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("bypass") === "true";
      const hasBypassed = typeof window !== "undefined" && document.cookie.includes("adminLandingBypass=true");

      if (isRootRoute) {
        if (isAdmin && !isBypassUrl && !hasBypassed) {
          setShowAdminSplash(true);
          router.replace("/admin/dashboard");
        } else if (isSales && !isBypassUrl && !hasBypassed) {
          setShowAdminSplash(true);
          router.replace("/sales/dashboard");
        } else {
          setShowAdminSplash(false);
          setIsAuthorized(true);
        }
      } else if (isAdminRoute) {
        if (loggedUser && !isAdmin) {
          // Cached user is definitely not admin, redirect immediately
          setIsAuthorized(false);
          router.replace("/auth/login");
        } else if (authLoading || !isAuthenticated) {
          setShowAdminSplash(true);
        }
      } else if (isSalesRoute) {
        if (loggedUser && !isSales) {
          setIsAuthorized(false);
          router.replace("/auth/login");
        } else if (authLoading || !isAuthenticated) {
          setShowAdminSplash(true);
        }
      }
    };

    checkRedirectAndSplash();
  }, [pathname, router, isAdminRoute, isSalesRoute, isRootRoute, isAuthenticated, authLoading]);

  // Reactive authentication checks and splash timer
  useEffect(() => {
    if (!isAdminRoute && !isSalesRoute && !isRootRoute) return;

    if (!authLoading) {
      const role = user?.role?.toUpperCase();
      const isAdmin = user && (role === "ADMIN" || role === "SUPERADMIN" || user.role === "admin" || user.role === "superadmin");
      const isSales = user && (role === "SALESPERSON" || user.role === "salesperson");

      if (isAdminRoute) {
        if (!isAuthenticated || !isAdmin) {
          setIsAuthorized(false);
          setShowAdminSplash(false);
          router.replace("/auth/login");
        } else {
          // Keep the splash screen for at least 0.5 seconds to ensure smooth transition
          const timer = setTimeout(() => {
            setShowAdminSplash(false);
            setIsAuthorized(true);
          }, 500);
          return () => clearTimeout(timer);
        }
      }

      if (isSalesRoute) {
        if (!isAuthenticated || !isSales) {
          setIsAuthorized(false);
          setShowAdminSplash(false);
          router.replace("/auth/login");
        } else {
          const timer = setTimeout(() => {
            setShowAdminSplash(false);
            setIsAuthorized(true);
          }, 500);
          return () => clearTimeout(timer);
        }
      }
      
      if (isRootRoute) {
        const isBypassUrl = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("bypass") === "true";
        const hasBypassed = typeof window !== "undefined" && document.cookie.includes("adminLandingBypass=true");
        
        if (isAdmin && !isBypassUrl && !hasBypassed) {
          setShowAdminSplash(true);
          router.replace("/admin/dashboard");
        } else if (isSales && !isBypassUrl && !hasBypassed) {
          setShowAdminSplash(true);
          router.replace("/sales/dashboard");
        }
      }
    } else {
      if (isAdminRoute || isSalesRoute) {
        setShowAdminSplash(true);
      }
    }
  }, [user, isAuthenticated, authLoading, pathname, router, isAdminRoute, isSalesRoute, isRootRoute]);

  if (isAdminRoute || isSalesRoute) {
    if (!isAuthorized) {
      return null;
    }
    if (showAdminSplash) {
      const label = isSalesRoute ? "Sales Panel" : "Admin Panel";
      return <AdminSplashScreen label={label} isSales={isSalesRoute} />;
    }
  }

  if (isRootRoute && showAdminSplash) {
    const role = user?.role?.toUpperCase();
    const label = role === "SALESPERSON" ? "Sales Panel" : "Admin Panel";
    return <AdminSplashScreen label={label} isSales={role === "SALESPERSON"} />;
  }

  return <>{children}</>;
}
