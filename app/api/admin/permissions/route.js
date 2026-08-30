import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PERMISSION_CATALOG } from "@/lib/permissions";

export async function GET(req) {
  const { errorResponse } = await requirePermission(req, "roles.view");
  if (errorResponse) return errorResponse;

  try {
    const dbPermissions = await prisma.permission.findMany({
      orderBy: [{ module: "asc" }, { action: "asc" }],
    });

    return NextResponse.json({
      success: true,
      catalog: PERMISSION_CATALOG,
      permissions: dbPermissions,
    });
  } catch (error) {
    console.error("Fetch permissions error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch permissions" }, { status: 500 });
  }
}
