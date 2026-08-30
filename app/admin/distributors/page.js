"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PermissionGuard } from "@/components/common/PermissionGuard";
import { Modal } from "@/components/common/Modal";
import { StatusBadge } from "@/components/common/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Truck,
  FileCheck,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Plus,
  Building2,
  Phone,
  Mail,
} from "lucide-react";

export default function DistributorsPage() {
  const [distributors, setDistributors] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("applications"); // 'applications' or 'directory'
  const [search, setSearch] = useState("");

  // Review Modal State
  const [selectedApp, setSelectedApp] = useState(null);
  const [reviewAction, setReviewAction] = useState("approve"); // 'approve' or 'reject'
  const [reviewNotes, setReviewNotes] = useState("");
  const [creditLimit, setCreditLimit] = useState("15000");
  const [submitting, setSubmitting] = useState(false);

  const fetchDistributors = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/distributors");
      const json = await res.json();
      if (json.success) {
        setDistributors(json.distributors);
        setApplications(json.applications);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistributors();
  }, []);

  const openReviewModal = (app, action) => {
    setSelectedApp(app);
    setReviewAction(action);
    setReviewNotes(
      action === "approve"
        ? "All compliance documents and credit score verified."
        : "Application rejected due to business compliance requirements."
    );
    setCreditLimit("15000");
  };

  const handleProcessReview = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;

    setSubmitting(true);
    try {
      const endpoint =
        reviewAction === "approve"
          ? `/api/admin/distributors/applications/${selectedApp.id}/approve`
          : `/api/admin/distributors/applications/${selectedApp.id}/reject`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewNotes, creditLimit }),
      });

      const json = await res.json();
      if (json.success) {
        alert(json.message);
        setSelectedApp(null);
        fetchDistributors();
      } else {
        alert(json.error || "Review operation failed");
      }
    } catch (err) {
      alert("Network error processing review");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredApps = applications.filter(
    (a) =>
      a.companyName.toLowerCase().includes(search.toLowerCase()) ||
      a.applicantName.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredDistros = distributors.filter(
    (d) =>
      d.companyName.toLowerCase().includes(search.toLowerCase()) ||
      d.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout requiredPermission="distributors.view">
      <div className="page-header">
        <div>
          <h1 className="page-title">Distributors & Applications</h1>
          <p className="page-subtitle">
            Review partner distributor applications, credit limits, and wholesale accounts.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          onClick={() => setTab("applications")}
          className={`btn ${tab === "applications" ? "btn-primary" : "btn-secondary"}`}
        >
          <FileCheck size={16} />
          <span>Applications ({applications.filter((a) => a.status === "PENDING").length} Pending)</span>
        </button>

        <button
          onClick={() => setTab("directory")}
          className={`btn ${tab === "directory" ? "btn-primary" : "btn-secondary"}`}
        >
          <Truck size={16} />
          <span>Active Distributors ({distributors.length})</span>
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "20px", maxWidth: "340px" }}>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            className="form-input"
            style={{ width: "100%", paddingLeft: "36px" }}
            placeholder={`Search ${tab === "applications" ? "applications" : "distributors"}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        </div>
      </div>

      {/* APPLICATIONS TAB */}
      {tab === "applications" && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Company & Applicant</th>
                <th>Business Type</th>
                <th>Annual Revenue</th>
                <th>Submitted Date</th>
                <th>Status</th>
                <th>Reviewer Notes</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "var(--text-secondary)" }}>
                    Loading applications...
                  </td>
                </tr>
              ) : filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "var(--text-secondary)" }}>
                    No applications found.
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{app.companyName}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{app.applicantName}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{app.email} • {app.phone}</div>
                      </div>
                    </td>

                    <td>
                      <span style={{ fontSize: "0.85rem" }}>{app.businessType}</span>
                    </td>

                    <td>
                      <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{app.annualRevenue || "N/A"}</span>
                    </td>

                    <td style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                      {formatDate(app.createdAt)}
                    </td>

                    <td>
                      <StatusBadge status={app.status} />
                    </td>

                    <td>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", maxWidth: "220px", display: "inline-block" }}>
                        {app.reviewNotes || "Awaiting review"}
                      </span>
                    </td>

                    <td style={{ textAlign: "right" }}>
                      {app.status === "PENDING" ? (
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <PermissionGuard permission="distributors.approve">
                            <button
                              onClick={() => openReviewModal(app, "approve")}
                              className="btn btn-success btn-sm"
                              title="Approve application"
                            >
                              <CheckCircle size={14} />
                              <span>Approve</span>
                            </button>
                          </PermissionGuard>

                          <PermissionGuard permission="distributors.reject">
                            <button
                              onClick={() => openReviewModal(app, "reject")}
                              className="btn btn-danger btn-sm"
                              title="Reject application"
                            >
                              <XCircle size={14} />
                              <span>Reject</span>
                            </button>
                          </PermissionGuard>
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          Reviewed by {app.reviewedBy?.name || "Admin"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* DIRECTORY TAB */}
      {tab === "directory" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "18px",
          }}
        >
          {filteredDistros.map((d) => (
            <div key={d.id} className="glass-card" style={{ padding: "22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>{d.companyName}</h3>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Contact: {d.name}</div>
                </div>
                <StatusBadge status={d.status} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Mail size={13} color="var(--primary)" />
                  <span>{d.email}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Phone size={13} color="var(--primary)" />
                  <span>{d.phone}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Building2 size={13} color="var(--primary)" />
                  <span>{d.address}, {d.city}, {d.state}</span>
                </div>
              </div>

              <div style={{ padding: "10px 14px", backgroundColor: "rgba(0,0,0,0.25)", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Approved Credit Line:</span>
                <strong style={{ fontSize: "0.95rem", color: "var(--success)" }}>{formatCurrency(d.creditLimit)}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REVIEW APPLICATION MODAL */}
      <Modal
        isOpen={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        title={`${reviewAction === "approve" ? "Approve" : "Reject"} Application: ${selectedApp?.companyName}`}
        maxWidth="540px"
      >
        <form onSubmit={handleProcessReview}>
          <div style={{ marginBottom: "16px", padding: "12px", backgroundColor: "rgba(31, 41, 55, 0.5)", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>Applicant: {selectedApp?.applicantName}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Email: {selectedApp?.email} • Type: {selectedApp?.businessType}</div>
          </div>

          {reviewAction === "approve" && (
            <div className="form-group">
              <label className="form-label">Approved Credit Limit ($)</label>
              <input
                type="number"
                className="form-input"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Reviewer Notes</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              required
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
            <button type="button" onClick={() => setSelectedApp(null)} className="btn btn-secondary" disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className={`btn ${reviewAction === "approve" ? "btn-success" : "btn-danger"}`}
              disabled={submitting}
            >
              {submitting ? "Processing..." : reviewAction === "approve" ? "Confirm Approval" : "Confirm Rejection"}
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
