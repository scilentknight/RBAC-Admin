import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { convertToCSV, formatDate } from "@/lib/utils";

export async function GET(req) {
  const { errorResponse } = await requirePermission(req, "orders.export");
  if (errorResponse) return errorResponse;

  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const flatRows = [];
    for (const ord of orders) {
      for (const item of ord.items) {
        flatRows.push({
          orderNumber: ord.orderNumber,
          date: formatDate(ord.createdAt),
          customerName: ord.customerName,
          customerEmail: ord.customerEmail,
          status: ord.status,
          paymentStatus: ord.paymentStatus,
          paymentMethod: ord.paymentMethod,
          productName: item.productName,
          sku: item.variantSku,
          variantDetails: item.variantAttributes || "Standard",
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          itemTotal: item.totalPrice,
          orderTotal: ord.totalAmount,
        });
      }
    }

    const headers = {
      orderNumber: "Order Number",
      date: "Date",
      customerName: "Customer Name",
      customerEmail: "Customer Email",
      status: "Status",
      paymentStatus: "Payment Status",
      paymentMethod: "Payment Method",
      productName: "Product",
      sku: "SKU",
      variantDetails: "Variant Attributes",
      unitPrice: "Unit Price",
      quantity: "Quantity",
      itemTotal: "Line Total",
      orderTotal: "Order Total",
    };

    const csvContent = convertToCSV(flatRows, headers);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="orders_export_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export orders error:", error);
    return NextResponse.json({ success: false, error: "Failed to export orders" }, { status: 500 });
  }
}
