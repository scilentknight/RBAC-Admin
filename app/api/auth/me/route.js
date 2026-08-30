import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";

export async function GET(req) {
  const { user, errorResponse } = await requireAuth(req);
  if (errorResponse) return errorResponse;

  return NextResponse.json({
    success: true,
    user,
  });
}
