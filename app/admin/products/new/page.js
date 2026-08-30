"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { slugify, cartesianProduct } from "@/lib/utils";
import {
  Package,
  Plus,
  Trash2,
  Sparkles,
  ArrowLeft,
  Layers,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import Link from "next/link";

export default function CreateProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Product Basic State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("VARIABLE"); // SIMPLE or VARIABLE
  const [status, setStatus] = useState("ACTIVE");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // Simple Product Fields
  const [simplePrice, setSimplePrice] = useState("49.99");
  const [simpleComparePrice, setSimpleComparePrice] = useState("");
  const [simpleSku, setSimpleSku] = useState("");
  const [simpleStock, setSimpleStock] = useState("50");
  const [simpleLowStock, setSimpleLowStock] = useState("5");
  const [simpleBarcode, setSimpleBarcode] = useState("");

  // Variable Product Attribute Selection
  // Map of attributeId -> array of selected attributeValue objects
  const [selectedAttributeValues, setSelectedAttributeValues] = useState({});

  // Generated Variants Matrix
  const [generatedVariants, setGeneratedVariants] = useState([]);

  useEffect(() => {
    async function loadMeta() {
      try {
        const [catRes, brandRes, attrRes] = await Promise.all([
          fetch("/api/admin/categories"),
          fetch("/api/admin/brands"),
          fetch("/api/admin/attributes"),
        ]);
        const catJson = await catRes.json();
        const brandJson = await brandRes.json();
        const attrJson = await attrRes.json();

        if (catJson.success) setCategories(catJson.categories);
        if (brandJson.success) setBrands(brandJson.brands);
        if (attrJson.success) setAttributes(attrJson.attributes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadMeta();
  }, []);

  const handleNameChange = (val) => {
    setName(val);
    const generatedSlug = slugify(val);
    setSlug(generatedSlug);
    if (type === "SIMPLE" && !simpleSku) {
      setSimpleSku(`${generatedSlug.toUpperCase().slice(0, 8)}-01`);
    }
  };

  // Toggle selection of attribute value
  const handleToggleAttrValue = (attribute, valueObj) => {
    setSelectedAttributeValues((prev) => {
      const currentList = prev[attribute.id] || [];
      const exists = currentList.some((v) => v.id === valueObj.id);

      let updatedList;
      if (exists) {
        updatedList = currentList.filter((v) => v.id !== valueObj.id);
      } else {
        updatedList = [...currentList, { ...valueObj, attributeName: attribute.name, attributeId: attribute.id }];
      }

      const next = { ...prev };
      if (updatedList.length === 0) {
        delete next[attribute.id];
      } else {
        next[attribute.id] = updatedList;
      }
      return next;
    });
  };

  // Generate Cartesian Combinations Matrix
  const handleGenerateVariations = () => {
    const attrIds = Object.keys(selectedAttributeValues);
    if (attrIds.length === 0) {
      alert("Please select at least one value from at least one attribute to generate variations.");
      return;
    }

    const valueArrays = attrIds.map((id) => selectedAttributeValues[id]);
    const combinations = cartesianProduct(valueArrays);

    const baseSlug = slug || slugify(name) || "PROD";

    const newVariants = combinations.map((combo, idx) => {
      const comboLabel = combo.map((c) => c.value).join(" / ");
      const skuSuffix = combo.map((c) => (c.code || slugify(c.value)).toUpperCase()).join("-");
      const generatedSku = `${baseSlug.toUpperCase().slice(0, 8)}-${skuSuffix}`;

      return {
        id: `temp-${idx}-${Date.now()}`,
        combinationLabel: comboLabel,
        attributeValueIds: combo.map((c) => c.id),
        sku: generatedSku,
        barcode: "",
        price: "49.99",
        compareAtPrice: "",
        stock: "20",
        lowStockThreshold: "5",
        status: "ACTIVE",
      };
    });

    setGeneratedVariants(newVariants);
  };

  const updateVariantRow = (index, field, value) => {
    setGeneratedVariants((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const removeVariantRow = (index) => {
    setGeneratedVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const payload = {
        name,
        slug: slug || slugify(name),
        shortDescription,
        description,
        type,
        status,
        categoryId: categoryId || null,
        brandId: brandId || null,
        images: imageUrl ? [imageUrl] : [],
      };

      if (type === "SIMPLE") {
        payload.price = simplePrice;
        payload.compareAtPrice = simpleComparePrice || null;
        payload.sku = simpleSku;
        payload.stock = simpleStock;
        payload.lowStockThreshold = simpleLowStock;
        payload.barcode = simpleBarcode || null;
      } else {
        if (generatedVariants.length === 0) {
          setError("Please generate at least one variation SKU for this variable product");
          setSubmitting(false);
          return;
        }
        payload.variants = generatedVariants.map((v) => ({
          sku: v.sku,
          barcode: v.barcode || null,
          price: v.price,
          compareAtPrice: v.compareAtPrice || null,
          stock: v.stock,
          lowStockThreshold: v.lowStockThreshold,
          attributeValueIds: v.attributeValueIds,
          status: v.status,
        }));
      }

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Failed to create product");
      } else {
        router.push("/admin/products");
      }
    } catch (err) {
      setError("Network error creating product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout requiredPermission="products.create">
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Link href="/admin/products" style={{ color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
              <ArrowLeft size={16} />
            </Link>
            <h1 className="page-title">Create New Product</h1>
          </div>
          <p className="page-subtitle">
            Configure catalog item details, attributes, and dynamic SKU variations.
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

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Basic Info Card */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "16px", color: "var(--text-primary)" }}>
            1. Basic Information
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">Product Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Nike Pro Dri-FIT T-Shirt"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Product Slug</label>
              <input
                type="text"
                className="form-input"
                placeholder="nike-pro-dri-fit-tshirt"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginTop: "8px" }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Select Category...</option>
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
                <option value="">Select Brand...</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Product Status</label>
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="ACTIVE">ACTIVE (Published)</option>
                <option value="DRAFT">DRAFT</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: "8px" }}>
            <label className="form-label">Primary Image URL</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://images.unsplash.com/..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Short Description</label>
            <input
              type="text"
              className="form-input"
              placeholder="Brief summary for listings..."
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Full Description</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Detailed product specifications and details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Product Type Switcher Card */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "14px" }}>
            2. Product Type & SKU Architecture
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "20px" }}>
            <div
              onClick={() => setType("SIMPLE")}
              style={{
                padding: "16px",
                borderRadius: "var(--radius-md)",
                backgroundColor: type === "SIMPLE" ? "rgba(99, 102, 241, 0.15)" : "rgba(31, 41, 55, 0.5)",
                border: type === "SIMPLE" ? "2px solid var(--primary)" : "1px solid var(--border-primary)",
                cursor: "pointer",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "4px" }}>
                Simple Product
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                Single standalone item without variations (e.g. Logitech MX Master Mouse).
              </div>
            </div>

            <div
              onClick={() => setType("VARIABLE")}
              style={{
                padding: "16px",
                borderRadius: "var(--radius-md)",
                backgroundColor: type === "VARIABLE" ? "rgba(99, 102, 241, 0.15)" : "rgba(31, 41, 55, 0.5)",
                border: type === "VARIABLE" ? "2px solid var(--primary)" : "1px solid var(--border-primary)",
                cursor: "pointer",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "4px" }}>
                Variable Product (Multi-SKU)
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                Multiple sellable variations (e.g. Color x Size x Storage combinations).
              </div>
            </div>
          </div>

          {/* Simple Product Fields */}
          {type === "SIMPLE" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
              <div className="form-group">
                <label className="form-label">SKU Code</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. LOGI-MX3S-GRY"
                  value={simpleSku}
                  onChange={(e) => setSimpleSku(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="99.99"
                  value={simplePrice}
                  onChange={(e) => setSimplePrice(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Compare-At Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="119.99"
                  value={simpleComparePrice}
                  onChange={(e) => setSimpleComparePrice(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Stock Quantity</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="50"
                  value={simpleStock}
                  onChange={(e) => setSimpleStock(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Low Stock Alert</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="5"
                  value={simpleLowStock}
                  onChange={(e) => setSimpleLowStock(e.target.value)}
                />
              </div>
            </div>
          ) : (
            /* Variable Product Attributes & Combination Generator */
            <div>
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
                  Select Variation Attributes & Values:
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {attributes.map((attr) => {
                    const selectedVals = selectedAttributeValues[attr.id] || [];

                    return (
                      <div
                        key={attr.id}
                        style={{
                          padding: "12px 16px",
                          borderRadius: "var(--radius-md)",
                          backgroundColor: "rgba(31, 41, 55, 0.4)",
                          border: "1px solid var(--border-primary)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                          <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)" }}>
                            {attr.name} ({attr.code})
                          </span>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                            {selectedVals.length} selected
                          </span>
                        </div>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                          {attr.values?.map((val) => {
                            const isSelected = selectedVals.some((v) => v.id === val.id);
                            return (
                              <button
                                key={val.id}
                                type="button"
                                onClick={() => handleToggleAttrValue(attr, val)}
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: "var(--radius-sm)",
                                  backgroundColor: isSelected ? "var(--primary)" : "rgba(17, 24, 39, 0.8)",
                                  color: isSelected ? "#ffffff" : "var(--text-secondary)",
                                  border: isSelected ? "1px solid var(--primary)" : "1px solid var(--border-primary)",
                                  fontSize: "0.8rem",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                              >
                                {val.code?.startsWith("#") && (
                                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: val.code }} />
                                )}
                                <span>{val.value}</span>
                                {isSelected && <Check size={12} />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={handleGenerateVariations}
                    className="btn btn-secondary"
                    style={{ borderColor: "var(--border-highlight)", color: "var(--primary)" }}
                  >
                    <Sparkles size={16} />
                    <span>Generate SKU Variations Matrix</span>
                  </button>
                </div>
              </div>

              {/* Generated Variants Table */}
              {generatedVariants.length > 0 && (
                <div style={{ marginTop: "20px" }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "10px" }}>
                    Generated SKUs ({generatedVariants.length} Variations):
                  </div>

                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Combination</th>
                          <th>SKU</th>
                          <th>Price ($)</th>
                          <th>Compare ($)</th>
                          <th>Stock</th>
                          <th>Low Alert</th>
                          <th style={{ textAlign: "right" }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {generatedVariants.map((v, idx) => (
                          <tr key={v.id}>
                            <td>
                              <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-primary)" }}>
                                {v.combinationLabel}
                              </span>
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-input"
                                style={{ padding: "6px 8px", fontSize: "0.8rem", width: "160px" }}
                                value={v.sku}
                                onChange={(e) => updateVariantRow(idx, "sku", e.target.value)}
                                required
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                step="0.01"
                                className="form-input"
                                style={{ padding: "6px 8px", fontSize: "0.8rem", width: "90px" }}
                                value={v.price}
                                onChange={(e) => updateVariantRow(idx, "price", e.target.value)}
                                required
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                step="0.01"
                                className="form-input"
                                style={{ padding: "6px 8px", fontSize: "0.8rem", width: "90px" }}
                                value={v.compareAtPrice}
                                onChange={(e) => updateVariantRow(idx, "compareAtPrice", e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-input"
                                style={{ padding: "6px 8px", fontSize: "0.8rem", width: "80px" }}
                                value={v.stock}
                                onChange={(e) => updateVariantRow(idx, "stock", e.target.value)}
                                required
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-input"
                                style={{ padding: "6px 8px", fontSize: "0.8rem", width: "70px" }}
                                value={v.lowStockThreshold}
                                onChange={(e) => updateVariantRow(idx, "lowStockThreshold", e.target.value)}
                              />
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <button
                                type="button"
                                onClick={() => removeVariantRow(idx)}
                                className="btn btn-danger btn-sm"
                                style={{ padding: "4px 8px" }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit Bar */}
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
            {submitting ? "Saving Product..." : "Create Product & SKUs"}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
