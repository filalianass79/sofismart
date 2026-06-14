import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CreditCard,
  AlertCircle,
  TrendingDown,
  Receipt,
  CheckCircle2,
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

export async function ComptableHomeDashboard() {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? "Comptable";

  try {
    const [paymentsMonth, pendingValidation, unpaidSales, recentPayments, totalUnpaidAmount] =
      await Promise.all([
        prisma.payment.aggregate({
          where: { paidAt: { gte: monthStart }, validationStatus: "VALIDATED" },
          _sum: { amount: true },
          _count: true,
        }),
        prisma.payment.count({ where: { validationStatus: "PENDING" } }),
        prisma.sale.count({
          where: { status: "VALIDATED", paymentStatus: { in: ["UNPAID", "PARTIAL"] } },
        }),
        prisma.payment.findMany({
          orderBy: { paidAt: "desc" },
          take: 8,
          include: { client: { select: { name: true } } },
        }),
        prisma.sale.aggregate({
          where: { status: "VALIDATED", paymentStatus: { in: ["UNPAID", "PARTIAL"] } },
          _sum: { finalPrice: true },
        }),
      ]);

    const encaissements = formatMoney(Number(paymentsMonth._sum.amount ?? 0));
    const impayes = formatMoney(Number(totalUnpaidAmount._sum.finalPrice ?? 0));
    const today = format(new Date(), "EEEE d MMMM", { locale: fr });

    return (
      <div className="space-y-6">
        <DashboardHero
          eyebrow="Espace comptabilité"
          title={`Bonjour, ${firstName}`}
          description={`Suivi des encaissements et validation des paiements — ${today}.`}
          stats={[
            { label: "Encaissements", value: encaissements },
            { label: "Paiements validés", value: String(paymentsMonth._count) },
          ]}
        />

        {pendingValidation > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-400/35 bg-gradient-to-r from-amber-50 to-amber-100/50 px-5 py-4">
            <div className="flex items-center gap-2 text-sm text-amber-950">
              <Clock className="h-5 w-5 shrink-0" />
              <span>
                <strong>{pendingValidation}</strong> paiement(s) en attente de validation
              </span>
            </div>
            <Link href="/dashboard/payments?status=PENDING" className="text-sm font-medium text-gold-800">
              Valider →
            </Link>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction href="/dashboard/payments" label="Gérer les paiements" icon={CreditCard} variant="primary" />
          <QuickAction href="/dashboard/payments/new" label="Enregistrer un paiement" icon={Receipt} />
          <QuickAction href="/dashboard/sales" label="Ventes impayées" icon={TrendingDown} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard
            title="Encaissements du mois"
            value={encaissements}
            hint={`${paymentsMonth._count} paiement(s) validé(s)`}
            icon={CreditCard}
            accent="emerald"
            href="/dashboard/payments"
          />
          <KpiCard
            title="À valider"
            value={String(pendingValidation)}
            hint="Paiements en attente"
            icon={AlertCircle}
            accent="amber"
            href="/dashboard/payments?status=PENDING"
          />
          <KpiCard
            title="Ventes impayées"
            value={String(unpaidSales)}
            hint={`Montant : ${impayes}`}
            icon={TrendingDown}
            accent="morocco"
            href="/dashboard/sales"
          />
        </div>

        <DashboardPanel
          title="Derniers paiements"
          subtitle="Encaissements récents enregistrés"
          action={{ href: "/dashboard/payments", label: "Tous les paiements" }}
        >
          {recentPayments.length === 0 ? (
            <EmptyState message="Aucun paiement enregistré pour le moment." />
          ) : (
            <ActivityList>
              {recentPayments.map((p) => (
                <ActivityItem
                  key={p.id}
                  title={p.client?.name ?? "Client inconnu"}
                  subtitle={
                    p.paidAt
                      ? format(new Date(p.paidAt), "d MMM yyyy · HH:mm", { locale: fr })
                      : undefined
                  }
                  meta={formatMoney(Number(p.amount))}
                  badge={
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                        p.validationStatus === "VALIDATED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {p.validationStatus === "VALIDATED" ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" /> Validé
                        </>
                      ) : (
                        "En attente"
                      )}
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
