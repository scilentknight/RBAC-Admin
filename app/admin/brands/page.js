"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PermissionGuard } from "@/components/common/PermissionGuard";
import { Modal } from "@/components/common/Modal";
import { StatusBadge } from "@/components/common/Badge";
import { slugify } from "@/lib/utils";
import { Tag, Plus, Edit2, Trash2, Search, Package } from "lucide-react";

export default function BrandsPage() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    logo: "",
    status: "ACTIVE",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/brands");
      const json = await res.json();
      if (json.success) {
        setBrands(json.brands);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const openCreateModal = () => {
    setEditingBrand(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      logo: "",
      status: "ACTIVE",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (b) => {
    setEditingBrand(b);
    setFormData({
      name: b.name,
      slug: b.slug,
      description: b.description || "",
      logo: b.logo || "",
      status: b.status,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleNameChange = (name) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: !editingBrand ? slugify(name) : prev.slug,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const url = editingBrand ? `/api/admin/brands/${editingBrand.id}` : "/api/admin/brands";
      const method = editingBrand ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!json.success) {
        setFormError(json.error || "Failed to save brand");
      } else {
        setIsModalOpen(false);
        fetchBrands();
      }
    } catch (err) {
      setFormError("Network error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (b) => {
    if (!confirm(`Delete brand "${b.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/brands/${b.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        fetchBrands();
      } else {
        alert(json.error || "Failed to delete brand");
      }
    } catch (err) {
      alert("Delete failed");
    }
  };

  const filtered = brands.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout requiredPermission="brands.view">
      <div className="page-header">
        <div>
          <h1 className="page-title">Brand Directory</h1>
          <p className="page-subtitle">
            Manage manufacturer logos, brand descriptions, and catalog associations.
          </p>
        </div>

        <PermissionGuard permission="brands.create">
          <button onClick={openCreateModal} className="btn btn-primary">
            <Plus size={16} />
            <span>Add Brand</span>
          </button>
        </PermissionGuard>
      </div>

      <div style={{ marginBottom: "20px", maxWidth: "340px" }}>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            className="form-input"
            style={{ width: "100%", paddingLeft: "36px" }}
            placeholder="Search brands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        </div>
      </div>

      {/* Brands Grid */}
      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
          Loading brands...
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "16px",
          }}
        >
          {filtered.map((b) => (
            <div key={b.id} className="glass-card" style={{ padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                  {b.logo ? (
                    <img src={b.logo} alt={b.name} style={{ width: "42px", height: "42px", borderRadius: "8px", objectFit: "cover", backgroundColor: "#fff", padding: "2px" }} />
                  ) : (
                    <div style={{ width: "42px", height: "42px", borderRadius: "8px", backgroundColor: "var(--bg-tertiary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Tag size={20} color="var(--primary)" />
                    </div>
                  )}
                  <div>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700 }}>{b.name}</h3>
                    <code style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{b.slug}</code>
                  </div>
                </div>

                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "14px", minHeight: "36px" }}>
                  {b.description || "No description provided."}
                </p>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", backgroundColor: "rgba(0,0,0,0.25)", borderRadius: "var(--radius-sm)", marginBottom: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                    <Package size={14} />
                    <span>{b._count?.products || 0} Products</span>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px", paddingTop: "12px", borderTop: "1px solid var(--border-subtle)" }}>
                <PermissionGuard permission="brands.edit">
                  <button onClick={() => openEditModal(b)} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                    <Edit2 size={13} />
                    <span>Edit</span>
                  </button>
                </PermissionGuard>

                <PermissionGuard permission="brands.delete">
                  <button onClick={() => handleDelete(b)} className="btn btn-danger btn-sm" title="Delete brand">
                    <Trash2 size={13} />
                  </button>
                </PermissionGuard>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBrand ? `Edit Brand: ${editingBrand.name}` : "Create Brand"}
        maxWidth="540px"
      >
        <form onSubmit={handleSave}>
          {formError && (
            <div style={{ backgroundColor: "var(--danger-light)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#fca5a5", padding: "10px", borderRadius: "var(--radius-md)", fontSize: "0.85rem", marginBottom: "14px" }}>
              {formError}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div className="form-group">
              <label className="form-label">Brand Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Sony"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Slug</label>
              <input
                type="text"
                className="form-input"
                placeholder="sony"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Logo Image URL</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://..."
              value={formData.logo}
              onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Brand statement or overview..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : editingBrand ? "Save Changes" : "Create Brand"}
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
