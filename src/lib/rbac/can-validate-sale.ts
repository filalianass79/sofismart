import { hasPermission, type ResolvedPermissions } from "@/lib/rbac/has-permission";

const VALIDATOR_ROLE_CODES = new Set(["ADMIN", "GERANT"]);

/** Gérants et administrateurs uniquement — jamais les commerciaux. */
export function userCanValidateSales(
  permissions: ResolvedPermissions | string[] | undefined,
  roleCode?: string | null,
): boolean {
  const code = (roleCode ?? "").toUpperCase();
  if (code === "COMMERCIAL") return false;

  const hasPerms =
    permissions instanceof Set
      ? permissions.size > 0
      : (permissions?.length ?? 0) > 0;
  if (hasPerms) {
    return hasPermission(permissions, "ventes.validate") || hasPermission(permissions, "*");
  }

  return VALIDATOR_ROLE_CODES.has(code);
}
