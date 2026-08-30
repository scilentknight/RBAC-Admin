import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { convertToCSV } from "@/lib/utils";

export async function GET(req) {
  const { errorResponse } = await requirePermission(req, "products.export");
  if (errorResponse) return errorResponse;

  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        brand: true,
        variants: {
          include: {
            attributeValues: {
              include: { attributeValue: { include: { attribute: true } } },
            },
          },
        },
      },
    });

    const flatRows = [];
    for (const p of products) {
      for (const v of p.variants) {
        const attrStr = v.attributeValues
          .map((av) => `${av.attributeValue.attribute?.name}: ${av.attributeValue.value}`)
          .join(" | ");

        flatRows.push({
          productId: p.id,
          productName: p.name,
          slug: p.slug,
          type: p.type,
          status: p.status,
          category: p.category?.name || "Uncategorized",
          brand: p.brand?.name || "None",
          sku: v.sku,
          barcode: v.barcode || "",
          price: v.price,
          compareAtPrice: v.compareAtPrice || "",
          stock: v.stock,
          lowStockThreshold: v.lowStockThreshold,
          variantAttributes: attrStr,
        });
      }
    }

    const headers = {
      productId: "Product ID",
      productName: "Product Name",
      slug: "Slug",
      type: "Type",
      status: "Status",
      category: "Category",
      brand: "Brand",
      sku: "SKU",
      barcode: "Barcode",
      price: "Price",
      compareAtPrice: "Compare Price",
      stock: "Stock Quantity",
      lowStockThreshold: "Low Stock Alert",
      variantAttributes: "Variation Attributes",
    };

    const csvContent = convertToCSV(flatRows, headers);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="products_export_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export products error:", error);
    return NextResponse.json({ success: false, error: "Failed to export products" }, { status: 500 });
  }
}
