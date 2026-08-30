import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PERMISSION_CATALOG } from "../lib/permissions.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Clear existing records in sequence
  await prisma.inventoryLog.deleteMany({});
  await prisma.dealerInventory.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.distributorApplication.deleteMany({});
  await prisma.distributor.deleteMany({});
  await prisma.productVariantAttribute.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.attributeValue.deleteMany({});
  await prisma.attribute.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.brand.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.userRole.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.dealer.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("🧹 Cleaned database tables.");

  // 2. Seed Permissions from PERMISSION_CATALOG
  const allPermissions = [];
  for (const mod of PERMISSION_CATALOG) {
    for (const act of mod.actions) {
      const permId = `${mod.module}.${act.action}`;
      const perm = await prisma.permission.create({
        data: {
          id: permId,
          module: mod.module,
          action: act.action,
          label: act.label,
          description: act.description,
        },
      });
      allPermissions.push(perm);
    }
  }
  console.log(`✅ Seeded ${allPermissions.length} permissions.`);

  // 3. Create Roles
  // Super Admin
  const superAdminRole = await prisma.role.create({
    data: {
      name: "Super Administrator",
      slug: "super-admin",
      description: "Full system access to all modules, configurations, and permissions",
      isSystem: true,
    },
  });

  // Store Manager
  const storeManagerRole = await prisma.role.create({
    data: {
      name: "Store Manager",
      slug: "store-manager",
      description: "Manages catalog, inventory, categories, brands, and customer orders",
      isSystem: false,
    },
  });

  // Catalog Manager
  const catalogManagerRole = await prisma.role.create({
    data: {
      name: "Catalog Manager",
      slug: "catalog-manager",
      description: "Manages products, variations, categories, brands, and attributes",
      isSystem: false,
    },
  });

  // Order Specialist
  const orderSpecialistRole = await prisma.role.create({
    data: {
      name: "Order Specialist",
      slug: "order-specialist",
      description: "Handles customer orders, fulfillments, cancellations, and order exports",
      isSystem: false,
    },
  });

  // Distributor & Dealer Manager
  const partnerManagerRole = await prisma.role.create({
    data: {
      name: "Partner Manager",
      slug: "partner-manager",
      description: "Manages distributors, applications, dealers, and dealer inventories",
      isSystem: false,
    },
  });

  // Dealer Staff
  const dealerStaffRole = await prisma.role.create({
    data: {
      name: "Dealer Staff",
      slug: "dealer-staff",
      description: "Dealer portal user with view and update access restricted to their assigned inventory",
      isSystem: false,
    },
  });

  // 4. Assign Permissions to Roles
  // Super Admin gets ALL
  for (const perm of allPermissions) {
    await prisma.rolePermission.create({
      data: { roleId: superAdminRole.id, permissionId: perm.id },
    });
  }

  // Store Manager
  const storeManagerPerms = [
    "categories.view", "categories.create", "categories.edit", "categories.delete",
    "brands.view", "brands.create", "brands.edit", "brands.delete",
    "attributes.view", "attributes.create", "attributes.edit", "attributes.delete",
    "products.view", "products.create", "products.edit", "products.delete", "products.export",
    "orders.view", "orders.edit", "orders.cancel", "orders.export",
    "dealer_inventory.view", "dealer_inventory.update",
  ];
  for (const pid of storeManagerPerms) {
    await prisma.rolePermission.create({
      data: { roleId: storeManagerRole.id, permissionId: pid },
    });
  }

  // Catalog Manager
  const catalogPerms = [
    "categories.view", "categories.create", "categories.edit", "categories.delete",
    "brands.view", "brands.create", "brands.edit", "brands.delete",
    "attributes.view", "attributes.create", "attributes.edit", "attributes.delete",
    "products.view", "products.create", "products.edit", "products.delete", "products.export",
  ];
  for (const pid of catalogPerms) {
    await prisma.rolePermission.create({
      data: { roleId: catalogManagerRole.id, permissionId: pid },
    });
  }

  // Order Specialist
  const orderPerms = [
    "orders.view", "orders.edit", "orders.cancel", "orders.export",
    "products.view",
  ];
  for (const pid of orderPerms) {
    await prisma.rolePermission.create({
      data: { roleId: orderSpecialistRole.id, permissionId: pid },
    });
  }

  // Partner Manager
  const partnerPerms = [
    "distributors.view", "distributors.approve", "distributors.reject",
    "dealers.view", "dealers.create", "dealers.edit", "dealers.delete",
    "dealer_inventory.view", "dealer_inventory.update",
    "products.view",
  ];
  for (const pid of partnerPerms) {
    await prisma.rolePermission.create({
      data: { roleId: partnerManagerRole.id, permissionId: pid },
    });
  }

  // Dealer Staff
  const dealerStaffPerms = [
    "dealer_inventory.view", "dealer_inventory.update",
    "products.view",
  ];
  for (const pid of dealerStaffPerms) {
    await prisma.rolePermission.create({
      data: { roleId: dealerStaffRole.id, permissionId: pid },
    });
  }

  console.log("✅ Configured Role Permissions matrix.");

  // 5. Seed Dealers
  const dealerApex = await prisma.dealer.create({
    data: {
      name: "Apex Electronics Distribution",
      code: "DLR-APEX-01",
      email: "contact@apexdealers.com",
      phone: "+1 (555) 234-5678",
      address: "450 Broadway Ave",
      city: "New York",
      state: "NY",
      region: "East Coast",
      status: "ACTIVE",
    },
  });

  const dealerMetro = await prisma.dealer.create({
    data: {
      name: "Metro Sports & Apparel Dealers",
      code: "DLR-METRO-02",
      email: "support@metrosports.com",
      phone: "+1 (555) 876-5432",
      address: "800 Michigan Ave",
      city: "Chicago",
      state: "IL",
      region: "Midwest",
      status: "ACTIVE",
    },
  });

  // 6. Seed Users
  const passwordHashAdmin = await bcrypt.hash("Admin@123", 10);
  const passwordHashManager = await bcrypt.hash("Manager@123", 10);
  const passwordHashCatalog = await bcrypt.hash("Catalog@123", 10);
  const passwordHashOrders = await bcrypt.hash("Orders@123", 10);
  const passwordHashPartner = await bcrypt.hash("Partner@123", 10);
  const passwordHashDealer = await bcrypt.hash("Dealer@123", 10);

  const userAdmin = await prisma.user.create({
    data: {
      name: "Alex Sterling (Super Admin)",
      email: "admin@omnicommerce.com",
      password: passwordHashAdmin,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      status: "ACTIVE",
      userRoles: { create: [{ roleId: superAdminRole.id }] },
    },
  });

  const userManager = await prisma.user.create({
    data: {
      name: "Marcus Vance (Store Manager)",
      email: "manager@omnicommerce.com",
      password: passwordHashManager,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      status: "ACTIVE",
      userRoles: { create: [{ roleId: storeManagerRole.id }] },
    },
  });

  const userCatalog = await prisma.user.create({
    data: {
      name: "Elena Rostova (Catalog Editor)",
      email: "catalog@omnicommerce.com",
      password: passwordHashCatalog,
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
      status: "ACTIVE",
      userRoles: { create: [{ roleId: catalogManagerRole.id }] },
    },
  });

  const userOrders = await prisma.user.create({
    data: {
      name: "David Kim (Order Specialist)",
      email: "orders@omnicommerce.com",
      password: passwordHashOrders,
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      status: "ACTIVE",
      userRoles: { create: [{ roleId: orderSpecialistRole.id }] },
    },
  });

  const userPartner = await prisma.user.create({
    data: {
      name: "Rachel Green (Partner Manager)",
      email: "partner@omnicommerce.com",
      password: passwordHashPartner,
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
      status: "ACTIVE",
      userRoles: { create: [{ roleId: partnerManagerRole.id }] },
    },
  });

  const userDealer = await prisma.user.create({
    data: {
      name: "Leo Hayes (Apex Dealer Rep)",
      email: "dealer.staff@omnicommerce.com",
      password: passwordHashDealer,
      avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
      status: "ACTIVE",
      dealerId: dealerApex.id,
      userRoles: { create: [{ roleId: dealerStaffRole.id }] },
    },
  });

  console.log("✅ Seeded Admin Users with pre-configured roles.");

  // 7. Seed Categories (Hierarchical Parent -> Children)
  const catElectronics = await prisma.category.create({
    data: {
      name: "Electronics",
      slug: "electronics",
      description: "Smartphones, computers, audio equipment and accessories",
      image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&auto=format&fit=crop&q=80",
      status: "ACTIVE",
      sortOrder: 1,
    },
  });

  const catPhones = await prisma.category.create({
    data: {
      name: "Mobile Phones",
      slug: "mobile-phones",
      description: "Flagship smartphones and devices",
      parentId: catElectronics.id,
      status: "ACTIVE",
      sortOrder: 1,
    },
  });

  const catAudio = await prisma.category.create({
    data: {
      name: "Audio & Headphones",
      slug: "audio-headphones",
      description: "Wireless earbuds, noise-canceling headphones",
      parentId: catElectronics.id,
      status: "ACTIVE",
      sortOrder: 2,
    },
  });

  const catClothing = await prisma.category.create({
    data: {
      name: "Clothing & Apparel",
      slug: "clothing",
      description: "Men and Women fashion and athletic wear",
      image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&auto=format&fit=crop&q=80",
      status: "ACTIVE",
      sortOrder: 2,
    },
  });

  const catMens = await prisma.category.create({
    data: {
      name: "Men's Apparel",
      slug: "mens-apparel",
      description: "Men's shirts, hoodies, athletic gear",
      parentId: catClothing.id,
      status: "ACTIVE",
      sortOrder: 1,
    },
  });

  const catWomens = await prisma.category.create({
    data: {
      name: "Women's Apparel",
      slug: "womens-apparel",
      description: "Women's tops, leggings, and activewear",
      parentId: catClothing.id,
      status: "ACTIVE",
      sortOrder: 2,
    },
  });

  console.log("✅ Seeded Hierarchical Categories.");

  // 8. Seed Brands
  const brandNike = await prisma.brand.create({
    data: {
      name: "Nike",
      slug: "nike",
      description: "Global leader in athletic sportswear and performance gear",
      logo: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&auto=format&fit=crop&q=80",
      status: "ACTIVE",
    },
  });

  const brandApple = await prisma.brand.create({
    data: {
      name: "Apple",
      slug: "apple",
      description: "Premium consumer electronics and computing devices",
      logo: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=200&auto=format&fit=crop&q=80",
      status: "ACTIVE",
    },
  });

  const brandSony = await prisma.brand.create({
    data: {
      name: "Sony",
      slug: "sony",
      description: "Pioneering high-resolution audio and imaging systems",
      logo: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&auto=format&fit=crop&q=80",
      status: "ACTIVE",
    },
  });

  const brandLogitech = await prisma.brand.create({
    data: {
      name: "Logitech",
      slug: "logitech",
      description: "Ergonomic computer peripherals and workspace accessories",
      logo: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=200&auto=format&fit=crop&q=80",
      status: "ACTIVE",
    },
  });

  console.log("✅ Seeded Brands.");

  // 9. Seed Dynamic Attributes & Values
  const attrColor = await prisma.attribute.create({
    data: {
      name: "Color",
      code: "color",
      description: "Product color options",
      status: "ACTIVE",
      values: {
        create: [
          { value: "Red", code: "#EF4444", sortOrder: 1 },
          { value: "Blue", code: "#3B82F6", sortOrder: 2 },
          { value: "Black", code: "#111827", sortOrder: 3 },
          { value: "White", code: "#FFFFFF", sortOrder: 4 },
        ],
      },
    },
    include: { values: true },
  });

  const attrSize = await prisma.attribute.create({
    data: {
      name: "Size",
      code: "size",
      description: "Standard clothing apparel sizes",
      status: "ACTIVE",
      values: {
        create: [
          { value: "S", code: "size-s", sortOrder: 1 },
          { value: "M", code: "size-m", sortOrder: 2 },
          { value: "L", code: "size-l", sortOrder: 3 },
          { value: "XL", code: "size-xl", sortOrder: 4 },
        ],
      },
    },
    include: { values: true },
  });

  const attrStorage = await prisma.attribute.create({
    data: {
      name: "Storage",
      code: "storage",
      description: "Internal device storage capacity",
      status: "ACTIVE",
      values: {
        create: [
          { value: "128GB", code: "128gb", sortOrder: 1 },
          { value: "256GB", code: "256gb", sortOrder: 2 },
          { value: "512GB", code: "512gb", sortOrder: 3 },
        ],
      },
    },
    include: { values: true },
  });

  console.log("✅ Seeded Attributes & Values.");

  // 10. Seed Products & Variations
  // Product 1: Variable Nike T-Shirt with Color x Size
  const prodNikeTshirt = await prisma.product.create({
    data: {
      name: "Nike Pro Dri-FIT Performance T-Shirt",
      slug: "nike-pro-dri-fit-tshirt",
      shortDescription: "Sweat-wicking athletic tee engineered for peak training performance.",
      description: "The Nike Pro Dri-FIT Top hugs you in lightweight fabric with breathability built into heat zones to help keep you cool and dry from warmups through cool-downs. Stretchy fabric made with at least 75% recycled polyester fibers comes in a tight fit that easily layers under other tops.",
      type: "VARIABLE",
      status: "ACTIVE",
      categoryId: catMens.id,
      brandId: brandNike.id,
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80", altText: "Nike Pro Dri-FIT Front View", isPrimary: true, sortOrder: 1 },
          { url: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80", altText: "Nike Pro Fabric Detail", isPrimary: false, sortOrder: 2 },
        ],
      },
    },
  });

  // Create Variations for Nike T-Shirt: Combinations of Color (Red, Blue, Black) x Size (S, M, L)
  const redVal = attrColor.values.find((v) => v.value === "Red");
  const blueVal = attrColor.values.find((v) => v.value === "Blue");
  const blackVal = attrColor.values.find((v) => v.value === "Black");

  const sVal = attrSize.values.find((v) => v.value === "S");
  const mVal = attrSize.values.find((v) => v.value === "M");
  const lVal = attrSize.values.find((v) => v.value === "L");

  const nikeVariantsData = [
    { sku: "NIKE-RED-S", color: redVal, size: sVal, price: 35.0, compare: 45.0, stock: 12, barcode: "8845012301" },
    { sku: "NIKE-RED-M", color: redVal, size: mVal, price: 35.0, compare: 45.0, stock: 20, barcode: "8845012302" },
    { sku: "NIKE-RED-L", color: redVal, size: lVal, price: 35.0, compare: 45.0, stock: 8, barcode: "8845012303" },

    { sku: "NIKE-BLU-S", color: blueVal, size: sVal, price: 38.0, compare: 48.0, stock: 15, barcode: "8845012304" },
    { sku: "NIKE-BLU-M", color: blueVal, size: mVal, price: 38.0, compare: 48.0, stock: 25, barcode: "8845012305" },
    { sku: "NIKE-BLU-L", color: blueVal, size: lVal, price: 38.0, compare: 48.0, stock: 4, barcode: "8845012306" }, // Low stock

    { sku: "NIKE-BLK-S", color: blackVal, size: sVal, price: 39.0, compare: 50.0, stock: 18, barcode: "8845012307" },
    { sku: "NIKE-BLK-M", color: blackVal, size: mVal, price: 39.0, compare: 50.0, stock: 30, barcode: "8845012308" },
    { sku: "NIKE-BLK-L", color: blackVal, size: lVal, price: 39.0, compare: 50.0, stock: 14, barcode: "8845012309" },
  ];

  const seededNikeVariants = [];
  for (const item of nikeVariantsData) {
    const variant = await prisma.productVariant.create({
      data: {
        productId: prodNikeTshirt.id,
        sku: item.sku,
        barcode: item.barcode,
        price: item.price,
        compareAtPrice: item.compare,
        stock: item.stock,
        lowStockThreshold: 5,
        status: "ACTIVE",
        attributeValues: {
          create: [
            { attributeValueId: item.color.id },
            { attributeValueId: item.size.id },
          ],
        },
      },
    });
    seededNikeVariants.push(variant);
  }

  // Product 2: Variable Apple iPhone 15 Pro (Color x Storage)
  const prodIPhone = await prisma.product.create({
    data: {
      name: "Apple iPhone 15 Pro",
      slug: "apple-iphone-15-pro",
      shortDescription: "Forged in titanium with revolutionary A17 Pro chip and customizable Action button.",
      description: "iPhone 15 Pro is the first iPhone to feature an aerospace-grade titanium design, using the same alloy that spacecraft use for missions to Mars. Titanium has one of the best strength-to-weight ratios of any metal, making these our lightest Pro models ever.",
      type: "VARIABLE",
      status: "ACTIVE",
      categoryId: catPhones.id,
      brandId: brandApple.id,
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80", altText: "iPhone 15 Pro Titanium", isPrimary: true, sortOrder: 1 },
        ],
      },
    },
  });

  const st128 = attrStorage.values.find((v) => v.value === "128GB");
  const st256 = attrStorage.values.find((v) => v.value === "256GB");
  const st512 = attrStorage.values.find((v) => v.value === "512GB");

  const iphoneVariantsData = [
    { sku: "IPHONE15P-BLK-128", color: blackVal, storage: st128, price: 999.0, stock: 10, barcode: "194253001" },
    { sku: "IPHONE15P-BLK-256", color: blackVal, storage: st256, price: 1099.0, stock: 15, barcode: "194253002" },
    { sku: "IPHONE15P-BLK-512", color: blackVal, storage: st512, price: 1299.0, stock: 6, barcode: "194253003" },
    { sku: "IPHONE15P-BLU-128", color: blueVal, storage: st128, price: 999.0, stock: 8, barcode: "194253004" },
    { sku: "IPHONE15P-BLU-256", color: blueVal, storage: st256, price: 1099.0, stock: 12, barcode: "194253005" },
  ];

  const seededIPhoneVariants = [];
  for (const item of iphoneVariantsData) {
    const variant = await prisma.productVariant.create({
      data: {
        productId: prodIPhone.id,
        sku: item.sku,
        barcode: item.barcode,
        price: item.price,
        stock: item.stock,
        lowStockThreshold: 3,
        status: "ACTIVE",
        attributeValues: {
          create: [
            { attributeValueId: item.color.id },
            { attributeValueId: item.storage.id },
          ],
        },
      },
    });
    seededIPhoneVariants.push(variant);
  }

  // Product 3: Simple Product Sony WH-1000XM5
  const prodSony = await prisma.product.create({
    data: {
      name: "Sony WH-1000XM5 Wireless Noise-Canceling Headphones",
      slug: "sony-wh-1000xm5-headphones",
      shortDescription: "Industry-leading noise cancellation with two processors and eight microphones.",
      description: "Our flagship wireless noise-canceling headphones deliver pure sound with remarkable clarity and unmatched comfort with ultra-soft leather earcups.",
      type: "SIMPLE",
      status: "ACTIVE",
      categoryId: catAudio.id,
      brandId: brandSony.id,
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80", altText: "Sony WH-1000XM5 Black", isPrimary: true, sortOrder: 1 },
        ],
      },
    },
  });

  const sonyVariant = await prisma.productVariant.create({
    data: {
      productId: prodSony.id,
      sku: "SONY-WH1000XM5-BLK",
      barcode: "4548736132566",
      price: 399.99,
      compareAtPrice: 449.99,
      stock: 45,
      lowStockThreshold: 10,
      status: "ACTIVE",
    },
  });

  // Product 4: Simple Product Logitech MX Master 3S
  const prodLogitech = await prisma.product.create({
    data: {
      name: "Logitech MX Master 3S Performance Wireless Mouse",
      slug: "logitech-mx-master-3s-mouse",
      shortDescription: "Quiet clicks and 8K DPI any-surface tracking for ultimate speed and precision.",
      description: "Meet MX Master 3S – an iconic mouse remastered for tactile feel, performance, and flow.",
      type: "SIMPLE",
      status: "ACTIVE",
      categoryId: catElectronics.id,
      brandId: brandLogitech.id,
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80", altText: "Logitech MX Master 3S", isPrimary: true, sortOrder: 1 },
        ],
      },
    },
  });

  const logiVariant = await prisma.productVariant.create({
    data: {
      productId: prodLogitech.id,
      sku: "LOGI-MX3S-GRY",
      barcode: "097855173348",
      price: 99.99,
      compareAtPrice: 119.99,
      stock: 60,
      lowStockThreshold: 15,
      status: "ACTIVE",
    },
  });

  console.log("✅ Seeded Simple & Variable Products with SKU variations.");

  // 11. Seed Dealer Inventory
  await prisma.dealerInventory.createMany({
    data: [
      {
        dealerId: dealerApex.id,
        variantId: seededIPhoneVariants[0].id,
        stock: 25,
        lowStockThreshold: 5,
        location: "Warehouse A - Rack 10",
      },
      {
        dealerId: dealerApex.id,
        variantId: sonyVariant.id,
        stock: 18,
        lowStockThreshold: 4,
        location: "Warehouse A - Rack 12",
      },
      {
        dealerId: dealerMetro.id,
        variantId: seededNikeVariants[0].id,
        stock: 50,
        lowStockThreshold: 10,
        location: "Distribution Center Chicago - Bay 4",
      },
      {
        dealerId: dealerMetro.id,
        variantId: seededNikeVariants[1].id,
        stock: 35,
        lowStockThreshold: 8,
        location: "Distribution Center Chicago - Bay 4",
      },
    ],
  });

  console.log("✅ Seeded Dealer Inventory.");

  // 12. Seed Customer Orders with accurate Variant Line-Items
  const order1 = await prisma.order.create({
    data: {
      orderNumber: "ORD-2026-1001",
      customerName: "Jessica Alba",
      customerEmail: "jessica.alba@example.com",
      customerPhone: "+1 (555) 789-0123",
      shippingAddress: "742 Evergreen Terrace, Springfield, OR",
      status: "DELIVERED",
      totalAmount: 118.0,
      paymentMethod: "CREDIT_CARD",
      paymentStatus: "PAID",
      notes: "Leave package at front porch door.",
      items: {
        create: [
          {
            productId: prodNikeTshirt.id,
            variantId: seededNikeVariants[7].id, // Black / M
            productName: prodNikeTshirt.name,
            variantSku: seededNikeVariants[7].sku,
            variantAttributes: "Color: Black, Size: M",
            unitPrice: 39.0,
            quantity: 2,
            totalPrice: 78.0,
          },
          {
            productId: prodNikeTshirt.id,
            variantId: seededNikeVariants[4].id, // Blue / M
            productName: prodNikeTshirt.name,
            variantSku: seededNikeVariants[4].sku,
            variantAttributes: "Color: Blue, Size: M",
            unitPrice: 38.0,
            quantity: 1,
            totalPrice: 38.0,
          },
        ],
      },
    },
  });

  const order2 = await prisma.order.create({
    data: {
      orderNumber: "ORD-2026-1002",
      customerName: "Nathan Drake",
      customerEmail: "nathan.drake@uncharted.com",
      customerPhone: "+1 (555) 345-6789",
      shippingAddress: "124 Conch Street, Pacific Palisades, CA",
      status: "PROCESSING",
      totalAmount: 1498.99,
      paymentMethod: "CREDIT_CARD",
      paymentStatus: "PAID",
      notes: "Express priority courier requested.",
      items: {
        create: [
          {
            productId: prodIPhone.id,
            variantId: seededIPhoneVariants[1].id, // Black / 256GB
            productName: prodIPhone.name,
            variantSku: seededIPhoneVariants[1].sku,
            variantAttributes: "Color: Black, Storage: 256GB",
            unitPrice: 1099.0,
            quantity: 1,
            totalPrice: 1099.0,
          },
          {
            productId: prodSony.id,
            variantId: sonyVariant.id,
            productName: prodSony.name,
            variantSku: sonyVariant.sku,
            variantAttributes: "Color: Black",
            unitPrice: 399.99,
            quantity: 1,
            totalPrice: 399.99,
          },
        ],
      },
    },
  });

  const order3 = await prisma.order.create({
    data: {
      orderNumber: "ORD-2026-1003",
      customerName: "Claire Redfield",
      customerEmail: "claire.redfield@terrasave.org",
      customerPhone: "+1 (555) 901-2345",
      shippingAddress: "500 Raccoon Way, Minneapolis, MN",
      status: "PENDING",
      totalAmount: 99.99,
      paymentMethod: "BANK_TRANSFER",
      paymentStatus: "PENDING",
      items: {
        create: [
          {
            productId: prodLogitech.id,
            variantId: logiVariant.id,
            productName: prodLogitech.name,
            variantSku: logiVariant.sku,
            variantAttributes: "Edition: Graphite Gray",
            unitPrice: 99.99,
            quantity: 1,
            totalPrice: 99.99,
          },
        ],
      },
    },
  });

  const order4 = await prisma.order.create({
    data: {
      orderNumber: "ORD-2026-1004",
      customerName: "Bruce Wayne",
      customerEmail: "bruce@wayneenterprises.com",
      customerPhone: "+1 (555) 100-2000",
      shippingAddress: "1007 Mountain Drive, Gotham City, NJ",
      status: "SHIPPED",
      totalAmount: 1299.0,
      paymentMethod: "CREDIT_CARD",
      paymentStatus: "PAID",
      items: {
        create: [
          {
            productId: prodIPhone.id,
            variantId: seededIPhoneVariants[2].id, // Black / 512GB
            productName: prodIPhone.name,
            variantSku: seededIPhoneVariants[2].sku,
            variantAttributes: "Color: Black, Storage: 512GB",
            unitPrice: 1299.0,
            quantity: 1,
            totalPrice: 1299.0,
          },
        ],
      },
    },
  });

  console.log("✅ Seeded Orders with variant snapshots.");

  // 13. Seed Distributors & Applications
  const distPacific = await prisma.distributor.create({
    data: {
      name: "Pacific Rim Logistics & Distribution",
      companyName: "Pacific Rim Holdings LLC",
      email: "inquiry@pacificrimlogistics.com",
      phone: "+1 (555) 443-8899",
      address: "100 Harbor Blvd, Suite 400",
      city: "Seattle",
      state: "WA",
      country: "USA",
      taxId: "TAX-9988221",
      status: "ACTIVE",
      creditLimit: 50000.0,
    },
  });

  await prisma.distributorApplication.create({
    data: {
      applicantName: "Arthur Curry",
      companyName: "Atlantis Global Supplies Inc.",
      email: "arthur@atlantissupplies.com",
      phone: "+1 (555) 667-1122",
      businessType: "Wholesale & Regional Retail",
      annualRevenue: "$5,000,000+",
      address: "120 Ocean View Ave, Miami, FL",
      status: "APPROVED",
      reviewNotes: "All compliance docs and tax records verified. Approved credit line.",
      reviewedByUserId: userAdmin.id,
      reviewedAt: new Date(),
      distributorId: distPacific.id,
    },
  });

  await prisma.distributorApplication.create({
    data: {
      applicantName: "Selina Kyle",
      companyName: "Gotham Luxury Imports Co.",
      email: "selina@gothamluxury.com",
      phone: "+1 (555) 998-3344",
      businessType: "Specialty High-End Retailer",
      annualRevenue: "$2,500,000",
      address: "88 Diamond St, Gotham, NJ",
      status: "PENDING",
      reviewNotes: "Under credit check review.",
    },
  });

  await prisma.distributorApplication.create({
    data: {
      applicantName: "Oswald Cobblepot",
      companyName: "Iceberg Wholesale Trade",
      email: "oswald@iceberglounge.com",
      phone: "+1 (555) 332-9900",
      businessType: "Third-party Reseller",
      annualRevenue: "$500,000",
      address: "13 Wharf Rd, Gotham, NJ",
      status: "REJECTED",
      reviewNotes: "Incomplete business tax validation and missing credit references.",
      reviewedByUserId: userAdmin.id,
      reviewedAt: new Date(),
    },
  });

  console.log("✅ Seeded Distributors and Applications.");
  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
