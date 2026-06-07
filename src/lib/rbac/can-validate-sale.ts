import { hasPermission } from "@/lib/rbac/has-permission";

const VALIDATOR_ROLE_CODES = new Set(["ADMIN", "GERANT"]);

/** Gérants et administrateurs uniquement — jamais les commerciaux. */
export function userCanValidateSales(
  permissions: string[] | undefined,
  roleCode?: string | null
): boolean {
  const code = (roleCode ?? "").toUpperCase();
  if (code === "COMMERCIAL") return false;

  if (permissions?.length) {
    return hasPermission(permissions, "ventes.validate") || hasPermission(permissions, "*");
  }

  return VALIDATOR_ROLE_CODES.has(code);
}
