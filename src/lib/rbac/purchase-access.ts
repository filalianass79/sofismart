import { hasPermission } from "@/lib/rbac/has-permission";
import { userCanViewFinancials } from "@/lib/rbac/financial-access";

const MANAGER_ROLE_CODES = new Set(["ADMIN", "GERANT"]);

/** @deprecated Utiliser userCanViewFinancials — alias achats. */
export const userCanViewPurchaseFinancials = userCanViewFinancials;

/** Création / modification / suppression d'achats — admin et gérant uniquement. */
export function userCanEditPurchases(
  permissions?: string[] | readonly string[],
  roleCode?: string | null,
): boolean {
  const code = (roleCode ?? "").toUpperCase();
  if (code === "ADMIN") return true;
  if (permissions?.length && hasPermission([...permissions], "*")) return true;
  return code === "GERANT";
}

export function userCanCreatePurchases(
  permissions?: string[] | readonly string[],
  roleCode?: string | null,
): boolean {
  return userCanEditPurchases(permissions, roleCode);
}

export function userCanDeletePurchases(
  permissions?: string[] | readonly string[],
  roleCode?: string | null,
): boolean {
  return userCanEditPurchases(permissions, roleCode);
}

export function userCanViewPurchases(
  permissions?: string[] | readonly string[],
  roleCode?: string | null,
): boolean {
  const code = (roleCode ?? "").toUpperCase();
  if (MANAGER_ROLE_CODES.has(code)) return true;
  if (permissions?.length) {
    const perms = [...permissions];
    return hasPermission(perms, "achats.view") || hasPermission(perms, "*");
  }
  return false;
}
