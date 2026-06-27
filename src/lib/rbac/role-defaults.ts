import type { PermissionKey } from "./definitions";

function keys(module: string, actions: string[]): PermissionKey[] {
  return actions.map((a) => `${module}.${a}` as PermissionKey);
}

/** Permissions par défaut par rôle système */
export const ROLE_DEFAULT_PERMISSIONS: Record<string, PermissionKey[]> = {
  ADMIN: [], // toutes les permissions en seed

  GERANT: [
    ...keys("dashboard", ["view"]),
    ...keys("achats", ["view", "create", "edit", "export", "validate"]),
    ...keys("ventes", ["view", "create", "edit", "export", "validate"]),
    ...keys("proformas", ["view", "create", "edit", "export", "delete", "validate"]),
    ...keys("vehicules", ["view", "create", "edit"]),
    ...keys("stock", ["view", "edit"]),
    ...keys("depots", ["view", "create", "edit", "delete"]),
    ...keys("clients", ["view", "create", "edit"]),
    ...keys("fournisseurs", ["view", "create", "edit"]),
    ...keys("paiements", ["view", "create", "edit", "validate"]),
    ...keys("caisse", ["view", "create", "edit", "export", "validate"]),
    ...keys("documents", ["view", "upload_documents"]),
    ...keys("rapports", ["view", "export"]),
    ...keys("salaries", ["view", "create", "edit", "archive"]),
    ...keys("parametres", ["view", "create", "edit", "delete"]),
    ...keys("notifications", ["view", "edit"]),
    ...keys("whatsapp", ["view", "create", "edit"]),
    ...keys("emails", ["view", "create", "edit"]),
    ...keys("proformas", ["view", "create", "edit", "export", "delete", "validate"]),
  ],

  DIRECTEUR: [
    ...keys("dashboard", ["view"]),
    ...keys("achats", ["view", "validate"]),
    ...keys("ventes", ["view"]),
    ...keys("proformas", ["view", "export"]),
    ...keys("vehicules", ["view"]),
    ...keys("stock", ["view"]),
    ...keys("depots", ["view"]),
    ...keys("rapports", ["view", "export"]),
    ...keys("paiements", ["view"]),
    ...keys("caisse", ["view", "export"]),
  ],

  COMMERCIAL: [
    ...keys("dashboard", ["view"]),
    ...keys("achats", ["view"]),
    ...keys("ventes", ["view", "create", "edit"]),
    ...keys("proformas", ["view", "create", "edit", "export"]),
    ...keys("vehicules", ["view"]),
    ...keys("clients", ["view", "create", "edit"]),
    ...keys("stock", ["view"]),
    ...keys("documents", ["view", "upload_documents"]),
    ...keys("notifications", ["view", "edit"]),
    ...keys("caisse", ["view", "create"]),
  ],

  COMPTABLE: [
    ...keys("dashboard", ["view"]),
    ...keys("achats", ["view", "export"]),
    ...keys("vehicules", ["view"]),
    ...keys("ventes", ["view", "export"]),
    ...keys("proformas", ["view", "create", "edit", "export"]),
    ...keys("paiements", ["view", "create", "edit", "validate"]),
    ...keys("caisse", ["view", "create", "edit", "export", "validate"]),
    ...keys("documents", ["view", "upload_documents"]),
    ...keys("rapports", ["view", "export"]),
    ...keys("fournisseurs", ["view"]),
  ],

  RESPONSABLE_DEPOT: [
    ...keys("dashboard", ["view"]),
    ...keys("stock", ["view", "edit"]),
    ...keys("depots", ["view", "edit"]),
    ...keys("vehicules", ["view", "edit"]),
    ...keys("documents", ["view", "upload_documents"]),
    ...keys("magasin", ["view", "validate", "edit"]),
    ...keys("ventes", ["view"]),
    ...keys("caisse", ["view", "create", "validate"]),
  ],

  MAGASINIER: [
    ...keys("dashboard", ["view"]),
    ...keys("achats", ["view"]),
    ...keys("stock", ["view", "edit"]),
    ...keys("depots", ["view"]),
    ...keys("vehicules", ["view"]),
    ...keys("magasin", ["view", "validate"]),
    ...keys("notifications", ["view", "edit"]),
    ...keys("caisse", ["view", "create"]),
  ],

  CHAUFFEUR: [
    ...keys("dashboard", ["view"]),
    ...keys("achats", ["view"]),
    ...keys("vehicules", ["view"]),
    ...keys("stock", ["view"]),
    ...keys("caisse", ["view", "create"]),
  ],

  EMPLOYE: [...keys("dashboard", ["view"])],
};

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  GERANT: "Gérant",
  DIRECTEUR: "Directeur",
  COMMERCIAL: "Commercial",
  COMPTABLE: "Comptable",
  RESPONSABLE_DEPOT: "Responsable dépôt",
  MAGASINIER: "Magasinier",
  CHAUFFEUR: "Chauffeur",
  EMPLOYE: "Employé",
};
