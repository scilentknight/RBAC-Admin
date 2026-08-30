import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export async function GET(req, { params }) {
  const { errorResponse } = await requirePermission(req, "dealers.view");
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    const dealer = await prisma.dealer.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, name: true, email: true, status: true, avatar: true } },
        inventories: {
          include: {
            variant: {
              include: {
                product: { select: { id: true, name: true, slug: true } },
                attributeValues: {
                  include: { attributeValue: { include: { attribute: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!dealer) {
      return NextResponse.json({ success: false, error: "Dealer not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, dealer });
  } catch (error) {
    console.error("Get dealer error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch dealer" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const { errorResponse } = await requirePermission(req, "dealers.edit");
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    const body = await req.json();
    const { name, code, email, phone, address, city, state, region, status } = body;

    const existing = await prisma.dealer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Dealer not found" }, { status: 404 });
    }

    const updated = await prisma.dealer.update({
      where: { id },
      data: {
        name: name || undefined,
        code: code ? code.toUpperCase().trim() : undefined,
        email: email ? email.toLowerCase().trim() : undefined,
        phone: phone !== undefined ? phone : undefined,
        address: address !== undefined ? address : undefined,
        city: city !== undefined ? city : undefined,
        state: state !== undefined ? state : undefined,
        region: region !== undefined ? region : undefined,
        status: status || undefined,
      },
    });

    return NextResponse.json({ success: true, dealer: updated });
  } catch (error) {
    console.error("Update dealer error:", error);
    return NextResponse.json({ success: false, error: "Failed to update dealer" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { errorResponse } = await requirePermission(req, "dealers.delete");
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    await prisma.dealer.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Dealer deleted successfully" });
  } catch (error) {
    console.error("Delete dealer error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete dealer" }, { status: 500 });
  }
}
