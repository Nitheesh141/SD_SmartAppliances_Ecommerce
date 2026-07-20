"use client";
import { ENV } from "@/config/env";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
// import { announcements } from "../LandingPage/data/announcements";
import { navLinks, footerColumns, socialLinks } from "../LandingPage/data/navigation";
import {
  User,
  Package,
  Settings,
  LogOut,
  CreditCard,
  FolderHeart,
  MapPin,
  Plus,
  Trash2,
  Edit3,
  ChevronRight,
  HelpCircle,
  FileText,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  KeyRound,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { checkoutService } from "@/services/checkoutService";
import { authService } from "@/services/authService";
import { Order } from "@/types/api";

interface Address {
  id: string;
  name: string;
  phone: string;
  pincode: string;
  locality: string;
  addressText: string;
  city: string;
  state: string;
  landmark?: string;
  alternatePhone?: string;
  addressType: "HOME" | "WORK";
}

function AccountPageContent() {
  const { user, logout, isAuthenticated, loading, updateProfile } = useAuth();
  const isDistributor = user && (user.role?.toUpperCase() === "DISTRIBUTOR" || user.role === "distributor");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active Tab state
  const [activeTab, setActiveTab] = useState<string>("profile");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["orders", "profile", "addresses", "pan", "password", "forgot-password", "distributor"].includes(tab)) {
      if (tab === "distributor" && user?.role?.toUpperCase() === "DISTRIBUTOR") {
        setActiveTab("profile");
      } else {
        setActiveTab(tab);
      }
    }
  }, [searchParams, user]);

  // Local state for personal profile edits
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingMobile, setIsEditingMobile] = useState(false);

  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editGender, setEditGender] = useState<"MALE" | "FEMALE" | null>(null);

  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  // Change Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Distributor conversion form states
  const [distCompany, setDistCompany] = useState("");
  const [distAddress1, setDistAddress1] = useState("");
  const [distAddress2, setDistAddress2] = useState("");
  const [distCity, setDistCity] = useState("");
  const [distState, setDistState] = useState("");
  const [distPincode, setDistPincode] = useState("");
  const [distGstin, setDistGstin] = useState("");
  const [distMobile, setDistMobile] = useState("");
  const [converting, setConverting] = useState(false);

  // Pre-fill distributor states if user is already a distributor
  useEffect(() => {
    if (user) {
      setDistCompany(user.companyName || "");
      setDistGstin(user.gstin || "");
      setDistMobile(user.phoneNumber || "");
    }
  }, [user]);

  // Forgot Password states (multi-step: email → OTP → new password)
  const [fpStep, setFpStep] = useState<1 | 2 | 3>(1);
  const [fpEmail, setFpEmail] = useState("");
  const [fpCode, setFpCode] = useState("");
  const [fpNewPassword, setFpNewPassword] = useState("");
  const [fpConfirmPassword, setFpConfirmPassword] = useState("");
  const [fpLoading, setFpLoading] = useState(false);
  const [fpError, setFpError] = useState("");
  const [fpSuccess, setFpSuccess] = useState("");
  const [fpResendCooldown, setFpResendCooldown] = useState(0);
  const [showFpPassword, setShowFpPassword] = useState(false);
  const [showFpConfirmPassword, setShowFpConfirmPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setProfileError("All password fields are required.");
      return;
    }

    if (newPassword.length < 8) {
      setProfileError("New password must be at least 8 characters long.");
      return;
    }

    if (!/(?=.*[A-Z])/.test(newPassword)) {
      setProfileError("New password must contain at least one uppercase letter.");
      return;
    }

    if (!/(?=.*[0-9])/.test(newPassword)) {
      setProfileError("New password must contain at least one number.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setProfileError("New passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setProfileError("New password must be different from your current password.");
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await authService.changePassword({
        currentPassword,
        newPassword,
      });

      if (response.success) {
        setProfileSuccess("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setProfileError(response.message || "Failed to update password.");
      }
    } catch (err: any) {
      setProfileError(err.message || "Failed to update password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleConvertToDistributor = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    setConverting(true);

    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${ENV.API_BASE_URL}/auth/convert-distributor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          companyName: distCompany,
          addressLine1: distAddress1,
          addressLine2: distAddress2,
          city: distCity,
          state: distState,
          pincode: distPincode,
          gstin: distGstin,
          mobileNumber: distMobile
        })
      });

      const data = await res.json();
      if (data.success) {
        setProfileSuccess(data.message || "Successfully converted to distributor!");
        // Refresh local cache and window reload
        if (data.user) {
          localStorage.setItem("userProfile", JSON.stringify(data.user));
        }
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setProfileError(data.message || "Conversion failed");
      }
    } catch (err) {
      console.error(err);
      setProfileError("Request failed. Please verify connection to the server.");
    } finally {
      setConverting(false);
    }
  };

  // Password strength calculator
  const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
    if (!pwd) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { score, label: "Weak", color: "#ef4444" };
    if (score <= 2) return { score, label: "Fair", color: "#f97316" };
    if (score <= 3) return { score, label: "Good", color: "#eab308" };
    if (score <= 4) return { score, label: "Strong", color: "#22c55e" };
    return { score, label: "Very Strong", color: "#16a34a" };
  };

  // Forgot Password Handlers
  const startFpResendCooldown = () => {
    setFpResendCooldown(60);
    const interval = setInterval(() => {
      setFpResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleFpSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setFpError("");
    setFpSuccess("");

    if (!fpEmail.trim()) {
      setFpError("Please enter your email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(fpEmail.trim())) {
      setFpError("Please enter a valid email address.");
      return;
    }

    setFpLoading(true);
    try {
      const res = await authService.forgotPassword({ email: fpEmail.trim() });
      if (res.success) {
        setFpStep(2);
        startFpResendCooldown();
        setFpSuccess("Verification code sent! Check your email inbox.");
      } else {
        setFpError(res.message || "Failed to send verification code.");
      }
    } catch (err: any) {
      setFpError(err.message || "Failed to send verification code.");
    } finally {
      setFpLoading(false);
    }
  };

  const handleFpVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setFpError("");
    setFpSuccess("");

    if (!fpCode.trim() || fpCode.trim().length !== 6) {
      setFpError("Please enter the 6-digit verification code.");
      return;
    }

    setFpLoading(true);
    try {
      // Move to step 3 — code will be validated at final reset step
      setFpStep(3);
      setFpSuccess("");
    } catch (err: any) {
      setFpError(err.message || "Invalid code.");
    } finally {
      setFpLoading(false);
    }
  };

  const handleFpResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFpError("");
    setFpSuccess("");

    if (!fpNewPassword || !fpConfirmPassword) {
      setFpError("Please fill in both password fields.");
      return;
    }
    if (fpNewPassword.length < 8) {
      setFpError("Password must be at least 8 characters.");
      return;
    }
    if (!/(?=.*[A-Z])/.test(fpNewPassword)) {
      setFpError("Password must contain at least one uppercase letter.");
      return;
    }
    if (!/(?=.*[0-9])/.test(fpNewPassword)) {
      setFpError("Password must contain at least one number.");
      return;
    }
    if (fpNewPassword !== fpConfirmPassword) {
      setFpError("Passwords do not match.");
      return;
    }

    setFpLoading(true);
    try {
      const res = await authService.resetPassword({
        email: fpEmail.trim(),
        code: fpCode.trim(),
        newPassword: fpNewPassword,
      });
      if (res.success) {
        setFpSuccess("Password reset successfully! You can now login with your new password.");
        // Reset all state
        setTimeout(() => {
          setFpStep(1);
          setFpEmail("");
          setFpCode("");
          setFpNewPassword("");
          setFpConfirmPassword("");
          setFpSuccess("");
          setFpError("");
          setActiveTab("password");
        }, 2500);
      } else {
        setFpError(res.message || "Failed to reset password.");
      }
    } catch (err: any) {
      setFpError(err.message || "Failed to reset password.");
    } finally {
      setFpLoading(false);
    }
  };

  const handleFpResend = async () => {
    if (fpResendCooldown > 0) return;
    setFpError("");
    setFpLoading(true);
    try {
      const res = await authService.forgotPassword({ email: fpEmail.trim() });
      if (res.success) {
        startFpResendCooldown();
        setFpSuccess("A new code has been sent to your email.");
      } else {
        setFpError(res.message || "Failed to resend code.");
      }
    } catch (err: any) {
      setFpError(err.message || "Failed to resend code.");
    } finally {
      setFpLoading(false);
    }
  };

  // Address management state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [activeAddressMenu, setActiveAddressMenu] = useState<string | null>(null);

  const [addressForm, setAddressForm] = useState<Omit<Address, "id">>({
    name: "",
    phone: "",
    pincode: "",
    locality: "",
    addressText: "",
    city: "",
    state: "",
    landmark: "",
    alternatePhone: "",
    addressType: "HOME",
  });

  // PAN Card state
  const [panNumber, setPanNumber] = useState("");
  const [panFullName, setPanFullName] = useState("");
  const [panUploadedFile, setPanUploadedFile] = useState<string | null>(null);
  const [panDeclared, setPanDeclared] = useState(false);
  const [panStatus, setPanStatus] = useState<string | null>(null);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [loading, isAuthenticated, router]);

  // Load user details into local states
  useEffect(() => {
    if (user) {
      setEditFirstName(user.firstName || user.name?.split(" ")[0] || "");
      setEditLastName(user.lastName || user.name?.split(" ").slice(1).join(" ") || "");
      setEditEmail(user.email || "");
      setEditMobile(user.phoneNumber || "");

      const savedGender = localStorage.getItem(`user_gender_${user.id}`);
      if (savedGender === "MALE" || savedGender === "FEMALE") {
        setEditGender(savedGender);
      }
    }
  }, [user]);

  // Load/initialize addresses from localStorage
  useEffect(() => {
    if (user) {
      const savedAddresses = localStorage.getItem(`user_addresses_${user.id}`);
      if (savedAddresses) {
        setAddresses(JSON.parse(savedAddresses));
      } else {
        const defaultMocks: Address[] = [
          {
            id: "addr-mock-1",
            name: `${user.firstName || "Nitheesh"} ${user.lastName || "K V"}`,
            phone: user.phoneNumber || "9789636896",
            pincode: "638506",
            locality: "Vaniputhur",
            addressText: "456, Arumaikarar thottam, kongarpalayam, Vaniputhur, Kongarpalayam, Near Arumaikarar Thottam, Erode",
            city: "Erode",
            state: "Tamil Nadu",
            landmark: "Near Temple",
            alternatePhone: "",
            addressType: "HOME",
          },
          {
            id: "addr-mock-2",
            name: "Vellingiri",
            phone: "6369192223",
            pincode: "638506",
            locality: "Gobichettipalayam",
            addressText: "456, Arumaikarar thottam, kongarpalayam, Gobichettipalayam, Vaniputhur",
            city: "Gobichettipalayam",
            state: "Tamil Nadu",
            landmark: "",
            alternatePhone: "",
            addressType: "HOME",
          }
        ];
        setAddresses(defaultMocks);
        localStorage.setItem(`user_addresses_${user.id}`, JSON.stringify(defaultMocks));
      }

      const savedPan = localStorage.getItem(`user_pan_${user.id}`);
      if (savedPan) {
        const panObj = JSON.parse(savedPan);
        setPanNumber(panObj.panNumber || "");
        setPanFullName(panObj.fullName || "");
        setPanUploadedFile(panObj.fileName || null);
        setPanDeclared(panObj.declared || false);
        setPanStatus("UPLOADED");
      }
    }
  }, [user]);

  // Fetch real user orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      setOrdersLoading(true);
      try {
        const res = await checkoutService.getOrders();
        if (res.success && res.data?.orders) {
          setOrders(res.data.orders);
        }
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 font-sans">
        <div className="w-12 h-12 border-4 border-[#D71920]/25 border-t-[#D71920] rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-semibold text-neutral-500 tracking-wider">Loading profile...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Handle profile saves
  const handleSaveProfile = async (field: "personal" | "email" | "mobile") => {
    setProfileError("");
    setProfileSuccess("");
    try {
      if (field === "personal") {
        if (!editFirstName.trim() || !editLastName.trim()) {
          setProfileError("First Name and Last Name cannot be empty.");
          return;
        }
        await updateProfile(editFirstName, editLastName, editEmail, editMobile || undefined);
        if (editGender) {
          localStorage.setItem(`user_gender_${user?.id}`, editGender);
        }
        setIsEditingPersonal(false);
      } else if (field === "email") {
        if (!editEmail.trim()) {
          setProfileError("Email cannot be empty.");
          return;
        }
        await updateProfile(editFirstName, editLastName, editEmail, editMobile || undefined);
        setIsEditingEmail(false);
      } else if (field === "mobile") {
        await updateProfile(editFirstName, editLastName, editEmail, editMobile || undefined);
        setIsEditingMobile(false);
      }
      setProfileSuccess("Profile updated successfully!");
      setTimeout(() => setProfileSuccess(""), 3000);
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile details.");
    }
  };

  // Address operations
  const handleAddOrUpdateAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.name || !addressForm.phone || !addressForm.pincode || !addressForm.locality || !addressForm.addressText || !addressForm.city || !addressForm.state) {
      alert("Please fill all required address fields.");
      return;
    }

    let updatedAddresses: Address[] = [];
    if (editingAddressId) {
      updatedAddresses = addresses.map((addr) =>
        addr.id === editingAddressId ? { ...addressForm, id: editingAddressId } : addr
      );
      setEditingAddressId(null);
    } else {
      const newAddress: Address = {
        ...addressForm,
        id: `addr-${Date.now()}`,
      };
      updatedAddresses = [newAddress, ...addresses];
    }

    setAddresses(updatedAddresses);
    localStorage.setItem(`user_addresses_${user?.id}`, JSON.stringify(updatedAddresses));
    setIsAddingAddress(false);
    setAddressForm({
      name: "",
      phone: "",
      pincode: "",
      locality: "",
      addressText: "",
      city: "",
      state: "",
      landmark: "",
      alternatePhone: "",
      addressType: "HOME",
    });
  };

  const handleEditAddressClick = (addr: Address) => {
    setAddressForm({
      name: addr.name,
      phone: addr.phone,
      pincode: addr.pincode,
      locality: addr.locality,
      addressText: addr.addressText,
      city: addr.city,
      state: addr.state,
      landmark: addr.landmark || "",
      alternatePhone: addr.alternatePhone || "",
      addressType: addr.addressType,
    });
    setEditingAddressId(addr.id);
    setIsAddingAddress(true);
    setActiveAddressMenu(null);
  };

  const handleDeleteAddress = (id: string) => {
    const updated = addresses.filter((addr) => addr.id !== id);
    setAddresses(updated);
    localStorage.setItem(`user_addresses_${user?.id}`, JSON.stringify(updated));
    setActiveAddressMenu(null);
  };

  // PAN Card operations
  const handlePanUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!panNumber || !panFullName) {
      alert("Please fill out PAN number and Name.");
      return;
    }
    if (!panDeclared) {
      alert("Please accept the terms and conditions declaration.");
      return;
    }

    const panObj = {
      panNumber,
      fullName: panFullName,
      fileName: panUploadedFile || "pan_card.jpg",
      declared: panDeclared,
    };
    localStorage.setItem(`user_pan_${user?.id}`, JSON.stringify(panObj));
    setPanStatus("UPLOADED");
    alert("PAN details submitted successfully!");
  };

  const handlePanFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPanUploadedFile(e.target.files[0].name);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-slate-950 font-sans">
      {/* <AnnouncementBar announcements={announcements} /> */}
      <Header navLinks={navLinks} />

      <main className="flex-1 w-full max-w-[1400px] xl:max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* LEFT SIDEBAR SECTION */}
          <div className="w-full lg:w-[300px] flex flex-col gap-4 flex-shrink-0">
            {/* Sidebar Menu Panel */}
            <div className="bg-white dark:bg-slate-900 shadow-md rounded-2xl text-left border border-neutral-100 dark:border-slate-800 overflow-hidden py-2">

              {/* MY ORDERS Section */}
              <div className="border-b border-neutral-100 dark:border-slate-800/60 pb-2">
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`w-full flex items-center justify-between px-6 py-3.5 hover:bg-neutral-50 dark:hover:bg-slate-800/50 cursor-pointer ${activeTab === "orders" ? "bg-red-50/40 dark:bg-red-950/10" : ""
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <Package size={18} className="text-[#D71920]" />
                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">My Orders</span>
                  </div>
                  <ChevronRight size={14} className="text-neutral-400" />
                </button>
              </div>

              {/* ACCOUNT SETTINGS Section */}
              <div className="border-b border-neutral-100 dark:border-slate-800/60 py-2">
                <div className="px-6 py-2 flex items-center gap-4">
                  <User size={18} className="text-[#D71920]" />
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Account Settings</span>
                </div>
                <div className="flex flex-col mt-1">
                  <button
                    onClick={() => setActiveTab("profile")}
                    className={`pl-14 pr-6 py-2 text-sm text-left cursor-pointer transition-colors ${activeTab === "profile"
                      ? "text-[#D71920] font-bold"
                      : "text-neutral-700 dark:text-neutral-300 hover:text-[#D71920] dark:hover:text-red-400"
                      }`}
                  >
                    Profile Information
                  </button>
                  <button
                    onClick={() => setActiveTab("addresses")}
                    className={`pl-14 pr-6 py-2 text-sm text-left cursor-pointer transition-colors ${activeTab === "addresses"
                      ? "text-[#D71920] font-bold"
                      : "text-neutral-700 dark:text-neutral-300 hover:text-[#D71920] dark:hover:text-red-400"
                      }`}
                  >
                    Manage Addresses
                  </button>
                  <button
                    onClick={() => setActiveTab("pan")}
                    className={`pl-14 pr-6 py-2 text-sm text-left cursor-pointer transition-colors ${activeTab === "pan"
                      ? "text-[#D71920] font-bold"
                      : "text-neutral-700 dark:text-neutral-300 hover:text-[#D71920] dark:hover:text-red-400"
                      }`}
                  >
                    PAN Card Information
                  </button>
                  <button
                    onClick={() => setActiveTab("password")}
                    className={`pl-14 pr-6 py-2 text-sm text-left cursor-pointer transition-colors ${activeTab === "password"
                      ? "text-[#D71920] font-bold"
                      : "text-neutral-700 dark:text-neutral-300 hover:text-[#D71920] dark:hover:text-red-400"
                      }`}
                  >
                    Change Password
                  </button>
                  <button
                    onClick={() => { setFpStep(1); setFpError(""); setFpSuccess(""); setActiveTab("forgot-password"); }}
                    className={`pl-14 pr-6 py-2 text-sm text-left cursor-pointer transition-colors ${activeTab === "forgot-password"
                      ? "text-[#D71920] font-bold"
                      : "text-neutral-700 dark:text-neutral-300 hover:text-[#D71920] dark:hover:text-red-400"
                      }`}
                  >
                    Forgot Password
                  </button>
                  {user?.role?.toUpperCase() !== "DISTRIBUTOR" && (
                    <button
                      onClick={() => setActiveTab("distributor")}
                      className={`pl-14 pr-6 py-2 text-sm text-left cursor-pointer transition-colors ${activeTab === "distributor"
                        ? "text-[#D71920] font-bold"
                        : "text-neutral-700 dark:text-neutral-300 hover:text-[#D71920] dark:hover:text-red-400"
                        }`}
                    >
                      Become a Distributor
                    </button>
                  )}
                </div>
              </div>

              {/* PAYMENTS Section */}
              <div className="border-b border-neutral-100 dark:border-slate-800/60 py-2">
                <div className="px-6 py-2 flex items-center gap-4">
                  <CreditCard size={18} className="text-[#D71920]" />
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Payments</span>
                </div>
                <div className="flex flex-col mt-1">
                  <button
                    onClick={() => setActiveTab("gift_cards")}
                    className={`pl-14 pr-6 py-2 text-sm text-left cursor-pointer transition-colors flex items-center justify-between ${activeTab === "gift_cards"
                      ? "text-[#D71920] font-bold"
                      : "text-neutral-700 dark:text-neutral-300 hover:text-[#D71920] dark:hover:text-red-400"
                      }`}
                  >
                    <span>Gift Cards</span>
                    <span className="text-[10px] bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded-full font-extrabold mr-2">₹0</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("saved_upi")}
                    className={`pl-14 pr-6 py-2 text-sm text-left cursor-pointer transition-colors ${activeTab === "saved_upi"
                      ? "text-[#D71920] font-bold"
                      : "text-neutral-700 dark:text-neutral-300 hover:text-[#D71920] dark:hover:text-red-400"
                      }`}
                  >
                    Saved UPI
                  </button>
                  <button
                    onClick={() => setActiveTab("saved_cards")}
                    className={`pl-14 pr-6 py-2 text-sm text-left cursor-pointer transition-colors ${activeTab === "saved_cards"
                      ? "text-[#D71920] font-bold"
                      : "text-neutral-700 dark:text-neutral-300 hover:text-[#D71920] dark:hover:text-red-400"
                      }`}
                  >
                    Saved Cards
                  </button>
                </div>
              </div>

              {/* MY STUFF Section */}
              <div className="border-b border-neutral-100 dark:border-slate-800/60 py-2">
                <div className="px-6 py-2 flex items-center gap-4">
                  <FolderHeart size={18} className="text-[#D71920]" />
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">My Stuff</span>
                </div>
                <div className="flex flex-col mt-1">
                  <button
                    onClick={() => setActiveTab("coupons")}
                    className={`pl-14 pr-6 py-2 text-sm text-left cursor-pointer transition-colors ${activeTab === "coupons"
                      ? "text-[#D71920] font-bold"
                      : "text-neutral-700 dark:text-neutral-300 hover:text-[#D71920] dark:hover:text-red-400"
                      }`}
                  >
                    My Coupons
                  </button>
                  <button
                    onClick={() => setActiveTab("reviews")}
                    className={`pl-14 pr-6 py-2 text-sm text-left cursor-pointer transition-colors ${activeTab === "reviews"
                      ? "text-[#D71920] font-bold"
                      : "text-neutral-700 dark:text-neutral-300 hover:text-[#D71920] dark:hover:text-red-400"
                      }`}
                  >
                    My Reviews & Ratings
                  </button>
                  <button
                    onClick={() => setActiveTab("notifications")}
                    className={`pl-14 pr-6 py-2 text-sm text-left cursor-pointer transition-colors ${activeTab === "notifications"
                      ? "text-[#D71920] font-bold"
                      : "text-neutral-700 dark:text-neutral-300 hover:text-[#D71920] dark:hover:text-red-400"
                      }`}
                  >
                    All Notifications
                  </button>
                  <button
                    onClick={() => setActiveTab("wishlist")}
                    className={`pl-14 pr-6 py-2 text-sm text-left cursor-pointer transition-colors ${activeTab === "wishlist"
                      ? "text-[#D71920] font-bold"
                      : "text-neutral-700 dark:text-neutral-300 hover:text-[#D71920] dark:hover:text-red-400"
                      }`}
                  >
                    My Wishlist
                  </button>
                  <button
                    onClick={() => router.push("/service-request")}
                    className="pl-14 pr-6 py-2 text-sm text-left cursor-pointer transition-colors text-neutral-700 dark:text-neutral-300 hover:text-[#D71920] dark:hover:text-red-400"
                  >
                    Service Requests
                  </button>
                </div>
              </div>

              {/* Logout Row */}
              <div className="mt-2">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-4 px-6 py-3.5 text-xs font-bold text-[#D71920] hover:bg-red-50/50 dark:hover:bg-red-950/10 cursor-pointer text-left uppercase tracking-wider"
                >
                  <LogOut size={16} className="text-[#D71920]" />
                  <span>Logout</span>
                </button>
              </div>

            </div>

            {/* Frequently Visited Link Banner */}
            <div className="bg-white dark:bg-slate-900 shadow-md rounded-2xl p-4 text-left border border-neutral-100 dark:border-slate-800">
              <p className="text-xs font-extrabold text-neutral-800 dark:text-neutral-200 mb-2 uppercase tracking-wider">Help & Support</p>
              <div className="flex gap-4 text-xs text-neutral-500">
                <button onClick={() => router.push("/track-order")} className="hover:text-[#D71920] hover:underline cursor-pointer">Track Order</button>
                <button onClick={() => router.push("/support")} className="hover:text-[#D71920] hover:underline cursor-pointer">Help Center</button>
                <button onClick={() => router.push("/service-request")} className="hover:text-[#D71920] hover:underline cursor-pointer">Service Requests</button>
              </div>
            </div>

          </div>

          {/* RIGHT DETAILS PANEL SECTION */}
          <div className="flex-1 bg-white dark:bg-slate-900 shadow-md rounded-2xl p-6 sm:p-10 text-left border border-neutral-100 dark:border-slate-800">
            {profileError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-3">
                <AlertCircle size={18} className="text-[#D71920]" />
                <span>{profileError}</span>
              </div>
            )}
            {profileSuccess && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-3">
                <CheckCircle size={18} className="text-green-600" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {/* TAB CONTENT: PROFILE INFORMATION */}
            {activeTab === "profile" && (
              <div className="space-y-10">

                {/* Personal Information */}
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <h3 className="text-lg font-bold text-neutral-800 dark:text-white">Personal Information</h3>
                    <button
                      onClick={() => {
                        if (isEditingPersonal) handleSaveProfile("personal");
                        else setIsEditingPersonal(true);
                      }}
                      className="text-sm font-bold text-[#D71920] hover:text-[#b8141a] hover:underline cursor-pointer"
                    >
                      {isEditingPersonal ? "Save" : "Edit"}
                    </button>
                    {isEditingPersonal && (
                      <button
                        onClick={() => {
                          setEditFirstName(user?.firstName || "");
                          setEditLastName(user?.lastName || "");
                          setIsEditingPersonal(false);
                        }}
                        className="text-sm font-semibold text-neutral-500 hover:underline cursor-pointer ml-2"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
                    <input
                      type="text"
                      disabled={!isEditingPersonal}
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      className={`w-full px-4 py-2.5 text-sm border rounded-xl outline-none transition-all ${isEditingPersonal
                        ? "bg-white dark:bg-slate-950 border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 text-black dark:text-white"
                        : "bg-neutral-50 dark:bg-slate-850 border-neutral-200 dark:border-slate-800 text-neutral-600 dark:text-neutral-400 cursor-not-allowed"
                        }`}
                    />
                    <input
                      type="text"
                      disabled={!isEditingPersonal}
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      className={`w-full px-4 py-2.5 text-sm border rounded-xl outline-none transition-all ${isEditingPersonal
                        ? "bg-white dark:bg-slate-950 border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 text-black dark:text-white"
                        : "bg-neutral-50 dark:bg-slate-850 border-neutral-200 dark:border-slate-800 text-neutral-600 dark:text-neutral-400 cursor-not-allowed"
                        }`}
                    />
                  </div>

                  {/* Gender selection */}
                  <div className="mt-4">
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 font-semibold mb-2">Your Gender</p>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2.5 cursor-pointer text-sm text-neutral-700 dark:text-neutral-300">
                        <input
                          type="radio"
                          name="gender"
                          disabled={!isEditingPersonal}
                          checked={editGender === "MALE"}
                          onChange={() => setEditGender("MALE")}
                          className="w-4 h-4 accent-[#D71920] cursor-pointer"
                        />
                        <span>Male</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer text-sm text-neutral-700 dark:text-neutral-300">
                        <input
                          type="radio"
                          name="gender"
                          disabled={!isEditingPersonal}
                          checked={editGender === "FEMALE"}
                          onChange={() => setEditGender("FEMALE")}
                          className="w-4 h-4 accent-[#D71920] cursor-pointer"
                        />
                        <span>Female</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <h3 className="text-lg font-bold text-neutral-800 dark:text-white">Email Address</h3>
                    <button
                      onClick={() => {
                        if (isEditingEmail) handleSaveProfile("email");
                        else setIsEditingEmail(true);
                      }}
                      className="text-sm font-bold text-[#D71920] hover:text-[#b8141a] hover:underline cursor-pointer"
                    >
                      {isEditingEmail ? "Save" : "Edit"}
                    </button>
                    {isEditingEmail && (
                      <button
                        onClick={() => {
                          setEditEmail(user?.email || "");
                          setIsEditingEmail(false);
                        }}
                        className="text-sm font-semibold text-neutral-500 hover:underline cursor-pointer ml-2"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  <div className="max-w-2xl">
                    <input
                      type="email"
                      disabled={!isEditingEmail}
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className={`w-full px-4 py-2.5 text-sm border rounded-xl outline-none transition-all ${isEditingEmail
                        ? "bg-white dark:bg-slate-950 border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 text-black dark:text-white"
                        : "bg-neutral-50 dark:bg-slate-850 border-neutral-200 dark:border-slate-800 text-neutral-600 dark:text-neutral-400 cursor-not-allowed"
                        }`}
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <h3 className="text-lg font-bold text-neutral-800 dark:text-white">Mobile Number</h3>
                    <button
                      onClick={() => {
                        if (isEditingMobile) handleSaveProfile("mobile");
                        else setIsEditingMobile(true);
                      }}
                      className="text-sm font-bold text-[#D71920] hover:text-[#b8141a] hover:underline cursor-pointer"
                    >
                      {isEditingMobile ? "Save" : "Edit"}
                    </button>
                    {isEditingMobile && (
                      <button
                        onClick={() => {
                          setEditMobile(user?.phoneNumber || "");
                          setIsEditingMobile(false);
                        }}
                        className="text-sm font-semibold text-neutral-500 hover:underline cursor-pointer ml-2"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  <div className="max-w-2xl">
                    <input
                      type="text"
                      disabled={!isEditingMobile}
                      value={editMobile}
                      onChange={(e) => setEditMobile(e.target.value)}
                      className={`w-full px-4 py-2.5 text-sm border rounded-xl outline-none transition-all ${isEditingMobile
                        ? "bg-white dark:bg-slate-950 border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 text-black dark:text-white"
                        : "bg-neutral-50 dark:bg-slate-850 border-neutral-200 dark:border-slate-800 text-neutral-600 dark:text-neutral-400 cursor-not-allowed"
                        }`}
                    />
                  </div>
                </div>

                {/* FAQs Section */}
                <div className="border-t border-neutral-100 dark:border-slate-800/80 pt-8">
                  <h3 className="text-lg font-bold text-neutral-800 dark:text-white mb-6">FAQs</h3>
                  <div className="space-y-6 max-w-5xl">
                    <div>
                      <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                        What happens when I update my email address (or mobile number)?
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        Your login credentials (email or phone number) will be updated accordingly. All transactional communications, OTPs, and system notifications will be routed to your newly registered credentials.
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                        When will my SD Smart account profile reflect the updates?
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        The modifications are applied immediately upon clicking "Save" and completing any required validations. Your session is synchronized in real-time.
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                        Does updating my details disrupt past order history?
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        No. Changing profile parameters does not invalidate your account history. All order logs, wishlists, and registered warranty details remain tied to your primary user record.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Account Deletion actions */}
                <div className="flex flex-col gap-3 pt-6 border-t border-neutral-100 dark:border-slate-800 pt-6 text-sm">
                  <button
                    onClick={() => alert("Please contact customer support to temporarily deactivate your account.")}
                    className="text-left font-bold text-neutral-600 hover:text-[#D71920] dark:text-neutral-400 dark:hover:text-red-400 transition-colors w-fit cursor-pointer"
                  >
                    Deactivate Account
                  </button>
                  <button
                    onClick={() => alert("Please submit a ticket to request permanent deletion of your credentials and data.")}
                    className="text-left font-bold text-[#D71920] hover:text-[#b8141a] transition-colors w-fit cursor-pointer"
                  >
                    Delete Account
                  </button>
                </div>

              </div>
            )}

            {/* TAB CONTENT: CHANGE PASSWORD */}
            {activeTab === "password" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-neutral-800 dark:text-white">Change Password</h3>
                </div>

                <form onSubmit={handleChangePassword} className="max-w-2xl text-left space-y-5">
                  {/* Current Password */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="Enter current password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-2.5 pr-12 border border-neutral-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white text-sm rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 outline-none transition-all"
                      />
                      <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer">
                        {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Min. 8 characters, include uppercase & number"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2.5 pr-12 border border-neutral-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white text-sm rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 outline-none transition-all"
                      />
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer">
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {/* Password Strength Meter */}
                    {newPassword && (() => {
                      const { score, label, color } = getPasswordStrength(newPassword);
                      return (
                        <div className="mt-2">
                          <div className="flex gap-1 mb-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div key={i} className="h-1 flex-1 rounded-full transition-all" style={{ backgroundColor: i <= score ? color : '#e5e7eb' }} />
                            ))}
                          </div>
                          <p className="text-xs font-semibold" style={{ color }}>{label}</p>
                        </div>
                      );
                    })()}
                    <ul className="mt-2 space-y-0.5">
                      {[['At least 8 characters', newPassword.length >= 8], ['One uppercase letter', /[A-Z]/.test(newPassword)], ['One number', /[0-9]/.test(newPassword)]].map(([rule, passed]) => (
                        <li key={rule as string} className={`text-xs flex items-center gap-1.5 ${passed ? 'text-green-600' : 'text-neutral-400'}`}>
                          <CheckCircle size={11} className={passed ? 'text-green-500' : 'text-neutral-300'} />
                          {rule as string}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full px-4 py-2.5 pr-12 border text-sm rounded-xl focus:ring-2 outline-none transition-all dark:bg-slate-950 dark:text-white ${
                          confirmPassword && newPassword !== confirmPassword
                            ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                            : confirmPassword && newPassword === confirmPassword
                            ? 'border-green-400 focus:border-green-400 focus:ring-green-400/20'
                            : 'border-neutral-300 dark:border-slate-700 focus:border-[#D71920] focus:ring-[#D71920]/20'
                        }`}
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer">
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} /> Passwords do not match</p>
                    )}
                    {confirmPassword && newPassword === confirmPassword && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle size={11} /> Passwords match</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="w-full py-3 bg-[#D71920] hover:bg-[#b8141a] text-white font-bold text-sm rounded-xl transition-all cursor-pointer tracking-wider shadow-md shadow-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {passwordLoading ? "Updating..." : "UPDATE PASSWORD"}
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => { setFpStep(1); setFpError(""); setFpSuccess(""); setActiveTab("forgot-password"); }}
                      className="text-sm text-[#D71920] hover:text-[#b8141a] font-semibold hover:underline cursor-pointer"
                    >
                      Forgot your current password?
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB CONTENT: FORGOT PASSWORD */}
            {activeTab === "forgot-password" && (
              <div className="space-y-6 max-w-2xl">
                {/* Header with step indicator */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-red-50 dark:bg-red-950/20 rounded-xl flex items-center justify-center">
                    <KeyRound size={20} className="text-[#D71920]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-800 dark:text-white">Forgot Password</h3>
                    <p className="text-xs text-neutral-500">Reset your password via email verification</p>
                  </div>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center gap-2 mb-6">
                  {(['Email', 'Verify Code', 'New Password'] as const).map((label, idx) => {
                    const step = idx + 1;
                    const isActive = fpStep === step;
                    const isDone = fpStep > step;
                    return (
                      <div key={label} className="flex items-center gap-2 flex-1">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                          isDone ? 'bg-green-500 text-white' : isActive ? 'bg-[#D71920] text-white' : 'bg-neutral-100 dark:bg-slate-800 text-neutral-400'
                        }`}>
                          {isDone ? <CheckCircle size={14} /> : step}
                        </div>
                        <span className={`text-xs font-semibold hidden sm:block ${
                          isActive ? 'text-[#D71920]' : isDone ? 'text-green-600' : 'text-neutral-400'
                        }`}>{label}</span>
                        {idx < 2 && <div className={`flex-1 h-0.5 rounded-full ${ isDone ? 'bg-green-400' : 'bg-neutral-200 dark:bg-slate-700'}`} />}
                      </div>
                    );
                  })}
                </div>

                {/* Error/Success Messages */}
                {fpError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
                    <AlertCircle size={16} className="text-[#D71920] flex-shrink-0" />
                    <span>{fpError}</span>
                  </div>
                )}
                {fpSuccess && (
                  <div className="p-3.5 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                    <span>{fpSuccess}</span>
                  </div>
                )}

                {/* STEP 1: Email Input */}
                {fpStep === 1 && (
                  <form onSubmit={handleFpSendCode} className="space-y-5">
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                      <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                        Enter the email address associated with your SD Smart account. We'll send you a 6-digit verification code.
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Email Address</label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input
                          type="email"
                          placeholder="your@email.com"
                          required
                          value={fpEmail}
                          onChange={(e) => setFpEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white text-sm rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={fpLoading}
                      className="w-full py-3 bg-[#D71920] hover:bg-[#b8141a] text-white font-bold text-sm rounded-xl transition-all cursor-pointer tracking-wider shadow-md shadow-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {fpLoading ? "Sending..." : "SEND VERIFICATION CODE"}
                    </button>
                    <button type="button" onClick={() => setActiveTab("password")} className="w-full text-sm text-neutral-500 hover:text-neutral-700 cursor-pointer py-1">
                      ← Back to Change Password
                    </button>
                  </form>
                )}

                {/* STEP 2: OTP Verification */}
                {fpStep === 2 && (
                  <form onSubmit={handleFpVerifyCode} className="space-y-5">
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl">
                      <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
                        A 6-digit code has been sent to <strong>{fpEmail}</strong>. Check your inbox (and spam folder). Valid for <strong>10 minutes</strong>.
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">6-Digit Verification Code</label>
                      <input
                        type="text"
                        placeholder="Enter 6-digit code"
                        required
                        maxLength={6}
                        value={fpCode}
                        onChange={(e) => setFpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="w-full px-4 py-3 border border-neutral-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white text-lg font-mono text-center tracking-widest rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 outline-none transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={fpLoading || fpCode.length !== 6}
                      className="w-full py-3 bg-[#D71920] hover:bg-[#b8141a] text-white font-bold text-sm rounded-xl transition-all cursor-pointer tracking-wider shadow-md shadow-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {fpLoading ? "Verifying..." : "VERIFY CODE"}
                    </button>
                    <div className="flex items-center justify-between text-sm">
                      <button type="button" onClick={() => { setFpStep(1); setFpCode(""); setFpError(""); setFpSuccess(""); }} className="text-neutral-500 hover:text-neutral-700 cursor-pointer">
                        ← Change Email
                      </button>
                      <button
                        type="button"
                        onClick={handleFpResend}
                        disabled={fpResendCooldown > 0 || fpLoading}
                        className={`font-semibold cursor-pointer ${fpResendCooldown > 0 ? 'text-neutral-400 cursor-not-allowed' : 'text-[#D71920] hover:text-[#b8141a]'}`}
                      >
                        {fpResendCooldown > 0 ? `Resend in ${fpResendCooldown}s` : <span className="flex items-center gap-1"><RefreshCw size={13} /> Resend Code</span>}
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP 3: New Password */}
                {fpStep === 3 && (
                  <form onSubmit={handleFpResetPassword} className="space-y-5">
                    <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30 rounded-xl flex items-center gap-3">
                      <ShieldCheck size={20} className="text-green-600 flex-shrink-0" />
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Code verified! Now set your new password.
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">New Password</label>
                      <div className="relative">
                        <input
                          type={showFpPassword ? "text" : "password"}
                          placeholder="Min. 8 characters, uppercase & number"
                          required
                          value={fpNewPassword}
                          onChange={(e) => setFpNewPassword(e.target.value)}
                          className="w-full px-4 py-2.5 pr-12 border border-neutral-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white text-sm rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 outline-none transition-all"
                        />
                        <button type="button" onClick={() => setShowFpPassword(!showFpPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer">
                          {showFpPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {fpNewPassword && (() => {
                        const { score, label, color } = getPasswordStrength(fpNewPassword);
                        return (
                          <div className="mt-2">
                            <div className="flex gap-1 mb-1">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-1 flex-1 rounded-full transition-all" style={{ backgroundColor: i <= score ? color : '#e5e7eb' }} />
                              ))}
                            </div>
                            <p className="text-xs font-semibold" style={{ color }}>{label}</p>
                          </div>
                        );
                      })()}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Confirm Password</label>
                      <div className="relative">
                        <input
                          type={showFpConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your new password"
                          required
                          value={fpConfirmPassword}
                          onChange={(e) => setFpConfirmPassword(e.target.value)}
                          className={`w-full px-4 py-2.5 pr-12 border text-sm rounded-xl focus:ring-2 outline-none transition-all dark:bg-slate-950 dark:text-white ${
                            fpConfirmPassword && fpNewPassword !== fpConfirmPassword
                              ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                              : fpConfirmPassword && fpNewPassword === fpConfirmPassword
                              ? 'border-green-400 focus:border-green-400 focus:ring-green-400/20'
                              : 'border-neutral-300 dark:border-slate-700 focus:border-[#D71920] focus:ring-[#D71920]/20'
                          }`}
                        />
                        <button type="button" onClick={() => setShowFpConfirmPassword(!showFpConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer">
                          {showFpConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {fpConfirmPassword && fpNewPassword !== fpConfirmPassword && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} /> Passwords do not match</p>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={fpLoading}
                      className="w-full py-3 bg-[#D71920] hover:bg-[#b8141a] text-white font-bold text-sm rounded-xl transition-all cursor-pointer tracking-wider shadow-md shadow-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {fpLoading ? "Resetting..." : "RESET PASSWORD"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* TAB CONTENT: MANAGE ADDRESSES */}
            {activeTab === "addresses" && (
              <div>
                <h3 className="text-lg font-bold text-neutral-800 dark:text-white mb-6">Manage Addresses</h3>

                {/* ADD ADDRESS BUTTON/FORM */}
                {!isAddingAddress ? (
                  <button
                    onClick={() => {
                      setAddressForm({
                        name: "",
                        phone: "",
                        pincode: "",
                        locality: "",
                        addressText: "",
                        city: "",
                        state: "",
                        landmark: "",
                        alternatePhone: "",
                        addressType: "HOME",
                      });
                      setEditingAddressId(null);
                      setIsAddingAddress(true);
                    }}
                    className="w-full py-4 border-2 border-dashed border-neutral-200 dark:border-slate-800 flex items-center justify-start px-6 gap-3 text-[#D71920] hover:bg-red-50/10 font-bold transition-all cursor-pointer text-sm mb-6 bg-white dark:bg-slate-900 rounded-xl"
                  >
                    <Plus size={18} />
                    <span>ADD A NEW ADDRESS</span>
                  </button>
                ) : (
                  <form onSubmit={handleAddOrUpdateAddress} className="bg-neutral-50/50 dark:bg-slate-950 p-6 border border-neutral-200 dark:border-slate-800 rounded-2xl mb-6 text-left">
                    <p className="text-xs font-bold text-[#D71920] uppercase tracking-wider mb-4">
                      {editingAddressId ? "EDIT ADDRESS" : "ADD NEW ADDRESS"}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <input
                        type="text"
                        placeholder="Full Name"
                        required
                        value={addressForm.name}
                        onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                        className="w-full px-4 py-2.5 border border-neutral-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 outline-none transition-all"
                      />
                      <input
                        type="text"
                        placeholder="10-digit phone number"
                        required
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                        className="w-full px-4 py-2.5 border border-neutral-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 outline-none transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <input
                        type="text"
                        placeholder="Pincode"
                        required
                        value={addressForm.pincode}
                        onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                        className="w-full px-4 py-2.5 border border-neutral-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 outline-none transition-all"
                      />
                      <input
                        type="text"
                        placeholder="Locality"
                        required
                        value={addressForm.locality}
                        onChange={(e) => setAddressForm({ ...addressForm, locality: e.target.value })}
                        className="w-full px-4 py-2.5 border border-neutral-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 outline-none transition-all"
                      />
                    </div>
                    <div className="mb-4">
                      <textarea
                        placeholder="Address (Area and Street)"
                        required
                        rows={3}
                        value={addressForm.addressText}
                        onChange={(e) => setAddressForm({ ...addressForm, addressText: e.target.value })}
                        className="w-full px-4 py-2.5 border border-neutral-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 outline-none resize-none transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <input
                        type="text"
                        placeholder="City/District/Town"
                        required
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        className="w-full px-4 py-2.5 border border-neutral-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 outline-none transition-all"
                      />
                      <input
                        type="text"
                        placeholder="State"
                        required
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                        className="w-full px-4 py-2.5 border border-neutral-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 outline-none transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <input
                        type="text"
                        placeholder="Landmark (Optional)"
                        value={addressForm.landmark}
                        onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                        className="w-full px-4 py-2.5 border border-neutral-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 outline-none transition-all"
                      />
                      <input
                        type="text"
                        placeholder="Alternate Phone (Optional)"
                        value={addressForm.alternatePhone}
                        onChange={(e) => setAddressForm({ ...addressForm, alternatePhone: e.target.value })}
                        className="w-full px-4 py-2.5 border border-neutral-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 outline-none transition-all"
                      />
                    </div>

                    <div className="mb-6">
                      <p className="text-xs text-neutral-500 font-bold mb-2">Address Type</p>
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2.5 cursor-pointer text-sm text-neutral-700 dark:text-neutral-300">
                          <input
                            type="radio"
                            name="addressType"
                            checked={addressForm.addressType === "HOME"}
                            onChange={() => setAddressForm({ ...addressForm, addressType: "HOME" })}
                            className="w-4 h-4 accent-[#D71920] cursor-pointer"
                          />
                          <span>Home (All day delivery)</span>
                        </label>
                        <label className="flex items-center gap-2.5 cursor-pointer text-sm text-neutral-700 dark:text-neutral-300">
                          <input
                            type="radio"
                            name="addressType"
                            checked={addressForm.addressType === "WORK"}
                            onChange={() => setAddressForm({ ...addressForm, addressType: "WORK" })}
                            className="w-4 h-4 accent-[#D71920] cursor-pointer"
                          />
                          <span>Work (Delivery between 10 AM - 5 PM)</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-[#D71920] hover:bg-[#b8141a] text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-md shadow-red-500/10"
                      >
                        SAVE
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingAddress(false);
                          setEditingAddressId(null);
                        }}
                        className="px-6 py-2.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-slate-800 font-bold text-sm rounded-xl transition-colors cursor-pointer"
                      >
                        CANCEL
                      </button>
                    </div>
                  </form>
                )}

                {/* ADDRESS LIST */}
                <div className="space-y-4">
                  {addresses.length === 0 ? (
                    <p className="text-sm text-neutral-500 py-6 text-center">No addresses saved yet.</p>
                  ) : (
                    addresses.map((addr) => (
                      <div key={addr.id} className="border border-neutral-150 dark:border-slate-800/80 p-6 bg-white dark:bg-slate-900 rounded-2xl relative text-left">

                        <div className="flex items-center gap-2.5 mb-2">
                          <span className="text-[9px] font-extrabold bg-red-50 dark:bg-red-950/20 text-[#D71920] px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {addr.addressType}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 mb-2">
                          <p className="text-sm font-extrabold text-neutral-800 dark:text-white">{addr.name}</p>
                          <p className="text-sm font-extrabold text-neutral-800 dark:text-white">{addr.phone}</p>
                        </div>

                        <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-xl pr-6 leading-relaxed">
                          {addr.addressText}, {addr.city}, {addr.state} - <span className="font-extrabold text-neutral-800 dark:text-white">{addr.pincode}</span>
                          {addr.landmark && `, Landmark: ${addr.landmark}`}
                        </p>

                        {/* Three-dots Menu Option */}
                        <div className="absolute right-4 top-4">
                          <button
                            onClick={() => setActiveAddressMenu(activeAddressMenu === addr.id ? null : addr.id)}
                            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-full cursor-pointer text-neutral-500"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {activeAddressMenu === addr.id && (
                            <div className="absolute right-0 mt-1 w-28 bg-white dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 shadow-xl rounded-xl z-10 py-1 overflow-hidden">
                              <button
                                onClick={() => handleEditAddressClick(addr)}
                                className="w-full px-4 py-2 text-left text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-slate-900 flex items-center gap-2 cursor-pointer"
                              >
                                <Edit3 size={12} />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteAddress(addr.id)}
                                className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-neutral-50 dark:hover:bg-slate-900 flex items-center gap-2 cursor-pointer"
                              >
                                <Trash2 size={12} />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>

                      </div>
                    ))
                  )}
                </div>

              </div>
            )}

            {/* TAB CONTENT: PAN CARD INFORMATION */}
            {activeTab === "pan" && (
              <div>
                <h3 className="text-lg font-bold text-neutral-800 dark:text-white mb-6">PAN Card Information</h3>

                <form onSubmit={handlePanUpload} className="max-w-xl text-left space-y-6">
                  {panStatus === "UPLOADED" && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-3">
                      <CheckCircle size={18} className="text-green-600" />
                      <div>
                        <p className="font-bold">PAN Card details submitted!</p>
                        <p className="text-xs text-green-600 mt-0.5">Verification is currently pending approval.</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">PAN Card Number</label>
                    <input
                      type="text"
                      placeholder="ABCDE1234F"
                      required
                      maxLength={10}
                      disabled={panStatus === "UPLOADED"}
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                      className="w-full max-w-sm px-4 py-2.5 border border-neutral-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white text-sm rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 outline-none uppercase font-mono transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Full Name</label>
                    <input
                      type="text"
                      placeholder="As per PAN Card"
                      required
                      disabled={panStatus === "UPLOADED"}
                      value={panFullName}
                      onChange={(e) => setPanFullName(e.target.value)}
                      className="w-full max-w-sm px-4 py-2.5 border border-neutral-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white text-sm rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                      Upload PAN Card (Only JPEG file is allowed)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept=".jpg,.jpeg"
                        disabled={panStatus === "UPLOADED"}
                        onChange={handlePanFileChange}
                        className="hidden"
                        id="pan-file-picker"
                      />
                      <label
                        htmlFor="pan-file-picker"
                        className={`px-5 py-2.5 border border-neutral-300 dark:border-slate-700 rounded-xl text-sm font-semibold transition-all cursor-pointer ${panStatus === "UPLOADED"
                          ? "bg-neutral-100 dark:bg-slate-850 text-neutral-400 cursor-not-allowed"
                          : "bg-white dark:bg-slate-900 hover:bg-neutral-50 hover:border-[#D71920] text-neutral-700 dark:text-neutral-300"
                          }`}
                      >
                        Choose File
                      </label>
                      <span className="text-xs text-neutral-500 font-mono">
                        {panUploadedFile || "No file chosen"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 max-w-lg">
                    <input
                      type="checkbox"
                      id="pan-declare-checkbox"
                      disabled={panStatus === "UPLOADED"}
                      checked={panDeclared}
                      onChange={(e) => setPanDeclared(e.target.checked)}
                      className="w-4 h-4 mt-0.5 accent-[#D71920] cursor-pointer"
                    />
                    <label htmlFor="pan-declare-checkbox" className="text-xs text-neutral-500 leading-relaxed cursor-pointer select-none">
                      I do hereby declare that the PAN details submitted above belong to me and are accurate. I accept sole responsibility for the validity of these credentials as part of my account verification for SD Smart Appliances.
                    </label>
                  </div>

                  {panStatus !== "UPLOADED" && (
                    <button
                      type="submit"
                      className="px-8 py-2.5 bg-[#D71920] hover:bg-[#b8141a] text-white font-bold text-sm rounded-xl transition-all cursor-pointer tracking-wider shadow-md shadow-red-500/10"
                    >
                      UPLOAD
                    </button>
                  )}
                </form>

                <div className="mt-8 border-t border-neutral-100 dark:border-slate-800 pt-6">
                  <button
                    onClick={() => alert("Redirecting to Terms & Conditions...")}
                    className="text-xs font-semibold text-[#D71920] hover:underline cursor-pointer"
                  >
                    Read Terms & Conditions of PAN Card Verification
                  </button>
                </div>

              </div>
            )}

            {/* TAB CONTENT: MY ORDERS */}
            {activeTab === "orders" && (
              <div>
                <h3 className="text-lg font-bold text-neutral-800 dark:text-white mb-6">My Orders</h3>
                <div className="space-y-4">
                  {ordersLoading ? (
                    <div className="py-12 flex justify-center">
                      <div className="w-8 h-8 border-4 border-[#D71920]/25 border-t-[#D71920] rounded-full animate-spin"></div>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-16 space-y-4">
                      <div className="w-16 h-16 bg-neutral-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-neutral-400">
                        <Package size={28} />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-neutral-800 dark:text-white">No Orders Found</h4>
                        <p className="text-sm text-neutral-500 mt-1">You haven't placed any orders yet.</p>
                      </div>
                    </div>
                  ) : (
                    orders.map(order => (
                      <div key={order.id} className="border border-neutral-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
                        <div className="flex gap-4">
                          <div className="w-16 h-16 bg-neutral-100 dark:bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Package size={28} className="text-neutral-400" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-neutral-800 dark:text-white">Order: {order.orderNumber}</p>
                            <p className="text-xs text-neutral-500 mt-1">{order.items.length} Product{order.items.length > 1 ? 's' : ''}</p>
                            <p className="text-xs text-neutral-500">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-left sm:text-right flex flex-col sm:items-end w-full sm:w-auto">
                          {!isDistributor && (
                            <p className="text-sm font-bold text-neutral-800 dark:text-white mb-1">₹{order.grandTotal.toLocaleString()}</p>
                          )}
                          <p className="text-xs text-neutral-600 font-bold mb-3 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block animate-pulse"></span>
                            Status: {order.status}
                          </p>
                          <button 
                            onClick={() => router.push(`/account/orders/${order.id}`)}
                            className="text-xs font-bold bg-[#1C1C1C] hover:bg-black text-white px-4 py-2 rounded-lg transition-colors w-full sm:w-auto text-center"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: DISTRIBUTOR SECTION */}
            {activeTab === "distributor" && (
              <div>
                <h3 className="text-lg font-bold text-neutral-800 dark:text-white mb-6">
                  {user?.role === "distributor" ? "Distributor Profile Details" : "Become an Authorized Distributor"}
                </h3>
                
                {user?.role === "distributor" ? (
                  <div className="border border-neutral-200 dark:border-slate-800 p-6 md:p-8 bg-white dark:bg-slate-900 rounded-2xl text-left space-y-6">
                    <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 rounded-2xl">
                      <span className="h-2 w-2 rounded-full bg-green-500 animate-ping"></span>
                      <span className="text-xs font-bold uppercase tracking-wider">Active Distributor Channel Status</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      <div className="space-y-1">
                        <span className="text-xs text-neutral-400 uppercase font-bold tracking-wider">Business Name</span>
                        <p className="font-bold text-neutral-800 dark:text-white text-base">{user.companyName || "N/A"}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-neutral-400 uppercase font-bold tracking-wider">GSTIN Number</span>
                        <p className="font-bold text-neutral-800 dark:text-white text-base font-mono">{user.gstin || "N/A"}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-neutral-400 uppercase font-bold tracking-wider">Distributor Code</span>
                        <p className="font-bold text-[#D71920] text-base font-mono">DIST-{user.id.substring(0, 8).toUpperCase()}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-neutral-400 uppercase font-bold tracking-wider">Registered Email</span>
                        <p className="font-bold text-neutral-800 dark:text-white text-base">{user.email}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-neutral-100 dark:border-slate-800 text-xs text-neutral-500 leading-relaxed">
                      Your business details are synchronized with the tax invoice generation engine. To request modifications to your verified corporate details, please contact billing support.
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleConvertToDistributor} className="border border-neutral-200 dark:border-slate-800 p-6 md:p-8 bg-white dark:bg-slate-900 rounded-2xl text-left space-y-6">
                    <p className="text-sm text-neutral-500 mb-4 leading-relaxed">
                      Register your business details to convert your account to a B2B distributor. Once approved, all invoices will contain your company name and GSTIN dynamically.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Business Name */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Business/Company Name</label>
                        <input
                          type="text"
                          required
                          value={distCompany}
                          onChange={(e) => setDistCompany(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#D71920] text-sm font-semibold"
                          placeholder="e.g. Kongu Engineering College"
                        />
                      </div>

                      {/* GSTIN */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">GSTIN Number</label>
                        <input
                          type="text"
                          required
                          value={distGstin}
                          onChange={(e) => setDistGstin(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#D71920] text-sm font-semibold font-mono"
                          placeholder="e.g. 29BBBBB2222B2Z2"
                        />
                      </div>

                      {/* Mobile */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Mobile Number</label>
                        <input
                          type="text"
                          required
                          value={distMobile}
                          onChange={(e) => setDistMobile(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#D71920] text-sm font-semibold"
                          placeholder="e.g. 09789636896"
                        />
                      </div>

                      {/* Address Line 1 */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Address Line 1</label>
                        <input
                          type="text"
                          required
                          value={distAddress1}
                          onChange={(e) => setDistAddress1(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#D71920] text-sm font-semibold"
                          placeholder="e.g. 456, Arumaikarar Thottam"
                        />
                      </div>

                      {/* Address Line 2 */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Address Line 2</label>
                        <input
                          type="text"
                          value={distAddress2}
                          onChange={(e) => setDistAddress2(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#D71920] text-sm font-semibold"
                          placeholder="e.g. Kongarpalayam"
                        />
                      </div>

                      {/* City */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">City</label>
                        <input
                          type="text"
                          required
                          value={distCity}
                          onChange={(e) => setDistCity(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#D71920] text-sm font-semibold"
                          placeholder="e.g. Erode"
                        />
                      </div>

                      {/* State */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">State</label>
                        <input
                          type="text"
                          required
                          value={distState}
                          onChange={(e) => setDistState(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#D71920] text-sm font-semibold"
                          placeholder="e.g. Tamil Nadu"
                        />
                      </div>

                      {/* Pincode */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Pincode</label>
                        <input
                          type="text"
                          required
                          value={distPincode}
                          onChange={(e) => setDistPincode(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#D71920] text-sm font-semibold"
                          placeholder="e.g. 638506"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        disabled={converting}
                        className="px-6 py-3 bg-[#D71920] hover:bg-[#b8141a] disabled:bg-neutral-600 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-red-500/25 flex items-center gap-2 cursor-pointer"
                      >
                        {converting ? "Converting Channel..." : "Convert To Distributor"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB CONTENT: MY WISHLIST */}
            {activeTab === "wishlist" && (
              <div>
                <h3 className="text-lg font-bold text-neutral-800 dark:text-white mb-6">My Wishlist</h3>
                <div className="space-y-4">
                  <div className="border border-neutral-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 rounded-2xl flex justify-between items-center text-left">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-neutral-100 dark:bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FolderHeart size={28} className="text-[#D71920]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-neutral-800 dark:text-white">SD Smart Commercial Pressure Cooker (20L)</p>
                        <p className="text-xs text-neutral-500 mt-1">Rating: 4.8 ★</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-bold text-neutral-800 dark:text-white">₹7,999</span>
                          <span className="text-xs text-neutral-400 line-through">₹9,999</span>
                          <span className="text-xs text-green-600 font-bold">20% off</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => alert("Added to cart!")}
                      className="px-4 py-2 bg-[#D71920] hover:bg-[#b8141a] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-md shadow-red-500/10"
                    >
                      ADD TO CART
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: OTHER PLACEHOLDERS */}
            {["gift_cards", "saved_upi", "saved_cards", "coupons", "reviews", "notifications"].includes(activeTab) && (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 bg-neutral-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-neutral-400">
                  {activeTab.includes("card") || activeTab.includes("upi") ? <CreditCard size={28} /> : <Settings size={28} />}
                </div>
                <div>
                  <h4 className="text-base font-bold text-neutral-800 dark:text-white capitalize">
                    {activeTab.replace("_", " ")}
                  </h4>
                  <p className="text-sm text-neutral-500 mt-1 max-w-sm mx-auto">
                    You have no active {activeTab.replace("_", " ")} at this time. Check back later for promotional offers or saved credentials.
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>
      </main>

      <Footer footerColumns={footerColumns} socialLinks={socialLinks} />
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 font-sans">
        <div className="w-12 h-12 border-4 border-[#D71920]/25 border-t-[#D71920] rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-semibold text-neutral-500 tracking-wider">Loading Account...</p>
      </div>
    }>
      <AccountPageContent />
    </Suspense>
  );
}
