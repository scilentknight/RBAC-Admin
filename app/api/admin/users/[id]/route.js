import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { hashPassword } from "@/lib/auth";

export async function GET(req, { params }) {
  const { errorResponse } = await requirePermission(req, "users.view");
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
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
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const permissionSet = new Set();
    user.userRoles.forEach((ur) => {
      ur.role.rolePermissions.forEach((rp) => {
        if (rp.permission?.id) permissionSet.add(rp.permission.id);
      });
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        status: user.status,
        dealerId: user.dealerId,
        dealer: user.dealer,
        roles: user.userRoles.map((ur) => ({ id: ur.role.id, name: ur.role.name, slug: ur.role.slug })),
        permissions: Array.from(permissionSet),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const { errorResponse } = await requirePermission(req, "users.edit");
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    const body = await req.json();
    const { name, email, password, roleIds, status, dealerId, avatar } = body;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const updateData = {
      name: name || existingUser.name,
      email: email ? email.toLowerCase().trim() : existingUser.email,
      status: status || existingUser.status,
      dealerId: dealerId !== undefined ? dealerId : existingUser.dealerId,
      avatar: avatar !== undefined ? avatar : existingUser.avatar,
    };

    if (password && password.trim().length > 0) {
      updateData.password = await hashPassword(password);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id },
        data: updateData,
      });

      if (Array.isArray(roleIds)) {
        await tx.userRole.deleteMany({ where: { userId: id } });
        if (roleIds.length > 0) {
          await tx.userRole.createMany({
            data: roleIds.map((rId) => ({
              userId: id,
              roleId: rId,
            })),
          });
        }
      }

      return u;
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ success: false, error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { user: requestingUser, errorResponse } = await requirePermission(req, "users.delete");
  if (errorResponse) return errorResponse;

  const { id } = await params;

  if (requestingUser.id === id) {
    return NextResponse.json({ success: false, error: "You cannot delete your own account" }, { status: 400 });
  }

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete user" }, { status: 500 });
  }
}
