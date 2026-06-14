import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { depotTypeLabels } from "@/lib/depot-labels";
import { DepotStatusBadge } from "@/components/depots/depot-status-badge";
import type { DepotStatus, DepotType } from "@/generated/prisma/enums";
import { formatVehicleTitle } from "@/lib/vehicle-catalog";
import { requireSettingsPageAccess } from "@/lib/rbac/settings-page-auth";
import { hasPermission } from "@/lib/rbac/has-permission";

export default async function DepotDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const perms = await requireSettingsPageAccess("depots.view");

  const depot = await prisma.depot.findUnique({
    where: { id },
    include: {
      manager: { select: { name: true, email: true } },
      vehicles: {
        where: { status: { not: "SOLD" } },
        take: 50,
        orderBy: { internalRef: "asc" },
        include: { brand: true, carModel: true },
      },
      movementsFrom: {
        orderBy: { movementDate: "desc" },
        take: 15,
        include: { vehicle: { include: { brand: true, carModel: true } }, toDepot: true },
      },
      _count: { select: { vehicles: true } },
    },
  });
  if (!depot) notFound();

  const canEdit = hasPermission(perms, "depots.edit");
  const remaining = Math.max(0, depot.maxCapacity - depot._count.vehicles);
  const alert = depot._count.vehicles >= depot.maxCapacity;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-navy-500">{depot.reference}</p>
          <h2 className="font-display text-3xl text-navy-950">{depot.name}</h2>
          <DepotStatusBadge status={depot.status as DepotStatus} />
        </div>
        {canEdit && (
          <Link href={`/dashboard/settings/depots/${id}/edit`} className="rounded-lg border px-4 py-2 text-sm font-medium">
            Modifier
          </Link>
        )}
      </div>

      {alert && (
        <p className="rounded-lg border border-morocco-200 bg-morocco-50 px-4 py-3 text-sm text-morocco-800">
          Capacité maximale atteinte ({depot._count.vehicles}/{depot.maxCapacity})
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-navy-950/10 bg-white p-5 text-sm shadow-sm">
          <h3 className="font-semibold text-navy-900">Informations</h3>
          <dl className="mt-3 space-y-2 text-navy-700">
            <p>Type : {depotTypeLabels[depot.depotType as DepotType]}</p>
            <p>Ville : {depot.city ?? "—"}</p>
            <p>Adresse : {depot.address ?? "—"}</p>
            <p>Tél. : {depot.phone ?? "—"}</p>
            <p>Responsable : {depot.manager?.name ?? "—"}</p>
            <p>
              Capacité : {depot._count.vehicles} / {depot.maxCapacity} (reste {remaining})
            </p>
          </dl>
        </section>

        <section className="rounded-xl border border-navy-950/10 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-navy-900">Véhicules stockés</h3>
          <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm">
            {depot.vehicles.map((v) => (
              <li key={v.id}>
                <Link href={`/dashboard/vehicles/${v.id}`} className="text-gold-700 hover:underline">
                  {formatVehicleTitle(v)} — {v.internalRef}
                </Link>
              </li>
            ))}
            {!depot.vehicles.length && <li className="text-navy-500">Aucun véhicule</li>}
          </ul>
        </section>
      </div>

      <section className="rounded-xl border border-navy-950/10 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-navy-900">Mouvements récents</h3>
        <ul className="mt-3 space-y-2 text-sm text-navy-700">
          {depot.movementsFrom.map((m) => (
            <li key={m.id}>
              {formatVehicleTitle(m.vehicle)} → {m.toDepot?.name ?? "sortie"} ({m.movementType})
            </li>
          ))}
          {!depot.movementsFrom.length && <li className="text-navy-500">Aucun mouvement</li>}
        </ul>
      </section>
    </div>
  );
}
