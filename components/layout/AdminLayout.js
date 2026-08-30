"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { ShieldAlert, RefreshCw } from "lucide-react";

export function AdminLayout({ children, requiredPermission = null }) {
  const { user, loading, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--bg-primary)",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid var(--border-primary)",
            borderTopColor: "var(--primary)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Loading permissions & workspace...</span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // If a specific permission is required for this page and user lacks it:
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
        <AdminSidebar />
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <AdminHeader />
          <main style={{ padding: "40px 32px", display: "flex", justifyContent: "center" }}>
            <div
              className="glass-panel"
              style={{
                maxWidth: "600px",
                width: "100%",
                padding: "36px",
                textAlign: "center",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                backgroundColor: "rgba(239, 68, 68, 0.04)",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "var(--danger-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 18px",
                  color: "var(--danger)",
                }}
              >
                <ShieldAlert size={30} />
              </div>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "8px", color: "#ffffff" }}>
                Access Restricted
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "20px" }}>
                Your current role (<strong>{user.roles?.map((r) => r.name).join(", ")}</strong>) does not have the required permission <code style={{ color: "var(--danger)", background: "rgba(0,0,0,0.4)", padding: "2px 6px", borderRadius: "4px" }}>{requiredPermission}</code> to access this module.
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <button onClick={() => router.push("/admin")} className="btn btn-secondary">
                  Back to Dashboard
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
      <AdminSidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <AdminHeader />
        <main style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
