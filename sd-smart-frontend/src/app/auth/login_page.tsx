"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { THEME_CLASSES } from "@/config/themes";
import AuthBackground from "@/components/animations/AuthBackground";
import { useAuth } from "@/providers/AuthProvider";

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

      const cachedProfile = localStorage.getItem("userProfile");
      const loggedUser = cachedProfile ? JSON.parse(cachedProfile) : null;

      // Redirect to admin, distributor, or home after success animation completes
      setTimeout(() => {
        const role = loggedUser?.role?.toUpperCase();
        if (loggedUser && (role === "ADMIN" || role === "SUPERADMIN" || loggedUser.role === "admin" || loggedUser.role === "superadmin")) {
          router.push("/admin/dashboard");
        } else if (loggedUser && (role === "DISTRIBUTOR" || loggedUser.role === "distributor")) {
          router.push("/distributor/dashboard");
        } else {
          router.push("/");
        }
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthBackground focusPos={focusPos} isSuccess={isSuccess}>
      <div className="w-full max-w-md bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-800/40 rounded-2xl p-6 sm:p-8 shadow-2xl transition-all duration-500">
        {/* Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sd-smart-ecommerce/SD-logo.png"
              alt="SD Smart Appliances"
              className="h-10 w-auto object-contain"
            />
          </Link>
          <h1 className="text-2xl font-bold text-[#1C1C1C] mb-1">Welcome Back</h1>
          <p className="text-neutral-600 text-sm">Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 text-left animate-fade-in">
              {error}
            </div>
          )}

          {/* Email or Phone Number Field */}
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium text-[#1C1C1C] mb-1 text-left">
              Email Address or Phone Number
            </label>
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              required
              className="w-full px-4 py-2 bg-white dark:bg-slate-950/80 border border-neutral-300 dark:border-slate-700 text-[#1C1C1C] dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 focus:border-[#D71920] transition-all"
            />
          </div>

          {/* Password Field */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-[#1C1C1C]">
                Password
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-xs text-[#D71920] hover:text-[#D71920]/80 transition-colors font-medium"
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
                className="w-full px-4 py-2 bg-white dark:bg-slate-950/80 border border-neutral-300 dark:border-slate-700 text-[#1C1C1C] dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 focus:border-[#D71920] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || isSuccess}
            className="w-full py-2 bg-[#D71920] text-white font-semibold rounded-lg hover:bg-[#B91520] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
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
        <p className="text-center mt-6 text-neutral-600 text-sm">
          Don't have an account?{" "}
          <Link
            href="/auth/signup"
            className="text-[#D71920] font-semibold hover:text-[#D71920]/80 transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </AuthBackground>
  );
}
