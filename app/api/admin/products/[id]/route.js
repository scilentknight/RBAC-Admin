import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { slugify } from "@/lib/utils";

export async function GET(req, { params }) {
  const { errorResponse } = await requirePermission(req, "products.view");
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: {
          include: {
            attributeValues: {
              include: {
                attributeValue: {
                  include: { attribute: true },
                },
              },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("Get product error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const { errorResponse } = await requirePermission(req, "products.edit");
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    const body = await req.json();
    const {
      name,
      slug,
      shortDescription,
      description,
      status,
      categoryId,
      brandId,
      images,
      // Variants updates
      variants,
    } = body;

    const existing = await prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update parent product details
      const prod = await tx.product.update({
        where: { id },
        data: {
          name: name || existing.name,
          slug: slug ? slugify(slug) : (name ? slugify(name) : existing.slug),
          shortDescription: shortDescription !== undefined ? shortDescription : existing.shortDescription,
          description: description !== undefined ? description : existing.description,
          status: status || existing.status,
          categoryId: categoryId !== undefined ? categoryId : existing.categoryId,
          brandId: brandId !== undefined ? brandId : existing.brandId,
        },
      });

      // 2. Update images if supplied
      if (Array.isArray(images)) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (images.length > 0) {
          await tx.productImage.createMany({
            data: images.map((img, idx) => ({
              productId: id,
              url: typeof img === "string" ? img : img.url,
              altText: typeof img === "string" ? prod.name : img.altText || prod.name,
              sortOrder: idx + 1,
              isPrimary: idx === 0,
            })),
          });
        }
      }

      // 3. Update variants if supplied
      if (Array.isArray(variants)) {
        for (const v of variants) {
          if (v.id) {
            // Existing variant update
            await tx.productVariant.update({
              where: { id: v.id },
              data: {
                sku: v.sku ? v.sku.trim().toUpperCase() : undefined,
                barcode: v.barcode !== undefined ? v.barcode : undefined,
                price: v.price !== undefined ? parseFloat(v.price) : undefined,
                compareAtPrice: v.compareAtPrice !== undefined ? (v.compareAtPrice ? parseFloat(v.compareAtPrice) : null) : undefined,
                stock: v.stock !== undefined ? parseInt(v.stock) : undefined,
                lowStockThreshold: v.lowStockThreshold !== undefined ? parseInt(v.lowStockThreshold) : undefined,
                status: v.status || undefined,
                image: v.image !== undefined ? v.image : undefined,
              },
            });
          } else {
            // Newly added variant to existing product
            const newVar = await tx.productVariant.create({
              data: {
                productId: id,
                sku: v.sku.trim().toUpperCase(),
                barcode: v.barcode || null,
                price: parseFloat(v.price) || 0,
                compareAtPrice: v.compareAtPrice ? parseFloat(v.compareAtPrice) : null,
                stock: parseInt(v.stock) || 0,
                lowStockThreshold: parseInt(v.lowStockThreshold) || 5,
                image: v.image || null,
                status: v.status || "ACTIVE",
              },
            });

            if (Array.isArray(v.attributeValueIds) && v.attributeValueIds.length > 0) {
              await tx.productVariantAttribute.createMany({
                data: v.attributeValueIds.map((valId) => ({
                  variantId: newVar.id,
                  attributeValueId: valId,
                })),
              });
            }
          }
        }
      }

      return prod;
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json({ success: false, error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { errorResponse } = await requirePermission(req, "products.delete");
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete product" }, { status: 500 });
  }
}
