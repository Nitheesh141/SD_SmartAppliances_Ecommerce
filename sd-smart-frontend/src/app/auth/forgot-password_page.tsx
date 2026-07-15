"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import AuthBackground from "@/components/animations/AuthBackground";
import { authService } from "@/services/authService";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "verification" | "reset">("email");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusPos, setFocusPos] = useState<{ x: number; y: number } | null>(null);

  const passwordStrength = {
    hasMinLength: newPassword.length >= 8,
    hasUpperCase: /[A-Z]/.test(newPassword),
    hasLowerCase: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
  };

  const isPasswordStrong = Object.values(passwordStrength).every(Boolean);

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

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authService.forgotPassword({ email });
      if (response.success) {
        setSuccess("Verification code sent to your email");
        setStep("verification");
      } else {
        setError(response.message || "Failed to send code. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to send code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }
    setError("");
    setSuccess("");
    setStep("reset");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!isPasswordStrong) {
      setError("Password does not meet security requirements");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await authService.resetPassword({
        email,
        code: verificationCode,
        newPassword,
      });

      if (response.success) {
        setSuccess("Password reset successfully! Redirecting to login...");
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      } else {
        setError(response.message || "Failed to reset password");
      }
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthBackground focusPos={focusPos}>
      <div className="w-full max-w-md bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-800/40 rounded-2xl p-6 sm:p-8 shadow-2xl transition-all duration-500">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/SD-logo.png"
              alt="SD Smart Appliances"
              className="h-10 w-auto object-contain"
            />
          </Link>
          <h1 className="text-2xl font-bold text-[#1C1C1C] mb-2">Reset Password</h1>
          <p className="text-neutral-600">
            {step === "email" && "Enter your email to receive a verification code"}
            {step === "verification" && "Enter the code sent to your email"}
            {step === "reset" && "Create your new password"}
          </p>
        </div>

        {/* Step 1: Email */}
        {step === "email" && (
          <form onSubmit={handleSendCode} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                {success}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#1C1C1C] mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
                className="w-full px-4 py-2 border border-neutral-200 dark:border-slate-800 dark:bg-slate-950/40 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 focus:border-[#D71920] transition-all"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-[#D71920] text-white font-semibold rounded-lg hover:bg-[#B91520] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send Code"}
            </button>
          </form>
        )}

        {/* Step 2: Verification Code */}
        {step === "verification" && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-[#1C1C1C] mb-1">
                Verification Code
              </label>
              <input
                id="code"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
                className="w-full px-4 py-2 border border-neutral-200 dark:border-slate-800 dark:bg-slate-950/40 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 focus:border-[#D71920] transition-all text-center text-lg tracking-widest"
                placeholder="000000"
              />
              <p className="text-xs text-neutral-500 mt-1">Check your email for the 6-digit code</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-[#D71920] text-white font-semibold rounded-lg hover:bg-[#B91520] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>

            <button
              type="button"
              onClick={() => setStep("email")}
              className="w-full flex items-center justify-center gap-2 py-2 border border-neutral-200 text-neutral-600 font-semibold rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          </form>
        )}

        {/* Step 3: Reset Password */}
        {step === "reset" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                {success}
              </div>
            )}

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-[#1C1C1C] mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  required
                  className="w-full px-4 py-2 border border-neutral-200 dark:border-slate-800 dark:bg-slate-950/40 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 focus:border-[#D71920] transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {/* Password Strength Indicator */}
              {newPassword && (
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#1C1C1C] mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  required
                  className="w-full px-4 py-2 border border-neutral-200 dark:border-slate-800 dark:bg-slate-950/40 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 focus:border-[#D71920] transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
              {confirmPassword && newPassword === confirmPassword && (
                <p className="text-xs text-green-500 mt-1">Passwords match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordStrong || newPassword !== confirmPassword}
              className="w-full py-2 bg-[#D71920] text-white font-semibold rounded-lg hover:bg-[#B91520] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <button
              type="button"
              onClick={() => setStep("email")}
              className="w-full flex items-center justify-center gap-2 py-2 border border-neutral-200 text-neutral-600 font-semibold rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          </form>
        )}

        {/* Back to Login Link */}
        <p className="text-center mt-6 text-neutral-600">
          <Link
            href="/auth/login"
            className="text-[#D71920] font-semibold hover:text-[#D71920]/80 transition-colors"
          >
            Back to Login
          </Link>
        </p>
      </div>
    </AuthBackground>
  );
}
