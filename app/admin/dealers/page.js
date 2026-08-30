"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PermissionGuard } from "@/components/common/PermissionGuard";
import { Modal } from "@/components/common/Modal";
import { StatusBadge } from "@/components/common/Badge";
import {
  Store,
  Plus,
  Edit2,
  Trash2,
  Search,
  Users,
  Boxes,
  MapPin,
  Mail,
  Phone,
} from "lucide-react";
import Link from "next/link";

export default function DealersPage() {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDealer, setEditingDealer] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    region: "",
    status: "ACTIVE",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchDealers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/dealers");
      const json = await res.json();
      if (json.success) {
        setDealers(json.dealers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDealers();
  }, []);

  const openCreateModal = () => {
    setEditingDealer(null);
    setFormData({
      name: "",
      code: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      region: "North America",
      status: "ACTIVE",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (d) => {
    setEditingDealer(d);
    setFormData({
      name: d.name,
      code: d.code,
      email: d.email,
      phone: d.phone || "",
      address: d.address || "",
      city: d.city || "",
      state: d.state || "",
      region: d.region || "",
      status: d.status,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const url = editingDealer ? `/api/admin/dealers/${editingDealer.id}` : "/api/admin/dealers";
      const method = editingDealer ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!json.success) {
        setFormError(json.error || "Failed to save dealer");
      } else {
        setIsModalOpen(false);
        fetchDealers();
      }
    } catch (err) {
      setFormError("Network error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (d) => {
    if (!confirm(`Delete dealer "${d.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/dealers/${d.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        fetchDealers();
      } else {
        alert(json.error || "Failed to delete dealer");
      }
    } catch (err) {
      alert("Delete failed");
    }
  };

  const filtered = dealers.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase()) ||
      d.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout requiredPermission="dealers.view">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dealer Management</h1>
          <p className="page-subtitle">
            Manage authorized retail dealer accounts, regional locations, and representatives.
          </p>
        </div>

        <PermissionGuard permission="dealers.create">
          <button onClick={openCreateModal} className="btn btn-primary">
            <Plus size={16} />
            <span>Add Dealer</span>
          </button>
        </PermissionGuard>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "20px", maxWidth: "340px" }}>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            className="form-input"
            style={{ width: "100%", paddingLeft: "36px" }}
            placeholder="Search dealers by name, code, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        </div>
      </div>

      {/* Dealers Grid */}
      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
          Loading dealers...
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "18px",
          }}
        >
          {filtered.map((d) => (
            <div key={d.id} className="glass-card" style={{ padding: "22px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>{d.name}</h3>
                    <code style={{ fontSize: "0.75rem", color: "var(--primary)", backgroundColor: "rgba(99, 102, 241, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                      {d.code}
                    </code>
                  </div>
                  <StatusBadge status={d.status} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.8rem", color: "var(--text-secondary)", margin: "14px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Mail size={13} color="var(--primary)" />
                    <span>{d.email}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Phone size={13} color="var(--primary)" />
                    <span>{d.phone}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <MapPin size={13} color="var(--primary)" />
                    <span>{d.address}, {d.city}, {d.state} ({d.region})</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", padding: "10px 14px", backgroundColor: "rgba(0,0,0,0.25)", borderRadius: "var(--radius-md)", marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem" }}>
                    <Users size={14} color="var(--primary)" />
                    <span>{d._count?.users || 0} Rep Users</span>
                  </div>

                  <Link
                    href={`/admin/dealer-inventory?dealerId=${d.id}`}
                    style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "var(--text-secondary)", textDecoration: "underline" }}
                  >
                    <Boxes size={14} color="var(--success)" />
                    <span>{d._count?.inventories || 0} Inventory SKUs</span>
                  </Link>
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px", paddingTop: "12px", borderTop: "1px solid var(--border-subtle)" }}>
                <PermissionGuard permission="dealers.edit">
                  <button onClick={() => openEditModal(d)} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                    <Edit2 size={13} />
                    <span>Edit</span>
                  </button>
                </PermissionGuard>

                <PermissionGuard permission="dealers.delete">
                  <button onClick={() => handleDelete(d)} className="btn btn-danger btn-sm" title="Delete dealer">
                    <Trash2 size={13} />
                  </button>
                </PermissionGuard>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT DEALER MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDealer ? `Edit Dealer: ${editingDealer.name}` : "Create New Dealer Account"}
        maxWidth="600px"
      >
        <form onSubmit={handleSave}>
          {formError && (
            <div style={{ backgroundColor: "var(--danger-light)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#fca5a5", padding: "10px", borderRadius: "var(--radius-md)", fontSize: "0.85rem", marginBottom: "14px" }}>
              {formError}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "14px" }}>
            <div className="form-group">
              <label className="form-label">Dealer Business Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Metro Sports Inc."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Dealer Code</label>
              <input
                type="text"
                className="form-input"
                placeholder="DLR-METRO-01"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div className="form-group">
              <label className="form-label">Contact Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="dealer@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Street Address</label>
            <input
              type="text"
              className="form-input"
              placeholder="123 Main Blvd"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                type="text"
                className="form-input"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <input
                type="text"
                className="form-input"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Region</label>
              <input
                type="text"
                className="form-input"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : editingDealer ? "Save Changes" : "Create Dealer"}
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
