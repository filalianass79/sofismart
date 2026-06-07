import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { can, canWithPermissions, type Permission } from "@/lib/permissions";
import type { UserRole } from "@/generated/prisma/enums";
import { hasPermission, loadUserPermissions } from "@/lib/rbac/has-permission";
import { prisma } from "@/lib/prisma";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    return { response: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) };
  }
  return { session };
}

export async function requirePermission(permission: Permission | string) {
  const gate = await requireAuth();
  if ("response" in gate) return gate;

  const perms = gate.session.user.permissions;
  if (perms?.length) {
    if (!canWithPermissions(perms, permission)) {
      return { response: NextResponse.json({ error: "Permission refusée" }, { status: 403 }) };
    }
    return gate;
  }

  const role = gate.session.user.role as UserRole;
  if (!can(role, permission as Permission)) {
    return { response: NextResponse.json({ error: "Permission refusée" }, { status: 403 }) };
  }
  return gate;
}

export async function requirePermissionFresh(permission: string) {
  const gate = await requireAuth();
  if ("response" in gate) return gate;
  const resolved = await loadUserPermissions(prisma, gate.session.user.id);
  if (!canWithPermissions(resolved, permission)) {
    return { response: NextResponse.json({ error: "Permission refusée" }, { status: 403 }) };
  }
  return { ...gate, permissions: [...resolved] };
}

export async function requireAdmin() {
  return requirePermission("users:*");
}

/** Lecture du catalogue marques / modèles (véhicules, achats, stock). */
export async function requireVehicleCatalogAccess() {
  const gate = await requireAuth();
  if ("response" in gate) return gate;

  const perms = gate.session.user.permissions?.length
    ? new Set(gate.session.user.permissions)
    : await loadUserPermissions(prisma, gate.session.user.id);

  const allowed =
    hasPermission(perms, "vehicles:*") ||
    hasPermission(perms, "vehicules.view") ||
    hasPermission(perms, "achats.view") ||
    hasPermission(perms, "achats.create") ||
    hasPermission(perms, "achats.edit");

  if (!allowed) {
    const role = gate.session.user.role as UserRole;
    if (!can(role, "vehicles:*") && !can(role, "purchases:*")) {
      return { response: NextResponse.json({ error: "Permission refusée" }, { status: 403 }) };
    }
  }
  return gate;
}
