"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";

/**
 * Conditionally render elements based on user permissions
 * @param {Object} props
 * @param {string} [props.permission] - Single required permission (e.g. "products.edit")
 * @param {string[]} [props.anyOf] - Array of permissions where at least one is required
 * @param {string[]} [props.allOf] - Array of permissions where all are required
 * @param {React.ReactNode} [props.fallback] - Fallback to render if forbidden
 * @param {boolean} [props.disableInsteadOfHide] - Clones child button and sets disabled attribute with tooltip
 */
export function PermissionGuard({
  permission,
  anyOf,
  allOf,
  children,
  fallback = null,
  disableInsteadOfHide = false,
}) {
  const { user, hasPermission, hasAnyPermission } = useAuth();

  if (!user) return fallback;

  let isAllowed = true;

  if (permission) {
    isAllowed = hasPermission(permission);
  } else if (anyOf && anyOf.length > 0) {
    isAllowed = hasAnyPermission(anyOf);
  } else if (allOf && allOf.length > 0) {
    isAllowed = allOf.every((p) => hasPermission(p));
  }

  if (isAllowed) {
    return <>{children}</>;
  }

  if (disableInsteadOfHide && React.isValidElement(children)) {
    return React.cloneElement(children, {
      disabled: true,
      title: `Permission Required: ${permission || anyOf?.join(" or ") || ""}`,
      style: { ...(children.props.style || {}), opacity: 0.4, cursor: "not-allowed" },
    });
  }

  return fallback;
}
