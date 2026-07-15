"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, Sun, Moon } from "lucide-react";
import AuthBackground from "@/components/animations/AuthBackground";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusPos, setFocusPos] = useState<{ x: number; y: number } | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Sync theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("admin-theme") || localStorage.getItem("theme");
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme === "dark" || (!savedTheme && systemDark);
    
    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("admin-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("admin-theme", "light");
      localStorage.setItem("theme", "light");
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const rect = e.target.getBoundingClientRect();
    setFocusPos({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  };

  const handleBlur = () => {
    setFocusPos(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(identifier, password);
      setIsSuccess(true);
      toast.success("Successfully logged in!");

      // Redirect based on user role after animation
      setTimeout(() => {
        const cachedProfile = localStorage.getItem("userProfile");
        const loggedUser = cachedProfile ? JSON.parse(cachedProfile) : null;
        const role = loggedUser?.role?.toUpperCase();
        
        if (loggedUser && (role === "ADMIN" || role === "SUPERADMIN" || loggedUser.role === "admin" || loggedUser.role === "superadmin")) {
          if (typeof window !== "undefined") {
            document.cookie = "adminLandingBypass=true; path=/; SameSite=Lax";
          }
          router.push("/admin/dashboard");
        } else if (loggedUser && (role === "DISTRIBUTOR" || loggedUser.role === "distributor")) {
          router.push("/distributor/dashboard");
        } else if (loggedUser && (role === "SALESPERSON" || loggedUser.role === "salesperson")) {
          router.push("/sales/dashboard");
        } else {
          router.push("/");
        }
      }, 800);
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
      toast.error(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthBackground focusPos={focusPos} isSuccess={isSuccess}>
      {/* Floating Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={toggleTheme}
          className="p-3 rounded-full bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/50 dark:border-neutral-800/50 text-slate-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-300 shadow-md cursor-pointer hover:scale-105"
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white/80 dark:bg-neutral-900/85 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-800/50 rounded-3xl p-6 xs:p-8 sm:p-10 shadow-2xl transition-all duration-500 hover:shadow-[#D71920]/5 text-slate-800 dark:text-white">
        {/* Header / Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <Link href="/" className="inline-block mb-4 sm:mb-6 hover:scale-105 transition-transform duration-300">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/SD-logo.png"
              alt="SD Smart Appliances"
              className="h-10 sm:h-12 w-auto object-contain mx-auto"
            />
          </Link>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-neutral-900 dark:text-white mb-1.5 sm:mb-2 uppercase">
            Welcome Back
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
            Sign in to your account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {error && (
            <div className="p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs sm:text-sm font-semibold text-red-500 text-left animate-fade-in animate-duration-200">
              {error}
            </div>
          )}

          {/* Email or Phone Number Field */}
          <div className="space-y-1.5">
            <label htmlFor="identifier" className="block text-xs sm:text-sm font-black text-neutral-700 dark:text-neutral-300 uppercase tracking-wider text-left">
              Email or Phone Number
            </label>
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              required
              className="w-full px-4 py-3 bg-white/50 dark:bg-neutral-950/45 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 focus:border-[#D71920] transition-all text-sm font-medium"
              placeholder="Enter your email or phone"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="block text-xs sm:text-sm font-black text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                Password
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-xs text-[#D71920] hover:text-[#D71920]/80 transition-colors font-bold uppercase tracking-wider"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
                className="w-full px-4 py-3 bg-white/50 dark:bg-neutral-950/45 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 focus:border-[#D71920] transition-all text-sm font-medium pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || isSuccess}
            className="w-full py-3 bg-[#D71920] text-white font-black uppercase tracking-wider text-xs sm:text-sm rounded-xl hover:bg-[#B91520] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-[#D71920]/20 transform active:scale-95"
          >
            {loading || isSuccess ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <LogIn size={16} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Signup Link */}
        <p className="text-center mt-8 text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm font-bold uppercase tracking-wider">
          Don't have an account?{" "}
          <Link
            href="/auth/signup"
            className="text-[#D71920] font-black hover:text-[#D71920]/80 transition-colors underline decoration-2 underline-offset-4"
          >
            Sign up
          </Link>
        </p>
      </div>
    </AuthBackground>
  );
}
