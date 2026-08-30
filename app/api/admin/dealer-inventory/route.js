import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireDealerOwnership } from "@/lib/rbac";

export async function GET(req) {
  const { user, errorResponse } = await requirePermission(req, "dealer_inventory.view");
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const requestedDealerId = searchParams.get("dealerId");

    // Server-side authorization check:
    // If the authenticated user is a dealer account (has dealerId), enforce dealerId
    let effectiveDealerId = requestedDealerId;

    if (user.dealerId) {
      // User is locked to their own dealer account
      effectiveDealerId = user.dealerId;
    }

    const where = {};
    if (effectiveDealerId) {
      where.dealerId = effectiveDealerId;
    }

    const inventories = await prisma.dealerInventory.findMany({
      where,
      include: {
        dealer: { select: { id: true, name: true, code: true } },
        variant: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
            attributeValues: {
              include: { attributeValue: { include: { attribute: true } } },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const formatted = inventories.map((inv) => {
      const attrStr = inv.variant.attributeValues
        .map((av) => `${av.attributeValue.attribute?.name}: ${av.attributeValue.value}`)
        .join(", ");

      return {
        id: inv.id,
        dealerId: inv.dealerId,
        dealer: inv.dealer,
        variantId: inv.variantId,
        sku: inv.variant.sku,
        price: inv.variant.price,
        productName: inv.variant.product.name,
        productSlug: inv.variant.product.slug,
        productImage: inv.variant.product.images[0]?.url || inv.variant.image,
        variantAttributes: attrStr || "Standard",
        stock: inv.stock,
        lowStockThreshold: inv.lowStockThreshold,
        location: inv.location,
        updatedAt: inv.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      inventories: formatted,
      isDealerUser: !!user.dealerId,
      userDealerId: user.dealerId,
    });
  } catch (error) {
    console.error("Fetch dealer inventory error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch dealer inventory" }, { status: 500 });
  }
}

export async function PUT(req) {
  const { user, errorResponse } = await requirePermission(req, "dealer_inventory.update");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { inventoryId, dealerId, variantId, stock, lowStockThreshold, location } = body;

    let targetInventory = null;

    if (inventoryId) {
      targetInventory = await prisma.dealerInventory.findUnique({ where: { id: inventoryId } });
    } else if (dealerId && variantId) {
      targetInventory = await prisma.dealerInventory.findUnique({
        where: { dealerId_variantId: { dealerId, variantId } },
      });
    }

    // Verify ownership if user is a dealer staff
    if (user.dealerId) {
      if (targetInventory && targetInventory.dealerId !== user.dealerId) {
        return NextResponse.json(
          { success: false, error: "Forbidden: You cannot modify another dealer's inventory" },
          { status: 403 }
        );
      }
      if (dealerId && dealerId !== user.dealerId) {
        return NextResponse.json(
          { success: false, error: "Forbidden: You cannot assign stock to another dealer" },
          { status: 403 }
        );
      }
    }

    const effectiveDealerId = user.dealerId || dealerId || targetInventory?.dealerId;
    if (!effectiveDealerId) {
      return NextResponse.json({ success: false, error: "Dealer ID is required" }, { status: 400 });
    }

    const effectiveVariantId = variantId || targetInventory?.variantId;
    if (!effectiveVariantId) {
      return NextResponse.json({ success: false, error: "Variant ID is required" }, { status: 400 });
    }

    const updated = await prisma.dealerInventory.upsert({
      where: {
        dealerId_variantId: {
          dealerId: effectiveDealerId,
          variantId: effectiveVariantId,
        },
      },
      update: {
        stock: stock !== undefined ? parseInt(stock) : undefined,
        lowStockThreshold: lowStockThreshold !== undefined ? parseInt(lowStockThreshold) : undefined,
        location: location !== undefined ? location : undefined,
      },
      create: {
        dealerId: effectiveDealerId,
        variantId: effectiveVariantId,
        stock: parseInt(stock) || 0,
        lowStockThreshold: parseInt(lowStockThreshold) || 5,
        location: location || null,
      },
    });

    // Record inventory audit log
    await prisma.inventoryLog.create({
      data: {
        variantId: effectiveVariantId,
        dealerId: effectiveDealerId,
        changeType: "DEALER_UPDATE",
        quantityChange: stock !== undefined ? parseInt(stock) : 0,
        previousStock: targetInventory ? targetInventory.stock : 0,
        newStock: updated.stock,
        referenceId: `Dealer Stock Adjustment by ${user.name}`,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true, inventory: updated });
  } catch (error) {
    console.error("Update dealer inventory error:", error);
    return NextResponse.json({ success: false, error: "Failed to update dealer inventory" }, { status: 500 });
  }
}
