import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export async function GET(req) {
  const { errorResponse } = await requirePermission(req, "orders.view");
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const where = {};

    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { customerName: { contains: search } },
        { customerEmail: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true } },
            variant: { select: { id: true, sku: true, stock: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error("Fetch orders error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(req) {
  const { user, errorResponse } = await requirePermission(req, "orders.edit");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      paymentMethod = "CREDIT_CARD",
      paymentStatus = "PAID",
      notes,
      items = [],
    } = body;

    if (!customerName || !customerEmail || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Customer name, email and order items are required" },
        { status: 400 }
      );
    }

    // Atomic transaction: create order and decrement SKU-level inventory
    const newOrder = await prisma.$transaction(async (tx) => {
      let total = 0;
      const preparedItems = [];

      for (const item of items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: {
            product: true,
            attributeValues: {
              include: { attributeValue: { include: { attribute: true } } },
            },
          },
        });

        if (!variant) {
          throw new Error(`Product variant ${item.variantId} not found`);
        }

        if (variant.stock < item.quantity) {
          throw new Error(`Insufficient stock for SKU ${variant.sku}. Available: ${variant.stock}, Requested: ${item.quantity}`);
        }

        const attrSnapshot = variant.attributeValues
          .map((av) => `${av.attributeValue.attribute?.name || "Attr"}: ${av.attributeValue.value}`)
          .join(", ");

        const itemTotal = variant.price * item.quantity;
        total += itemTotal;

        // Decrement stock at SKU level
        const updatedVariant = await tx.productVariant.update({
          where: { id: variant.id },
          data: { stock: variant.stock - item.quantity },
        });

        // Log inventory change
        await tx.inventoryLog.create({
          data: {
            variantId: variant.id,
            changeType: "ORDER_DEDUCT",
            quantityChange: -item.quantity,
            previousStock: variant.stock,
            newStock: updatedVariant.stock,
            referenceId: `New Order for ${customerName}`,
            userId: user.id,
          },
        });

        preparedItems.push({
          productId: variant.productId,
          variantId: variant.id,
          productName: variant.product.name,
          variantSku: variant.sku,
          variantAttributes: attrSnapshot || null,
          unitPrice: variant.price,
          quantity: item.quantity,
          totalPrice: itemTotal,
        });
      }

      const orderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

      const order = await tx.order.create({
        data: {
          orderNumber,
          customerName,
          customerEmail,
          customerPhone: customerPhone || null,
          shippingAddress: shippingAddress || "Default Store Address",
          status: "PENDING",
          totalAmount: total,
          paymentMethod,
          paymentStatus,
          notes: notes || null,
          items: {
            create: preparedItems,
          },
        },
        include: { items: true },
      });

      return order;
    });

    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create order" }, { status: 400 });
  }
}
