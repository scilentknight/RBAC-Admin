"use client";

import React, { useState } from "react";
import { useAuth, PRESET_TEST_USERS } from "@/context/AuthContext";
import { Lock, Mail, Key, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@omnicommerce.com");
  const [password, setPassword] = useState("Admin@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await login(email, password);
    if (!res.success) {
      setError(res.error || "Failed to sign in");
      setLoading(false);
    }
  };

  const handleQuickLogin = (presetEmail, presetPass = "Admin@123") => {
    setEmail(presetEmail);
    // Find default password
    let p = "Admin@123";
    if (presetEmail.includes("manager")) p = "Manager@123";
    if (presetEmail.includes("catalog")) p = "Catalog@123";
    if (presetEmail.includes("orders")) p = "Orders@123";
    if (presetEmail.includes("partner")) p = "Partner@123";
    if (presetEmail.includes("dealer")) p = "Dealer@123";
    setPassword(p);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#080c14",
        backgroundImage: `
          radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.15) 0%, transparent 40%),
          radial-gradient(circle at 80% 70%, rgba(168, 85, 247, 0.12) 0%, transparent 45%)
        `,
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1020px",
          display: "grid",
          gridTemplateColumns: "1fr 1.15fr",
          borderRadius: "var(--radius-xl)",
          overflow: "hidden",
          border: "1px solid var(--border-highlight)",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.8)",
          backgroundColor: "#0d131f",
        }}
      >
        {/* Left column: Login Form */}
        <div style={{ padding: "44px 38px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {/* Logo & Headline */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "28px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 15px rgba(99, 102, 241, 0.4)",
              }}
            >
              <Lock size={22} color="#ffffff" />
            </div>
            <div>
              <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>
                OmniCommerce
              </h1>
              <span style={{ fontSize: "0.72rem", color: "var(--primary)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                RBAC Administration
              </span>
            </div>
          </div>

          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>
            Admin Portal Sign In
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "24px" }}>
            Enter your credentials or pick a demo role persona to test granular RBAC authorization.
          </p>

          {error && (
            <div
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#fca5a5",
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                fontSize: "0.85rem",
                marginBottom: "20px",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: "relative" }}>
                <input
                  type="email"
                  className="form-input"
                  style={{ width: "100%", paddingLeft: "38px" }}
                  placeholder="admin@omnicommerce.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Mail
                  size={16}
                  style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "24px" }}>
              <label className="form-label">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type="password"
                  className="form-input"
                  style={{ width: "100%", paddingLeft: "38px" }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Key
                  size={16}
                  style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: "100%", padding: "12px" }}
            >
              {loading ? "Authenticating..." : "Sign In to Admin"}
              <ArrowRight size={16} />
            </button>
          </form>
        </div>

        {/* Right column: Pre-configured Test Personas */}
        <div
          style={{
            backgroundColor: "rgba(17, 24, 39, 0.95)",
            borderLeft: "1px solid var(--border-primary)",
            padding: "36px 32px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Sparkles size={18} color="var(--primary)" />
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#ffffff" }}>
                Quick Test Personas
              </h3>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "18px" }}>
              Click any role persona to auto-populate credentials and test server-side permission enforcement:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {PRESET_TEST_USERS.map((preset) => {
                const isSelected = email === preset.email;
                return (
                  <div
                    key={preset.email}
                    onClick={() => handleQuickLogin(preset.email)}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: isSelected ? "rgba(99, 102, 241, 0.15)" : "rgba(31, 41, 55, 0.6)",
                      border: isSelected ? "1px solid var(--primary)" : "1px solid var(--border-primary)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: preset.color,
                          }}
                        />
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
                          {preset.role}
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>({preset.name})</span>
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                        {preset.description}
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: "0.72rem",
                        padding: "3px 8px",
                        backgroundColor: isSelected ? "var(--primary)" : "rgba(255, 255, 255, 0.08)",
                        color: isSelected ? "#ffffff" : "var(--text-secondary)",
                        borderRadius: "var(--radius-sm)",
                        fontWeight: 600,
                      }}
                    >
                      Use
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              paddingTop: "18px",
              borderTop: "1px solid var(--border-primary)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "0.75rem",
              color: "var(--text-muted)",
            }}
          >
            <ShieldCheck size={16} color="var(--success)" />
            <span>Encrypted Session Cookies • Server-side RBAC Route Guards</span>
          </div>
        </div>
      </div>
    </div>
  );
}
