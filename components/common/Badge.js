import React from "react";

export function Badge({ children, variant = "neutral", className = "" }) {
  const variantClass = {
    primary: "badge-primary",
    success: "badge-success",
    warning: "badge-warning",
    danger: "badge-danger",
    neutral: "badge-neutral",
  }[variant] || "badge-neutral";

  return <span className={`badge ${variantClass} ${className}`}>{children}</span>;
}

export function StatusBadge({ status }) {
  const statusLower = (status || "").toLowerCase();

  let variant = "neutral";
  if (["active", "delivered", "approved", "paid"].includes(statusLower)) {
    variant = "success";
  } else if (["pending", "processing", "shipped", "draft"].includes(statusLower)) {
    variant = "warning";
  } else if (["cancelled", "rejected", "disabled", "inactive", "archived", "suspended"].includes(statusLower)) {
    variant = "danger";
  } else if (["confirmed", "variable", "simple"].includes(statusLower)) {
    variant = "primary";
  }

  return <Badge variant={variant}>{status}</Badge>;
}
