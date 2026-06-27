import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Car,
  ShoppingCart,
  HandCoins,
  Users,
  Truck,
  CreditCard,
  FileStack,
  FileText,
  BarChart3,
  Settings,
  Package,
  QrCode,
  Plus,
  Upload,
  Warehouse,
  UserCog,
  Shield,
  Building2,
  Tag,
  ClipboardList,
  Bell,
  Mail,
  Wallet,
} from "lucide-react";
import type { Permission } from "@/lib/permissions";

export type NavChild = {
  id: string;
  href: string;
  label: string;
  /** Permission RBAC (hérite du parent si absent) */
  perm?: string;
};

export type NavItem = {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
  perm: string;
  indent?: boolean;
  activePrefix?: string;
  children?: NavChild[];
};

export type NavSearchEntry = {
  id: string;
  label: string;
  href: string;
  group: string;
  perm: string;
};

/** Mapping permissions granulaires → legacy (fallback session sans RBAC chargé) */
export const NAV_LEGACY_PERM: Record<string, Permission> = {
  "dashboard.view": "dashboard:read",
  "vehicules.view": "vehicles:*",
  "vehicules.create": "vehicles:*",
  "achats.view": "purchases:*",
  "achats.create": "purchases:*",
  "ventes.view": "sales:*",
  "ventes.create": "sales:*",
  "proformas.view": "sales:*",
  "depots.view": "depots:*",
  "clients.view": "clients:*",
  "fournisseurs.view": "suppliers:*",
  "paiements.view": "payments:*",
  "caisse.view": "payments:*",
  "caisse.create": "payments:*",
  "documents.view": "documents:*",
  "rapports.view": "reports:*",
  "magasin.view": "warehouse:*",
  "salaries.view": "users:*",
  "utilisateurs.view": "users:*",
  "roles.view": "users:*",
  "parametres.view": "users:*",
  "notifications.edit": "users:*",
  "emails.edit": "users:*",
  "emails.view": "users:*",
};

export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    id: "home",
    href: "/dashboard",
    label: "Tableau de bord",
    icon: LayoutDashboard,
    perm: "dashboard.view",
  },
  {
    id: "vehicles",
    href: "/dashboard/vehicles",
    label: "Véhicules",
    icon: Car,
    perm: "vehicules.view",
    activePrefix: "/dashboard/vehicles",
    children: [
      { id: "vehicles-list", href: "/dashboard/vehicles", label: "Liste véhicules" },
      { id: "vehicles-new", href: "/dashboard/vehicles/new", label: "Nouveau véhicule", perm: "vehicules.create" },
    ],
  },
  {
    id: "purchases",
    href: "/dashboard/purchases",
    label: "Achats",
    icon: ShoppingCart,
    perm: "achats.view",
    activePrefix: "/dashboard/purchases",
    children: [
      { id: "purchases-list", href: "/dashboard/purchases", label: "Liste achats" },
      { id: "purchases-new", href: "/dashboard/purchases/new", label: "Nouvel achat", perm: "achats.create" },
      { id: "purchases-import", href: "/dashboard/purchases/import", label: "Import facture" },
    ],
  },
  {
    id: "sales",
    href: "/dashboard/sales",
    label: "Ventes",
    icon: HandCoins,
    perm: "ventes.view",
    activePrefix: "/dashboard/sales",
    children: [
      { id: "sales-list", href: "/dashboard/sales", label: "Liste ventes" },
      { id: "sales-new", href: "/dashboard/sales/new", label: "Nouvelle vente", perm: "ventes.create" },
    ],
  },
  {
    id: "proformas",
    href: "/dashboard/proformas",
    label: "Proformas",
    icon: FileText,
    perm: "proformas.view",
    activePrefix: "/dashboard/proformas",
    children: [
      { id: "proformas-list", href: "/dashboard/proformas", label: "Liste proformas" },
      { id: "proformas-new", href: "/dashboard/proformas/new", label: "Nouvelle proforma" },
    ],
  },
  {
    id: "clients",
    href: "/dashboard/clients",
    label: "Clients",
    icon: Users,
    perm: "clients.view",
    activePrefix: "/dashboard/clients",
    children: [
      { id: "clients-list", href: "/dashboard/clients", label: "Liste clients" },
      { id: "clients-new", href: "/dashboard/clients/new", label: "Nouveau client" },
    ],
  },
  {
    id: "suppliers",
    href: "/dashboard/suppliers",
    label: "Fournisseurs",
    icon: Truck,
    perm: "fournisseurs.view",
    activePrefix: "/dashboard/suppliers",
    children: [
      { id: "suppliers-list", href: "/dashboard/suppliers", label: "Liste fournisseurs" },
      { id: "suppliers-new", href: "/dashboard/suppliers/new", label: "Nouveau fournisseur" },
    ],
  },
  {
    id: "payments",
    href: "/dashboard/payments",
    label: "Paiements",
    icon: CreditCard,
    perm: "paiements.view",
    activePrefix: "/dashboard/payments",
    children: [
      { id: "payments-list", href: "/dashboard/payments", label: "Liste paiements" },
      { id: "payments-new", href: "/dashboard/payments/new", label: "Nouveau paiement" },
    ],
  },
  {
    id: "treasury",
    href: "/dashboard/treasury",
    label: "Trésorerie",
    icon: Wallet,
    perm: "caisse.view",
    activePrefix: "/dashboard/treasury",
    children: [
      { id: "treasury-dashboard", href: "/dashboard/treasury", label: "Tableau de bord" },
      { id: "treasury-cashboxes", href: "/dashboard/treasury/cashboxes", label: "Caisses" },
      { id: "treasury-cashboxes-new", href: "/dashboard/treasury/cashboxes/new", label: "Nouvelle caisse", perm: "caisse.create" },
      { id: "treasury-transfers", href: "/dashboard/treasury/cash-transfers", label: "Transferts" },
    ],
  },
  {
    id: "depots",
    href: "/dashboard/depots",
    label: "Dépôts",
    icon: Warehouse,
    perm: "depots.view",
    activePrefix: "/dashboard/depots",
    children: [
      { id: "depots-list", href: "/dashboard/depots", label: "Liste dépôts" },
      { id: "depots-new", href: "/dashboard/depots/new", label: "Nouveau dépôt" },
    ],
  },
  {
    id: "documents",
    href: "/dashboard/documents",
    label: "Documents",
    icon: FileStack,
    perm: "documents.view",
  },
  {
    id: "reports",
    href: "/dashboard/reports",
    label: "Rapports",
    icon: BarChart3,
    perm: "rapports.view",
  },
];

