"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";

function AdminSplashScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0d0d0d] text-white select-none font-sans">
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
          <div className="absolute inset-0 rounded-full border-4 border-neutral-800"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#D71920] border-r-[#D71920] animate-spin"></div>
        </div>

        {/* Loading Text */}
        <h3 className="text-base font-extrabold tracking-wider text-neutral-100 uppercase mb-1">
          SD SMART APPLIANCES
        </h3>
        <p className="text-[10px] text-[#D71920] font-black tracking-widest uppercase animate-pulse">
          Loading Admin Panel...
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

  const isAdminRoute = pathname?.startsWith("/admin");
  const isRootRoute = pathname === "/";

  // Check if server-side user is an admin
  const isServerAdmin = serverUser && (
    serverUser.role?.toUpperCase() === "ADMIN" || 
    serverUser.role?.toUpperCase() === "SUPERADMIN" || 
    serverUser.role === "admin" || 
    serverUser.role === "superadmin"
  );

  // Initialize state based on server-side check to prevent hydration mismatch and flash
  const [showAdminSplash, setShowAdminSplash] = useState(() => {
    if (isAdminRoute && isServerAdmin) {
      return true;
    }
    return false;
  });
  const [isAuthorized, setIsAuthorized] = useState(true);

  // Synchronous checks on mount or pathname change
  useEffect(() => {
    if (!isAdminRoute && !isRootRoute) {
      setShowAdminSplash(false);
      setIsAuthorized(true);
      return;
    }

    const checkRedirectAndSplash = () => {
      const cachedProfile = localStorage.getItem("userProfile");
      const loggedUser = cachedProfile ? JSON.parse(cachedProfile) : null;
      const role = loggedUser?.role?.toUpperCase();
      const isAdmin = loggedUser && (role === "ADMIN" || role === "SUPERADMIN" || loggedUser.role === "admin" || loggedUser.role === "superadmin");
      
      const isBypassUrl = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("bypass") === "true";
      const hasBypassed = typeof window !== "undefined" && document.cookie.includes("adminLandingBypass=true");

      if (isRootRoute) {
        if (isAdmin && !isBypassUrl && !hasBypassed) {
          setShowAdminSplash(true);
          router.replace("/admin/dashboard");
        } else {
          setShowAdminSplash(false);
          setIsAuthorized(true);
        }
      } else if (isAdminRoute) {
        if (loggedUser && !isAdmin) {
          // Cached user is definitely not admin, redirect immediately
          setIsAuthorized(false);
          router.replace("/auth/login");
        } else {
          setShowAdminSplash(true);
        }
      }
    };

    checkRedirectAndSplash();
  }, [pathname, router, isAdminRoute, isRootRoute]);

  // Reactive authentication checks and splash timer
  useEffect(() => {
    if (!isAdminRoute && !isRootRoute) return;

    if (!authLoading) {
      const role = user?.role?.toUpperCase();
      const isAdmin = user && (role === "ADMIN" || role === "SUPERADMIN" || user.role === "admin" || user.role === "superadmin");

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
      
      if (isRootRoute && isAdmin) {
        const isBypassUrl = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("bypass") === "true";
        const hasBypassed = typeof window !== "undefined" && document.cookie.includes("adminLandingBypass=true");
        
        if (!isBypassUrl && !hasBypassed) {
          setShowAdminSplash(true);
          router.replace("/admin/dashboard");
        }
      }
    } else {
      if (isAdminRoute) {
        setShowAdminSplash(true);
      }
    }
  }, [user, isAuthenticated, authLoading, pathname, router, isAdminRoute, isRootRoute]);

  if (isAdminRoute) {
    if (!isAuthorized) {
      return null;
    }
    if (showAdminSplash) {
      return <AdminSplashScreen />;
    }
  }

  if (isRootRoute && showAdminSplash) {
    return <AdminSplashScreen />;
  }

  return <>{children}</>;
}
