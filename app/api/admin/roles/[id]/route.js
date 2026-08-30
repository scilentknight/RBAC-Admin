import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { slugify } from "@/lib/utils";

export async function GET(req, { params }) {
  const { errorResponse } = await requirePermission(req, "roles.view");
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
        userRoles: {
          include: {
            user: {
              select: { id: true, name: true, email: true, status: true, avatar: true },
            },
          },
        },
      },
    });

    if (!role) {
      return NextResponse.json({ success: false, error: "Role not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      role: {
        id: role.id,
        name: role.name,
        slug: role.slug,
        description: role.description,
        isSystem: role.isSystem,
        permissions: role.rolePermissions.map((rp) => rp.permission.id),
        users: role.userRoles.map((ur) => ur.user),
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get role error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch role" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const { errorResponse } = await requirePermission(req, "roles.edit");
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    const body = await req.json();
    const { name, description, permissions } = body;

    const existingRole = await prisma.role.findUnique({ where: { id } });
    if (!existingRole) {
      return NextResponse.json({ success: false, error: "Role not found" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const role = await tx.role.update({
        where: { id },
        data: {
          name: name || existingRole.name,
          slug: name ? slugify(name) : existingRole.slug,
          description: description !== undefined ? description : existingRole.description,
        },
      });

      if (Array.isArray(permissions)) {
        // Replace role permissions
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        if (permissions.length > 0) {
          await tx.rolePermission.createMany({
            data: permissions.map((pId) => ({
              roleId: id,
              permissionId: pId,
            })),
          });
        }
      }

      return role;
    });

    return NextResponse.json({ success: true, role: updated });
  } catch (error) {
    console.error("Update role error:", error);
    return NextResponse.json({ success: false, error: "Failed to update role" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { errorResponse } = await requirePermission(req, "roles.delete");
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    const role = await prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { userRoles: true } } },
    });

    if (!role) {
      return NextResponse.json({ success: false, error: "Role not found" }, { status: 404 });
    }

    if (role.isSystem) {
      return NextResponse.json(
        { success: false, error: "System protected roles cannot be deleted" },
        { status: 400 }
      );
    }

    if (role._count.userRoles > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete role: ${role._count.userRoles} users are currently assigned to it` },
        { status: 400 }
      );
    }

    await prisma.role.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Role deleted successfully" });
  } catch (error) {
    console.error("Delete role error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete role" }, { status: 500 });
  }
}
