"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import AuthBackground from "@/components/animations/AuthBackground";
import { useAuth } from "@/providers/AuthProvider";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });
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

  const passwordStrength = {
    hasMinLength: formData.password.length >= 8,
    hasUpperCase: /[A-Z]/.test(formData.password),
    hasLowerCase: /[a-z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
  };

  const isPasswordStrong = Object.values(passwordStrength).every(Boolean);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (!isPasswordStrong) {
      setError("Password does not meet security requirements");
      setLoading(false);
      return;
    }

    try {
      await signup(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.phoneNumber
      );
      setIsSuccess(true);
      // Redirect to home page after success animation completes
      setTimeout(() => {
        router.push("/");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthBackground focusPos={focusPos} isSuccess={isSuccess}>
      <div className="w-full max-w-md bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-800/40 rounded-2xl p-6 sm:p-8 shadow-2xl transition-all duration-500">
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
          <h1 className="text-2xl font-bold text-[#1C1C1C] mb-2">Create Account</h1>
          <p className="text-neutral-600">Join SD Smart Appliances community</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-[#1C1C1C] mb-1">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
                className="w-full px-4 py-2 bg-white dark:bg-slate-950/80 border border-neutral-300 dark:border-slate-700 text-[#1C1C1C] dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 focus:border-[#D71920] transition-all"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-[#1C1C1C] mb-1">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
                className="w-full px-4 py-2 bg-white dark:bg-slate-950/80 border border-neutral-300 dark:border-slate-700 text-[#1C1C1C] dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 focus:border-[#D71920] transition-all"
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#1C1C1C] mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              required
              className="w-full px-4 py-2 bg-white dark:bg-slate-950/80 border border-neutral-300 dark:border-slate-700 text-[#1C1C1C] dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 focus:border-[#D71920] transition-all"
            />
          </div>

          {/* Phone Number Field */}
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-[#1C1C1C] mb-1">
              Phone Number
            </label>
            <input
              id="phoneNumber"
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              required
              className="w-full px-4 py-2 bg-white dark:bg-slate-950/80 border border-neutral-300 dark:border-slate-700 text-[#1C1C1C] dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 focus:border-[#D71920] transition-all"
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
                name="password"
                value={formData.password}
                onChange={handleChange}
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
            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <div className={`w-3 h-3 rounded-full ${passwordStrength.hasMinLength ? "bg-green-500" : "bg-gray-300"}`} />
                  <span className={passwordStrength.hasMinLength ? "text-green-600" : "text-neutral-600"}>
                    At least 8 characters
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className={`w-3 h-3 rounded-full ${passwordStrength.hasUpperCase ? "bg-green-500" : "bg-gray-300"}`} />
                  <span className={passwordStrength.hasUpperCase ? "text-green-600" : "text-neutral-600"}>
                    One uppercase letter
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className={`w-3 h-3 rounded-full ${passwordStrength.hasLowerCase ? "bg-green-500" : "bg-gray-300"}`} />
                  <span className={passwordStrength.hasLowerCase ? "text-green-600" : "text-neutral-600"}>
                    One lowercase letter
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className={`w-3 h-3 rounded-full ${passwordStrength.hasNumber ? "bg-green-500" : "bg-gray-300"}`} />
                  <span className={passwordStrength.hasNumber ? "text-green-600" : "text-neutral-600"}>
                    One number
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#1C1C1C] mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
                className="w-full px-4 py-2 bg-white dark:bg-slate-950/80 border border-neutral-300 dark:border-slate-700 text-[#1C1C1C] dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 focus:border-[#D71920] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || isSuccess || !isPasswordStrong}
            className="w-full py-2 bg-[#D71920] text-white font-semibold rounded-lg hover:bg-[#B91520] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading || isSuccess ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Creating account...</span>
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Sign In Link */}
        <p className="text-center mt-6 text-neutral-600">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-[#D71920] font-semibold hover:text-[#D71920]/80 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthBackground>
  );
}
