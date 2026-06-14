import { Suspense } from "react";
import { auth } from "@/auth";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  resolveRoleDashboard,
  ROLE_DASHBOARD_META,
} from "@/lib/dashboard/resolve-role-dashboard";
import { AdminHomeDashboard } from "@/components/dashboard/home/admin-home";
import { CommercialHomeDashboard } from "@/components/dashboard/home/commercial-home";
import { ComptableHomeDashboard } from "@/components/dashboard/home/comptable-home";
import { MagasinierHomeDashboard } from "@/components/dashboard/home/magasinier-home";
import { DepotManagerHomeDashboard } from "@/components/dashboard/home/depot-manager-home";
import { DashboardNotificationsPanel } from "@/components/dashboard/dashboard-notifications-panel";
import { SofiSpinner } from "@/components/ui/loading";

type PageProps = { searchParams: Promise<{ period?: string }> };

export default async function DashboardPage({ searchParams }: PageProps) {
  const session = await auth();
  const userId = session?.user?.id ?? "";
  const roleCode = session?.user?.roleCode ?? session?.user?.role;
  const permissions = session?.user?.permissions ?? [];
  const { period } = await searchParams;

  const kind = resolveRoleDashboard(roleCode, permissions);
  const meta = ROLE_DASHBOARD_META[kind];
  const today = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });

  let content: React.ReactNode;
  switch (kind) {
    case "magasinier":
      content = <MagasinierHomeDashboard userId={userId} />;
      break;
    case "commercial":
      content = <CommercialHomeDashboard userId={userId} />;
      break;
    case "comptable":
      content = <ComptableHomeDashboard />;
      break;
    case "depot_manager":
      content = <DepotManagerHomeDashboard userId={userId} />;
      break;
    default:
      content = <AdminHomeDashboard period={period} />;
  }

  return (
    <div className="space-y-6">
      {kind === "admin" ? (
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-navy-500">{today}</p>
          <h2 className="mt-1 font-display text-3xl text-navy-950">{meta.title}</h2>
          <p className="mt-1 text-sm text-navy-600">{meta.subtitle}</p>
        </div>
      ) : null}

      {userId ? (
        <Suspense
          fallback={
            <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-navy-950/10 bg-white">
              <SofiSpinner label="Chargement des notifications…" size="sm" />
            </div>
          }
        >
          <DashboardNotificationsPanel userId={userId} />
        </Suspense>
      ) : null}

      {content}
    </div>
  );
}
