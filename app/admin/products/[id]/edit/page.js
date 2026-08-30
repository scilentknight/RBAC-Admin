"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { formatCurrency, slugify } from "@/lib/utils";
import { ArrowLeft, Save, Plus, Trash2, Layers } from "lucide-react";
import Link from "next/link";

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams();

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [type, setType] = useState("SIMPLE");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [variants, setVariants] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [prodRes, catRes, brandRes] = await Promise.all([
          fetch(`/api/admin/products/${id}`),
          fetch("/api/admin/categories"),
          fetch("/api/admin/brands"),
        ]);

        const prodJson = await prodRes.json();
        const catJson = await catRes.json();
        const brandJson = await brandRes.json();

        if (catJson.success) setCategories(catJson.categories);
        if (brandJson.success) setBrands(brandJson.brands);

        if (prodJson.success && prodJson.product) {
          const p = prodJson.product;
          setName(p.name);
          setSlug(p.slug);
          setShortDescription(p.shortDescription || "");
          setDescription(p.description || "");
          setStatus(p.status);
          setType(p.type);
          setCategoryId(p.categoryId || "");
          setBrandId(p.brandId || "");
          setImageUrl(p.images?.[0]?.url || "");
          setVariants(p.variants || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadData();
  }, [id]);

  const updateVariant = (idx, field, val) => {
    setVariants((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const payload = {
        name,
        slug,
        shortDescription,
        description,
        status,
        categoryId: categoryId || null,
        brandId: brandId || null,
        images: imageUrl ? [imageUrl] : [],
        variants: variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          barcode: v.barcode,
          price: parseFloat(v.price),
          compareAtPrice: v.compareAtPrice ? parseFloat(v.compareAtPrice) : null,
          stock: parseInt(v.stock),
          lowStockThreshold: parseInt(v.lowStockThreshold || 5),
          status: v.status || "ACTIVE",
        })),
      };

      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Failed to update product");
      } else {
        router.push("/admin/products");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout requiredPermission="products.edit">
        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
          Loading product...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout requiredPermission="products.edit">
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Link href="/admin/products" style={{ color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
              <ArrowLeft size={16} />
            </Link>
            <h1 className="page-title">Edit Product: {name}</h1>
          </div>
          <p className="page-subtitle">
            Update pricing, stock inventory, and SKU variations.
          </p>
        </div>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: "var(--danger-light)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#fca5a5",
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            fontSize: "0.875rem",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Basic Info */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "16px" }}>
            Product Information
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">Product Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Slug</label>
              <input
                type="text"
                className="form-input"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.parent ? `${c.parent.name} > ` : ""}{c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Brand</label>
              <select
                className="form-select"
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
              >
                <option value="">None</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="DRAFT">DRAFT</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Image URL</label>
            <input
              type="url"
              className="form-input"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Variants & SKUs List */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "14px" }}>
            Variations & SKU Inventory ({variants.length} SKUs)
          </h3>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU Code</th>
                  <th>Attributes / Dimension</th>
                  <th>Price ($)</th>
                  <th>Compare ($)</th>
                  <th>Stock</th>
                  <th>Low Alert</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v, idx) => {
                  const attrDesc = v.attributeValues
                    ?.map((av) => `${av.attributeValue?.attribute?.name || "Attr"}: ${av.attributeValue?.value}`)
                    .join(", ");

                  return (
                    <tr key={v.id || idx}>
                      <td>
                        <input
                          type="text"
                          className="form-input"
                          style={{ padding: "6px 8px", width: "160px", fontSize: "0.8rem" }}
                          value={v.sku}
                          onChange={(e) => updateVariant(idx, "sku", e.target.value)}
                          required
                        />
                      </td>
                      <td>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 500 }}>
                          {attrDesc || "Standard Variant"}
                        </span>
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          className="form-input"
                          style={{ padding: "6px 8px", width: "90px", fontSize: "0.8rem" }}
                          value={v.price}
                          onChange={(e) => updateVariant(idx, "price", e.target.value)}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          className="form-input"
                          style={{ padding: "6px 8px", width: "90px", fontSize: "0.8rem" }}
                          value={v.compareAtPrice || ""}
                          onChange={(e) => updateVariant(idx, "compareAtPrice", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-input"
                          style={{ padding: "6px 8px", width: "80px", fontSize: "0.8rem" }}
                          value={v.stock}
                          onChange={(e) => updateVariant(idx, "stock", e.target.value)}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-input"
                          style={{ padding: "6px 8px", width: "70px", fontSize: "0.8rem" }}
                          value={v.lowStockThreshold || 5}
                          onChange={(e) => updateVariant(idx, "lowStockThreshold", e.target.value)}
                        />
                      </td>
                      <td>
                        <select
                          className="form-select"
                          style={{ padding: "6px 8px", fontSize: "0.8rem" }}
                          value={v.status || "ACTIVE"}
                          onChange={(e) => updateVariant(idx, "status", e.target.value)}
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="INACTIVE">INACTIVE</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginBottom: "40px" }}>
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="btn btn-secondary"
            disabled={submitting}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
            {submitting ? "Saving..." : "Save Product Changes"}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
