import { prisma } from "@/lib/prisma";
import { getWarehouseDepotScope } from "@/lib/warehouse/depot-scope";
import { getWarehouseStats, getPendingDeliveries } from "@/lib/services/warehouse-dashboard-service";
import { Package, Truck, Calendar, FileCheck, Warehouse, ClipboardList } from "lucide-react";
import { formatVehicleTitle } from "@/lib/vehicle-catalog";
import {
  ActivityItem,
  ActivityList,
  DashboardHero,
  DashboardPanel,
  EmptyState,
  KpiCard,
  QuickAction,
} from "@/components/dashboard/shared/dashboard-ui";

export async function MagasinierHomeDashboard({ userId }: { userId: string }) {
  const scope = await getWarehouseDepotScope(userId);
  const [stats, pending, depot, user] = await Promise.all([
    getWarehouseStats(scope),
    getPendingDeliveries(scope),
    scope.userDepotId
      ? prisma.depot.findUnique({ where: { id: scope.userDepotId }, select: { name: true, city: true } })
      : null,
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
  ]);

  const firstName = user?.name?.split(" ")[0] ?? "Magasinier";
  const depotLabel = depot ? `${depot.name}${depot.city ? ` · ${depot.city}` : ""}` : "Tous les dépôts";

  return (
    <div className="space-y-6">
      <DashboardHero
        eyebrow="Espace magasin"
        title={`Bonjour, ${firstName}`}
        description={`Livraisons, stock et sorties véhicules — ${depotLabel}.`}
        stats={[
          { label: "En attente", value: String(stats.pendingDeliveries) },
          { label: "Au dépôt", value: String(stats.vehiclesInDepot) },
        ]}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <QuickAction href="/dashboard/warehouse" label="Module magasin" icon={Warehouse} variant="primary" />
        <QuickAction href="/dashboard/warehouse?tab=deliveries" label="Livraisons en cours" icon={Truck} />
        <QuickAction href="/dashboard/warehouse?tab=exit" label="Bons de sortie" icon={ClipboardList} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Véhicules au dépôt"
          value={String(stats.vehiclesInDepot)}
          hint="Stock disponible"
          icon={Package}
          accent="navy"
          href="/dashboard/warehouse"
        />
        <KpiCard
          title="Livraisons en attente"
          value={String(stats.pendingDeliveries)}
          hint="À traiter"
          icon={Truck}
          accent="amber"
          href="/dashboard/warehouse?tab=deliveries"
        />
        <KpiCard
          title="Livrées aujourd'hui"
          value={String(stats.deliveredToday)}
          hint="Sorties du jour"
          icon={Calendar}
          accent="emerald"
        />
        <KpiCard
          title="Bons signés"
          value={String(stats.signedUploaded)}
          hint="Documents uploadés"
          icon={FileCheck}
          accent="sky"
        />
      </div>

      <DashboardPanel
        title="Prochaines livraisons"
        subtitle="Véhicules prêts à sortir ou en préparation"
        action={{ href: "/dashboard/warehouse", label: "Voir tout" }}
      >
        {pending.slice(0, 6).length === 0 ? (
          <EmptyState message="Aucune livraison en attente. Tout est à jour." />
        ) : (
          <ActivityList>
            {pending.slice(0, 6).map((s) => (
              <ActivityItem
                key={s.id}
                href="/dashboard/warehouse"
                title={s.reference}
                subtitle={`${s.client?.name ?? "—"} · ${formatVehicleTitle(s.vehicle as never)}`}
                badge={
                  <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-medium uppercase text-gold-800">
                    À traiter
                  </span>
                }
              />
            ))}
          </ActivityList>
        )}
      </DashboardPanel>
    </div>
  );
}
