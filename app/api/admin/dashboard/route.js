import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";

export async function GET(req) {
  const { user, errorResponse } = await requireAuth(req);
  if (errorResponse) return errorResponse;

  const perms = new Set(user.permissions);
  const data = {
    user: {
      name: user.name,
      email: user.email,
      roles: user.roles,
    },
    modules: {},
  };

  try {
    // 1. User Management Stats
    if (perms.has("users.view")) {
      const [totalUsers, activeUsers, totalRoles] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: "ACTIVE" } }),
        prisma.role.count(),
      ]);
      data.modules.users = { totalUsers, activeUsers, totalRoles };
    }

    // 2. Catalog & Products Stats
    if (perms.has("products.view")) {
      const [totalProducts, variableProducts, simpleProducts, lowStockVariants] = await Promise.all([
        prisma.product.count(),
        prisma.product.count({ where: { type: "VARIABLE" } }),
        prisma.product.count({ where: { type: "SIMPLE" } }),
        prisma.productVariant.findMany({
          where: {
            stock: { lte: 5 },
          },
          include: {
            product: { select: { name: true, slug: true } },
            attributeValues: {
              include: { attributeValue: { include: { attribute: true } } },
            },
          },
          take: 5,
        }),
      ]);

      data.modules.products = {
        totalProducts,
        variableProducts,
        simpleProducts,
        lowStockItems: lowStockVariants.map((v) => ({
          id: v.id,
          sku: v.sku,
          productName: v.product.name,
          stock: v.stock,
          lowStockThreshold: v.lowStockThreshold,
          price: v.price,
        })),
      };
    }

    // 3. Categories & Brands Stats
    if (perms.has("categories.view")) {
      data.modules.categories = {
        totalCategories: await prisma.category.count(),
      };
    }

    if (perms.has("brands.view")) {
      data.modules.brands = {
        totalBrands: await prisma.brand.count(),
      };
    }

    // 4. Orders & Sales Stats
    if (perms.has("orders.view")) {
      const [totalOrders, ordersList, pendingOrders, revenueAgg] = await Promise.all([
        prisma.order.count(),
        prisma.order.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            items: true,
          },
        }),
        prisma.order.count({ where: { status: "PENDING" } }),
        prisma.order.aggregate({
          where: { status: { not: "CANCELLED" } },
          _sum: { totalAmount: true },
        }),
      ]);

      const statusBreakdown = await prisma.order.groupBy({
        by: ["status"],
        _count: { id: true },
      });

      data.modules.orders = {
        totalOrders,
        pendingOrders,
        totalRevenue: revenueAgg._sum.totalAmount || 0,
        recentOrders: ordersList,
        statusBreakdown: statusBreakdown.reduce((acc, curr) => {
          acc[curr.status] = curr._count.id;
          return acc;
        }, {}),
      };
    }

    // 5. Distributors & Applications Stats
    if (perms.has("distributors.view")) {
      const [totalDistributors, pendingApps, approvedApps] = await Promise.all([
        prisma.distributor.count(),
        prisma.distributorApplication.count({ where: { status: "PENDING" } }),
        prisma.distributorApplication.count({ where: { status: "APPROVED" } }),
      ]);

      data.modules.distributors = {
        totalDistributors,
        pendingApplications: pendingApps,
        approvedApplications: approvedApps,
      };
    }

    // 6. Dealers & Dealer Inventory Stats
    if (perms.has("dealers.view")) {
      const totalDealers = await prisma.dealer.count();
      data.modules.dealers = { totalDealers };
    }

    if (perms.has("dealer_inventory.view")) {
      const inventoryWhere = user.dealerId ? { dealerId: user.dealerId } : {};
      const totalAllocatedItems = await prisma.dealerInventory.count({ where: inventoryWhere });
      data.modules.dealerInventory = { totalAllocatedItems };
    }

    return NextResponse.json({ success: true, dashboard: data });
  } catch (error) {
    console.error("Dashboard data error:", error);
    return NextResponse.json({ success: false, error: "Failed to generate dashboard data" }, { status: 500 });
  }
}
