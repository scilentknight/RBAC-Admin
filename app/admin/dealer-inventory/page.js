"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PermissionGuard } from "@/components/common/PermissionGuard";
import { Modal } from "@/components/common/Modal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
  Boxes,
  Edit2,
  Search,
  AlertTriangle,
  MapPin,
  Save,
  Package,
  ShieldCheck,
} from "lucide-react";

function DealerInventoryContent() {
  const searchParams = useSearchParams();
  const requestedDealerId = searchParams.get("dealerId") || "";

  const { user } = useAuth();
  const [inventories, setInventories] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [selectedDealerId, setSelectedDealerId] = useState(requestedDealerId);
  const [isDealerUser, setIsDealerUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Edit stock modal state
  const [editingItem, setEditingItem] = useState(null);
  const [editStock, setEditStock] = useState("0");
  const [editLowThreshold, setEditLowThreshold] = useState("5");
  const [editLocation, setEditLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (selectedDealerId) query.set("dealerId", selectedDealerId);

      const [invRes, dealRes] = await Promise.all([
        fetch(`/api/admin/dealer-inventory?${query.toString()}`),
        fetch("/api/admin/dealers"),
      ]);

      const invJson = await invRes.json();
      const dealJson = await dealRes.json();

      if (invJson.success) {
        setInventories(invJson.inventories);
        setIsDealerUser(invJson.isDealerUser);
        if (invJson.userDealerId) {
          setSelectedDealerId(invJson.userDealerId);
        }
      }

      if (dealJson.success) {
        setDealers(dealJson.dealers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [selectedDealerId]);

  const openStockModal = (item) => {
    setEditingItem(item);
    setEditStock(item.stock.toString());
    setEditLowThreshold((item.lowStockThreshold || 5).toString());
    setEditLocation(item.location || "");
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/dealer-inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryId: editingItem.id,
          dealerId: editingItem.dealerId,
          variantId: editingItem.variantId,
          stock: parseInt(editStock),
          lowStockThreshold: parseInt(editLowThreshold),
          location: editLocation,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setEditingItem(null);
        fetchInventory();
      } else {
        alert(json.error || "Failed to update stock");
      }
    } catch (err) {
      alert("Error saving stock");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = inventories.filter(
    (item) =>
      item.productName.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      (item.dealer?.name && item.dealer.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dealer Inventory Allocations</h1>
          <p className="page-subtitle">
            {isDealerUser
              ? "Your authorized dealer warehouse stock levels and SKU inventory."
              : "Review and update inventory stock allocations across authorized dealer networks."}
          </p>
        </div>

        {isDealerUser && (
          <div
            style={{
              padding: "6px 14px",
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "var(--radius-full)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "0.8rem",
              color: "var(--success)",
              fontWeight: 600,
            }}
          >
            <ShieldCheck size={16} />
            <span>Dealer Scope Enforced ({user?.dealer?.name || "Assigned Dealer"})</span>
          </div>
        )}
      </div>

      {/* Filter / Dealer Selector (Only for HQ admin users) */}
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
        <div style={{ position: "relative", minWidth: "260px", flex: 1 }}>
          <input
            type="text"
            className="form-input"
            style={{ width: "100%", paddingLeft: "36px" }}
            placeholder="Search by product, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        </div>

        {!isDealerUser && (
          <select
            className="form-select"
            style={{ minWidth: "220px" }}
            value={selectedDealerId}
            onChange={(e) => setSelectedDealerId(e.target.value)}
          >
            <option value="">All Dealers</option>
            {dealers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Inventory Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {!isDealerUser && <th>Dealer Account</th>}
              <th>Product & Variation SKU</th>
              <th>Attributes Snapshot</th>
              <th>Unit Price</th>
              <th>Allocated Stock</th>
              <th>Low Alert Threshold</th>
              <th>Shelf Location</th>
              <th>Last Updated</th>
              <th style={{ textAlign: "right" }}>Update</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={isDealerUser ? 8 : 9} style={{ textAlign: "center", padding: "30px", color: "var(--text-secondary)" }}>
                  Loading inventory...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={isDealerUser ? 8 : 9} style={{ textAlign: "center", padding: "30px", color: "var(--text-secondary)" }}>
                  No inventory allocations found.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const isLow = item.stock <= item.lowStockThreshold;

                return (
                  <tr key={item.id}>
                    {!isDealerUser && (
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{item.dealer?.name}</div>
                        <code style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{item.dealer?.code}</code>
                      </td>
                    )}

                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {item.productImage ? (
                          <img src={item.productImage} alt={item.productName} style={{ width: "36px", height: "36px", borderRadius: "6px", objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "36px", height: "36px", borderRadius: "6px", backgroundColor: "var(--bg-tertiary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Package size={16} />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{item.productName}</div>
                          <code style={{ fontSize: "0.75rem", color: "var(--primary)" }}>SKU: {item.sku}</code>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        {item.variantAttributes}
                      </span>
                    </td>

                    <td style={{ fontWeight: 700 }}>{formatCurrency(item.price)}</td>

                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontWeight: 800, fontSize: "1rem", color: isLow ? "var(--danger)" : "var(--text-primary)" }}>
                          {item.stock} units
                        </span>
                        {isLow && (
                          <span title="Low stock threshold exceeded">
                            <AlertTriangle size={15} color="var(--danger)" />
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                      &le; {item.lowStockThreshold} units
                    </td>

                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        <MapPin size={12} />
                        <span>{item.location || "Default Bay"}</span>
                      </div>
                    </td>

                    <td style={{ color: "var(--text-secondary)", fontSize: "0.78rem" }}>
                      {formatDate(item.updatedAt)}
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <PermissionGuard permission="dealer_inventory.update">
                        <button
                          onClick={() => openStockModal(item)}
                          className="btn btn-secondary btn-sm"
                          title="Update stock count"
                        >
                          <Edit2 size={13} />
                          <span>Adjust</span>
                        </button>
                      </PermissionGuard>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* EDIT STOCK MODAL */}
      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title={`Adjust Stock: ${editingItem?.sku}`}
        maxWidth="500px"
      >
        <form onSubmit={handleUpdateStock}>
          <div style={{ marginBottom: "16px", padding: "12px", backgroundColor: "rgba(31, 41, 55, 0.5)", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{editingItem?.productName}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              Attributes: {editingItem?.variantAttributes}
            </div>
            {!isDealerUser && (
              <div style={{ fontSize: "0.75rem", color: "var(--primary)", marginTop: "4px" }}>
                Dealer: {editingItem?.dealer?.name}
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div className="form-group">
              <label className="form-label">Available Stock Quantity</label>
              <input
                type="number"
                className="form-input"
                value={editStock}
                onChange={(e) => setEditStock(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Low Stock Threshold</label>
              <input
                type="number"
                className="form-input"
                value={editLowThreshold}
                onChange={(e) => setEditLowThreshold(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Shelf / Aisle Location</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Aisle 3 - Bay B4"
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
            <button type="button" onClick={() => setEditingItem(null)} className="btn btn-secondary" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : "Save Stock Adjustment"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function DealerInventoryPage() {
  return (
    <AdminLayout requiredPermission="dealer_inventory.view">
      <Suspense fallback={<div style={{ padding: "40px", color: "var(--text-secondary)" }}>Loading inventory...</div>}>
        <DealerInventoryContent />
      </Suspense>
    </AdminLayout>
  );
}
