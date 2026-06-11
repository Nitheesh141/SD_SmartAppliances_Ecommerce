"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount (from localStorage or API)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (token) {
          // TODO: Validate token with backend
          const userData = localStorage.getItem("userProfile");
          if (userData) {
            setUser(JSON.parse(userData));
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) throw new Error("Login failed");

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

  const signup = async (email: string, password: string, firstName: string, lastName: string) => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const response = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });

      if (!response.ok) throw new Error("Signup failed");

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

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userProfile");
    setUser(null);
    setIsAuthenticated(false);
  };

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch("http://localhost:5000/api/auth/reset-password", {
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

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, signup, logout, resetPassword }}>
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
