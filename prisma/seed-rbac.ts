import type { PrismaClient } from "../src/generated/prisma/client";
import {
  ALL_PERMISSION_KEYS,
  PERMISSION_ACTIONS,
  PERMISSION_MODULES,
  permissionKey,
} from "../src/lib/rbac/definitions";
import { ROLE_DEFAULT_PERMISSIONS, ROLE_LABELS } from "../src/lib/rbac/role-defaults";
import { DEFAULT_ROLE_CODES } from "../src/lib/rbac/definitions";

export async function seedRbac(prisma: PrismaClient) {
  const permRecords: { id: string; module: string; action: string }[] = [];

  for (const module of PERMISSION_MODULES) {
    for (const action of PERMISSION_ACTIONS) {
      const key = permissionKey(module, action);
      const p = await prisma.permission.upsert({
        where: { module_action: { module, action } },
        update: { description: key },
        create: { module, action, description: key },
      });
      permRecords.push({ id: p.id, module, action });
    }
  }

  const permByKey = new Map(permRecords.map((p) => [`${p.module}.${p.action}`, p.id]));

  for (const code of DEFAULT_ROLE_CODES) {
    const role = await prisma.role.upsert({
      where: { code },
      update: { name: ROLE_LABELS[code] ?? code, isSystem: true },
      create: {
        code,
        name: ROLE_LABELS[code] ?? code,
        description: `Rôle système ${code}`,
        isSystem: true,
      },
    });

    const keys = [
      ...new Set(
        code === "ADMIN"
          ? ALL_PERMISSION_KEYS
          : (ROLE_DEFAULT_PERMISSIONS[code] ?? []),
      ),
    ];

    for (const key of keys) {
      const pid = permByKey.get(key);
      if (!pid) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: pid } },
        update: { allowed: true },
        create: { roleId: role.id, permissionId: pid, allowed: true },
      });
    }
  }

  return permByKey;
}

export async function linkLegacyUsers(prisma: PrismaClient) {
  const map: Record<string, string> = {
    ADMIN: "ADMIN",
    COMMERCIAL: "COMMERCIAL",
    DEPOT_MANAGER: "RESPONSABLE_DEPOT",
    ACCOUNTANT: "COMPTABLE",
  };

  for (const [legacy, code] of Object.entries(map)) {
    const role = await prisma.role.findUnique({ where: { code } });
    if (!role) continue;
    await prisma.user.updateMany({
      where: { role: legacy as "ADMIN" | "COMMERCIAL" | "DEPOT_MANAGER" | "ACCOUNTANT", roleId: null },
      data: { roleId: role.id },
    });
  }
}
