"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/common/Badge";
import Link from "next/link";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  AlertTriangle,
  FileCheck,
  Store,
  Layers,
  ArrowRight,
  TrendingUp,
  Shield,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/admin/dashboard");
        const json = await res.json();
        if (json.success) {
          setData(json.dashboard);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const modules = data?.modules || {};

  return (
    <AdminLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, <strong>{user?.name}</strong>. Here is your permission-scoped operational summary.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
          Loading dashboard metrics...
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Top Metric Cards Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: "16px",
            }}
          >
            {/* Sales Revenue (orders.view) */}
            {modules.orders && (
              <div className="glass-card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>
                      Total Revenue
                    </div>
                    <div style={{ fontSize: "1.65rem", fontWeight: 800, marginTop: "6px", color: "var(--text-primary)" }}>
                      {formatCurrency(modules.orders.totalRevenue)}
                    </div>
                  </div>
                  <div style={{ padding: "10px", borderRadius: "10px", backgroundColor: "var(--success-light)", color: "var(--success)" }}>
                    <DollarSign size={22} />
                  </div>
                </div>
                <div style={{ marginTop: "12px", fontSize: "0.78rem", color: "var(--success)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <TrendingUp size={14} />
                  <span>Real-time completed orders</span>
                </div>
              </div>
            )}

            {/* Total Orders (orders.view) */}
            {modules.orders && (
              <div className="glass-card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>
                      Orders Placed
                    </div>
                    <div style={{ fontSize: "1.65rem", fontWeight: 800, marginTop: "6px", color: "var(--text-primary)" }}>
                      {modules.orders.totalOrders}
                    </div>
                  </div>
                  <div style={{ padding: "10px", borderRadius: "10px", backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
                    <ShoppingCart size={22} />
                  </div>
                </div>
                <div style={{ marginTop: "12px", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                  <strong>{modules.orders.pendingOrders}</strong> pending processing
                </div>
              </div>
            )}

            {/* Products (products.view) */}
            {modules.products && (
              <div className="glass-card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>
                      Product Catalog
                    </div>
                    <div style={{ fontSize: "1.65rem", fontWeight: 800, marginTop: "6px", color: "var(--text-primary)" }}>
                      {modules.products.totalProducts}
                    </div>
                  </div>
                  <div style={{ padding: "10px", borderRadius: "10px", backgroundColor: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" }}>
                    <Package size={22} />
                  </div>
                </div>
                <div style={{ marginTop: "12px", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                  {modules.products.variableProducts} variable • {modules.products.simpleProducts} simple
                </div>
              </div>
            )}

            {/* Users (users.view) */}
            {modules.users && (
              <div className="glass-card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>
                      Active Admin Users
                    </div>
                    <div style={{ fontSize: "1.65rem", fontWeight: 800, marginTop: "6px", color: "var(--text-primary)" }}>
                      {modules.users.activeUsers}
                    </div>
                  </div>
                  <div style={{ padding: "10px", borderRadius: "10px", backgroundColor: "rgba(168, 85, 247, 0.15)", color: "var(--purple)" }}>
                    <Users size={22} />
                  </div>
                </div>
                <div style={{ marginTop: "12px", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                  Assigned across {modules.users.totalRoles} configured roles
                </div>
              </div>
            )}

            {/* Distributors (distributors.view) */}
            {modules.distributors && (
              <div className="glass-card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>
                      Distributors & Apps
                    </div>
                    <div style={{ fontSize: "1.65rem", fontWeight: 800, marginTop: "6px", color: "var(--text-primary)" }}>
                      {modules.distributors.totalDistributors}
                    </div>
                  </div>
                  <div style={{ padding: "10px", borderRadius: "10px", backgroundColor: "var(--warning-light)", color: "var(--warning)" }}>
                    <FileCheck size={22} />
                  </div>
                </div>
                <div style={{ marginTop: "12px", fontSize: "0.78rem", color: "var(--warning)" }}>
                  <strong>{modules.distributors.pendingApplications}</strong> applications pending review
                </div>
              </div>
            )}

            {/* Dealers (dealers.view) */}
            {modules.dealers && (
              <div className="glass-card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>
                      Registered Dealers
                    </div>
                    <div style={{ fontSize: "1.65rem", fontWeight: 800, marginTop: "6px", color: "var(--text-primary)" }}>
                      {modules.dealers.totalDealers}
                    </div>
                  </div>
                  <div style={{ padding: "10px", borderRadius: "10px", backgroundColor: "rgba(236, 72, 153, 0.15)", color: "#ec4899" }}>
                    <Store size={22} />
                  </div>
                </div>
                <div style={{ marginTop: "12px", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                  Authorized regional retail partners
                </div>
              </div>
            )}
          </div>

          {/* Low Stock Warning Box (if products.view) */}
          {modules.products?.lowStockItems?.length > 0 && (
            <div
              className="glass-panel"
              style={{
                padding: "20px 24px",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                backgroundColor: "rgba(245, 158, 11, 0.05)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--warning)", fontWeight: 700, fontSize: "0.95rem" }}>
                  <AlertTriangle size={18} />
                  <span>Low Stock Inventory Alerts (SKU Level)</span>
                </div>
                <Link href="/admin/products" style={{ fontSize: "0.8rem", color: "var(--primary)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span>View Catalog</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
                {modules.products.lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "rgba(17, 24, 39, 0.8)",
                      border: "1px solid var(--border-primary)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>{item.productName}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>SKU: <code>{item.sku}</code></div>
                    </div>
                    <span className="badge badge-danger">
                      Stock: {item.stock} left
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Orders Section (if orders.view) */}
          {modules.orders && (
            <div className="glass-panel" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Recent Customer Orders</h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    Latest order transactions with variant line item breakdowns
                  </p>
                </div>
                <Link href="/admin/orders" className="btn btn-secondary btn-sm">
                  View All Orders
                  <ArrowRight size={14} />
                </Link>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Items (SKU Variations)</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modules.orders.recentOrders?.map((ord) => (
                      <tr key={ord.id}>
                        <td>
                          <Link href={`/admin/orders/${ord.id}`} style={{ fontWeight: 600, color: "var(--primary)" }}>
                            {ord.orderNumber}
                          </Link>
                        </td>
                        <td style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>
                          {formatDate(ord.createdAt)}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{ord.customerName}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{ord.customerEmail}</div>
                        </td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            {ord.items?.map((it) => (
                              <div key={it.id} style={{ fontSize: "0.78rem" }}>
                                <strong>{it.quantity}x</strong> {it.productName} ({it.variantSku})
                              </div>
                            ))}
                          </div>
                        </td>
                        <td style={{ fontWeight: 700 }}>{formatCurrency(ord.totalAmount)}</td>
                        <td>
                          <StatusBadge status={ord.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Current Role Permissions Summary Card */}
          <div className="glass-panel" style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <Shield size={18} color="var(--primary)" />
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700 }}>
                Active Session Permissions Matrix ({user?.permissions?.length || 0} active keys)
              </h3>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "14px" }}>
              These permissions are evaluated server-side on every API route handler:
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {user?.permissions?.map((pk) => (
                <span
                  key={pk}
                  style={{
                    padding: "3px 8px",
                    backgroundColor: "rgba(99, 102, 241, 0.1)",
                    border: "1px solid rgba(99, 102, 241, 0.25)",
                    borderRadius: "4px",
                    fontSize: "0.75rem",
                    fontFamily: "var(--font-mono)",
                    color: "#a5b4fc",
                  }}
                >
                  {pk}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
