import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export async function GET(req, { params }) {
  const { errorResponse } = await requirePermission(req, "distributors.view");
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    const distributor = await prisma.distributor.findUnique({
      where: { id },
      include: {
        applications: {
          include: {
            reviewedBy: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!distributor) {
      return NextResponse.json({ success: false, error: "Distributor not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, distributor });
  } catch (error) {
    console.error("Get distributor error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch distributor" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const { errorResponse } = await requirePermission(req, "distributors.view");
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    const body = await req.json();
    const { name, companyName, email, phone, address, city, state, country, taxId, status, creditLimit } = body;

    const updated = await prisma.distributor.update({
      where: { id },
      data: {
        name: name || undefined,
        companyName: companyName || undefined,
        email: email ? email.toLowerCase().trim() : undefined,
        phone: phone !== undefined ? phone : undefined,
        address: address !== undefined ? address : undefined,
        city: city !== undefined ? city : undefined,
        state: state !== undefined ? state : undefined,
        country: country || undefined,
        taxId: taxId !== undefined ? taxId : undefined,
        status: status || undefined,
        creditLimit: creditLimit !== undefined ? parseFloat(creditLimit) : undefined,
      },
    });

    return NextResponse.json({ success: true, distributor: updated });
  } catch (error) {
    console.error("Update distributor error:", error);
    return NextResponse.json({ success: false, error: "Failed to update distributor" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { errorResponse } = await requirePermission(req, "distributors.view");
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    await prisma.distributor.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Distributor removed successfully" });
  } catch (error) {
    console.error("Delete distributor error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete distributor" }, { status: 500 });
  }
}
