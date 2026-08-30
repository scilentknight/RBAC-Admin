import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/**
 * Retrieve user with their assigned roles and flattened distinct permissions
 */
export async function getUserWithPermissions(userId) {
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
      dealer: true,
    },
  });

  if (!user || user.status !== "ACTIVE") {
    return null;
  }

  // Extract distinct permissions and role names
  const permissionSet = new Set();
  const roles = [];

  for (const ur of user.userRoles) {
    roles.push({
      id: ur.role.id,
      name: ur.role.name,
      slug: ur.role.slug,
    });

    for (const rp of ur.role.rolePermissions) {
      if (rp.permission?.id) {
        permissionSet.add(rp.permission.id);
      }
    }
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    status: user.status,
    dealerId: user.dealerId,
    dealer: user.dealer,
    roles,
    permissions: Array.from(permissionSet),
  };
}

/**
 * Guard to ensure user is authenticated
 */
export async function requireAuth(req) {
  const session = await getSessionUser(req);

  if (!session || !session.userId) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { success: false, error: "Authentication required", code: "UNAUTHENTICATED" },
        { status: 401 }
      ),
    };
  }

  const user = await getUserWithPermissions(session.userId);

  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { success: false, error: "User account disabled or not found", code: "UNAUTHORIZED" },
        { status: 401 }
      ),
    };
  }

  return { user, errorResponse: null };
}

/**
 * Guard to enforce server-side permission check
 * @param {Request} req
 * @param {string} requiredPermission - e.g. "products.view"
 */
export async function requirePermission(req, requiredPermission) {
  const { user, errorResponse } = await requireAuth(req);
  if (errorResponse) return { user: null, errorResponse };

  const hasPermission = user.permissions.includes(requiredPermission);

  if (!hasPermission) {
    return {
      user,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: `Forbidden: Missing required permission [${requiredPermission}]`,
          code: "FORBIDDEN",
          requiredPermission,
        },
        { status: 403 }
      ),
    };
  }

  return { user, errorResponse: null };
}

/**
 * Guard for checking ANY of the given permissions
 * @param {Request} req
 * @param {string[]} permissionsList
 */
export async function requireAnyPermission(req, permissionsList) {
  const { user, errorResponse } = await requireAuth(req);
  if (errorResponse) return { user: null, errorResponse };

  const hasAny = permissionsList.some((p) => user.permissions.includes(p));

  if (!hasAny) {
    return {
      user,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: `Forbidden: Requires at least one of [${permissionsList.join(", ")}]`,
          code: "FORBIDDEN",
        },
        { status: 403 }
      ),
    };
  }

  return { user, errorResponse: null };
}

/**
 * Enforce dealer ownership:
 * If user is a dealer account (has dealerId), they can ONLY access their own dealer data.
 */
export async function requireDealerOwnership(user, targetDealerId) {
  if (user.dealerId && user.dealerId !== targetDealerId) {
    return NextResponse.json(
      {
        success: false,
        error: "Forbidden: You do not have access to another dealer's inventory or data",
        code: "DEALER_ACCESS_DENIED",
      },
      { status: 403 }
    );
  }
  return null;
}
