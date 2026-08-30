"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PermissionGuard } from "@/components/common/PermissionGuard";
import { StatusBadge, Badge } from "@/components/common/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Search,
  Download,
  Filter,
  Layers,
  AlertTriangle,
} from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.set("search", search);
      if (categoryId) query.set("categoryId", categoryId);
      if (brandId) query.set("brandId", brandId);
      if (type) query.set("type", type);
      if (status) query.set("status", status);

      const [prodRes, catRes, brandRes] = await Promise.all([
        fetch(`/api/admin/products?${query.toString()}`),
        fetch("/api/admin/categories"),
        fetch("/api/admin/brands"),
      ]);

      const prodJson = await prodRes.json();
      const catJson = await catRes.json();
      const brandJson = await brandRes.json();

      if (prodJson.success) setProducts(prodJson.products);
      if (catJson.success) setCategories(catJson.categories);
      if (brandJson.success) setBrands(brandJson.brands);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, categoryId, brandId, type, status]);

  const handleDelete = async (prod) => {
    if (!confirm(`Are you sure you want to delete product "${prod.name}" and all its SKUs?`)) return;

    try {
      const res = await fetch(`/api/admin/products/${prod.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        fetchProducts();
      } else {
        alert(json.error || "Failed to delete product");
      }
    } catch (err) {
      alert("Delete failed");
    }
  };

  return (
    <AdminLayout requiredPermission="products.view">
      <div className="page-header">
        <div>
          <h1 className="page-title">Product Catalog & SKUs</h1>
          <p className="page-subtitle">
            Manage simple and variable products, multi-attribute SKU variations, and stock inventory.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <PermissionGuard permission="products.export">
            <a
              href="/api/admin/products/export"
              download
              className="btn btn-secondary"
              title="Export all products to CSV"
            >
              <Download size={16} />
              <span>Export CSV</span>
            </a>
          </PermissionGuard>

          <PermissionGuard permission="products.create">
            <Link href="/admin/products/new" className="btn btn-primary">
              <Plus size={16} />
              <span>Create Product</span>
            </Link>
          </PermissionGuard>
        </div>
      </div>

      {/* Filters Bar */}
      <div
        className="glass-panel"
        style={{
          padding: "16px 20px",
          marginBottom: "20px",
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", minWidth: "260px", flex: 1 }}>
          <input
            type="text"
            className="form-input"
            style={{ width: "100%", paddingLeft: "36px" }}
            placeholder="Search by name, slug, or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        </div>

        <select
          className="form-select"
          style={{ minWidth: "160px" }}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          className="form-select"
          style={{ minWidth: "150px" }}
          value={brandId}
          onChange={(e) => setBrandId(e.target.value)}
        >
          <option value="">All Brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <select
          className="form-select"
          style={{ minWidth: "140px" }}
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="SIMPLE">Simple</option>
          <option value="VARIABLE">Variable</option>
        </select>

        <select
          className="form-select"
          style={{ minWidth: "140px" }}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="DRAFT">DRAFT</option>
          <option value="ARCHIVED">ARCHIVED</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Type</th>
              <th>Category & Brand</th>
              <th>Price</th>
              <th>Variations & SKUs</th>
              <th>Total Stock</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "var(--text-secondary)" }}>
                  Loading catalog...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "var(--text-secondary)" }}>
                  No products found matching filters.
                </td>
              </tr>
            ) : (
              products.map((prod) => {
                const isLowStock = prod.variants.some((v) => v.stock <= v.lowStockThreshold);

                return (
                  <tr key={prod.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {prod.primaryImage ? (
                          <img
                            src={prod.primaryImage}
                            alt={prod.name}
                            style={{ width: "42px", height: "42px", borderRadius: "8px", objectFit: "cover" }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "42px",
                              height: "42px",
                              borderRadius: "8px",
                              backgroundColor: "var(--bg-tertiary)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "var(--text-muted)",
                            }}
                          >
                            <Package size={20} />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{prod.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{prod.slug}</div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={`badge ${prod.type === "VARIABLE" ? "badge-primary" : "badge-neutral"}`}>
                        {prod.type}
                      </span>
                    </td>

                    <td>
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 500 }}>{prod.category?.name || "Uncategorized"}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{prod.brand?.name || "No Brand"}</div>
                      </div>
                    </td>

                    <td style={{ fontWeight: 700 }}>
                      {typeof prod.priceRange === "object"
                        ? `${formatCurrency(prod.priceRange.min)} - ${formatCurrency(prod.priceRange.max)}`
                        : formatCurrency(prod.priceRange)}
                    </td>

                    <td>
                      {prod.type === "VARIABLE" ? (
                        <div>
                          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--primary)" }}>
                            {prod.variantCount} SKU Variations
                          </span>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {prod.variants.map((v) => v.sku).join(", ")}
                          </div>
                        </div>
                      ) : (
                        <code style={{ fontSize: "0.75rem", color: "var(--text-primary)" }}>
                          {prod.variants[0]?.sku || "SKU-01"}
                        </code>
                      )}
                    </td>

                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontWeight: 700 }}>{prod.totalStock} units</span>
                        {isLowStock && (
                          <span title="Low stock on one or more SKUs">
                            <AlertTriangle size={14} color="var(--warning)" />
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <StatusBadge status={prod.status} />
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <PermissionGuard permission="products.edit">
                          <Link
                            href={`/admin/products/${prod.id}/edit`}
                            className="btn btn-secondary btn-sm"
                            title="Edit product & variations"
                          >
                            <Edit2 size={14} />
                          </Link>
                        </PermissionGuard>

                        <PermissionGuard permission="products.delete">
                          <button
                            onClick={() => handleDelete(prod)}
                            className="btn btn-danger btn-sm"
                            title="Delete product"
                          >
                            <Trash2 size={14} />
                          </button>
                        </PermissionGuard>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
