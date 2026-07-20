"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, UserPlus, Building, Phone, FileText, MapPin, Mail, Lock, User } from "lucide-react";
import AuthBackground from "@/components/animations/AuthBackground";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";

export default function DistributorSignupPage() {
  const router = useRouter();
  const { distributorSignup } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form fields
  const [formData, setFormData] = useState({
    distributorName: "",
    contactPersonName: "",
    email: "",
    mobileNumber: "",
    gstNumber: "",
    businessName: "",
    businessAddress: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusPos, setFocusPos] = useState<{ x: number; y: number } | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const rect = e.target.getBoundingClientRect();
    setFocusPos({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  };

  const handleBlur = () => {
    setFocusPos(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let value = e.target.value;
    if (e.target.name === "mobileNumber") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.mobileNumber.length !== 10) {
      setError("Mobile Number must be exactly 10 digits.");
      toast.error("Mobile Number must be exactly 10 digits.");
      return;
    }

    // Password validations
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (!/[A-Z]/.test(formData.password) || !/[a-z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      setError("Password must contain at least one uppercase letter, one lowercase letter, and one number.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await distributorSignup({
        distributorName: formData.distributorName,
        contactPersonName: formData.contactPersonName,
        email: formData.email,
        mobileNumber: formData.mobileNumber,
        gstNumber: formData.gstNumber,
        businessName: formData.businessName,
        businessAddress: formData.businessAddress,
        password: formData.password,
      });

      setIsSuccess(true);
      toast.success("Registration successful! Welcome to our Distributor network.");

      // Redirect to distributor dashboard after success animation
      setTimeout(() => {
        router.push("/distributor/dashboard");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please check your inputs.");
      toast.error(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthBackground focusPos={focusPos} isSuccess={isSuccess}>
      <div className="w-full max-w-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-800/40 rounded-2xl p-6 sm:p-8 shadow-2xl transition-all duration-500 my-8">
        {/* Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block mb-3">
            <img
              src="/SD-logo.png"
              alt="SD Smart Appliances"
              className="h-10 w-auto object-contain"
            />
          </Link>
          <h1 className="text-2xl font-bold text-[#1C1C1C] dark:text-white mb-1">Distributor Registration</h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">Register your business details to apply as an authorized B2B partner.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 text-left animate-fade-in">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Distributor Name */}
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1 text-left">
                Distributor Name *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                  <User size={16} />
                </span>
                <input
                  name="distributorName"
                  type="text"
                  value={formData.distributorName}
                  onChange={handleChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  required
                  placeholder="e.g. Acme Distribution"
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950/80 border border-neutral-300 dark:border-slate-700 text-[#1C1C1C] dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 focus:border-[#D71920] transition-all"
                />
              </div>
            </div>

            {/* Contact Person Name */}
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1 text-left">
                Contact Person Name *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                  <User size={16} />
                </span>
                <input
                  name="contactPersonName"
                  type="text"
                  value={formData.contactPersonName}
                  onChange={handleChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  required
                  placeholder="e.g. John Doe"
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950/80 border border-neutral-300 dark:border-slate-700 text-[#1C1C1C] dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 focus:border-[#D71920] transition-all"
                />
              </div>
            </div>

            {/* Business Name */}
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1 text-left">
                Business Name *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                  <Building size={16} />
                </span>
                <input
                  name="businessName"
                  type="text"
                  value={formData.businessName}
                  onChange={handleChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  required
                  placeholder="e.g. Acme Appliances Ltd"
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950/80 border border-neutral-300 dark:border-slate-700 text-[#1C1C1C] dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 focus:border-[#D71920] transition-all"
                />
              </div>
            </div>

            {/* GST Number */}
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1 text-left">
                GST Number
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                  <FileText size={16} />
                </span>
                <input
                  name="gstNumber"
                  type="text"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder="15-digit GSTIN (Optional)"
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950/80 border border-neutral-300 dark:border-slate-700 text-[#1C1C1C] dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 focus:border-[#D71920] transition-all"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1 text-left">
                Email Address *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                  <Mail size={16} />
                </span>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  required
                  placeholder="distributor@business.com"
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950/80 border border-neutral-300 dark:border-slate-700 text-[#1C1C1C] dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 focus:border-[#D71920] transition-all"
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1 text-left">
                Mobile Number *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                  <Phone size={16} />
                </span>
                <input
                  name="mobileNumber"
                  type="tel"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  required
                  placeholder="e.g. 9876543210"
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950/80 border border-neutral-300 dark:border-slate-700 text-[#1C1C1C] dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 focus:border-[#D71920] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Business Address */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1 text-left">
              Business Address *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-neutral-400">
                <MapPin size={16} />
              </span>
              <textarea
                name="businessAddress"
                value={formData.businessAddress}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
                rows={3}
                placeholder="Enter complete business/billing address"
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950/80 border border-neutral-300 dark:border-slate-700 text-[#1C1C1C] dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 focus:border-[#D71920] transition-all resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1 text-left">
                Password *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                  <Lock size={16} />
                </span>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  required
                  className="w-full pl-10 pr-10 py-2 bg-white dark:bg-slate-950/80 border border-neutral-300 dark:border-slate-700 text-[#1C1C1C] dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 focus:border-[#D71920] transition-all"
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

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1 text-left">
                Confirm Password *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                  <Lock size={16} />
                </span>
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  required
                  className="w-full pl-10 pr-10 py-2 bg-white dark:bg-slate-950/80 border border-neutral-300 dark:border-slate-700 text-[#1C1C1C] dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D71920]/20 focus:border-[#D71920] transition-all"
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
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || isSuccess}
            className="w-full py-3 bg-[#D71920] text-white font-bold rounded-lg hover:bg-[#B91520] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-sm shadow-lg shadow-[#D71920]/10 mt-6"
          >
            {loading || isSuccess ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Registering Distributor...</span>
              </>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Register Distributor</span>
              </>
            )}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center mt-6 text-neutral-600 dark:text-neutral-400 text-sm">
          Already registered as a distributor?{" "}
          <Link
            href="/auth/login"
            className="text-[#D71920] font-semibold hover:text-[#D71920]/80 transition-colors"
          >
            Sign In
          </Link>
        </p>
      </div>
    </AuthBackground>
  );
}
