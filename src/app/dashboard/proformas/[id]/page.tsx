import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getProformaById } from "@/lib/services/proforma-service";
import { formatMoney } from "@/lib/utils";
import { formatVehicleTitle } from "@/lib/vehicle-catalog";
import { ProformaStatusBadge } from "@/components/proformas/proforma-status-badge";
import { ProformaDetailActions } from "@/components/proformas/proforma-detail-actions";

export default async function ProformaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getProformaById(id);
  if (!row) notFound();

  return (
    <article className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-navy-500">
            <Link href="/dashboard/proformas" className="hover:underline">
              Proformas
            </Link>{" "}
            / {row.reference}
          </p>
          <h2 className="font-display text-3xl text-navy-950">{row.reference}</h2>
          <div className="mt-2">
            <ProformaStatusBadge status={row.status} />
          </div>
        </div>
        <ProformaDetailActions id={row.id} status={row.status} pdfUrl={row.pdfUrl} />
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-navy-950/10 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-navy-900">Client</h3>
          <p className="mt-2">{row.client?.name ?? "Client provisoire (non enregistré)"}</p>
        </section>
        <section className="rounded-xl border border-navy-950/10 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-navy-900">Véhicule</h3>
          <p className="mt-2">{formatVehicleTitle(row.vehicle)}</p>
          <p className="text-sm text-navy-500">Statut stock : {row.vehicle.status} (inchangé)</p>
        </section>
        <section className="rounded-xl border border-navy-950/10 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-navy-900">Montants</h3>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt>Prix HT</dt>
              <dd>{formatMoney(Number(row.priceHT))}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Remise</dt>
              <dd>{formatMoney(Number(row.discount))}</dd>
            </div>
            <div className="flex justify-between font-semibold">
              <dt>Total TTC</dt>
              <dd className="text-gold-800">{formatMoney(Number(row.totalTTC))}</dd>
            </div>
          </dl>
        </section>
        <section className="rounded-xl border border-navy-950/10 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-navy-900">Dates</h3>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt>Proforma</dt>
              <dd>{format(new Date(row.proformaDate), "dd/MM/yyyy", { locale: fr })}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Validité</dt>
              <dd>{format(new Date(row.validityDate), "dd/MM/yyyy", { locale: fr })}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Commercial</dt>
              <dd>{row.commercial.name}</dd>
            </div>
          </dl>
        </section>
      </div>

      {row.convertedSale && (
        <p className="text-sm">
          Convertie en vente{" "}
          <Link href={`/dashboard/sales/${row.convertedSale.id}`} className="text-gold-800 hover:underline">
            {row.convertedSale.reference}
          </Link>
        </p>
      )}

      {row.history.length > 0 && (
        <section className="rounded-xl border border-navy-950/10 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-navy-900">Historique</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {row.history.map((h) => (
              <li key={h.id} className="flex justify-between border-b border-navy-950/5 pb-2">
                <span>{h.action}</span>
                <span className="text-navy-500">
                  {format(new Date(h.createdAt), "dd/MM/yyyy HH:mm", { locale: fr })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
