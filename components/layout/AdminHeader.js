"use client";

import React, { useState } from "react";
import { useAuth, PRESET_TEST_USERS } from "@/context/AuthContext";
import { LogOut, Shield, ChevronDown, Check, UserCheck, KeyRound } from "lucide-react";

export function AdminHeader() {
  const { user, logout, switchRole } = useAuth();
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const handleRoleSwitch = async (email) => {
    setSwitching(true);
    await switchRole(email);
    setSwitching(false);
    setRoleSwitcherOpen(false);
  };

  const currentRole = user?.roles?.[0]?.name || "Authenticated User";

  return (
    <header
      style={{
        height: "var(--header-height)",
        backgroundColor: "rgba(13, 19, 31, 0.8)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Left side: System status badge & active context */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "5px 12px",
            backgroundColor: "rgba(99, 102, 241, 0.1)",
            border: "1px solid rgba(99, 102, 241, 0.25)",
            borderRadius: "var(--radius-full)",
            fontSize: "0.78rem",
            fontWeight: 600,
            color: "var(--primary)",
          }}
        >
          <Shield size={14} />
          <span>Active Role: <strong>{currentRole}</strong></span>
          <span
            style={{
              padding: "1px 6px",
              backgroundColor: "var(--primary)",
              color: "#ffffff",
              borderRadius: "10px",
              fontSize: "0.6875rem",
              marginLeft: "4px",
            }}
          >
            {user?.permissions?.length || 0} Perms
          </span>
        </div>
      </div>

      {/* Right side: Quick Role Switcher + Logout */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {/* Test Role Switcher Popover */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
            className="btn btn-secondary btn-sm"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(31, 41, 55, 0.8)",
              borderColor: "var(--border-highlight)",
            }}
          >
            <UserCheck size={16} color="var(--primary)" />
            <span>Switch Test Persona</span>
            <ChevronDown size={14} />
          </button>

          {roleSwitcherOpen && (
            <div
              className="glass-panel animate-fade-in"
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: "320px",
                backgroundColor: "#111827",
                border: "1px solid var(--border-highlight)",
                boxShadow: "var(--shadow-xl)",
                padding: "8px",
                zIndex: 100,
              }}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  padding: "8px 12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  borderBottom: "1px solid var(--border-primary)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <KeyRound size={13} />
                <span>Instant RBAC Role Switcher</span>
              </div>

              <div style={{ maxHeight: "360px", overflowY: "auto", padding: "4px 0" }}>
                {PRESET_TEST_USERS.map((preset) => {
                  const isCurrent = user?.email === preset.email;
                  return (
                    <button
                      key={preset.email}
                      onClick={() => handleRoleSwitch(preset.email)}
                      disabled={switching}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        padding: "10px 12px",
                        borderRadius: "var(--radius-sm)",
                        border: "none",
                        backgroundColor: isCurrent ? "rgba(99, 102, 241, 0.15)" : "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isCurrent) e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isCurrent) e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              backgroundColor: preset.color,
                            }}
                          />
                          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                            {preset.role}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                          {preset.description}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "1px" }}>
                          {preset.email}
                        </div>
                      </div>
                      {isCurrent && <Check size={16} color="var(--primary)" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Logout button */}
        <button
          onClick={logout}
          className="btn btn-secondary btn-sm"
          title="Sign out of administration"
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
