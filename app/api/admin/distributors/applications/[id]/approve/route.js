import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export async function POST(req, { params }) {
  const { user, errorResponse } = await requirePermission(req, "distributors.approve");
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    const body = await req.json().catch(() => ({}));
    const { reviewNotes, creditLimit = 15000.0 } = body;

    const application = await prisma.distributorApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
    }

    if (application.status === "APPROVED") {
      return NextResponse.json({ success: false, error: "Application has already been approved" }, { status: 400 });
    }

    // Atomic transaction: create/link distributor entity and update application
    const result = await prisma.$transaction(async (tx) => {
      // Find or create distributor record
      let distributor = await tx.distributor.findUnique({
        where: { email: application.email },
      });

      if (!distributor) {
        distributor = await tx.distributor.create({
          data: {
            name: application.applicantName,
            companyName: application.companyName,
            email: application.email,
            phone: application.phone,
            address: application.address,
            city: "General",
            state: "USA",
            country: "USA",
            status: "ACTIVE",
            creditLimit: parseFloat(creditLimit) || 15000.0,
          },
        });
      }

      const updatedApp = await tx.distributorApplication.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewNotes: reviewNotes || "Application approved by authorized manager.",
          reviewedByUserId: user.id,
          reviewedAt: new Date(),
          distributorId: distributor.id,
        },
        include: { distributor: true, reviewedBy: { select: { id: true, name: true, email: true } } },
      });

      return updatedApp;
    });

    return NextResponse.json({
      success: true,
      message: `Application for ${application.companyName} approved successfully`,
      application: result,
    });
  } catch (error) {
    console.error("Approve application error:", error);
    return NextResponse.json({ success: false, error: "Failed to approve application" }, { status: 500 });
  }
}