export const MAGASIN_NAV_ITEMS: NavItem[] = [
  {
    id: "warehouse",
    href: "/dashboard/warehouse",
    label: "Magasin & livraisons",
    icon: Package,
    perm: "magasin.view",
    activePrefix: "/dashboard/warehouse",
    children: [
      { id: "warehouse-home", href: "/dashboard/warehouse", label: "Tableau magasin" },
      { id: "warehouse-scan", href: "/dashboard/warehouse/scan", label: "Scanner QR" },
    ],
  },
];

export const SETTINGS_NAV: NavItem = {
  id: "settings",
  href: "/dashboard/settings/brands",
  label: "Paramètres",
  icon: Settings,
  perm: "parametres.view",
  activePrefix: "/dashboard/settings",
  children: [
    { id: "settings-company", href: "/dashboard/settings/company", label: "Société", perm: "parametres.view" },
    { id: "settings-brands", href: "/dashboard/settings/brands", label: "Marques", perm: "parametres.view" },
    { id: "settings-models", href: "/dashboard/settings/models", label: "Modèles", perm: "parametres.view" },
    { id: "settings-depots", href: "/dashboard/settings/depots", label: "Dépôts", perm: "depots.view" },
    { id: "settings-employees", href: "/dashboard/settings/employees", label: "Salariés", perm: "salaries.view" },
    { id: "settings-users", href: "/dashboard/settings/users", label: "Utilisateurs", perm: "utilisateurs.view" },
    { id: "settings-roles", href: "/dashboard/settings/roles", label: "Rôles", perm: "roles.view" },
    { id: "settings-audit", href: "/dashboard/settings/audit-logs", label: "Audit", perm: "parametres.view" },
    { id: "settings-notifications", href: "/dashboard/settings/notifications", label: "Notifications", perm: "notifications.edit" },
    { id: "settings-email", href: "/dashboard/settings/email-notifications", label: "E-mail", perm: "emails.edit" },
    { id: "settings-templates", href: "/dashboard/settings/email-templates", label: "Templates e-mail", perm: "emails.view" },
  ],
};

/** @deprecated Utiliser SETTINGS_NAV.perm + children */
export const SETTINGS_NAV_LEGACY = {
  href: SETTINGS_NAV.href,
  label: SETTINGS_NAV.label,
  icon: SETTINGS_NAV.icon,
  perms: [
    "parametres.view",
    "depots.view",
    "salaries.view",
    "utilisateurs.view",
    "roles.view",
    "notifications.edit",
    "emails.edit",
    "emails.view",
  ] as const,
};

/** Entrées aplaties pour la recherche dans le menu */
export function flattenNavForSearch(items: NavItem[], group: string): NavSearchEntry[] {
  const entries: NavSearchEntry[] = [];
  for (const item of items) {
    entries.push({
      id: item.id,
      label: item.label,
      href: item.href,
      group,
      perm: item.perm,
    });
    for (const child of item.children ?? []) {
      entries.push({
        id: child.id,
        label: child.label,
        href: child.href,
        group: item.label,
        perm: child.perm ?? item.perm,
      });
    }
  }
  return entries;
}

export const ALL_SEARCH_ENTRIES: NavSearchEntry[] = [
  ...flattenNavForSearch(MAIN_NAV_ITEMS, "Principal"),
  ...flattenNavForSearch(MAGASIN_NAV_ITEMS, "Magasin"),
  ...flattenNavForSearch([SETTINGS_NAV], "Paramètres"),
];

/** Icônes utilitaires exportées pour cohérence */
export { Plus, Upload, QrCode, Building2, Tag, UserCog, Shield, ClipboardList, Bell, Mail };
