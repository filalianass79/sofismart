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
} from "lucide-react";
import type { Permission } from "@/lib/permissions";

export type NavItem = {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
  /** Permission RBAC requise (module.action) */
  perm: string;
  /** Sous-menu (indentation visuelle) */
  indent?: boolean;
  /** Préfixe de chemin pour état actif (défaut = href) */
  activePrefix?: string;
};

/** Mapping permissions granulaires → legacy (fallback session sans RBAC chargé) */
export const NAV_LEGACY_PERM: Record<string, Permission> = {
  "dashboard.view": "dashboard:read",
  "vehicules.view": "vehicles:*",
  "achats.view": "purchases:*",
  "ventes.view": "sales:*",
  "proformas.view": "sales:*",
  "depots.view": "depots:*",
  "clients.view": "clients:*",
  "fournisseurs.view": "suppliers:*",
  "paiements.view": "payments:*",
  "documents.view": "documents:*",
  "rapports.view": "reports:*",
  "magasin.view": "warehouse:*",
  "salaries.view": "users:*",
  "utilisateurs.view": "users:*",
  "roles.view": "users:*",
  "parametres.view": "users:*",
};

export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    id: "home",
    href: "/dashboard",
    label: "Tableau de bord",
    icon: LayoutDashboard,
    perm: "dashboard.view",
  },
  { id: "vehicles", href: "/dashboard/vehicles", label: "Véhicules", icon: Car, perm: "vehicules.view" },
  { id: "purchases", href: "/dashboard/purchases", label: "Achats", icon: ShoppingCart, perm: "achats.view" },
  { id: "sales", href: "/dashboard/sales", label: "Ventes", icon: HandCoins, perm: "ventes.view" },
  { id: "proformas", href: "/dashboard/proformas", label: "Proformas", icon: FileText, perm: "proformas.view" },
  { id: "clients", href: "/dashboard/clients", label: "Clients", icon: Users, perm: "clients.view" },
  { id: "suppliers", href: "/dashboard/suppliers", label: "Fournisseurs", icon: Truck, perm: "fournisseurs.view" },
  { id: "payments", href: "/dashboard/payments", label: "Paiements", icon: CreditCard, perm: "paiements.view" },
  { id: "documents", href: "/dashboard/documents", label: "Documents", icon: FileStack, perm: "documents.view" },
  { id: "reports", href: "/dashboard/reports", label: "Rapports", icon: BarChart3, perm: "rapports.view" },
];

export const MAGASIN_NAV_ITEMS: NavItem[] = [
  {
    id: "warehouse",
    href: "/dashboard/warehouse",
    label: "Magasin & livraisons",
    icon: Package,
    perm: "magasin.view",
    activePrefix: "/dashboard/warehouse",
  },
  {
    id: "warehouse-scan",
    href: "/dashboard/warehouse/scan",
    label: "Scanner QR",
    icon: QrCode,
    perm: "magasin.view",
    indent: true,
    activePrefix: "/dashboard/warehouse",
  },
];

export const SETTINGS_NAV = {
  href: "/dashboard/settings/brands",
  label: "Paramètres",
  icon: Settings,
  perms: ["parametres.view", "depots.view", "salaries.view", "utilisateurs.view", "roles.view"] as const,
};
