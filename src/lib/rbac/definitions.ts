/** Modules et actions RBAC SOFISMART */
export const PERMISSION_MODULES = [
  "dashboard",
  "achats",
  "ventes",
  "vehicules",
  "stock",
  "depots",
  "clients",
  "fournisseurs",
  "paiements",
  "documents",
  "salaries",
  "utilisateurs",
  "roles",
  "rapports",
  "parametres",
  "magasin",
  "notifications",
  "whatsapp",
  "emails",
  "proformas",
] as const;

export const PERMISSION_ACTIONS = [
  "view",
  "create",
  "edit",
  "delete",
  "export",
  "validate",
  "reset_password",
  "manage_permissions",
  "upload_documents",
  "archive",
] as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[number];
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];
export type PermissionKey = `${PermissionModule}.${PermissionAction}`;

export function permissionKey(module: string, action: string): PermissionKey {
  return `${module}.${action}` as PermissionKey;
}

export const ALL_PERMISSION_KEYS: PermissionKey[] = PERMISSION_MODULES.flatMap((m) =>
  PERMISSION_ACTIONS.map((a) => permissionKey(m, a))
);

/** Mapping ancien format API → clés granulaires */
export const LEGACY_PERMISSION_MAP: Record<string, PermissionKey[]> = {
  "dashboard:read": ["dashboard.view"],
  "vehicles:*": [
    "vehicules.view",
    "vehicules.create",
    "vehicules.edit",
    "vehicules.delete",
    "vehicules.export",
  ],
  "purchases:*": [
    "achats.view",
    "achats.create",
    "achats.edit",
    "achats.delete",
    "achats.export",
    "achats.validate",
  ],
  "sales:*": [
    "ventes.view",
    "ventes.create",
    "ventes.edit",
    "ventes.delete",
    "ventes.export",
    "ventes.validate",
  ],
  "proformas:*": [
    "proformas.view",
    "proformas.create",
    "proformas.edit",
    "proformas.export",
    "proformas.delete",
    "proformas.validate",
  ],
  "warehouse:*": ["magasin.view", "magasin.validate", "magasin.edit"],
  "warehouse.dashboard.view": ["magasin.view"],
  "warehouse.pending_deliveries.view": ["magasin.view"],
  "warehouse.vehicles.view": ["magasin.view"],
  "warehouse.delivery_history.view": ["magasin.view"],
  "warehouse.delivery_note.generate": ["magasin.validate"],
  "warehouse.delivery_note.download": ["magasin.view"],
  "warehouse.delivery_note.confirm": ["magasin.validate"],
  "warehouse.delivery_note.upload_signed": ["magasin.validate"],
  "warehouse.qr.scan": ["magasin.view"],
  "depots:*": ["depots.view", "depots.create", "depots.edit", "depots.delete", "stock.view", "stock.edit"],
  "clients:*": ["clients.view", "clients.create", "clients.edit", "clients.delete"],
  "suppliers:*": ["fournisseurs.view", "fournisseurs.create", "fournisseurs.edit", "fournisseurs.delete"],
  "payments:*": ["paiements.view", "paiements.create", "paiements.edit", "paiements.delete"],
  "documents:*": [
    "documents.view",
    "documents.create",
    "documents.upload_documents",
    "documents.delete",
  ],
  "reports:*": ["rapports.view", "rapports.export"],
  "users:*": [
    "utilisateurs.view",
    "utilisateurs.create",
    "utilisateurs.edit",
    "utilisateurs.reset_password",
    "utilisateurs.manage_permissions",
  ],
  "expenses:*": ["paiements.view", "rapports.view"],
};

export const DEFAULT_ROLE_CODES = [
  "ADMIN",
  "GERANT",
  "DIRECTEUR",
  "COMMERCIAL",
  "COMPTABLE",
  "RESPONSABLE_DEPOT",
  "MAGASINIER",
  "CHAUFFEUR",
  "EMPLOYE",
] as const;

export type SystemRoleCode = (typeof DEFAULT_ROLE_CODES)[number];
