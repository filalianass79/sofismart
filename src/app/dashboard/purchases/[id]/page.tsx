import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getPurchaseAccessFromSession } from "@/lib/server/purchase-access-session";
import { formatPurchaseMoney } from "@/lib/purchase-privacy";
import { formatVehicleTitle } from "@/lib/vehicle-catalog";
import { sumFees } from "@/lib/finance";
import { PaymentStatusBadge } from "@/components/purchases/payment-status-badge";
import { PurchaseStatusBadge } from "@/components/purchases/purchase-status-badge";
import {
  purchaseTypeLabels,
  supplierTypeLabels,
  feeTypeLabels,
  paymentMethodLabels,
  documentCategoryLabels,
} from "@/lib/purchase-labels";
import type { DocumentCategory, PurchaseFeeType } from "@/generated/prisma/enums";

type Props = { params: Promise<{ id: string }> };

export default async function PurchaseDetailPage({ params }: Props) {
  const { id } = await params;
  const access = await getPurchaseAccessFromSession();
  if (!access) redirect("/dashboard");
  const canViewFinancials = access.canViewFinancials;
  const canEdit = access.canEdit;

  const p = await prisma.purchase.findUnique({
    where: { id },
    include: {
      supplier: true,
      vehicle: { include: { depot: true, brand: true, carModel: true } },
      fees: true,
      payments: true,
      documents: true,
      stockMovements: { include: { toDepot: true } },
    },
  });
  if (!p) notFound();

  const paid = p.payments.reduce((a, x) => a + Number(x.amount), 0);
  const due = Number(p.totalPurchasePrice);
  const balance = Math.max(0, due - paid);
  const feesTotal = sumFees(p.fees);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/purchases"
            className="inline-flex items-center gap-1 text-sm text-navy-600 hover:text-navy-950"
          >
            <ChevronLeft className="h-4 w-4" /> Achats
          </Link>
          <h2 className="mt-2 font-display text-3xl text-navy-950">{p.reference}</h2>
          <p className="text-sm text-navy-600">
            {new Date(p.purchaseDate).toLocaleDateString("fr-FR")} — {p.supplier.name}
          </p>
          <div className="mt-2 flex gap-2">
            <PurchaseStatusBadge status={p.status} />
            <PaymentStatusBadge status={p.paymentStatus} />
          </div>
        </div>
        {canEdit && (
          <Link
            href={`/dashboard/purchases/${id}/edit`}
            className="inline-flex items-center gap-2 rounded-lg bg-navy-950 px-4 py-2 text-sm font-medium text-white"
          >
            <Pencil className="h-4 w-4" /> Modifier
          </Link>
        )}
      </div>

      {canViewFinancials ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Prix total achat" value={formatPurchaseMoney(p.totalPurchasePrice, true)} />
          <StatCard label="Frais" value={formatPurchaseMoney(feesTotal, true)} />
          <StatCard label="Prix de revient" value={formatPurchaseMoney(p.costPrice, true)} highlight />
          <StatCard label="Reste à payer" value={formatPurchaseMoney(balance, true)} />
        </div>
      ) : (
        <p className="rounded-lg border border-navy-950/10 bg-cream-50 px-4 py-3 text-sm text-navy-600">
          Les montants d&apos;achat sont visibles uniquement par l&apos;administrateur et le gérant.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Fournisseur">
          <p className="font-semibold">{p.supplier.name}</p>
          <p className="text-navy-600">{supplierTypeLabels[p.supplier.type]}</p>
          {p.supplier.ice && <p className="text-sm">ICE : {p.supplier.ice}</p>}
          {p.supplier.phone && <p className="text-sm">{p.supplier.phone}</p>}
        </Section>
        <Section title="Facture">
          <p className="text-sm">Type : {purchaseTypeLabels[p.purchaseType]}</p>
          {p.invoiceNumber && <p className="text-sm">N° facture : {p.invoiceNumber}</p>}
          {canViewFinancials ? (
            <>
              <p className="text-sm">
                HT : {formatPurchaseMoney(p.amountHT, true)} — TVA : {formatPurchaseMoney(p.taxAmount, true)}
              </p>
              <p className="text-sm">TTC : {formatPurchaseMoney(p.amountTTC, true)}</p>
            </>
          ) : (
            <p className="text-sm text-navy-500">Montants non affichés</p>
          )}
        </Section>
        {p.vehicle && (
          <Section title="Véhicule">
            <p className="font-semibold">
              {formatVehicleTitle(p.vehicle)} {p.vehicle.version}
            </p>
            <p className="text-sm">{p.vehicle.year} — {p.vehicle.internalRef}</p>
            <p className="text-sm">Dépôt : {p.vehicle.depot.name}</p>
            {p.vehicle.vin && <p className="text-sm">VIN : {p.vehicle.vin}</p>}
            <Link
              href={`/dashboard/vehicles/${p.vehicle.id}`}
              className="mt-2 inline-block text-sm text-gold-700 hover:underline"
            >
              Voir fiche véhicule →
            </Link>
          </Section>
        )}
        <Section title="Paiements">
          {p.payments.length === 0 ? (
            <p className="text-sm text-navy-400">Aucun paiement</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {p.payments.map((pay) => (
                <li key={pay.id} className="flex justify-between border-b border-navy-950/5 pb-2">
                  <span>
                    {new Date(pay.paidAt).toLocaleDateString("fr-FR")} — {paymentMethodLabels[pay.method]}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatPurchaseMoney(pay.amount, canViewFinancials)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {p.fees.length > 0 && (
        <Section title="Frais d'achat" className="rounded-xl border bg-white p-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-navy-500">
                <th className="pb-2">Type</th>
                <th className="pb-2">Libellé</th>
                {canViewFinancials && <th className="pb-2 text-right">Montant</th>}
              </tr>
            </thead>
            <tbody>
              {p.fees.map((f) => (
                <tr key={f.id} className="border-t border-navy-950/5">
                  <td className="py-2">{feeTypeLabels[f.type as PurchaseFeeType]}</td>
                  <td className="py-2">{f.label ?? "—"}</td>
                  {canViewFinancials && (
                    <td className="py-2 text-right tabular-nums">
                      {formatPurchaseMoney(f.amount, true)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {p.documents.length > 0 && (
        <Section title="Documents" className="rounded-xl border bg-white p-5">
          <ul className="divide-y text-sm">
            {p.documents.map((d) => (
              <li key={d.id} className="flex items-center justify-between py-2">
                <span>
                  {documentCategoryLabels[d.category as DocumentCategory]} — {d.originalName}
                </span>
                <a href={d.path} target="_blank" rel="noreferrer" className="text-gold-700 hover:underline">
                  Télécharger
                </a>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${highlight ? "border-gold-400/50 bg-gold-500/10" : "border-navy-950/10 bg-white"}`}
    >
      <p className="text-xs font-semibold uppercase text-navy-500">{label}</p>
      <p className="mt-1 font-display text-2xl text-navy-950 tabular-nums">{value}</p>
    </div>
  );
}

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className ?? "rounded-xl border border-navy-950/10 bg-white p-5 shadow-sm"}>
      <h3 className="mb-3 font-semibold text-navy-950">{title}</h3>
      {children}
    </div>
  );
}
