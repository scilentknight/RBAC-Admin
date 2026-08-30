"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PermissionGuard } from "@/components/common/PermissionGuard";
import { Modal } from "@/components/common/Modal";
import { useAuth } from "@/context/AuthContext";
import { PERMISSION_CATALOG, getAllPermissionKeys } from "@/lib/permissions";
import {
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Users,
  CheckSquare,
  Square,
  Lock,
  Search,
  Check,
} from "lucide-react";

export default function RolesManagementPage() {
  const { user } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // View users modal state
  const [viewRoleUsers, setViewRoleUsers] = useState(null);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/roles");
      const json = await res.json();
      if (json.success) {
        setRoles(json.roles);
      }
    } catch (err) {
      console.error("Fetch roles error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const openCreateModal = () => {
    setEditingRole(null);
    setFormData({
      name: "",
      description: "",
      permissions: [],
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = async (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || "",
      permissions: [...role.permissions],
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const openUsersModal = async (roleId) => {
    try {
      const res = await fetch(`/api/admin/roles/${roleId}`);
      const json = await res.json();
      if (json.success) {
        setViewRoleUsers(json.role);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle individual permission
  const togglePermission = (permKey) => {
    setFormData((prev) => {
      const perms = new Set(prev.permissions);
      if (perms.has(permKey)) {
        perms.delete(permKey);
      } else {
        perms.add(permKey);
      }
      return { ...prev, permissions: Array.from(perms) };
    });
  };

  // Toggle entire module permissions
  const toggleModulePermissions = (moduleName) => {
    const mod = PERMISSION_CATALOG.find((m) => m.module === moduleName);
    if (!mod) return;

    const modPermKeys = mod.actions.map((a) => `${mod.module}.${a.action}`);
    const allSelected = modPermKeys.every((pk) => formData.permissions.includes(pk));

    setFormData((prev) => {
      const perms = new Set(prev.permissions);
      if (allSelected) {
        modPermKeys.forEach((pk) => perms.delete(pk));
      } else {
        modPermKeys.forEach((pk) => perms.add(pk));
      }
      return { ...prev, permissions: Array.from(perms) };
    });
  };

  // Select all permissions shortcut
  const selectAllPermissions = () => {
    const all = getAllPermissionKeys();
    setFormData((prev) => ({ ...prev, permissions: all }));
  };

  // Clear all permissions
  const clearAllPermissions = () => {
    setFormData((prev) => ({ ...prev, permissions: [] }));
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const url = editingRole ? `/api/admin/roles/${editingRole.id}` : "/api/admin/roles";
      const method = editingRole ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!json.success) {
        setFormError(json.error || "Failed to save role");
      } else {
        setIsModalOpen(false);
        fetchRoles();
      }
    } catch (err) {
      setFormError("Network error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRole = async (role) => {
    if (role.isSystem) {
      alert("System protected roles cannot be deleted.");
      return;
    }
    if (!confirm(`Are you sure you want to delete role "${role.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/roles/${role.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        fetchRoles();
      } else {
        alert(json.error || "Failed to delete role");
      }
    } catch (err) {
      alert("Failed to delete role");
    }
  };

  const filteredRoles = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout requiredPermission="roles.view">
      <div className="page-header">
        <div>
          <h1 className="page-title">Roles & Access Control</h1>
          <p className="page-subtitle">
            Configure system roles and grant granular module action permissions across the platform.
          </p>
        </div>

        <PermissionGuard permission="roles.create">
          <button onClick={openCreateModal} className="btn btn-primary">
            <Plus size={16} />
            <span>Create New Role</span>
          </button>
        </PermissionGuard>
      </div>

      {/* Search & Filters */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "12px" }}>
        <div style={{ position: "relative", maxWidth: "340px", width: "100%" }}>
          <input
            type="text"
            className="form-input"
            style={{ width: "100%", paddingLeft: "36px" }}
            placeholder="Search roles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search
            size={16}
            style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
          />
        </div>
      </div>

      {/* Roles Grid */}
      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
          Loading role definitions...
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "18px",
          }}
        >
          {filteredRoles.map((role) => (
            <div
              key={role.id}
              className="glass-card"
              style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                borderLeft: role.isSystem ? "4px solid var(--primary)" : "1px solid var(--border-primary)",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div>
                    <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)" }}>
                      {role.name}
                    </h3>
                    <code style={{ fontSize: "0.75rem", color: "var(--primary)", backgroundColor: "rgba(99, 102, 241, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                      {role.slug}
                    </code>
                  </div>
                  {role.isSystem && (
                    <span className="badge badge-primary" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Lock size={12} />
                      System Protected
                    </span>
                  )}
                </div>

                <p style={{ fontSize: "0.83rem", color: "var(--text-secondary)", marginBottom: "16px", minHeight: "38px" }}>
                  {role.description || "No description provided for this role."}
                </p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "10px 14px",
                    backgroundColor: "rgba(0, 0, 0, 0.25)",
                    borderRadius: "var(--radius-md)",
                    marginBottom: "18px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    <ShieldCheck size={16} color="var(--primary)" />
                    <span><strong>{role.permissions.length}</strong> Permissions</span>
                  </div>

                  <button
                    onClick={() => openUsersModal(role.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    <Users size={16} color="var(--success)" />
                    <span><strong>{role.userCount}</strong> Users</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  paddingTop: "14px",
                  borderTop: "1px solid var(--border-subtle)",
                }}
              >
                <PermissionGuard permission="roles.edit">
                  <button
                    onClick={() => openEditModal(role)}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                  >
                    <Edit2 size={14} />
                    <span>Edit Permissions</span>
                  </button>
                </PermissionGuard>

                {!role.isSystem && (
                  <PermissionGuard permission="roles.delete">
                    <button
                      onClick={() => handleDeleteRole(role)}
                      className="btn btn-danger btn-sm"
                      title="Delete role"
                    >
                      <Trash2 size={14} />
                    </button>
                  </PermissionGuard>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT ROLE MODAL WITH PERMISSIONS MATRIX */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRole ? `Edit Role: ${editingRole.name}` : "Create New Custom Role"}
        maxWidth="840px"
      >
        <form onSubmit={handleSaveRole}>
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div className="form-group">
              <label className="form-label">Role Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Warehouse Inventory Supervisor"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input
                type="text"
                className="form-input"
                placeholder="Brief summary of duties and access level"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          {/* Permissions Matrix Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              margin: "20px 0 12px",
              paddingBottom: "8px",
              borderBottom: "1px solid var(--border-primary)",
            }}
          >
            <div>
              <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Module Permissions Matrix ({formData.permissions.length} selected)
              </h4>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                Select the exact actions this role is authorized to perform on the server.
              </p>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={selectAllPermissions}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: "0.75rem" }}
              >
                Select All
              </button>
              <button
                type="button"
                onClick={clearAllPermissions}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: "0.75rem" }}
              >
                Deselect All
              </button>
            </div>
          </div>

          {/* Grouped Permission Checkbox Matrix */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              maxHeight: "380px",
              overflowY: "auto",
              paddingRight: "6px",
            }}
          >
            {PERMISSION_CATALOG.map((mod) => {
              const modPermKeys = mod.actions.map((a) => `${mod.module}.${a.action}`);
              const selectedCount = modPermKeys.filter((pk) => formData.permissions.includes(pk)).length;
              const allSelected = selectedCount === modPermKeys.length;

              return (
                <div
                  key={mod.module}
                  style={{
                    backgroundColor: "rgba(31, 41, 55, 0.4)",
                    border: "1px solid var(--border-primary)",
                    borderRadius: "var(--radius-md)",
                    padding: "14px 16px",
                  }}
                >
                  {/* Module Header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "10px",
                      cursor: "pointer",
                    }}
                    onClick={() => toggleModulePermissions(mod.module)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                        {mod.moduleLabel}
                      </span>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          backgroundColor: selectedCount > 0 ? "rgba(99, 102, 241, 0.2)" : "rgba(255,255,255,0.05)",
                          color: selectedCount > 0 ? "var(--primary)" : "var(--text-muted)",
                          fontWeight: 600,
                        }}
                      >
                        {selectedCount}/{modPermKeys.length}
                      </span>
                    </div>

                    <button
                      type="button"
                      style={{
                        background: "none",
                        border: "none",
                        color: allSelected ? "var(--primary)" : "var(--text-muted)",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      {allSelected ? "Unselect Module" : "Select All Module"}
                    </button>
                  </div>

                  {/* Actions Checkboxes */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: "8px",
                    }}
                  >
                    {mod.actions.map((act) => {
                      const permKey = `${mod.module}.${act.action}`;
                      const isChecked = formData.permissions.includes(permKey);

                      return (
                        <label
                          key={permKey}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "8px",
                            padding: "8px 10px",
                            borderRadius: "var(--radius-sm)",
                            backgroundColor: isChecked ? "rgba(99, 102, 241, 0.12)" : "rgba(17, 24, 39, 0.5)",
                            border: isChecked ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid var(--border-subtle)",
                            cursor: "pointer",
                            transition: "all 0.1s ease",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePermission(permKey)}
                            style={{ marginTop: "2px" }}
                          />
                          <div>
                            <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: isChecked ? "#ffffff" : "var(--text-primary)" }}>
                              {act.label}
                            </div>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                              {permKey}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modal Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              marginTop: "24px",
              paddingTop: "16px",
              borderTop: "1px solid var(--border-primary)",
            }}
          >
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : editingRole ? "Save Changes" : "Create Role"}
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW USERS ASSIGNED TO ROLE MODAL */}
      <Modal
        isOpen={!!viewRoleUsers}
        onClose={() => setViewRoleUsers(null)}
        title={`Users assigned to "${viewRoleUsers?.name}"`}
        maxWidth="540px"
      >
        {viewRoleUsers?.users?.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textAlign: "center", padding: "20px 0" }}>
            No users are currently assigned to this role.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {viewRoleUsers?.users?.map((u) => (
              <div
                key={u.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "rgba(31, 41, 55, 0.5)",
                  border: "1px solid var(--border-primary)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: "var(--primary-light)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      color: "var(--primary)",
                    }}
                  >
                    {u.name?.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>{u.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{u.email}</div>
                  </div>
                </div>
                <span className="badge badge-success">{u.status}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
