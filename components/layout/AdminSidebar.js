"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Package,
  FolderTree,
  Tag,
  SlidersHorizontal,
  ShoppingCart,
  Truck,
  Store,
  Boxes,
  Lock,
  ChevronRight,
} from "lucide-react";

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, hasPermission } = useAuth();

  const navGroups = [
    {
      title: "Core",
      items: [
        {
          label: "Dashboard",
          href: "/admin",
          icon: LayoutDashboard,
          requiredPermission: null, // Open to all authenticated users
        },
      ],
    },
    {
      title: "Access Control",
      items: [
        {
          label: "Users Management",
          href: "/admin/users",
          icon: Users,
          requiredPermission: "users.view",
        },
        {
          label: "Roles & Permissions",
          href: "/admin/roles",
          icon: ShieldCheck,
          requiredPermission: "roles.view",
        },
      ],
    },
    {
      title: "Product Catalog",
      items: [
        {
          label: "Products & SKUs",
          href: "/admin/products",
          icon: Package,
          requiredPermission: "products.view",
        },
        {
          label: "Categories",
          href: "/admin/categories",
          icon: FolderTree,
          requiredPermission: "categories.view",
        },
        {
          label: "Brands",
          href: "/admin/brands",
          icon: Tag,
          requiredPermission: "brands.view",
        },
        {
          label: "Attributes & Values",
          href: "/admin/attributes",
          icon: SlidersHorizontal,
          requiredPermission: "attributes.view",
        },
      ],
    },
    {
      title: "Sales & Fulfillment",
      items: [
        {
          label: "Orders",
          href: "/admin/orders",
          icon: ShoppingCart,
          requiredPermission: "orders.view",
        },
      ],
    },
    {
      title: "Partners & Inventory",
      items: [
        {
          label: "Distributors",
          href: "/admin/distributors",
          icon: Truck,
          requiredPermission: "distributors.view",
        },
        {
          label: "Dealers",
          href: "/admin/dealers",
          icon: Store,
          requiredPermission: "dealers.view",
        },
        {
          label: "Dealer Inventory",
          href: "/admin/dealer-inventory",
          icon: Boxes,
          requiredPermission: "dealer_inventory.view",
        },
      ],
    },
  ];

  return (
    <aside
      style={{
        width: "var(--sidebar-width)",
        backgroundColor: "#0d131f",
        borderRight: "1px solid var(--border-primary)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        zIndex: 40,
        overflowY: "auto",
      }}
    >
      {/* Brand Logo */}
      <div
        style={{
          height: "var(--header-height)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "0 24px",
          borderBottom: "1px solid var(--border-primary)",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 15px rgba(99, 102, 241, 0.4)",
          }}
        >
          <Lock size={20} color="#ffffff" />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: "1.05rem", letterSpacing: "-0.02em", color: "#ffffff" }}>
            OmniCommerce
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--primary)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            RBAC Platform
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <div style={{ padding: "16px 12px", flex: 1 }}>
        {navGroups.map((group, gIdx) => {
          // Filter visible items based on user permissions
          const visibleItems = group.items.filter(
            (item) => !item.requiredPermission || hasPermission(item.requiredPermission)
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={gIdx} style={{ marginBottom: "20px" }}>
              <div
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--text-muted)",
                  padding: "6px 12px",
                  marginBottom: "4px",
                }}
              >
                {group.title}
              </div>

              {visibleItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: "var(--radius-md)",
                      marginBottom: "3px",
                      fontSize: "0.875rem",
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? "#ffffff" : "var(--text-secondary)",
                      backgroundColor: isActive ? "rgba(99, 102, 241, 0.15)" : "transparent",
                      border: isActive ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid transparent",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Icon
                        size={18}
                        color={isActive ? "var(--primary)" : "var(--text-secondary)"}
                      />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight size={14} color="var(--primary)" />}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* User Role Card in Footer */}
      {user && (
        <div
          style={{
            padding: "14px",
            margin: "12px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "rgba(17, 24, 39, 0.8)",
            border: "1px solid var(--border-primary)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                backgroundColor: "var(--primary-light)",
                border: "1px solid var(--border-highlight)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                color: "var(--primary)",
                fontSize: "0.85rem",
                overflow: "hidden",
              }}
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                user.name?.charAt(0) || "U"
              )}
            </div>
            <div style={{ overflow: "hidden", flex: 1 }}>
              <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.name}
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.roles?.map((r) => r.name).join(", ") || "User"}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
