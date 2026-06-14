import { prisma } from "@/lib/prisma";
import { getWarehouseDepotScope } from "@/lib/warehouse/depot-scope";
import { getWarehouseStats } from "@/lib/services/warehouse-dashboard-service";
import { Warehouse, Truck, Car, Settings, MapPin } from "lucide-react";
import {
  CapacityBar,
  DashboardHero,
  DashboardPanel,
  EmptyState,
  KpiCard,
  QuickAction,
} from "@/components/dashboard/shared/dashboard-ui";

export async function DepotManagerHomeDashboard({ userId }: { userId: string }) {
  const scope = await getWarehouseDepotScope(userId);
  const [stats, user] = await Promise.all([
    getWarehouseStats(scope),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
  ]);

  const depots = scope.isAdmin
    ? await prisma.depot.findMany({
        include: { _count: { select: { vehicles: true } } },
        orderBy: { name: "asc" },
      })
    : scope.depotIds?.length
      ? await prisma.depot.findMany({
          where: { id: { in: scope.depotIds } },
          include: { _count: { select: { vehicles: true } } },
          orderBy: { name: "asc" },
        })
      : [];

  const firstName = user?.name?.split(" ")[0] ?? "Responsable";
  const depotCount = depots.length;

  return (
    <div className="space-y-6">
      <DashboardHero
        eyebrow="Espace dépôt"
        title={`Bonjour, ${firstName}`}
        description="Capacité, véhicules et livraisons de vos sites."
        stats={[
          { label: "Dépôts", value: String(depotCount) },
          { label: "Véhicules", value: String(stats.vehiclesInDepot) },
        ]}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <QuickAction href="/dashboard/warehouse" label="Module magasin" icon={Warehouse} variant="primary" />
        <QuickAction href="/dashboard/settings/depots" label="Gérer les dépôts" icon={Settings} />
        <QuickAction href="/dashboard/vehicles" label="Parc véhicules" icon={Car} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          title="Véhicules (mes dépôts)"
          value={String(stats.vehiclesInDepot)}
          hint="Stock total"
          icon={Car}
          accent="navy"
          href="/dashboard/vehicles"
        />
        <KpiCard
          title="Livraisons en attente"
          value={String(stats.pendingDeliveries)}
          hint="À planifier"
          icon={Truck}
          accent="amber"
          href="/dashboard/warehouse"
        />
        <KpiCard
          title="Livrées ce mois"
          value={String(stats.deliveredMonth)}
          hint="Sorties validées"
          icon={Warehouse}
          accent="emerald"
        />
      </div>

      <DashboardPanel
        title="Capacité des dépôts"
        subtitle="Occupation et places disponibles"
        action={{ href: "/dashboard/settings/depots", label: "Paramètres dépôts" }}
      >
        {depots.length === 0 ? (
          <EmptyState message="Aucun dépôt assigné à votre profil." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {depots.map((d) => (
              <div key={d.id} className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-navy-500">
                  <MapPin className="h-3.5 w-3.5" />
                  {d.city ?? "—"}
                </div>
                <CapacityBar
                  label={d.name}
                  current={d._count.vehicles}
                  max={d.maxCapacity}
                  href={`/dashboard/settings/depots/${d.id}`}
                />
              </div>
            ))}
          </div>
        )}
      </DashboardPanel>
    </div>
  );
}
