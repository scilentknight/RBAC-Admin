import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export async function POST(req, { params }) {
  const { user, errorResponse } = await requirePermission(req, "orders.cancel");
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    if (order.status === "CANCELLED") {
      return NextResponse.json({ success: false, error: "Order is already cancelled" }, { status: 400 });
    }

    // Transaction: cancel order and restock each variant inventory
    const cancelledOrder = await prisma.$transaction(async (tx) => {
      // Restock inventory for each item
      for (const item of order.items) {
        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
          });

          if (variant) {
            const newStock = variant.stock + item.quantity;
            await tx.productVariant.update({
              where: { id: variant.id },
              data: { stock: newStock },
            });

            await tx.inventoryLog.create({
              data: {
                variantId: variant.id,
                changeType: "ORDER_RESTOCK",
                quantityChange: item.quantity,
                previousStock: variant.stock,
                newStock,
                referenceId: `Cancelled Order ${order.orderNumber}`,
                userId: user.id,
              },
            });
          }
        }
      }

      // Update order status
      const updated = await tx.order.update({
        where: { id },
        data: {
          status: "CANCELLED",
          paymentStatus: order.paymentStatus === "PAID" ? "REFUNDED" : "CANCELLED",
        },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      message: "Order cancelled and inventory successfully restocked",
      order: cancelledOrder,
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    return NextResponse.json({ success: false, error: "Failed to cancel order" }, { status: 500 });
  }
}
