import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { slugify } from "@/lib/utils";

export async function GET(req) {
  const { errorResponse } = await requirePermission(req, "categories.view");
  if (errorResponse) return errorResponse;

  try {
    const categories = await prisma.category.findMany({
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: { select: { id: true, name: true, slug: true, status: true, sortOrder: true } },
        _count: { select: { products: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error("Fetch categories error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req) {
  const { errorResponse } = await requirePermission(req, "categories.create");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { name, slug, description, image, parentId, status = "ACTIVE", sortOrder = 0 } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: "Category name is required" }, { status: 400 });
    }

    const finalSlug = slug ? slugify(slug) : slugify(name);

    const existing = await prisma.category.findUnique({ where: { slug: finalSlug } });
    if (existing) {
      return NextResponse.json({ success: false, error: "A category with this slug already exists" }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug: finalSlug,
        description: description || null,
        image: image || null,
        parentId: parentId || null,
        status,
        sortOrder: parseInt(sortOrder) || 0,
      },
    });

    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json({ success: false, error: "Failed to create category" }, { status: 500 });
  }
}
