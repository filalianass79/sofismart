"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Building2,
  Car,
  Bell,
  ClipboardList,
  Mail,
  MessageCircle,
  Settings,
  Shield,
  Tag,
  UserCircle,
  UserCog,
  Warehouse,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { hasPermission } from "@/lib/rbac/has-permission";
import { can, type Permission } from "@/lib/permissions";
import type { UserRole } from "@/generated/prisma/enums";

const legacyPerm: Record<string, Permission> = {
  "depots.view": "depots:*",
  "salaries.view": "users:*",
  "utilisateurs.view": "users:*",
  "roles.view": "users:*",
};

const allTabs = [
  { href: "/dashboard/settings/company", label: "Société", icon: Building2, perm: "parametres.view" },
  { href: "/dashboard/settings/brands", label: "Marques", icon: Tag, perm: "parametres.view" },
  { href: "/dashboard/settings/models", label: "Modèles", icon: Car, perm: "parametres.view" },
  { href: "/dashboard/settings/credit-organizations", label: "Crédit", icon: Building2, perm: "parametres.view" },
  { href: "/dashboard/settings/depots", label: "Dépôts", icon: Warehouse, perm: "depots.view" },
  { href: "/dashboard/settings/employees", label: "Salariés", icon: UserCircle, perm: "salaries.view" },
  { href: "/dashboard/settings/users", label: "Utilisateurs", icon: UserCog, perm: "utilisateurs.view" },
  { href: "/dashboard/settings/roles", label: "Rôles", icon: Shield, perm: "roles.view" },
  { href: "/dashboard/settings/audit-logs", label: "Audit", icon: ClipboardList, perm: "parametres.view" },
  { href: "/dashboard/settings/notifications", label: "Notifications", icon: Bell, perm: "notifications.edit" },
  { href: "/dashboard/settings/whatsapp", label: "WhatsApp", icon: MessageCircle, perm: "whatsapp.view" },
  { href: "/dashboard/settings/email-notifications", label: "Email", icon: Mail, perm: "emails.edit" },
  { href: "/dashboard/settings/email-templates", label: "Templates email", icon: Mail, perm: "emails.view" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const perms = session?.user?.permissions ?? [];
  const role = session?.user?.role as UserRole | undefined;

  const tabs = allTabs.filter((t) => {
    if (hasPermission(perms, t.perm) || hasPermission(perms, "*")) return true;
    if (!perms.length && role) {
      const leg = legacyPerm[t.perm];
      return leg ? can(role, leg) : false;
    }
    return false;
  });

  return (
    <article className="space-y-6">
      <header className="flex flex-wrap items-start gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold-500/25 to-gold-600/10 text-gold-700">
          <Settings className="h-6 w-6" />
        </span>
        <section>
          <h2 className="font-display text-3xl text-navy-950">Paramètres</h2>
          <p className="mt-1 max-w-2xl text-sm text-navy-600">
            Société, catalogue, dépôts, équipe, comptes, rôles et journal d&apos;audit.
          </p>
        </section>
      </header>

      <nav className="overflow-x-auto rounded-xl border border-navy-950/10 bg-white p-1 shadow-sm">
        <div className="flex min-w-max gap-1">
          {tabs.map((t) => {
            const active = pathname === t.href || pathname.startsWith(`${t.href}/`);
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors sm:px-4",
                  active
                    ? "bg-navy-950 text-white shadow-sm"
                    : "text-navy-600 hover:bg-cream-100 hover:text-navy-900"
                )}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-90" />
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {children}
    </article>
  );
}
