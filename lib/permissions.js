/**
 * Centralized Permission Catalog
 * Single source of truth for all modules and their actionable permissions.
 */

export const PERMISSION_CATALOG = [
  {
    module: "users",
    moduleLabel: "User Management",
    description: "Manage admin users, credentials, and role assignments",
    actions: [
      { action: "view", label: "View Users", description: "List and view admin user profiles" },
      { action: "create", label: "Create Users", description: "Create new admin user accounts" },
      { action: "edit", label: "Edit Users", description: "Update user profiles, status, and roles" },
      { action: "delete", label: "Delete Users", description: "Remove admin user accounts" },
    ],
  },
  {
    module: "roles",
    moduleLabel: "Roles & Permissions",
    description: "Define custom roles and assign fine-grained permissions",
    actions: [
      { action: "view", label: "View Roles", description: "List and view roles and their permissions" },
      { action: "create", label: "Create Roles", description: "Create new custom roles" },
      { action: "edit", label: "Edit Roles", description: "Update role details" },
      { action: "delete", label: "Delete Roles", description: "Delete existing roles" },
      { action: "manage_permissions", label: "Manage Role Permissions", description: "Assign/revoke permissions to roles" },
    ],
  },
  {
    module: "categories",
    moduleLabel: "Categories",
    description: "Manage hierarchical category taxonomy",
    actions: [
      { action: "view", label: "View Categories", description: "List and view categories and trees" },
      { action: "create", label: "Create Categories", description: "Add new parent and child categories" },
      { action: "edit", label: "Edit Categories", description: "Update category details and hierarchy" },
      { action: "delete", label: "Delete Categories", description: "Remove categories" },
    ],
  },
  {
    module: "brands",
    moduleLabel: "Brands",
    description: "Manage product brand catalog and logos",
    actions: [
      { action: "view", label: "View Brands", description: "List and view brand directories" },
      { action: "create", label: "Create Brands", description: "Add new brand entities" },
      { action: "edit", label: "Edit Brands", description: "Update brand information and logos" },
      { action: "delete", label: "Delete Brands", description: "Remove brands" },
    ],
  },
  {
    module: "attributes",
    moduleLabel: "Attributes & Values",
    description: "Manage dynamic product attributes (Color, Size, Storage, etc.)",
    actions: [
      { action: "view", label: "View Attributes", description: "List attributes and their values" },
      { action: "create", label: "Create Attributes", description: "Create new dynamic attributes and values" },
      { action: "edit", label: "Edit Attributes", description: "Update attribute names and values" },
      { action: "delete", label: "Delete Attributes", description: "Remove attributes and values" },
    ],
  },
  {
    module: "products",
    moduleLabel: "Products & Variations",
    description: "Manage simple and variable products, SKUs, and inventory",
    actions: [
      { action: "view", label: "View Products", description: "List products, variants, and stock" },
      { action: "create", label: "Create Products", description: "Create simple or multi-variant products" },
      { action: "edit", label: "Edit Products", description: "Update products, prices, and variant SKUs" },
      { action: "delete", label: "Delete Products", description: "Delete products and variants" },
      { action: "export", label: "Export Products", description: "Export product catalog data" },
    ],
  },
  {
    module: "orders",
    moduleLabel: "Order Management",
    description: "Manage customer orders, statuses, and variant line-items",
    actions: [
      { action: "view", label: "View Orders", description: "List and view order details and items" },
      { action: "edit", label: "Edit Orders", description: "Update order status and tracking details" },
      { action: "cancel", label: "Cancel Orders", description: "Cancel orders and restock inventory" },
      { action: "export", label: "Export Orders", description: "Export orders data to CSV" },
    ],
  },
  {
    module: "distributors",
    moduleLabel: "Distributors",
    description: "Manage distributor accounts and partnership applications",
    actions: [
      { action: "view", label: "View Distributors & Applications", description: "List distributors and review requests" },
      { action: "approve", label: "Approve Distributor Application", description: "Approve pending distributor applications" },
      { action: "reject", label: "Reject Distributor Application", description: "Reject distributor applications" },
    ],
  },
  {
    module: "dealers",
    moduleLabel: "Dealers",
    description: "Manage dealer profiles, regions, and authorized accounts",
    actions: [
      { action: "view", label: "View Dealers", description: "List and view dealer accounts" },
      { action: "create", label: "Create Dealers", description: "Register new dealer accounts" },
      { action: "edit", label: "Edit Dealers", description: "Update dealer information" },
      { action: "delete", label: "Delete Dealers", description: "Remove dealer accounts" },
    ],
  },
  {
    module: "dealer_inventory",
    moduleLabel: "Dealer Inventory",
    description: "Manage dealer stock allocations and updates",
    actions: [
      { action: "view", label: "View Dealer Inventory", description: "View allocated inventory quantities" },
      { action: "update", label: "Update Dealer Stock", description: "Adjust dealer inventory stock levels" },
    ],
  },
];

/**
 * Returns a flat array of all permission keys (e.g. ["users.view", "users.create", ...])
 */
export function getAllPermissionKeys() {
  const keys = [];
  for (const mod of PERMISSION_CATALOG) {
    for (const act of mod.actions) {
      keys.push(`${mod.module}.${act.action}`);
    }
  }
  return keys;
}

/**
 * Returns flat list of all permissions with metadata
 */
export function getAllPermissionsFlat() {
  const list = [];
  for (const mod of PERMISSION_CATALOG) {
    for (const act of mod.actions) {
      list.push({
        id: `${mod.module}.${act.action}`,
        module: mod.module,
        moduleLabel: mod.moduleLabel,
        action: act.action,
        label: act.label,
        description: act.description,
      });
    }
  }
  return list;
}
