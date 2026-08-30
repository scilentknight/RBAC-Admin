import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { getUserWithPermissions } from "@/lib/rbac";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const userRecord = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!userRecord) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (userRecord.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "Your account is disabled. Please contact an administrator." },
        { status: 403 }
      );
    }

    const isMatch = await verifyPassword(password, userRecord.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
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
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during login" },
      { status: 500 }
    );
  }
}
