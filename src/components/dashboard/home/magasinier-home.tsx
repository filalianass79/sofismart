import Link from "next/link";
import { getWarehouseDepotScope } from "@/lib/warehouse/depot-scope";
import { getWarehouseStats, getPendingDeliveries } from "@/lib/services/warehouse-dashboard-service";
import { prisma } from "@/lib/prisma";
import { Package, Truck, Calendar, FileCheck, ArrowRight } from "lucide-react";
import { formatVehicleTitle } from "@/lib/vehicle-catalog";

export async function MagasinierHomeDashboard({ userId }: { userId: string }) {
  const scope = await getWarehouseDepotScope(userId);
  const [stats, pending, depot] = await Promise.all([
    getWarehouseStats(scope),
    getPendingDeliveries(scope),
    scope.userDepotId
      ? prisma.depot.findUnique({ where: { id: scope.userDepotId }, select: { name: true, city: true } })
      : null,
  ]);

  const cards = [
    { label: "Véhicules au dépôt", value: stats.vehiclesInDepot, icon: Package },
    { label: "Livraisons en attente", value: stats.pendingDeliveries, icon: Truck },
    { label: "Livrées aujourd'hui", value: stats.deliveredToday, icon: Calendar },
    { label: "Bons signés uploadés", value: stats.signedUploaded, icon: FileCheck },
  ];

  return (
    <div className="space-y-6">
      {depot && (
        <p className="text-sm text-navy-600">
          Dépôt : <strong>{depot.name}</strong>
          {depot.city ? ` — ${depot.city}` : ""}
        </p>
      )}

      <Link
        href="/dashboard/warehouse"
        className="flex items-center justify-between rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-3 text-sm font-medium text-navy-950 hover:bg-gold-500/15"
      >
        Ouvrir le module magasin & livraisons
        <ArrowRight className="h-4 w-4" />
      </Link>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-navy-950/10 bg-white p-4 shadow-sm">
            <c.icon className="h-4 w-4 text-gold-600" />
            <p className="mt-2 text-2xl font-semibold text-navy-950">{c.value}</p>
            <p className="text-xs text-navy-600">{c.label}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-navy-950/10 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase text-navy-600">Prochaines livraisons</h3>
          <Link href="/dashboard/warehouse" className="text-sm text-gold-700 hover:underline">
            Voir tout →
          </Link>
        </div>
        <ul className="mt-3 divide-y divide-navy-950/5">
          {pending.slice(0, 5).length === 0 ? (
            <li className="py-4 text-sm text-navy-500">Aucune livraison en attente.</li>
          ) : (
            pending.slice(0, 5).map((s) => (
              <li key={s.id} className="flex justify-between gap-2 py-3 text-sm">
                <div>
                  <span className="font-medium">{s.reference}</span>
                  <p className="text-navy-600">{s.client?.name}</p>
                  <p className="text-xs text-navy-500">{formatVehicleTitle(s.vehicle as never)}</p>
                </div>
                <Link href="/dashboard/warehouse" className="text-xs text-gold-700 self-center">
                  Traiter
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}

