import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { slugify } from "@/lib/utils";

// Add a new value to an attribute
export async function POST(req, { params }) {
  const { errorResponse } = await requirePermission(req, "attributes.create");
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    const body = await req.json();
    const { value, code, sortOrder } = body;

    if (!value) {
      return NextResponse.json({ success: false, error: "Value is required" }, { status: 400 });
    }

    const attribute = await prisma.attribute.findUnique({ where: { id } });
    if (!attribute) {
      return NextResponse.json({ success: false, error: "Attribute not found" }, { status: 404 });
    }

    const val = await prisma.attributeValue.create({
      data: {
        attributeId: id,
        value,
        code: code || slugify(value),
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : 0,
      },
    });

    return NextResponse.json({ success: true, value: val }, { status: 201 });
  } catch (error) {
    console.error("Create attribute value error:", error);
    return NextResponse.json({ success: false, error: "Failed to add attribute value" }, { status: 500 });
  }
}

// Update or delete an attribute value
export async function PUT(req, { params }) {
  const { errorResponse } = await requirePermission(req, "attributes.edit");
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    const body = await req.json();
    const { valueId, value, code, sortOrder } = body;

    if (!valueId) {
      return NextResponse.json({ success: false, error: "valueId is required" }, { status: 400 });
    }

    const updated = await prisma.attributeValue.update({
      where: { id: valueId },
      data: {
        value: value || undefined,
        code: code || (value ? slugify(value) : undefined),
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : undefined,
      },
    });

    return NextResponse.json({ success: true, value: updated });
  } catch (error) {
    console.error("Update attribute value error:", error);
    return NextResponse.json({ success: false, error: "Failed to update value" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { errorResponse } = await requirePermission(req, "attributes.delete");
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const valueId = searchParams.get("valueId");

    if (!valueId) {
      return NextResponse.json({ success: false, error: "valueId query param is required" }, { status: 400 });
    }

    await prisma.attributeValue.delete({ where: { id: valueId } });
    return NextResponse.json({ success: true, message: "Value deleted successfully" });
  } catch (error) {
    console.error("Delete attribute value error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete value" }, { status: 500 });
  }
}
