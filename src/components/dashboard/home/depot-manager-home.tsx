import Link from "next/link";
import { getWarehouseDepotScope } from "@/lib/warehouse/depot-scope";
import { getWarehouseStats } from "@/lib/services/warehouse-dashboard-service";
import { prisma } from "@/lib/prisma";
import { Warehouse, Truck, Car } from "lucide-react";

export async function DepotManagerHomeDashboard({ userId }: { userId: string }) {
  const scope = await getWarehouseDepotScope(userId);
  const stats = await getWarehouseStats(scope);

  const depots = scope.isAdmin
    ? await prisma.depot.findMany({ include: { _count: { select: { vehicles: true } } } })
    : scope.depotIds?.length
      ? await prisma.depot.findMany({
          where: { id: { in: scope.depotIds } },
          include: { _count: { select: { vehicles: true } } },
        })
      : [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={Car} label="Véhicules (mes dépôts)" value={stats.vehiclesInDepot} />
        <Stat icon={Truck} label="Livraisons en attente" value={stats.pendingDeliveries} />
        <Stat icon={Warehouse} label="Livrées ce mois" value={stats.deliveredMonth} />
      </div>

      <Link href="/dashboard/warehouse" className="btn-sofi-primary inline-block text-sm">
        Module magasin & livraisons
      </Link>

      <section className="rounded-xl border border-navy-950/10 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold uppercase text-navy-600">Mes dépôts</h3>
        <ul className="mt-4 space-y-3">
          {depots.map((d) => {
            const pct = Math.min(100, Math.round((d._count.vehicles / d.maxCapacity) * 100));
            return (
              <li key={d.id} className="rounded-lg border border-navy-950/8 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">{d.name}</span>
                  <span>
                    {d._count.vehicles}/{d.maxCapacity}
                  </span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-navy-950/10">
                  <div className="h-full rounded-full bg-gold-500" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
        <Link href="/dashboard/settings/depots" className="mt-3 inline-block text-sm text-gold-700 hover:underline">
          Gérer les dépôts →
        </Link>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Car; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-navy-950/10 bg-white p-4 shadow-sm">
      <Icon className="h-4 w-4 text-gold-600" />
      <p className="mt-2 text-xs uppercase text-navy-500">{label}</p>
      <p className="font-display text-2xl text-navy-950">{value}</p>
    </div>
  );
}

