import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export async function GET(req) {
  const { errorResponse } = await requirePermission(req, "dealers.view");
  if (errorResponse) return errorResponse;

  try {
    const dealers = await prisma.dealer.findMany({
      include: {
        users: { select: { id: true, name: true, email: true, status: true } },
        _count: { select: { inventories: true, users: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, dealers });
  } catch (error) {
    console.error("Fetch dealers error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch dealers" }, { status: 500 });
  }
}

export async function POST(req) {
  const { errorResponse } = await requirePermission(req, "dealers.create");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { name, code, email, phone, address, city, state, region, status = "ACTIVE" } = body;

    if (!name || !code || !email) {
      return NextResponse.json({ success: false, error: "Name, Code, and Email are required" }, { status: 400 });
    }

    const existing = await prisma.dealer.findFirst({
      where: {
        OR: [{ code: code.toUpperCase().trim() }, { email: email.toLowerCase().trim() }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "A dealer with this code or email already exists" },
        { status: 400 }
      );
    }

    const dealer = await prisma.dealer.create({
      data: {
        name,
        code: code.toUpperCase().trim(),
        email: email.toLowerCase().trim(),
        phone: phone || "",
        address: address || "",
        city: city || "",
        state: state || "",
        region: region || "General",
        status,
      },
    });

    return NextResponse.json({ success: true, dealer }, { status: 201 });
  } catch (error) {
    console.error("Create dealer error:", error);
    return NextResponse.json({ success: false, error: "Failed to create dealer" }, { status: 500 });
  }
}
