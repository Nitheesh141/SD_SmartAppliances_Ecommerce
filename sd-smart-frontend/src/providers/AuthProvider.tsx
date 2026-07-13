"use client";
import { ENV } from "@/config/env";

import React, { createContext, useContext, useState, useEffect } from "react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string | null;
  firstName?: string;
  lastName?: string;
  role?: string;
  companyName?: string | null;
  gstin?: string | null;
  approvalStatus?: string | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  loading: boolean;
  login: (emailOrPhone: string, password: string) => Promise<void>;
  signup: (email: string, password: string, firstName: string, lastName: string, phoneNumber?: string) => Promise<void>;
  adminSignup: (email: string, password: string, firstName: string, lastName: string, phoneNumber?: string) => Promise<void>;
  distributorSignup: (distributorData: any) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  sendOtp: (phone: string) => Promise<void>;
  loginWithOtp: (phone: string, code: string) => Promise<void>;
  updateProfile: (firstName: string, lastName: string, email: string, phoneNumber?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [didInit, setDidInit] = useState(false);

  // Patch global fetch to log detailed error status and URLs across all files
  useEffect(() => {
    if (typeof window !== "undefined" && !(window as any).fetchPatched) {
      const originalFetch = window.fetch;
      window.fetch = async function (...args) {
        try {
          const response = await originalFetch(...args);
          if (!response.ok) {
            console.error(`API Error: Fetch failed with status ${response.status} (${response.statusText || "Error"}) for URL: ${response.url}`);
          }
          return response;
        } catch (error: any) {
          console.error(`API Network Error: Failed to fetch URL: ${args[0]}. Error: ${error.message || error}`);
          throw error;
        }
      };
      (window as any).fetchPatched = true;
    }
  }, []);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (token) {
          const response = await fetch(`${ENV.API_BASE_URL}/auth/me`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            setIsAuthenticated(true);
            localStorage.setItem("userProfile", JSON.stringify(data.user));
          } else {
            console.error(`Auth check failed: Server returned status ${response.status} (${response.statusText || "Error"})`);
            // Token is invalid/expired, clear auth state
            localStorage.removeItem("authToken");
            localStorage.removeItem("userProfile");
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (error: any) {
        console.error("Auth check failed (Network Error):", error.message);
      } finally {
        setLoading(false);
        setDidInit(true);
      }
    };

    checkAuth();
  }, []);

  const login = async (emailOrPhone: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${ENV.API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: emailOrPhone, password }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Login failed");
      }

      const data = await response.json();
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userProfile", JSON.stringify(data.user));
      setUser(data.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, firstName: string, lastName: string, phoneNumber?: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${ENV.API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstName, lastName, phoneNumber }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Signup failed");
      }

      const data = await response.json();
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userProfile", JSON.stringify(data.user));
      setUser(data.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const adminSignup = async (email: string, password: string, firstName: string, lastName: string, phoneNumber?: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${ENV.API_BASE_URL}/auth/admin/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstName, lastName, phoneNumber }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Admin signup failed");
      }

      const data = await response.json();
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userProfile", JSON.stringify(data.user));
      setUser(data.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Admin signup error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const distributorSignup = async (distributorData: any) => {
    setLoading(true);
    try {
      const response = await fetch(`${ENV.API_BASE_URL}/auth/distributor/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(distributorData),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Distributor registration failed");
      }

      const data = await response.json();
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userProfile", JSON.stringify(data.user));
      setUser(data.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Distributor signup error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userProfile");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("adminLandingBypass");
    }
    setUser(null);
    setIsAuthenticated(false);
  };

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    try {
      const response = await fetch(`${ENV.API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });

      if (!response.ok) throw new Error("Password reset failed");
    } catch (error) {
      console.error("Password reset error:", error);
      throw error;
    }
  };

  const sendOtp = async (phone: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${ENV.API_BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Send OTP error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithOtp = async (phone: string, code: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${ENV.API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to verify OTP");
      }

      const data = await response.json();
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userProfile", JSON.stringify(data.user));
      setUser(data.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("OTP login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (firstName: string, lastName: string, email: string, phoneNumber?: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${ENV.API_BASE_URL}/auth/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ firstName, lastName, email, phoneNumber }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to update profile");
      }

      const data = await response.json();
      localStorage.setItem("userProfile", JSON.stringify(data.user));
      setUser(data.user);
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sync user profile state with cookies for Server-Side routing
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (user) {
        document.cookie = `userProfile=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=86400; SameSite=Lax`;
      } else if (didInit) {
        document.cookie = "userProfile=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
        document.cookie = "adminLandingBypass=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      }
    }
  }, [user, didInit]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        login,
        signup,
        adminSignup,
        distributorSignup,
        logout,
        resetPassword,
        sendOtp,
        loginWithOtp,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
