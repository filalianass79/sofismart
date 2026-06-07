import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";
import { CreditCard, AlertCircle, TrendingUp } from "lucide-react";

export async function ComptableHomeDashboard() {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [paymentsMonth, pendingValidation, unpaidSales, recentPayments] = await Promise.all([
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
      take: 6,
      include: { client: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-navy-950/10 bg-white p-4 shadow-sm">
          <CreditCard className="h-4 w-4 text-gold-600" />
          <p className="mt-2 text-xs uppercase text-navy-500">Encaissements du mois</p>
          <p className="font-display text-xl text-navy-950">
            {formatMoney(Number(paymentsMonth._sum.amount ?? 0))}
          </p>
          <p className="text-xs text-navy-600">{paymentsMonth._count} paiements</p>
        </div>
        <div className="rounded-xl border border-navy-950/10 bg-white p-4 shadow-sm">
          <AlertCircle className="h-4 w-4 text-morocco-600" />
          <p className="mt-2 text-xs uppercase text-navy-500">Paiements à valider</p>
          <p className="font-display text-xl text-navy-950">{pendingValidation}</p>
        </div>
        <div className="rounded-xl border border-navy-950/10 bg-white p-4 shadow-sm">
          <TrendingUp className="h-4 w-4 text-gold-600" />
          <p className="mt-2 text-xs uppercase text-navy-500">Ventes impayées</p>
          <p className="font-display text-xl text-navy-950">{unpaidSales}</p>
        </div>
      </div>

      <section className="rounded-xl border border-navy-950/10 bg-white p-5 shadow-sm">
        <div className="flex justify-between">
          <h3 className="text-sm font-semibold uppercase text-navy-600">Derniers paiements</h3>
          <Link href="/dashboard/payments" className="text-sm text-gold-700 hover:underline">
            Tous →
          </Link>
        </div>
        <ul className="mt-3 divide-y divide-navy-950/5 text-sm">
          {recentPayments.map((p) => (
            <li key={p.id} className="flex justify-between py-2">
              <span>{p.client?.name ?? "—"}</span>
              <span className="font-medium">{formatMoney(Number(p.amount))}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

