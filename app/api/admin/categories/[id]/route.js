import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { slugify } from "@/lib/utils";

export async function GET(req, { params }) {
  const { errorResponse } = await requirePermission(req, "categories.view");
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error("Get category error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch category" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const { errorResponse } = await requirePermission(req, "categories.edit");
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    const body = await req.json();
    const { name, slug, description, image, parentId, status, sortOrder } = body;

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: name || existing.name,
        slug: slug ? slugify(slug) : (name ? slugify(name) : existing.slug),
        description: description !== undefined ? description : existing.description,
        image: image !== undefined ? image : existing.image,
        parentId: parentId !== undefined ? (parentId === id ? null : parentId) : existing.parentId,
        status: status || existing.status,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : existing.sortOrder,
      },
    });

    return NextResponse.json({ success: true, category: updated });
  } catch (error) {
    console.error("Update category error:", error);
    return NextResponse.json({ success: false, error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { errorResponse } = await requirePermission(req, "categories.delete");
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    // Reset child category parentId
    await prisma.category.updateMany({
      where: { parentId: id },
      data: { parentId: null },
    });

    await prisma.category.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete category" }, { status: 500 });
  }
}
