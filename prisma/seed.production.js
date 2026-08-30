/**
 * Production-safe seed script for RBAC Admin Panel.
 *
 * SAFE TO RUN ON A LIVE DATABASE:
 * - Never deletes any existing records.
 * - Creates permissions only if they don't already exist (upsert by id).
 * - Creates roles only if they don't already exist (upsert by slug).
 * - Creates the initial Super Admin user only if no user with that email exists.
 * - The admin password MUST be supplied via the ADMIN_PASSWORD env variable.
 *   The script refuses to run if ADMIN_PASSWORD is not set or is too short.
 *
 * Usage:
 *   ADMIN_EMAIL=yourname@yourdomain.com ADMIN_PASSWORD="YourStrongPassword!" \
 *     DATABASE_URL="mysql://..." node prisma/seed.production.js
 *
 * On Windows PowerShell:
 *   $env:ADMIN_EMAIL = "yourname@yourdomain.com"
 *   $env:ADMIN_PASSWORD = "YourStrongPassword!"
 *   $env:DATABASE_URL = "mysql://..."
 *   node prisma/seed.production.js
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PERMISSION_CATALOG } from "../lib/permissions.js";

const prisma = new PrismaClient();

// ─── Safety Guards ─────────────────────────────────────────────────────────────

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_EMAIL.includes("@")) {
  console.error("❌ FATAL: ADMIN_EMAIL is not set or is not a valid email address.");
  console.error("   Set it with: $env:ADMIN_EMAIL = \"yourname@yourdomain.com\"");
  process.exit(1);
}

if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) {
  console.error("❌ FATAL: ADMIN_PASSWORD is not set or is shorter than 12 characters.");
  console.error("   Set it with: $env:ADMIN_PASSWORD = \"YourStrongPassword!\"");
  console.error("   Use a strong password — minimum 12 characters.");
  process.exit(1);
}

// Reject obviously insecure passwords
const INSECURE_PASSWORDS = ["Admin@123", "Password123", "password", "admin", "123456"];
if (INSECURE_PASSWORDS.includes(ADMIN_PASSWORD)) {
  console.error("❌ FATAL: ADMIN_PASSWORD is an insecure default password. Use a strong, unique password.");
  process.exit(1);
}

// ─── Main Seed ─────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Starting production-safe database seed...");
  console.log("   Mode: NON-DESTRUCTIVE — existing data is never deleted.\n");

  // 1. Upsert all permissions from PERMISSION_CATALOG
  let permCreated = 0;
  let permExisted = 0;

  for (const mod of PERMISSION_CATALOG) {
    for (const act of mod.actions) {
      const permId = `${mod.module}.${act.action}`;
      const existing = await prisma.permission.findUnique({ where: { id: permId } });

      if (!existing) {
        await prisma.permission.create({
          data: {
            id: permId,
            module: mod.module,
            action: act.action,
            label: act.label,
            description: act.description,
          },
        });
        permCreated++;
      } else {
        permExisted++;
      }
    }
  }

  console.log(`✅ Permissions: ${permCreated} created, ${permExisted} already existed.`);

  // 2. Upsert Super Admin role
  const existingRole = await prisma.role.findUnique({ where: { slug: "super-admin" } });

  let superAdminRole;
  if (!existingRole) {
    superAdminRole = await prisma.role.create({
      data: {
        name: "Super Administrator",
        slug: "super-admin",
        description: "Full system access to all modules, configurations, and permissions",
        isSystem: true,
      },
    });
    console.log("✅ Role: 'Super Administrator' created.");
  } else {
    superAdminRole = existingRole;
    console.log("✅ Role: 'Super Administrator' already exists, skipped.");
  }

  // 3. Ensure Super Admin has ALL permissions (upsert role-permission links)
  const allPermissions = await prisma.permission.findMany();
  let rpCreated = 0;
  let rpExisted = 0;

  for (const perm of allPermissions) {
    const existing = await prisma.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: perm.id } },
    });

    if (!existing) {
      await prisma.rolePermission.create({
        data: { roleId: superAdminRole.id, permissionId: perm.id },
      });
      rpCreated++;
    } else {
      rpExisted++;
    }
  }

  console.log(`✅ Role Permissions: ${rpCreated} assigned, ${rpExisted} already existed.`);

  // 4. Create initial admin user only if email doesn't exist
  const existingUser = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL.toLowerCase().trim() },
  });

  if (existingUser) {
    console.log(`✅ Admin user '${ADMIN_EMAIL}' already exists — not modified.`);
  } else {
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12); // cost factor 12 for production

    const adminUser = await prisma.user.create({
      data: {
        name: "Administrator",
        email: ADMIN_EMAIL.toLowerCase().trim(),
        password: hashedPassword,
        status: "ACTIVE",
        userRoles: {
          create: [{ roleId: superAdminRole.id }],
        },
      },
    });

    console.log(`✅ Admin user '${adminUser.email}' created with Super Administrator role.`);
    console.log("   ⚠️  Record the credentials securely — this password cannot be recovered.");
  }

  console.log("\n🎉 Production seed complete. Database was not modified beyond what was listed above.");
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
