"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PermissionGuard } from "@/components/common/PermissionGuard";
import { StatusBadge } from "@/components/common/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  ShoppingCart,
  Search,
  Download,
  Eye,
  Calendar,
  Filter,
} from "lucide-react";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.set("search", search);
      if (status) query.set("status", status);

      const res = await fetch(`/api/admin/orders?${query.toString()}`);
      const json = await res.json();
      if (json.success) {
        setOrders(json.orders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, status]);

  return (
    <AdminLayout requiredPermission="orders.view">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customer Orders</h1>
          <p className="page-subtitle">
            Manage customer transactions, fulfillment statuses, and preserved SKU variant line items.
          </p>
        </div>

        <PermissionGuard permission="orders.export">
          <a
            href="/api/admin/orders/export"
            download
            className="btn btn-secondary"
            title="Export orders to CSV"
          >
            <Download size={16} />
            <span>Export Orders (CSV)</span>
          </a>
        </PermissionGuard>
      </div>

      {/* Filter Bar */}
      <div
        className="glass-panel"
        style={{
          padding: "16px 20px",
          marginBottom: "20px",
          display: "flex",
          gap: "14px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", minWidth: "280px", flex: 1 }}>
          <input
            type="text"
            className="form-input"
            style={{ width: "100%", paddingLeft: "36px" }}
            placeholder="Search by order #, customer name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        </div>

        <select
          className="form-select"
          style={{ minWidth: "180px" }}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="PENDING">PENDING</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="PROCESSING">PROCESSING</option>
          <option value="SHIPPED">SHIPPED</option>
          <option value="DELIVERED">DELIVERED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order Number</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Items & SKU Variations</th>
              <th>Total Amount</th>
              <th>Payment</th>
              <th>Order Status</th>
              <th style={{ textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "var(--text-secondary)" }}>
                  Loading orders...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "var(--text-secondary)" }}>
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((ord) => (
                <tr key={ord.id}>
                  <td>
                    <Link
                      href={`/admin/orders/${ord.id}`}
                      style={{ fontWeight: 700, color: "var(--primary)" }}
                    >
                      {ord.orderNumber}
                    </Link>
                  </td>

                  <td style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>
                    {formatDate(ord.createdAt)}
                  </td>

                  <td>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{ord.customerName}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{ord.customerEmail}</div>
                  </td>

                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      {ord.items?.map((it) => (
                        <div key={it.id} style={{ fontSize: "0.8rem" }}>
                          <strong>{it.quantity}x</strong> {it.productName}
                          <span style={{ color: "var(--text-muted)", marginLeft: "4px" }}>
                            ({it.variantSku}) {it.variantAttributes && `[${it.variantAttributes}]`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>

                  <td style={{ fontWeight: 800, fontSize: "0.95rem" }}>
                    {formatCurrency(ord.totalAmount)}
                  </td>

                  <td>
                    <span style={{ fontSize: "0.78rem", fontWeight: 600 }}>
                      {ord.paymentMethod}
                    </span>
                    <div>
                      <StatusBadge status={ord.paymentStatus} />
                    </div>
                  </td>

                  <td>
                    <StatusBadge status={ord.status} />
                  </td>

                  <td style={{ textAlign: "right" }}>
                    <Link
                      href={`/admin/orders/${ord.id}`}
                      className="btn btn-secondary btn-sm"
                    >
                      <Eye size={14} />
                      <span>Details</span>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
