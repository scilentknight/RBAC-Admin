import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { slugify } from "@/lib/utils";

export async function GET(req, { params }) {
  const { errorResponse } = await requirePermission(req, "brands.view");
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        products: {
          select: { id: true, name: true, slug: true, status: true, type: true },
        },
        _count: { select: { products: true } },
      },
    });

    if (!brand) {
      return NextResponse.json({ success: false, error: "Brand not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, brand });
  } catch (error) {
    console.error("Get brand error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch brand" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const { errorResponse } = await requirePermission(req, "brands.edit");
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    const body = await req.json();
    const { name, slug, description, logo, status } = body;

    const existing = await prisma.brand.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Brand not found" }, { status: 404 });
    }

    const updated = await prisma.brand.update({
      where: { id },
      data: {
        name: name || existing.name,
        slug: slug ? slugify(slug) : (name ? slugify(name) : existing.slug),
        description: description !== undefined ? description : existing.description,
        logo: logo !== undefined ? logo : existing.logo,
        status: status || existing.status,
      },
    });

    return NextResponse.json({ success: true, brand: updated });
  } catch (error) {
    console.error("Update brand error:", error);
    return NextResponse.json({ success: false, error: "Failed to update brand" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { errorResponse } = await requirePermission(req, "brands.delete");
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    await prisma.brand.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Brand deleted successfully" });
  } catch (error) {
    console.error("Delete brand error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete brand" }, { status: 500 });
  }
}
