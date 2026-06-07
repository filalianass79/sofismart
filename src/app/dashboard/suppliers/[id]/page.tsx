import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";
import { formatVehicleTitle } from "@/lib/vehicle-catalog";
import { supplierTypeLabels } from "@/lib/purchase-labels";

type Props = { params: Promise<{ id: string }> };

export default async function SupplierDetailPage({ params }: Props) {
  const { id } = await params;
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      purchases: {
        orderBy: { purchaseDate: "desc" },
        include: { vehicle: { include: { brand: true, carModel: true } }, payments: true },
      },
      _count: { select: { purchases: true } },
    },
  });
  if (!supplier) notFound();

  const totalPurchases = supplier.purchases.reduce(
    (a, p) => a + Number(p.totalPurchasePrice || p.basePrice),
    0
  );
  const totalPaid = supplier.purchases.reduce(
    (a, p) => a + p.payments.reduce((s, pay) => s + Number(pay.amount), 0),
    0
  );

  return (
    <div className="space-y-6">
      <Link href="/dashboard/suppliers" className="inline-flex items-center gap-1 text-sm text-navy-600">
        <ChevronLeft className="h-4 w-4" /> Fournisseurs
      </Link>
      <div>
        <h2 className="font-display text-3xl text-navy-950">{supplier.name}</h2>
        <p className="text-sm text-navy-600">{supplierTypeLabels[supplier.type]}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Achats" value={String(supplier._count.purchases)} />
        <Stat label="Total achats" value={formatMoney(totalPurchases)} />
        <Stat label="Solde à payer" value={formatMoney(Math.max(0, totalPurchases - totalPaid))} />
      </div>
      <div className="rounded-xl border bg-white p-5 text-sm space-y-1">
        {supplier.ice && <p>ICE : {supplier.ice}</p>}
        {supplier.cin && <p>CIN : {supplier.cin}</p>}
        {supplier.phone && <p>Tél : {supplier.phone}</p>}
        {supplier.email && <p>Email : {supplier.email}</p>}
        {supplier.address && <p>{supplier.address}</p>}
      </div>
      <h3 className="font-semibold text-navy-950">Historique des achats</h3>
      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-cream-100 text-xs uppercase text-navy-600">
            <tr>
              <th className="px-4 py-3 text-left">Réf.</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Véhicule</th>
              <th className="px-4 py-3 text-right">Montant</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {supplier.purchases.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/purchases/${p.id}`} className="text-gold-700 hover:underline">
                    {p.reference}
                  </Link>
                </td>
                <td className="px-4 py-3">{new Date(p.purchaseDate).toLocaleDateString("fr-FR")}</td>
                <td className="px-4 py-3">
                  {p.vehicle ? formatVehicleTitle(p.vehicle) : "—"}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatMoney(p.totalPurchasePrice || p.basePrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-navy-950/10 bg-white p-4">
      <p className="text-xs uppercase text-navy-500">{label}</p>
      <p className="mt-1 font-display text-xl text-navy-950">{value}</p>
    </div>
  );
}
