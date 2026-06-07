import type { UserRole } from "@/generated/prisma/enums";
import { hasPermission as hasPerm, type ResolvedPermissions } from "@/lib/rbac/has-permission";

/** @deprecated Utiliser PermissionKey — conservé pour routes existantes */
export type Permission =
  | "dashboard:read"
  | "vehicles:*"
  | "purchases:*"
  | "sales:*"
  | "depots:*"
  | "clients:*"
  | "suppliers:*"
  | "payments:*"
  | "documents:*"
  | "reports:*"
  | "warehouse:*"
  | "users:*"
  | "expenses:*";

const legacyMatrix: Record<UserRole, Permission[]> = {
  ADMIN: [
    "dashboard:read",
    "vehicles:*",
    "purchases:*",
    "sales:*",
    "depots:*",
    "clients:*",
    "suppliers:*",
    "payments:*",
    "documents:*",
    "reports:*",
    "users:*",
    "expenses:*",
  ],
  COMMERCIAL: [
    "dashboard:read",
    "vehicles:*",
    "purchases:*",
    "sales:*",
    "clients:*",
    "suppliers:*",
    "documents:*",
    "reports:*",
  ],
  DEPOT_MANAGER: ["dashboard:read", "vehicles:*", "depots:*", "documents:*", "warehouse:*"],
  ACCOUNTANT: [
    "dashboard:read",
    "payments:*",
    "reports:*",
    "expenses:*",
    "documents:*",
    "purchases:*",
    "sales:*",
  ],
};

/** Vérification legacy par rôle enum (fallback si pas de permissions JWT) */
export function can(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  const list = legacyMatrix[role] ?? [];
  return list.some((p) => p === permission || p.endsWith(":*"));
}

export function canWithPermissions(
  permissions: ResolvedPermissions | string[] | undefined,
  permission: Permission | string
): boolean {
  if (permissions && (permissions instanceof Set ? permissions.size : permissions.length) > 0) {
    return hasPerm(permissions, permission);
  }
  return false;
}

export { hasPermission } from "@/lib/rbac/has-permission";
