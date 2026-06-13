import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";
import { formatFinancialMoney } from "@/lib/financial-privacy";
import { getFinancialAccessFromSession } from "@/lib/server/financial-access-session";
import { formatVehicleTitle } from "@/lib/vehicle-catalog";
import { saleTypeLabels } from "@/lib/sale-labels";
import {
  DeliveryStatusBadge,
  SalePaymentStatusBadge,
  SaleRecordStatusBadge,
} from "@/components/sales/sale-status-badge";
import { SaleDetailActions } from "@/components/sales/sale-detail-actions";
import type { SaleType } from "@/generated/prisma/enums";

export default async function SaleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ validated?: string; validation?: string; message?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const financial = await getFinancialAccessFromSession();
  const canViewFinancials = financial?.canViewFinancials ?? false;

  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      client: true,
      vehicle: { include: { depot: true, brand: true, carModel: true } },
      commercial: { select: { name: true } },
      payments: { orderBy: { paidAt: "desc" } },
      exitVoucher: true,
      depot: { select: { name: true } },
    },
  });
  if (!sale) notFound();

  const paid = sale.payments.reduce((a, p) => a + Number(p.amount), 0);
  const due = Number(sale.finalPrice);
  const balance = Math.max(0, due - paid);

  return (
    <div className="space-y-6">
      {sp.validated === "1" && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800">
          Vente validée avec succès. La facture et le bon de sortie sont disponibles ci-dessous.
        </p>
      )}
      {sp.validation === "error" && sp.message && (
        <p className="rounded-lg border border-morocco-500/30 bg-morocco-500/10 px-4 py-3 text-sm text-morocco-800">
          {decodeURIComponent(sp.message)}
        </p>
      )}
      {sp.validation === "expired" && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
          Lien de validation expiré. Ouvrez la vente depuis le tableau de bord pour valider manuellement.
        </p>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-navy-500">{sale.reference}</p>
          <h2 className="font-display text-3xl text-navy-950">Vente</h2>
          <div className="mt-2 flex gap-2">
            <SaleRecordStatusBadge status={sale.status} />
            <SalePaymentStatusBadge status={sale.paymentStatus} />
            <DeliveryStatusBadge status={sale.deliveryStatus} />
          </div>
        </div>
      </div>

      <SaleDetailActions
        saleId={sale.id}
        status={sale.status}
        hasExitVoucher={!!sale.exitVoucher}
        exitVoucherId={sale.exitVoucher?.id}
        invoiceNumber={sale.invoiceNumber}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-navy-950/10 bg-white p-5 text-sm shadow-sm">
          <h3 className="font-semibold">Client & véhicule</h3>
          <p className="mt-2">
            Client :{" "}
            {sale.clientId && sale.client ? (
              <Link href={`/dashboard/clients/${sale.clientId}`} className="text-gold-700">
                {sale.client.name}
              </Link>
            ) : (
              "— (brouillon)"
            )}
          </p>
          <p>
            Véhicule : {formatVehicleTitle(sale.vehicle)} ({sale.vehicle.year})
          </p>
          <p>Date : {format(sale.saleDate, "dd MMMM yyyy", { locale: fr })}</p>
          <p>Mode : {saleTypeLabels[sale.saleType as SaleType]}</p>
          <p>Commercial : {sale.commercial?.name ?? "—"}</p>
        </section>

        <section className="rounded-xl border border-gold-500/20 bg-gold-500/5 p-5 text-sm">
          <p>Prix final : {formatMoney(Number(sale.finalPrice))}</p>
          {canViewFinancials && (
            <p>Marge : {formatFinancialMoney(sale.margin, true)}</p>
          )}
          <p>Payé : {formatMoney(paid)}</p>
          <p className="font-semibold">Reste : {formatMoney(balance)}</p>
        </section>
      </div>

      <section className="rounded-xl border border-navy-950/10 bg-white p-5 shadow-sm">
        <h3 className="font-semibold">Paiements</h3>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-navy-500">
              <th className="py-2">Date</th>
              <th>Mode</th>
              <th className="text-right">Montant</th>
            </tr>
          </thead>
          <tbody>
            {sale.payments.map((p) => (
              <tr key={p.id} className="border-t border-navy-950/5">
                <td className="py-2">{format(p.paidAt, "dd/MM/yyyy", { locale: fr })}</td>
                <td>{p.method}</td>
                <td className="text-right">{formatMoney(Number(p.amount))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {sale.status === "VALIDATED" && (
        <section className="rounded-xl border border-gold-500/25 bg-gold-500/5 p-5 shadow-sm">
          <h3 className="font-semibold">Facture de vente</h3>
          <p className="mt-2 text-sm text-navy-600">
            {sale.invoiceNumber ? (
              <>N° <span className="font-mono">{sale.invoiceNumber}</span></>
            ) : (
              "Générée automatiquement à la validation"
            )}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/dashboard/documents/preview/sales-invoice/${sale.id}`}
              className="rounded-lg bg-gradient-to-r from-gold-600 to-gold-500 px-4 py-2 text-sm font-semibold text-navy-950"
            >
              Prévisualiser / PDF
            </Link>
            <a
              href={`/api/sales/${sale.id}/invoice/pdf`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-navy-950/15 px-4 py-2 text-sm font-medium"
            >
              Télécharger
            </a>
          </div>
        </section>
      )}

      {sale.exitVoucher && (
        <section className="rounded-xl border border-navy-950/10 bg-white p-5 shadow-sm">
          <h3 className="font-semibold">Bon de sortie</h3>
          <p className="mt-2 text-sm">
            Réf. {sale.exitVoucher.reference} · {sale.depot?.name ?? sale.vehicle.depot.name}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/dashboard/documents/preview/exit-voucher/${sale.exitVoucher.id}`}
              className="rounded-lg bg-gradient-to-r from-gold-600 to-gold-500 px-3 py-1.5 text-xs font-semibold text-navy-950"
            >
              Prévisualiser
            </Link>
            <a
              href={`/api/exit-vouchers/${sale.exitVoucher.id}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-navy-950 px-3 py-1.5 text-xs font-medium text-white"
            >
              PDF
            </a>
            <Link
              href={`/dashboard/warehouse/exit-vouchers/scan/${sale.exitVoucher.secureToken}`}
              className="rounded-lg border border-navy-950/15 px-3 py-1.5 text-xs font-medium"
            >
              Scan QR
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
