import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { getUserWithPermissions } from "@/lib/rbac";

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    const userRecord = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!userRecord) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const fullUser = await getUserWithPermissions(userRecord.id);

    const token = await createSessionToken({
      userId: fullUser.id,
      email: fullUser.email,
      name: fullUser.name,
      dealerId: fullUser.dealerId,
    });

    const response = NextResponse.json({
      success: true,
      user: fullUser,
      token,
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Switch role error:", error);
    return NextResponse.json({ success: false, error: "Failed to switch role" }, { status: 500 });
  }
}
