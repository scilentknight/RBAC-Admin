import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export async function POST(req, { params }) {
  const { user, errorResponse } = await requirePermission(req, "distributors.reject");
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    const body = await req.json().catch(() => ({}));
    const { reviewNotes } = body;

    const application = await prisma.distributorApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
    }

    const updated = await prisma.distributorApplication.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewNotes: reviewNotes || "Application rejected due to business compliance requirements.",
        reviewedByUserId: user.id,
        reviewedAt: new Date(),
      },
      include: { reviewedBy: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json({
      success: true,
      message: `Application for ${application.companyName} has been rejected`,
      application: updated,
    });
  } catch (error) {
    console.error("Reject application error:", error);
    return NextResponse.json({ success: false, error: "Failed to reject application" }, { status: 500 });
  }
}
