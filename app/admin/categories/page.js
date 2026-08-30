"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PermissionGuard } from "@/components/common/PermissionGuard";
import { Modal } from "@/components/common/Modal";
import { StatusBadge } from "@/components/common/Badge";
import { slugify } from "@/lib/utils";
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Search,
  ChevronRight,
  Folder,
  Layers,
} from "lucide-react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    image: "",
    parentId: "",
    status: "ACTIVE",
    sortOrder: 0,
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/categories");
      const json = await res.json();
      if (json.success) {
        setCategories(json.categories);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      image: "",
      parentId: "",
      status: "ACTIVE",
      sortOrder: 0,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      image: cat.image || "",
      parentId: cat.parentId || "",
      status: cat.status,
      sortOrder: cat.sortOrder,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleNameChange = (name) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: !editingCategory ? slugify(name) : prev.slug,
    }));
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const url = editingCategory ? `/api/admin/categories/${editingCategory.id}` : "/api/admin/categories";
      const method = editingCategory ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!json.success) {
        setFormError(json.error || "Failed to save category");
      } else {
        setIsModalOpen(false);
        fetchCategories();
      }
    } catch (err) {
      setFormError("Network error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cat) => {
    if (!confirm(`Delete category "${cat.name}"? Products will become uncategorized.`)) return;

    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        fetchCategories();
      } else {
        alert(json.error || "Failed to delete category");
      }
    } catch (err) {
      alert("Delete failed");
    }
  };

  // Filter
  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  // Group parent vs child
  const parentCategories = categories.filter((c) => !c.parentId);

  return (
    <AdminLayout requiredPermission="categories.view">
      <div className="page-header">
        <div>
          <h1 className="page-title">Category Taxonomy</h1>
          <p className="page-subtitle">
            Manage hierarchical product categories and subcategories.
          </p>
        </div>

        <PermissionGuard permission="categories.create">
          <button onClick={openCreateModal} className="btn btn-primary">
            <Plus size={16} />
            <span>Add Category</span>
          </button>
        </PermissionGuard>
      </div>

      {/* Hierarchy Preview Banner */}
      <div
        className="glass-panel"
        style={{
          padding: "16px 20px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "24px",
          overflowX: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--primary)", fontWeight: 700, fontSize: "0.85rem", whiteSpace: "nowrap" }}>
          <FolderTree size={18} />
          <span>Hierarchy Tree:</span>
        </div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "nowrap" }}>
          {parentCategories.map((p) => (
            <div
              key={p.id}
              style={{
                padding: "6px 12px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "rgba(31, 41, 55, 0.7)",
                border: "1px solid var(--border-primary)",
                fontSize: "0.78rem",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                whiteSpace: "nowrap",
              }}
            >
              <Folder size={14} color="var(--primary)" />
              <span style={{ fontWeight: 600 }}>{p.name}</span>
              <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>({p.children?.length || 0} sub)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "16px", maxWidth: "340px" }}>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            className="form-input"
            style={{ width: "100%", paddingLeft: "36px" }}
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        </div>
      </div>

      {/* Categories Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Category Name</th>
              <th>Slug</th>
              <th>Parent Level</th>
              <th>Subcategories</th>
              <th>Products</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "var(--text-secondary)" }}>
                  Loading categories...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "var(--text-secondary)" }}>
                  No categories found.
                </td>
              </tr>
            ) : (
              filtered.map((cat) => (
                <tr key={cat.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {cat.image ? (
                        <img
                          src={cat.image}
                          alt={cat.name}
                          style={{ width: "32px", height: "32px", borderRadius: "6px", objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "6px",
                            backgroundColor: "var(--bg-tertiary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--text-muted)",
                          }}
                        >
                          <Folder size={16} />
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{cat.name}</div>
                        {cat.description && (
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{cat.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <code style={{ fontSize: "0.75rem", color: "var(--primary)" }}>{cat.slug}</code>
                  </td>
                  <td>
                    {cat.parent ? (
                      <span className="badge badge-primary">
                        {cat.parent.name}
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>Top Level</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      {cat.children?.length || 0} subcategories
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                      {cat._count?.products || 0}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={cat.status} />
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "6px" }}>
                      <PermissionGuard permission="categories.edit">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="btn btn-secondary btn-sm"
                          title="Edit category"
                        >
                          <Edit2 size={14} />
                        </button>
                      </PermissionGuard>

                      <PermissionGuard permission="categories.delete">
                        <button
                          onClick={() => handleDelete(cat)}
                          className="btn btn-danger btn-sm"
                          title="Delete category"
                        >
                          <Trash2 size={14} />
                        </button>
                      </PermissionGuard>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? `Edit Category: ${editingCategory.name}` : "Create New Category"}
        maxWidth="580px"
      >
        <form onSubmit={handleSaveCategory}>
          {formError && (
            <div
              style={{
                backgroundColor: "var(--danger-light)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#fca5a5",
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                fontSize: "0.85rem",
                marginBottom: "16px",
              }}
            >
              {formError}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div className="form-group">
              <label className="form-label">Category Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Mobile Phones"
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
                placeholder="mobile-phones"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div className="form-group">
              <label className="form-label">Parent Category</label>
              <select
                className="form-select"
                value={formData.parentId}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
              >
                <option value="">None (Top Level Root)</option>
                {parentCategories
                  .filter((p) => !editingCategory || p.id !== editingCategory.id)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
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
          </div>

          <div className="form-group">
            <label className="form-label">Image URL</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://..."
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Category overview..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              marginTop: "20px",
              paddingTop: "16px",
              borderTop: "1px solid var(--border-primary)",
            }}
          >
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
