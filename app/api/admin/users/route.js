import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { hashPassword } from "@/lib/auth";

export async function GET(req) {
  const { errorResponse } = await requirePermission(req, "users.view");
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const roleId = searchParams.get("roleId") || "";
    const status = searchParams.get("status") || "";

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (roleId) {
      where.userRoles = {
        some: { roleId },
      };
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
        dealer: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = users.map((u) => {
      const perms = new Set();
      const roles = u.userRoles.map((ur) => {
        ur.role.rolePermissions.forEach((rp) => {
          if (rp.permission?.id) perms.add(rp.permission.id);
        });
        return {
          id: ur.role.id,
          name: ur.role.name,
          slug: ur.role.slug,
        };
      });

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        avatar: u.avatar,
        status: u.status,
        dealerId: u.dealerId,
        dealer: u.dealer ? { id: u.dealer.id, name: u.dealer.name, code: u.dealer.code } : null,
        roles,
        permissionsCount: perms.size,
        permissions: Array.from(perms),
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      };
    });

    return NextResponse.json({ success: true, users: formatted });
  } catch (error) {
    console.error("Fetch users error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req) {
  const { errorResponse } = await requirePermission(req, "users.create");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { name, email, password, roleIds = [], status = "ACTIVE", dealerId, avatar } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json({ success: false, error: "Email already in use" }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          avatar: avatar || null,
          status,
          dealerId: dealerId || null,
        },
      });

      if (roleIds.length > 0) {
        await tx.userRole.createMany({
          data: roleIds.map((rId) => ({
            userId: user.id,
            roleId: rId,
          })),
        });
      }

      return user;
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json({ success: false, error: "Failed to create user" }, { status: 500 });
  }
}
