"use client";

import type { ProformaDocumentData } from "@/lib/documents/types";
import { formatMoney } from "@/lib/utils";

export function ProformaPreview({ data }: { data: ProformaDocumentData }) {
  return (
    <article className="mx-auto max-w-[210mm] bg-white p-8 shadow-lg print:shadow-none">
      <header className="border-b border-navy-950/10 pb-4">
        <p className="font-display text-2xl text-navy-950">FACTURE PROFORMA</p>
        <p className="mt-2 rounded bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-950">
          DOCUMENT PROVISOIRE — NON VALABLE COMME FACTURE DÉFINITIVE
        </p>
        <p className="mt-2 text-sm text-navy-600">
          {data.reference} · {new Date(data.proformaDate).toLocaleDateString("fr-FR")} · Validité{" "}
          {new Date(data.validityDate).toLocaleDateString("fr-FR")}
        </p>
      </header>

      <section className="mt-6 grid gap-6 sm:grid-cols-2 text-sm">
        <div>
          <h3 className="font-semibold text-navy-900">SOFISMART</h3>
          <p>{data.company.tradeName ?? data.company.legalName}</p>
          <p className="text-navy-600">
            {[data.company.ice && `ICE ${data.company.ice}`, data.company.rc && `RC ${data.company.rc}`, data.company.taxId && `IF ${data.company.taxId}`]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="text-navy-600">{data.company.phone} · {data.company.email}</p>
        </div>
        <div>
          <h3 className="font-semibold text-navy-900">Client</h3>
          <p>{data.client.name}</p>
          <p className="text-navy-600">{data.client.phone}</p>
          <p className="text-navy-600">{data.client.address}</p>
        </div>
      </section>

      <section className="mt-6 text-sm">
        <h3 className="font-semibold text-navy-900">Véhicule</h3>
        <p>{data.vehicle.title}</p>
        <p className="text-navy-600">
          {data.vehicle.plate ?? "—"} · {data.vehicle.vin ?? "—"} · {data.vehicle.mileage.toLocaleString("fr-FR")} km
        </p>
      </section>

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b bg-cream-50 text-left text-xs uppercase text-navy-500">
            <th className="py-2">Désignation</th>
            <th>Qté</th>
            <th>P.U. HT</th>
            <th>Remise</th>
            <th>TVA</th>
            <th>Total TTC</th>
          </tr>
        </thead>
        <tbody>
          {data.lines.map((l, i) => (
            <tr key={i} className="border-b">
              <td className="py-2">{l.designation}</td>
              <td>{l.quantity}</td>
              <td>{formatMoney(l.unitPriceHT)}</td>
              <td>{l.discount > 0 ? formatMoney(l.discount) : "—"}</td>
              <td>{l.taxRate} %</td>
              <td>{formatMoney(l.totalTTC)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
        <div className="flex justify-between font-semibold">
          <span>Total TTC</span>
          <span>{formatMoney(data.totals.totalTTC)}</span>
        </div>
      </div>

      {data.paymentTerms && (
        <p className="mt-6 text-sm">
          <strong>Conditions de paiement :</strong> {data.paymentTerms}
        </p>
      )}
      <footer className="mt-8 border-t pt-4 text-xs text-navy-500">
        {data.legalMentions.map((m) => (
          <p key={m}>{m}</p>
        ))}
      </footer>
    </article>
  );
}
