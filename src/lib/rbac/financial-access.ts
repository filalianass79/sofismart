import { hasPermission } from "@/lib/rbac/has-permission";

const MANAGER_ROLE_CODES = new Set(["ADMIN", "GERANT"]);

/** Prix d'achat, prix de revient, marges — admin et gérant uniquement. */
export function userCanViewFinancials(
  permissions?: string[] | readonly string[],
  roleCode?: string | null,
): boolean {
  const code = (roleCode ?? "").toUpperCase();
  if (MANAGER_ROLE_CODES.has(code)) return true;
  if (permissions?.length && hasPermission([...permissions], "*")) return true;
  return false;
}
