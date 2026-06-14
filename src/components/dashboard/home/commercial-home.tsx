import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";
import {
  HandCoins,
  Users,
  Car,
  FileText,
  UserPlus,
  Clock,
} from "lucide-react";
import { DatabaseUnavailable } from "@/components/dashboard/database-unavailable";
import { databaseConnectionMessage, isDatabaseConnectionError } from "@/lib/prisma-errors";
import {
  ActivityItem,
  ActivityList,
  DashboardHero,
  DashboardPanel,
  EmptyState,
  KpiCard,
  QuickAction,
} from "@/components/dashboard/shared/dashboard-ui";
import { formatVehicleTitle } from "@/lib/vehicle-catalog";

export async function CommercialHomeDashboard({ userId }: { userId: string }) {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  try {
    const [salesMonth, salesPending, clientsCount, vehiclesAvailable, recentSales, pendingValidation, revenueMonth] =
      await Promise.all([
        prisma.sale.count({
          where: { commercialId: userId, saleDate: { gte: monthStart }, status: "VALIDATED" },
        }),
        prisma.sale.count({
          where: { commercialId: userId, status: "VALIDATED", deliveryStatus: "EXIT_PENDING" },
        }),
        prisma.client.count({ where: { assignedCommercialId: userId, isArchived: false } }),
        prisma.vehicle.count({ where: { status: { in: ["IN_STOCK", "RESERVED", "PREPARATION"] } } }),
        prisma.sale.findMany({
          where: { commercialId: userId },
          orderBy: { saleDate: "desc" },
          take: 6,
          include: {
            client: { select: { name: true } },
            vehicle: { include: { brand: true, carModel: true } },
          },
        }),
        prisma.sale.count({
          where: { commercialId: userId, status: "PENDING_VALIDATION" },
        }),
        prisma.sale.aggregate({
          where: { commercialId: userId, saleDate: { gte: monthStart }, status: "VALIDATED" },
          _sum: { finalPrice: true },
        }),
      ]);

    const ca = formatMoney(Number(revenueMonth._sum.finalPrice ?? 0));
    const firstName = user?.name?.split(" ")[0] ?? "Commercial";

    return (
      <div className="space-y-6">
        <DashboardHero
          eyebrow="Espace commercial"
          title={`Bonjour, ${firstName}`}
          description="Suivez vos ventes, clients et véhicules disponibles en un coup d'œil."
          stats={[
            { label: "CA du mois", value: ca },
            { label: "Ventes validées", value: String(salesMonth) },
          ]}
        />

        {pendingValidation > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-400/35 bg-gradient-to-r from-amber-50 to-amber-100/50 px-5 py-4">
            <div className="flex items-center gap-2 text-sm text-amber-950">
              <Clock className="h-5 w-5 shrink-0" />
              <span>
                <strong>{pendingValidation}</strong> vente(s) en attente de validation
              </span>
            </div>
            <Link href="/dashboard/sales?status=PENDING_VALIDATION" className="text-sm font-medium text-gold-800">
              Voir →
            </Link>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction href="/dashboard/sales/new" label="Nouvelle vente" icon={HandCoins} variant="primary" />
          <QuickAction href="/dashboard/clients/new" label="Nouveau client" icon={UserPlus} />
          <QuickAction href="/dashboard/proformas/new" label="Nouvelle proforma" icon={FileText} />
          <QuickAction href="/dashboard/vehicles" label="Parc véhicules" icon={Car} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="Ventes ce mois"
            value={String(salesMonth)}
            hint="Validées sur la période"
            icon={HandCoins}
            accent="emerald"
            href="/dashboard/sales"
          />
          <KpiCard
            title="Chiffre d'affaires"
            value={ca}
            hint="Mois en cours"
            icon={HandCoins}
            accent="gold"
          />
          <KpiCard
            title="Mes clients"
            value={String(clientsCount)}
            hint="Portefeuille actif"
            icon={Users}
            accent="navy"
            href="/dashboard/clients"
          />
          <KpiCard
            title="Véhicules dispo."
            value={String(vehiclesAvailable)}
            hint={`${salesPending} livraison(s) en attente`}
            icon={Car}
            accent="sky"
            href="/dashboard/vehicles"
          />
        </div>

        <DashboardPanel
          title="Activité récente"
          subtitle="Vos dernières ventes et demandes"
          action={{ href: "/dashboard/sales", label: "Toutes les ventes" }}
        >
          {recentSales.length === 0 ? (
            <EmptyState message="Aucune vente pour le moment. Créez votre première vente." />
          ) : (
            <ActivityList>
              {recentSales.map((s) => (
                <ActivityItem
                  key={s.id}
                  href={`/dashboard/sales/${s.id}`}
                  title={s.reference}
                  subtitle={`${s.client?.name ?? "—"} · ${formatVehicleTitle(s.vehicle)}`}
                  meta={formatMoney(Number(s.finalPrice))}
                  badge={
                    <span className="rounded-full bg-navy-950/5 px-2 py-0.5 text-[10px] font-medium uppercase text-navy-600">
                      {s.status === "PENDING_VALIDATION" ? "En attente" : s.status === "VALIDATED" ? "Validée" : s.status}
                    </span>
                  }
                />
              ))}
            </ActivityList>
          )}
        </DashboardPanel>
      </div>
    );
  } catch (err) {
    if (isDatabaseConnectionError(err)) {
      return <DatabaseUnavailable message={databaseConnectionMessage(err)} />;
    }
    throw err;
  }
}
