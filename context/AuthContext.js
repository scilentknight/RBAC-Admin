"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

const AuthContext = createContext(null);

export const PRESET_TEST_USERS = [
  {
    role: "Super Admin",
    name: "Alex Sterling",
    email: "admin@omnicommerce.com",
    badge: "Super Admin",
    description: "Full system access to all modules & settings",
    color: "#6366f1",
  },
  {
    role: "Store Manager",
    name: "Marcus Vance",
    email: "manager@omnicommerce.com",
    badge: "Store Manager",
    description: "Catalog, orders, inventory, categories, brands",
    color: "#10b981",
  },
  {
    role: "Catalog Editor",
    name: "Elena Rostova",
    email: "catalog@omnicommerce.com",
    badge: "Catalog Editor",
    description: "Products, variations, categories, brands, attributes",
    color: "#3b82f6",
  },
  {
    role: "Order Specialist",
    name: "David Kim",
    email: "orders@omnicommerce.com",
    badge: "Order Specialist",
    description: "Orders view, edit status, cancel, export",
    color: "#f59e0b",
  },
  {
    role: "Partner Manager",
    name: "Rachel Green",
    email: "partner@omnicommerce.com",
    badge: "Partner Manager",
    description: "Distributors & applications, dealers, dealer inventory",
    color: "#ec4899",
  },
  {
    role: "Dealer Staff",
    name: "Leo Hayes",
    email: "dealer.staff@omnicommerce.com",
    badge: "Dealer Staff",
    description: "Assigned dealer stock view & update only",
    color: "#8b5cf6",
  },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.success && data.user) {
      setUser(data.user);
      router.push("/admin");
      return { success: true };
    }
    return { success: false, error: data.error || "Login failed" };
  };

  const switchRole = async (email) => {
    try {
      const res = await fetch("/api/auth/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        // Refresh the page data for the new role permissions
        router.refresh();
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: "Role switch failed" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
    } catch (err) {
      router.push("/login");
    }
  };

  const hasPermission = useCallback(
    (permissionKey) => {
      if (!user || !Array.isArray(user.permissions)) return false;
      return user.permissions.includes(permissionKey);
    },
    [user]
  );

  const hasAnyPermission = useCallback(
    (permissionKeys = []) => {
      if (!user || !Array.isArray(user.permissions)) return false;
      return permissionKeys.some((pk) => user.permissions.includes(pk));
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        switchRole,
        hasPermission,
        hasAnyPermission,
        refreshUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
