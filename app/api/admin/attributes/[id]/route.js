import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { slugify } from "@/lib/utils";

export async function GET(req, { params }) {
  const { errorResponse } = await requirePermission(req, "attributes.view");
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    const attribute = await prisma.attribute.findUnique({
      where: { id },
      include: {
        values: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!attribute) {
      return NextResponse.json({ success: false, error: "Attribute not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, attribute });
  } catch (error) {
    console.error("Get attribute error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch attribute" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const { errorResponse } = await requirePermission(req, "attributes.edit");
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    const body = await req.json();
    const { name, code, description, status } = body;

    const existing = await prisma.attribute.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Attribute not found" }, { status: 404 });
    }

    const updated = await prisma.attribute.update({
      where: { id },
      data: {
        name: name || existing.name,
        code: code ? slugify(code) : existing.code,
        description: description !== undefined ? description : existing.description,
        status: status || existing.status,
      },
      include: { values: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json({ success: true, attribute: updated });
  } catch (error) {
    console.error("Update attribute error:", error);
    return NextResponse.json({ success: false, error: "Failed to update attribute" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { errorResponse } = await requirePermission(req, "attributes.delete");
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    await prisma.attribute.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Attribute deleted successfully" });
  } catch (error) {
    console.error("Delete attribute error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete attribute" }, { status: 500 });
  }
}
