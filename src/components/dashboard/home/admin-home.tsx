import { Suspense } from "react";
import {
  getAdminDashboardData,
  parseDashboardPeriod,
  type DashboardPeriod,
} from "@/lib/services/admin-dashboard-service";
import { AdminPeriodToolbar } from "@/components/dashboard/admin/period-toolbar";
import { AdminDashboardView } from "@/components/dashboard/admin/admin-dashboard-view";
import { SofiSpinner } from "@/components/ui/loading";

async function AdminDashboardContent({ period }: { period: DashboardPeriod }) {
  const data = await getAdminDashboardData(period);
  return <AdminDashboardView data={data} />;
}

export async function AdminHomeDashboard({ period: periodParam }: { period?: string | null }) {
  const period = parseDashboardPeriod(periodParam);

  return (
    <div className="space-y-5">
      <Suspense fallback={<div className="h-11 animate-pulse rounded-xl bg-navy-950/5" />}>
        <AdminPeriodToolbar current={period} />
      </Suspense>
      <Suspense
        fallback={
          <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-navy-950/10 bg-white">
            <SofiSpinner label="Chargement des indicateurs…" />
          </div>
        }
      >
        <AdminDashboardContent period={period} />
      </Suspense>
    </div>
  );
}
