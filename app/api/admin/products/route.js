import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { slugify } from "@/lib/utils";

export async function GET(req) {
  const { errorResponse } = await requirePermission(req, "products.view");
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const brandId = searchParams.get("brandId") || "";
    const status = searchParams.get("status") || "";
    const type = searchParams.get("type") || "";

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { slug: { contains: search } },
        {
          variants: {
            some: {
              sku: { contains: search },
            },
          },
        },
      ];
    }

    if (categoryId) where.categoryId = categoryId;
    if (brandId) where.brandId = brandId;
    if (status) where.status = status;
    if (type) where.type = type;

    const products = await prisma.product.findMany({
      where,
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
      orderBy: { createdAt: "desc" },
    });

    const formatted = products.map((p) => {
      const totalStock = p.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
      const minPrice = p.variants.length > 0 ? Math.min(...p.variants.map((v) => v.price)) : 0;
      const maxPrice = p.variants.length > 0 ? Math.max(...p.variants.map((v) => v.price)) : 0;
      const primaryImage = p.images.find((img) => img.isPrimary) || p.images[0] || null;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        shortDescription: p.shortDescription,
        description: p.description,
        type: p.type,
        status: p.status,
        category: p.category,
        brand: p.brand,
        primaryImage: primaryImage ? primaryImage.url : null,
        images: p.images,
        variantCount: p.variants.length,
        totalStock,
        priceRange: minPrice === maxPrice ? minPrice : { min: minPrice, max: maxPrice },
        variants: p.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          barcode: v.barcode,
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          stock: v.stock,
          reservedStock: v.reservedStock,
          lowStockThreshold: v.lowStockThreshold,
          weight: v.weight,
          image: v.image,
          status: v.status,
          attributes: v.attributeValues.map((av) => ({
            attributeId: av.attributeValue.attributeId,
            attributeName: av.attributeValue.attribute?.name,
            valueId: av.attributeValue.id,
            value: av.attributeValue.value,
          })),
        })),
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });

    return NextResponse.json({ success: true, products: formatted });
  } catch (error) {
    console.error("Fetch products error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req) {
  const { errorResponse } = await requirePermission(req, "products.create");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const {
      name,
      slug,
      shortDescription,
      description,
      type = "SIMPLE",
      status = "ACTIVE",
      categoryId,
      brandId,
      images = [],
      // For simple products:
      price,
      compareAtPrice,
      sku,
      stock = 0,
      lowStockThreshold = 5,
      barcode,
      // For variable products:
      variants = [],
    } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: "Product name is required" }, { status: 400 });
    }

    const finalSlug = slug ? slugify(slug) : slugify(name);

    const existing = await prisma.product.findUnique({ where: { slug: finalSlug } });
    if (existing) {
      return NextResponse.json({ success: false, error: "Product with this slug already exists" }, { status: 400 });
    }

    // Validate duplicate variation combinations if variable
    if (type === "VARIABLE") {
      if (!variants || variants.length === 0) {
        return NextResponse.json(
          { success: false, error: "At least one variant SKU is required for variable products" },
          { status: 400 }
        );
      }

      const comboKeys = new Set();
      const skuSet = new Set();

      for (const v of variants) {
        if (!v.sku || !v.sku.trim()) {
          return NextResponse.json({ success: false, error: "Every variation must have a valid SKU" }, { status: 400 });
        }
        if (skuSet.has(v.sku.trim().toUpperCase())) {
          return NextResponse.json({ success: false, error: `Duplicate SKU within product: ${v.sku}` }, { status: 400 });
        }
        skuSet.add(v.sku.trim().toUpperCase());

        if (Array.isArray(v.attributeValueIds) && v.attributeValueIds.length > 0) {
          const sortedKey = [...v.attributeValueIds].sort().join("::");
          if (comboKeys.has(sortedKey)) {
            return NextResponse.json(
              { success: false, error: "Duplicate attribute combination detected among variations" },
              { status: 400 }
            );
          }
          comboKeys.add(sortedKey);
        }
      }
    }

    // Database transaction for product and variations
    const newProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name,
          slug: finalSlug,
          shortDescription: shortDescription || null,
          description: description || null,
          type,
          status,
          categoryId: categoryId || null,
          brandId: brandId || null,
          images: {
            create: images.map((img, idx) => ({
              url: typeof img === "string" ? img : img.url,
              altText: typeof img === "string" ? name : img.altText || name,
              sortOrder: idx + 1,
              isPrimary: idx === 0,
            })),
          },
        },
      });

      if (type === "SIMPLE") {
        const simpleSku = sku ? sku.trim().toUpperCase() : `${finalSlug.toUpperCase().slice(0, 10)}-01`;
        await tx.productVariant.create({
          data: {
            productId: product.id,
            sku: simpleSku,
            barcode: barcode || null,
            price: parseFloat(price) || 0,
            compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
            stock: parseInt(stock) || 0,
            lowStockThreshold: parseInt(lowStockThreshold) || 5,
            status: "ACTIVE",
          },
        });
      } else {
        // Create variable variants
        for (const v of variants) {
          const variant = await tx.productVariant.create({
            data: {
              productId: product.id,
              sku: v.sku.trim().toUpperCase(),
              barcode: v.barcode || null,
              price: parseFloat(v.price) || 0,
              compareAtPrice: v.compareAtPrice ? parseFloat(v.compareAtPrice) : null,
              stock: parseInt(v.stock) || 0,
              lowStockThreshold: parseInt(v.lowStockThreshold) || 5,
              weight: v.weight ? parseFloat(v.weight) : null,
              image: v.image || null,
              status: v.status || "ACTIVE",
            },
          });

          if (Array.isArray(v.attributeValueIds) && v.attributeValueIds.length > 0) {
            await tx.productVariantAttribute.createMany({
              data: v.attributeValueIds.map((valId) => ({
                variantId: variant.id,
                attributeValueId: valId,
              })),
            });
          }
        }
      }

      return product;
    });

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create product" }, { status: 500 });
  }
}
