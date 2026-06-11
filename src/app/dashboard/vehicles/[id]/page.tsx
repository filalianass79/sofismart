import Link from "next/link";
import { UploadImage } from "@/components/ui/upload-image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";
import { formatFinancialMoney } from "@/lib/financial-privacy";
import { getFinancialAccessFromSession } from "@/lib/server/financial-access-session";
import { formatVehicleTitle, fuelTypeLabels, transmissionTypeLabels } from "@/lib/vehicle-catalog";
import { VehicleColorSwatch } from "@/components/ui/vehicle-color-swatch";
import { documentCategoryLabels } from "@/lib/purchase-labels";
import type { DocumentCategory } from "@/generated/prisma/enums";

type Props = { params: Promise<{ id: string }> };

export default async function VehicleDetailPage({ params }: Props) {
  const { id } = await params;
  const financial = await getFinancialAccessFromSession();
  const canViewFinancials = financial?.canViewFinancials ?? false;

  const v = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      depot: true,
      brand: true,
      carModel: true,
      photos: true,
      documents: true,
      movements: { orderBy: { createdAt: "desc" }, take: 20, include: { fromDepot: true, toDepot: true } },
      purchase: { include: { supplier: true, fees: true, payments: true } },
      sale: { include: { client: true, payments: true } },
    },
  });
  if (!v) notFound();

  return (
    <main className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-navy-950/10 bg-white p-5 shadow-sm">
        <section className="flex gap-4">
          {v.brand.logo ? (
            <span className="relative block h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-navy-950/10 bg-cream-50">
              <UploadImage src={v.brand.logo} alt="" fill className="object-contain p-1.5" />
            </span>
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-navy-950 to-navy-800 text-lg font-bold text-gold-300">
              {v.brand.label.slice(0, 1)}
            </span>
          )}
          <section>
            <Link href="/dashboard/vehicles" className="text-sm text-gold-700 hover:underline">
              ← Véhicules
            </Link>
            <h2 className="mt-1 font-display text-3xl text-navy-950">{formatVehicleTitle(v)}</h2>
            <p className="mt-1 text-sm text-navy-600">
              <span className="font-mono text-xs">{v.internalRef}</span>
              {v.version ? ` · ${v.version}` : ""}
            </p>
          </section>
        </section>
        <div className="flex flex-col items-end gap-2">
          {!v.isArchived && (
            <Link
              href={`/dashboard/vehicles/${v.id}/edit`}
              className="rounded-lg border border-gold-500/40 bg-gold-500/10 px-3 py-1.5 text-xs font-semibold text-navy-900 hover:bg-gold-500/20"
            >
              Modifier
            </Link>
          )}
          <span className="rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-navy-800">
            {v.status.replace(/_/g, " ")}
          </span>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        {canViewFinancials ? (
          <article className="rounded-xl border border-navy-950/10 bg-white p-4 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-navy-500">Financier</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-navy-600">Prix d&apos;achat</dt>
                <dd className="font-medium">{formatMoney(v.purchasePrice)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-navy-600">Frais</dt>
                <dd className="font-medium">{formatMoney(v.extraFeesTotal)}</dd>
              </div>
              <div className="flex justify-between border-t border-navy-950/10 pt-2">
                <dt className="font-semibold text-navy-900">Prix de revient</dt>
                <dd className="font-semibold text-gold-700">{formatMoney(v.costPrice)}</dd>
              </div>
              {v.finalSalePrice != null && (
                <div className="flex justify-between">
                  <dt className="text-navy-600">Prix de vente</dt>
                  <dd className="font-medium">{formatMoney(v.finalSalePrice)}</dd>
                </div>
              )}
            </dl>
          </article>
        ) : (
          <article className="rounded-xl border border-navy-950/10 bg-cream-50 p-4 text-sm text-navy-600">
           Données non disponibles
          </article>
        )}
        <article className="rounded-xl border border-navy-950/10 bg-white p-4 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-navy-500">Fiche technique</h3>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-navy-600">Année</dt>
            <dd>{v.year}</dd>
            <dt className="text-navy-600">Km</dt>
            <dd>{v.mileage.toLocaleString("fr-FR")}</dd>
            <dt className="text-navy-600">Carburant</dt>
            <dd>{v.fuel ? fuelTypeLabels[v.fuel] : "—"}</dd>
            <dt className="text-navy-600">Boîte</dt>
            <dd>{v.transmission ? transmissionTypeLabels[v.transmission] : "—"}</dd>
            <dt className="text-navy-600">Couleur</dt>
            <dd>
              <VehicleColorSwatch color={v.color} size="sm" />
            </dd>
            <dt className="text-navy-600">Immatriculation</dt>
            <dd>{v.plate ?? "—"}</dd>
            <dt className="text-navy-600">Matricule W</dt>
            <dd>{v.matriculeW ?? "—"}</dd>
            <dt className="text-navy-600">N° de Chassis</dt>
            <dd className="font-mono text-xs">{v.vin ?? "—"}</dd>
            <dt className="text-navy-600">Origine</dt>
            <dd>{v.origin}</dd>
            <dt className="text-navy-600">Dépôt</dt>
            <dd>{v.depot.name}</dd>
          </dl>
        </article>
      </section>

      {v.purchase && (
        <section className="rounded-xl border border-navy-950/10 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-navy-900">Achat</h3>
          <p className="mt-1 text-sm text-navy-600">
            Fournisseur : <strong>{v.purchase.supplier.name}</strong> —{" "}
            {new Date(v.purchase.purchaseDate).toLocaleDateString("fr-FR")}
          </p>
          {canViewFinancials && v.purchase.fees.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-sm text-navy-700">
              {v.purchase.fees.map((f) => (
                <li key={f.id}>
                  {f.type}: {formatMoney(f.amount)}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {v.documents.length > 0 && (
        <section className="rounded-xl border border-navy-950/10 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-navy-900">Documents</h3>
          <ul className="mt-2 divide-y divide-navy-950/5 text-sm">
            {v.documents.map((d) => (
              <li key={d.id} className="flex justify-between gap-2 py-2">
                <span>
                  {documentCategoryLabels[d.category as DocumentCategory]} — {d.originalName}
                </span>
                <a href={d.path} target="_blank" rel="noopener noreferrer" className="text-gold-700 hover:underline">
                  Ouvrir
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {v.sale && (
        <section className="rounded-xl border border-navy-950/10 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-navy-900">Vente</h3>
          <p className="mt-1 text-sm text-navy-600">
            Client : <strong>{v.sale.client?.name ?? "—"}</strong>
            {canViewFinancials && (
              <> — marge {formatFinancialMoney(v.sale.margin, true)}</>
            )}{" "}
            — {v.sale.paymentStatus}
          </p>
        </section>
      )}

      <section className="rounded-xl border border-navy-950/10 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-navy-900">Historique des mouvements</h3>
        <ul className="mt-2 space-y-2 text-sm text-navy-700">
          {v.movements.length === 0 && <li>Aucun transfert enregistré.</li>}
          {v.movements.map((m) => (
            <li key={m.id}>
              {new Date(m.createdAt).toLocaleString("fr-FR")} —{" "}
              {m.fromDepot?.name ?? "?"} → {m.toDepot?.name ?? "?"}
              {m.reason ? ` (${m.reason})` : ""}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
