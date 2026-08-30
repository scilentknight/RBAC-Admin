import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { slugify } from "@/lib/utils";

export async function GET(req) {
  const { errorResponse } = await requirePermission(req, "attributes.view");
  if (errorResponse) return errorResponse;

  try {
    const attributes = await prisma.attribute.findMany({
      include: {
        values: {
          orderBy: { sortOrder: "asc" },
        },
        _count: { select: { values: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, attributes });
  } catch (error) {
    console.error("Fetch attributes error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch attributes" }, { status: 500 });
  }
}

export async function POST(req) {
  const { errorResponse } = await requirePermission(req, "attributes.create");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { name, code, description, status = "ACTIVE", values = [] } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: "Attribute name is required" }, { status: 400 });
    }

    const finalCode = code ? slugify(code) : slugify(name);

    const existing = await prisma.attribute.findUnique({ where: { code: finalCode } });
    if (existing) {
      return NextResponse.json({ success: false, error: "Attribute with this code already exists" }, { status: 400 });
    }

    const attribute = await prisma.attribute.create({
      data: {
        name,
        code: finalCode,
        description: description || null,
        status,
        values: {
          create: values.map((val, idx) => ({
            value: typeof val === "string" ? val : val.value,
            code: typeof val === "string" ? slugify(val) : (val.code || slugify(val.value)),
            sortOrder: idx + 1,
          })),
        },
      },
      include: { values: true },
    });

    return NextResponse.json({ success: true, attribute }, { status: 201 });
  } catch (error) {
    console.error("Create attribute error:", error);
    return NextResponse.json({ success: false, error: "Failed to create attribute" }, { status: 500 });
  }
}
