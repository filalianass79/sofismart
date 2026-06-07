import { hasPermission } from "@/lib/rbac/has-permission";

export type RoleDashboardKind =
  | "admin"
  | "commercial"
  | "comptable"
  | "magasinier"
  | "depot_manager";

export const ROLE_DASHBOARD_META: Record<
  RoleDashboardKind,
  { title: string; subtitle: string }
> = {
  admin: {
    title: "Tableau de bord",
    subtitle: "Indicateurs ventes, achats, stock et performance commerciale",
  },
  commercial: {
    title: "Espace commercial",
    subtitle: "Ventes, clients et véhicules disponibles",
  },
  comptable: {
    title: "Espace comptabilité",
    subtitle: "Paiements, encaissements et suivi financier",
  },
  magasinier: {
    title: "Espace magasin",
    subtitle: "Livraisons, stock dépôt et sorties véhicules",
  },
  depot_manager: {
    title: "Espace dépôt",
    subtitle: "Capacité, véhicules et livraisons de votre site",
  },
};

/** Détermine le tableau de bord d’accueil selon le rôle et les permissions. */
export function resolveRoleDashboard(
  roleCode?: string | null,
  permissions: string[] = []
): RoleDashboardKind {
  const code = (roleCode ?? "").toUpperCase();

  if (code === "MAGASINIER") return "magasinier";
  if (code === "COMMERCIAL") return "commercial";
  if (code === "COMPTABLE") return "comptable";
  if (code === "RESPONSABLE_DEPOT") return "depot_manager";

  if (hasPermission(permissions, "magasin.validate") && !hasPermission(permissions, "ventes.create")) {
    return "magasinier";
  }
  if (hasPermission(permissions, "ventes.create") || hasPermission(permissions, "ventes.view")) {
    if (code === "COMMERCIAL") return "commercial";
  }
  if (hasPermission(permissions, "paiements.view") && !hasPermission(permissions, "ventes.create")) {
    return "comptable";
  }

  return "admin";
}
