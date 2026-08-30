"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PermissionGuard } from "@/components/common/PermissionGuard";
import { StatusBadge } from "@/components/common/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  ArrowLeft,
  ShoppingCart,
  User,
  MapPin,
  CreditCard,
  Ban,
  Save,
  CheckCircle,
  Package,
} from "lucide-react";

export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [updating, setUpdating] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/orders/${id}`);
      const json = await res.json();
      if (json.success && json.order) {
        setOrder(json.order);
        setStatus(json.order.status);
        setPaymentStatus(json.order.paymentStatus);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const handleUpdateStatus = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, paymentStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setOrder(json.order);
        alert("Order status updated successfully!");
      } else {
        alert(json.error || "Failed to update order status");
      }
    } catch (err) {
      alert("Error updating order");
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order? This will restock all SKU item quantities back into active inventory.")) {
      return;
    }

    setCancelling(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}/cancel`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        fetchOrder();
      } else {
        alert(json.error || "Failed to cancel order");
      }
    } catch (err) {
      alert("Error cancelling order");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout requiredPermission="orders.view">
        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
          Loading order details...
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout requiredPermission="orders.view">
        <div style={{ padding: "40px", textAlign: "center" }}>
          <h2>Order Not Found</h2>
          <Link href="/admin/orders" className="btn btn-secondary" style={{ marginTop: "16px" }}>
            Back to Orders
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout requiredPermission="orders.view">
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Link href="/admin/orders" style={{ color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
              <ArrowLeft size={16} />
            </Link>
            <h1 className="page-title">{order.orderNumber}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="page-subtitle">
            Placed on {formatDate(order.createdAt)} • Payment: <StatusBadge status={order.paymentStatus} />
          </p>
        </div>

        {order.status !== "CANCELLED" && (
          <PermissionGuard permission="orders.cancel">
            <button
              onClick={handleCancelOrder}
              className="btn btn-danger"
              disabled={cancelling}
            >
              <Ban size={16} />
              <span>{cancelling ? "Restocking..." : "Cancel Order & Restock"}</span>
            </button>
          </PermissionGuard>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        {/* Left Column: Order Items */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="glass-panel" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px" }}>
              Order Items ({order.items?.length || 0})
            </h3>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product & Variation SKU</th>
                    <th>Attributes Snapshot</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th style={{ textAlign: "right" }}>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                          {item.productName}
                        </div>
                        <code style={{ fontSize: "0.75rem", color: "var(--primary)" }}>
                          SKU: {item.variantSku}
                        </code>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                          {item.variantAttributes || "Standard Item"}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(item.unitPrice)}</td>
                      <td>
                        <span className="badge badge-neutral" style={{ fontSize: "0.8rem" }}>
                          x{item.quantity}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>
                        {formatCurrency(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total summary */}
            <div
              style={{
                marginTop: "16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "6px",
                paddingTop: "16px",
                borderTop: "1px solid var(--border-primary)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", width: "240px", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                <span>Subtotal:</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", width: "240px", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                <span>Shipping:</span>
                <span>$0.00 (Standard Free)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", width: "240px", fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "4px" }}>
                <span>Total:</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Notes Card */}
          {order.notes && (
            <div className="glass-panel" style={{ padding: "20px 24px" }}>
              <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "8px", color: "var(--text-secondary)" }}>
                Customer / Order Notes:
              </h4>
              <p style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>{order.notes}</p>
            </div>
          )}
        </div>

        {/* Right Column: Customer & Status Updater */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Status Management Card */}
          <PermissionGuard permission="orders.edit">
            <div className="glass-panel" style={{ padding: "24px" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "16px" }}>
                Update Order Status
              </h3>

              <div className="form-group">
                <label className="form-label">Fulfillment Status</label>
                <select
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div className="form-group" style={{ marginTop: "10px" }}>
                <label className="form-label">Payment Status</label>
                <select
                  className="form-select"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="PAID">PAID</option>
                  <option value="REFUNDED">REFUNDED</option>
                </select>
              </div>

              <button
                onClick={handleUpdateStatus}
                className="btn btn-primary"
                style={{ width: "100%", marginTop: "14px" }}
                disabled={updating}
              >
                <Save size={16} />
                <span>{updating ? "Saving..." : "Save Status Changes"}</span>
              </button>
            </div>
          </PermissionGuard>

          {/* Customer Info Card */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <User size={18} color="var(--primary)" />
              <span>Customer Information</span>
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.85rem" }}>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.75rem" }}>Customer Name</span>
                <strong style={{ color: "var(--text-primary)" }}>{order.customerName}</strong>
              </div>

              <div>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.75rem" }}>Email Address</span>
                <span style={{ color: "var(--text-primary)" }}>{order.customerEmail}</span>
              </div>

              {order.customerPhone && (
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.75rem" }}>Phone Number</span>
                  <span style={{ color: "var(--text-primary)" }}>{order.customerPhone}</span>
                </div>
              )}

              <div style={{ marginTop: "6px", paddingTop: "10px", borderTop: "1px solid var(--border-subtle)" }}>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.75rem", marginBottom: "4px" }}>
                  Shipping Address
                </span>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "6px", color: "var(--text-primary)" }}>
                  <MapPin size={14} style={{ marginTop: "2px", flexShrink: 0, color: "var(--primary)" }} />
                  <span>{order.shippingAddress}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
