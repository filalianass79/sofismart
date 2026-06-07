import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";
import { HandCoins, Users, Car, Plus } from "lucide-react";
import { DatabaseUnavailable } from "@/components/dashboard/database-unavailable";
import { databaseConnectionMessage, isDatabaseConnectionError } from "@/lib/prisma-errors";

export async function CommercialHomeDashboard({ userId }: { userId: string }) {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  try {
  const [salesMonth, salesPending, clientsCount, vehiclesAvailable, recentSales] = await Promise.all([
    prisma.sale.count({
      where: { commercialId: userId, saleDate: { gte: monthStart }, status: "VALIDATED" },
    }),
    prisma.sale.count({
      where: { commercialId: userId, status: "VALIDATED", deliveryStatus: "EXIT_PENDING" },
    }),
    prisma.client.count({ where: { assignedCommercialId: userId, isArchived: false } }),
    prisma.vehicle.count({ where: { status: { in: ["IN_STOCK", "RESERVED", "PREPARATION"] } } }),
    prisma.sale.findMany({
      where: { commercialId: userId, status: "VALIDATED" },
      orderBy: { saleDate: "desc" },
      take: 5,
      include: {
        client: { select: { name: true } },
        vehicle: { include: { brand: true, carModel: true } },
      },
    }),
  ]);

  const revenueMonth = await prisma.sale.aggregate({
    where: { commercialId: userId, saleDate: { gte: monthStart }, status: "VALIDATED" },
    _sum: { finalPrice: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Link href="/dashboard/sales/new" className="btn-sofi-primary inline-flex items-center gap-2">
          <Plus className="h-4 w-4" /> Nouvelle vente
        </Link>
        <Link href="/dashboard/clients/new" className="btn-sofi-ghost">
          Nouveau client
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat icon={HandCoins} label="Ventes ce mois" value={String(salesMonth)} />
        <MiniStat icon={HandCoins} label="CA du mois" value={formatMoney(Number(revenueMonth._sum.finalPrice ?? 0))} />
        <MiniStat icon={Users} label="Mes clients" value={String(clientsCount)} />
        <MiniStat icon={Car} label="Véhicules dispo." value={String(vehiclesAvailable)} sub={`${salesPending} livraisons en attente`} />
      </div>

      <section className="rounded-xl border border-navy-950/10 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase text-navy-600">Dernières ventes</h3>
          <Link href="/dashboard/sales" className="text-sm text-gold-700 hover:underline">
            Toutes →
          </Link>
        </div>
        <ul className="mt-4 divide-y divide-navy-950/5">
          {recentSales.length === 0 ? (
            <li className="py-4 text-sm text-navy-500">Aucune vente pour le moment.</li>
          ) : (
            recentSales.map((s) => (
              <li key={s.id} className="flex justify-between gap-2 py-3 text-sm">
                <div>
                  <Link href={`/dashboard/sales/${s.id}`} className="font-medium text-navy-950 hover:text-gold-700">
                    {s.reference}
                  </Link>
                  <p className="text-navy-600">{s.client?.name ?? "—"}</p>
                </div>
                <span className="shrink-0 font-medium">{formatMoney(Number(s.finalPrice))}</span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
  } catch (err) {
    if (isDatabaseConnectionError(err)) {
      return <DatabaseUnavailable message={databaseConnectionMessage(err)} />;
    }
    throw err;
  }
}

function MiniStat({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof HandCoins;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-navy-950/10 bg-white p-4 shadow-sm">
      <Icon className="h-4 w-4 text-gold-600" />
      <p className="mt-2 text-xs font-semibold uppercase text-navy-500">{label}</p>
      <p className="font-display text-xl text-navy-950">{value}</p>
      {sub && <p className="text-xs text-navy-600">{sub}</p>}
    </div>
  );
}


