"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PermissionGuard } from "@/components/common/PermissionGuard";
import { Modal } from "@/components/common/Modal";
import { StatusBadge } from "@/components/common/Badge";
import { slugify } from "@/lib/utils";
import {
  SlidersHorizontal,
  Plus,
  Edit2,
  Trash2,
  Search,
  Tag,
  X,
  Check,
} from "lucide-react";

export default function AttributesPage() {
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Attribute Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAttr, setEditingAttr] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    status: "ACTIVE",
    initialValues: "",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Manage Values Modal State
  const [managingAttr, setManagingAttr] = useState(null);
  const [newValueInput, setNewValueInput] = useState("");
  const [newValueCode, setNewValueCode] = useState("");

  const fetchAttributes = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/attributes");
      const json = await res.json();
      if (json.success) {
        setAttributes(json.attributes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttributes();
  }, []);

  const openCreateModal = () => {
    setEditingAttr(null);
    setFormData({
      name: "",
      code: "",
      description: "",
      status: "ACTIVE",
      initialValues: "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (attr) => {
    setEditingAttr(attr);
    setFormData({
      name: attr.name,
      code: attr.code,
      description: attr.description || "",
      status: attr.status,
      initialValues: "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleNameChange = (name) => {
    setFormData((prev) => ({
      ...prev,
      name,
      code: !editingAttr ? slugify(name) : prev.code,
    }));
  };

  const handleSaveAttribute = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const url = editingAttr ? `/api/admin/attributes/${editingAttr.id}` : "/api/admin/attributes";
      const method = editingAttr ? "PUT" : "POST";

      const payload = {
        name: formData.name,
        code: formData.code,
        description: formData.description,
        status: formData.status,
      };

      if (!editingAttr && formData.initialValues) {
        // Parse comma separated values
        payload.values = formData.initialValues
          .split(",")
          .map((v) => v.trim())
          .filter((v) => v.length > 0);
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) {
        setFormError(json.error || "Failed to save attribute");
      } else {
        setIsModalOpen(false);
        fetchAttributes();
      }
    } catch (err) {
      setFormError("Network error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAttribute = async (attr) => {
    if (!confirm(`Delete attribute "${attr.name}" and all its values?`)) return;

    try {
      const res = await fetch(`/api/admin/attributes/${attr.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        fetchAttributes();
      } else {
        alert(json.error || "Failed to delete attribute");
      }
    } catch (err) {
      alert("Delete failed");
    }
  };

  // Add a new value to managing attribute
  const handleAddValue = async (e) => {
    e.preventDefault();
    if (!newValueInput.trim() || !managingAttr) return;

    try {
      const res = await fetch(`/api/admin/attributes/${managingAttr.id}/values`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: newValueInput.trim(),
          code: newValueCode.trim() || slugify(newValueInput),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setNewValueInput("");
        setNewValueCode("");
        // refresh
        const refreshedRes = await fetch(`/api/admin/attributes/${managingAttr.id}`);
        const refreshedJson = await refreshedRes.json();
        if (refreshedJson.success) {
          setManagingAttr(refreshedJson.attribute);
        }
        fetchAttributes();
      } else {
        alert(json.error || "Failed to add value");
      }
    } catch (err) {
      alert("Error adding value");
    }
  };

  // Delete a specific value
  const handleDeleteValue = async (valueId) => {
    try {
      const res = await fetch(`/api/admin/attributes/${managingAttr.id}/values?valueId=${valueId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        const refreshedRes = await fetch(`/api/admin/attributes/${managingAttr.id}`);
        const refreshedJson = await refreshedRes.json();
        if (refreshedJson.success) {
          setManagingAttr(refreshedJson.attribute);
        }
        fetchAttributes();
      } else {
        alert(json.error || "Failed to remove value");
      }
    } catch (err) {
      alert("Error removing value");
    }
  };

  const filtered = attributes.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout requiredPermission="attributes.view">
      <div className="page-header">
        <div>
          <h1 className="page-title">Product Attributes & Values</h1>
          <p className="page-subtitle">
            Configure dynamic variation dimensions (Color, Size, Storage, RAM, Material, etc.).
          </p>
        </div>

        <PermissionGuard permission="attributes.create">
          <button onClick={openCreateModal} className="btn btn-primary">
            <Plus size={16} />
            <span>Create Dynamic Attribute</span>
          </button>
        </PermissionGuard>
      </div>

      <div style={{ marginBottom: "20px", maxWidth: "340px" }}>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            className="form-input"
            style={{ width: "100%", paddingLeft: "36px" }}
            placeholder="Search attributes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        </div>
      </div>

      {/* Attributes Grid */}
      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
          Loading attributes...
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "18px",
          }}
        >
          {filtered.map((attr) => (
            <div key={attr.id} className="glass-card" style={{ padding: "22px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div>
                    <h3 style={{ fontSize: "1.15rem", fontWeight: 700 }}>{attr.name}</h3>
                    <code style={{ fontSize: "0.72rem", color: "var(--primary)", backgroundColor: "rgba(99, 102, 241, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                      code: {attr.code}
                    </code>
                  </div>
                  <StatusBadge status={attr.status} />
                </div>

                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "14px" }}>
                  {attr.description || "Reusable variation property."}
                </p>

                {/* Values Swatches / Tags Preview */}
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: "6px" }}>
                    Configured Values ({attr.values?.length || 0}):
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {attr.values?.map((v) => (
                      <span
                        key={v.id}
                        style={{
                          padding: "3px 8px",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: "rgba(31, 41, 55, 0.8)",
                          border: "1px solid var(--border-primary)",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        {v.code?.startsWith("#") && (
                          <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: v.code }} />
                        )}
                        {v.value}
                      </span>
                    ))}
                    {attr.values?.length === 0 && (
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>No values added yet</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "8px", paddingTop: "14px", borderTop: "1px solid var(--border-subtle)" }}>
                <button
                  onClick={() => setManagingAttr(attr)}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                >
                  <Tag size={13} />
                  <span>Manage Values ({attr.values?.length || 0})</span>
                </button>

                <PermissionGuard permission="attributes.edit">
                  <button onClick={() => openEditModal(attr)} className="btn btn-secondary btn-sm" title="Edit attribute">
                    <Edit2 size={13} />
                  </button>
                </PermissionGuard>

                <PermissionGuard permission="attributes.delete">
                  <button onClick={() => handleDeleteAttribute(attr)} className="btn btn-danger btn-sm" title="Delete attribute">
                    <Trash2 size={13} />
                  </button>
                </PermissionGuard>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT ATTRIBUTE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAttr ? `Edit Attribute: ${editingAttr.name}` : "Create Dynamic Attribute"}
        maxWidth="540px"
      >
        <form onSubmit={handleSaveAttribute}>
          {formError && (
            <div style={{ backgroundColor: "var(--danger-light)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#fca5a5", padding: "10px", borderRadius: "var(--radius-md)", fontSize: "0.85rem", marginBottom: "14px" }}>
              {formError}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div className="form-group">
              <label className="form-label">Attribute Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Storage or Color"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Code Key</label>
              <input
                type="text"
                className="form-input"
                placeholder="storage"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </div>
          </div>

          {!editingAttr && (
            <div className="form-group">
              <label className="form-label">Initial Values (Comma Separated)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 128GB, 256GB, 512GB, 1TB"
                value={formData.initialValues}
                onChange={(e) => setFormData({ ...formData, initialValues: e.target.value })}
              />
            </div>
          )}

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
              rows={2}
              placeholder="Short description of this variation dimension..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : editingAttr ? "Save Changes" : "Create Attribute"}
            </button>
          </div>
        </form>
      </Modal>

      {/* MANAGE VALUES MODAL */}
      <Modal
        isOpen={!!managingAttr}
        onClose={() => setManagingAttr(null)}
        title={`Manage Values for ${managingAttr?.name}`}
        maxWidth="560px"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Add New Value Form */}
          <form onSubmit={handleAddValue} style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">Value Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Midnight Blue or XL"
                value={newValueInput}
                onChange={(e) => setNewValueInput(e.target.value)}
                required
              />
            </div>
            <div style={{ width: "130px" }}>
              <label className="form-label">Code / Hex</label>
              <input
                type="text"
                className="form-input"
                placeholder="#1e3a8a or xl"
                value={newValueCode}
                onChange={(e) => setNewValueCode(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: "42px" }}>
              <Plus size={16} />
              <span>Add</span>
            </button>
          </form>

          {/* Current Values List */}
          <div style={{ marginTop: "10px" }}>
            <div className="form-label" style={{ marginBottom: "8px" }}>
              Existing Values ({managingAttr?.values?.length || 0})
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto" }}>
              {managingAttr?.values?.map((v) => (
                <div
                  key={v.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "rgba(31, 41, 55, 0.6)",
                    border: "1px solid var(--border-primary)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {v.code?.startsWith("#") && (
                      <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: v.code }} />
                    )}
                    <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{v.value}</span>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>({v.code})</span>
                  </div>

                  <PermissionGuard permission="attributes.delete">
                    <button
                      onClick={() => handleDeleteValue(v.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--danger)",
                        cursor: "pointer",
                        padding: "4px",
                      }}
                      title="Remove value"
                    >
                      <X size={16} />
                    </button>
                  </PermissionGuard>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
