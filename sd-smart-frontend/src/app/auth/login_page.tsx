"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { THEME_CLASSES } from "@/config/themes";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // TODO: Add API call to authenticate user
      console.log("Login with:", { email, password });
      // For now, just redirect to home
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sd-smart-ecommerce/SD-logo.png"
              alt="SD Smart Appliances"
              className="h-10 w-auto object-contain"
            />
          </Link>
          <h1 className="text-2xl font-bold text-[#1C1C1C] mb-2">Welcome Back</h1>
          <p className="text-neutral-600">Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#1C1C1C] mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 focus:border-[#D71920] transition-all"
              placeholder="you@example.com"
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#1C1C1C] mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 focus:border-[#D71920] transition-all"
                placeholder="••••••••"
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

          {/* Forgot Password Link */}
          <div className="text-right">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-[#D71920] hover:text-[#D71920]/80 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-[#D71920] text-white font-semibold rounded-lg hover:bg-[#B91520] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Sign Up Link */}
        <p className="text-center mt-6 text-neutral-600">
          Don't have an account?{" "}
          <Link
            href="/auth/signup"
            className="text-[#D71920] font-semibold hover:text-[#D71920]/80 transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
