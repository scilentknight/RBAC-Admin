"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PermissionGuard } from "@/components/common/PermissionGuard";
import { Modal } from "@/components/common/Modal";
import { StatusBadge } from "@/components/common/Badge";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/lib/utils";
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
  Shield,
  Key,
  Eye,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function UsersManagementPage() {
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Create/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    roleIds: [],
    status: "ACTIVE",
    dealerId: "",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // View Permissions Inspector
  const [inspectUser, setInspectUser] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.set("search", search);
      if (roleFilter) query.set("roleId", roleFilter);
      if (statusFilter) query.set("status", statusFilter);

      const [usersRes, rolesRes, dealersRes] = await Promise.all([
        fetch(`/api/admin/users?${query.toString()}`),
        fetch("/api/admin/roles"),
        fetch("/api/admin/dealers"),
      ]);

      const usersJson = await usersRes.json();
      const rolesJson = await rolesRes.json();
      const dealersJson = await dealersRes.json();

      if (usersJson.success) setUsers(usersJson.users);
      if (rolesJson.success) setRoles(rolesJson.roles);
      if (dealersJson.success) setDealers(dealersJson.dealers);
    } catch (err) {
      console.error("Users fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, roleFilter, statusFilter]);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      roleIds: roles.length > 0 ? [roles[0].id] : [],
      status: "ACTIVE",
      dealerId: "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "", // Keep blank unless updating
      roleIds: user.roles.map((r) => r.id),
      status: user.status,
      dealerId: user.dealerId || "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const toggleRoleSelection = (roleId) => {
    setFormData((prev) => {
      const set = new Set(prev.roleIds);
      if (set.has(roleId)) {
        set.delete(roleId);
      } else {
        set.add(roleId);
      }
      return { ...prev, roleIds: Array.from(set) };
    });
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : "/api/admin/users";
      const method = editingUser ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!json.success) {
        setFormError(json.error || "Failed to save user");
      } else {
        setIsModalOpen(false);
        fetchData();
      }
    } catch (err) {
      setFormError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.id === authUser.id) {
      alert("You cannot delete your own active account.");
      return;
    }
    if (!confirm(`Are you sure you want to delete user "${user.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        fetchData();
      } else {
        alert(json.error || "Failed to delete user");
      }
    } catch (err) {
      alert("Network error deleting user");
    }
  };

  return (
    <AdminLayout requiredPermission="users.view">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">
            Admin accounts, status management, and role assignments.
          </p>
        </div>

        <PermissionGuard permission="users.create">
          <button onClick={openCreateModal} className="btn btn-primary">
            <Plus size={16} />
            <span>Create New User</span>
          </button>
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
        <div style={{ position: "relative", minWidth: "260px", flex: 1 }}>
          <input
            type="text"
            className="form-input"
            style={{ width: "100%", paddingLeft: "36px" }}
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search
            size={16}
            style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
          />
        </div>

        <select
          className="form-select"
          style={{ minWidth: "180px" }}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <select
          className="form-select"
          style={{ minWidth: "150px" }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="DISABLED">DISABLED</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Assigned Roles</th>
              <th>Status</th>
              <th>Associated Dealer</th>
              <th>Permissions</th>
              <th>Created Date</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "var(--text-secondary)" }}>
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "var(--text-secondary)" }}>
                  No users found matching filters.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          backgroundColor: "var(--primary-light)",
                          border: "1px solid var(--border-highlight)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          color: "var(--primary)",
                          overflow: "hidden",
                        }}
                      >
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          u.name?.charAt(0) || "U"
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{u.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {u.roles.map((r) => (
                        <span key={r.id} className="badge badge-primary">
                          {r.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={u.status} />
                  </td>
                  <td>
                    {u.dealer ? (
                      <span style={{ fontSize: "0.8rem", color: "var(--text-primary)", fontWeight: 500 }}>
                        {u.dealer.name} <code style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>({u.dealer.code})</code>
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>None (Direct Admin)</span>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => setInspectUser(u)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                    >
                      <Eye size={13} />
                      <span>{u.permissionsCount} Perms</span>
                    </button>
                  </td>
                  <td style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                    {formatDate(u.createdAt)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "6px" }}>
                      <PermissionGuard permission="users.edit">
                        <button
                          onClick={() => openEditModal(u)}
                          className="btn btn-secondary btn-sm"
                          title="Edit user"
                        >
                          <Edit2 size={14} />
                        </button>
                      </PermissionGuard>

                      {u.id !== authUser.id && (
                        <PermissionGuard permission="users.delete">
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="btn btn-danger btn-sm"
                            title="Delete user"
                          >
                            <Trash2 size={14} />
                          </button>
                        </PermissionGuard>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE / EDIT USER MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? `Edit User: ${editingUser.name}` : "Create New Admin User"}
        maxWidth="600px"
      >
        <form onSubmit={handleSaveUser}>
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

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Jane Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="jane@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Password {editingUser && <span style={{ textTransform: "none", color: "var(--text-muted)" }}>(leave blank to keep)</span>}
              </label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingUser}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "4px" }}>
            <div className="form-group">
              <label className="form-label">Account Status</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="ACTIVE">ACTIVE (Enabled)</option>
                <option value="DISABLED">DISABLED (Suspended)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Associate with Dealer (Optional)</label>
              <select
                className="form-select"
                value={formData.dealerId}
                onChange={(e) => setFormData({ ...formData, dealerId: e.target.value })}
              >
                <option value="">None (HQ Admin)</option>
                {dealers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Role Assigners */}
          <div style={{ marginTop: "12px" }}>
            <label className="form-label" style={{ marginBottom: "8px", display: "block" }}>
              Assign Roles
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {roles.map((r) => {
                const isSelected = formData.roleIds.includes(r.id);
                return (
                  <div
                    key={r.id}
                    onClick={() => toggleRoleSelection(r.id)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: isSelected ? "rgba(99, 102, 241, 0.15)" : "rgba(31, 41, 55, 0.5)",
                      border: isSelected ? "1px solid var(--primary)" : "1px solid var(--border-primary)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>{r.name}</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{r.permissions?.length || 0} permissions</div>
                    </div>
                    {isSelected && <CheckCircle size={16} color="var(--primary)" />}
                  </div>
                );
              })}
            </div>
          </div>

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
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : editingUser ? "Update User" : "Create User"}
            </button>
          </div>
        </form>
      </Modal>

      {/* PERMISSIONS INSPECTOR MODAL */}
      <Modal
        isOpen={!!inspectUser}
        onClose={() => setInspectUser(null)}
        title={`Effective Permissions for ${inspectUser?.name}`}
        maxWidth="680px"
      >
        <div style={{ marginBottom: "14px" }}>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Roles: <strong>{inspectUser?.roles?.map((r) => r.name).join(", ")}</strong>
          </p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "360px", overflowY: "auto" }}>
          {inspectUser?.permissions?.map((p) => (
            <span
              key={p}
              style={{
                padding: "4px 8px",
                backgroundColor: "rgba(99, 102, 241, 0.1)",
                border: "1px solid rgba(99, 102, 241, 0.25)",
                borderRadius: "4px",
                fontSize: "0.75rem",
                fontFamily: "var(--font-mono)",
                color: "#a5b4fc",
              }}
            >
              {p}
            </span>
          ))}
        </div>
      </Modal>
    </AdminLayout>
  );
}
