import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { slugify } from "@/lib/utils";

export async function GET(req) {
  const { errorResponse } = await requirePermission(req, "brands.view");
  if (errorResponse) return errorResponse;

  try {
    const brands = await prisma.brand.findMany({
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, brands });
  } catch (error) {
    console.error("Fetch brands error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch brands" }, { status: 500 });
  }
}

export async function POST(req) {
  const { errorResponse } = await requirePermission(req, "brands.create");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { name, slug, description, logo, status = "ACTIVE" } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: "Brand name is required" }, { status: 400 });
    }

    const finalSlug = slug ? slugify(slug) : slugify(name);

    const existing = await prisma.brand.findUnique({ where: { slug: finalSlug } });
    if (existing) {
      return NextResponse.json({ success: false, error: "A brand with this slug already exists" }, { status: 400 });
    }

    const brand = await prisma.brand.create({
      data: {
        name,
        slug: finalSlug,
        description: description || null,
        logo: logo || null,
        status,
      },
    });

    return NextResponse.json({ success: true, brand }, { status: 201 });
  } catch (error) {
    console.error("Create brand error:", error);
    return NextResponse.json({ success: false, error: "Failed to create brand" }, { status: 500 });
  }
}
