import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export async function GET(req) {
  const { errorResponse } = await requirePermission(req, "distributors.view");
  if (errorResponse) return errorResponse;

  try {
    const distributors = await prisma.distributor.findMany({
      include: {
        applications: {
          include: {
            reviewedBy: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const applications = await prisma.distributorApplication.findMany({
      include: {
        reviewedBy: { select: { id: true, name: true, email: true } },
        distributor: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      distributors,
      applications,
    });
  } catch (error) {
    console.error("Fetch distributors error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch distributors" }, { status: 500 });
  }
}

export async function POST(req) {
  const { errorResponse } = await requirePermission(req, "distributors.view");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { name, companyName, email, phone, address, city, state, country, taxId, creditLimit } = body;

    if (!companyName || !email) {
      return NextResponse.json({ success: false, error: "Company name and email are required" }, { status: 400 });
    }

    const dist = await prisma.distributor.create({
      data: {
        name: name || companyName,
        companyName,
        email: email.toLowerCase().trim(),
        phone: phone || "",
        address: address || "",
        city: city || "",
        state: state || "",
        country: country || "USA",
        taxId: taxId || null,
        creditLimit: creditLimit ? parseFloat(creditLimit) : 10000.0,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ success: true, distributor: dist }, { status: 201 });
  } catch (error) {
    console.error("Create distributor error:", error);
    return NextResponse.json({ success: false, error: "Failed to create distributor" }, { status: 500 });
  }
}
