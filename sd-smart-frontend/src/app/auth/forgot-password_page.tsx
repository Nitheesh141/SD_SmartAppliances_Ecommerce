"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "verification" | "reset">("email");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // TODO: Add API call to send verification code
      console.log("Sending code to:", email);
      setSuccess("Verification code sent to your email");
      setStep("verification");
    } catch (err: any) {
      setError(err.message || "Failed to send code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // TODO: Add API call to verify code
      console.log("Verifying code:", verificationCode);
      setSuccess("");
      setStep("reset");
    } catch (err: any) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      // TODO: Add API call to reset password
      console.log("Resetting password");
      setSuccess("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
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
                required
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 focus:border-[#D71920] transition-all"
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
                required
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 focus:border-[#D71920] transition-all text-center text-lg tracking-widest"
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
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 focus:border-[#D71920] transition-all"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#1C1C1C] mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 focus:border-[#D71920] transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
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
    </div>
  );
}
