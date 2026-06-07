import { formatMoney } from "@/lib/utils";
import type { SalesInvoiceDocumentData } from "@/lib/documents/types";
import {
  DocumentClientBlock,
  DocumentFooter,
  DocumentHeader,
  DocumentLayout,
  DocumentSection,
  DocumentTable,
  DocumentTotals,
  DocumentVehicleBlock,
} from "./document-primitives";

export function SalesInvoiceTemplate({
  data,
  scale = 1,
}: {
  data: SalesInvoiceDocumentData;
  scale?: number;
}) {
  const line = data.lines[0];
  return (
    <DocumentLayout scale={scale}>
      <DocumentHeader
        company={data.company}
        title="FACTURE DE VENTE"
        subtitle={`N° ${data.invoiceNumber}`}
        statusLabel={data.statusLabel}
      />
      <div className="grid grid-cols-2 gap-6 px-8 py-2 text-xs">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase text-navy-500">Vendeur</p>
          <p className="font-semibold">{data.company.tradeName ?? data.company.legalName}</p>
          <p>{data.company.ice && `ICE : ${data.company.ice}`}</p>
          <p>{data.company.rc && `RC : ${data.company.rc}`}</p>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase text-navy-500">Client</p>
          <DocumentClientBlock client={data.client} />
        </div>
      </div>
      <DocumentSection title="Véhicule vendu">
        <DocumentVehicleBlock vehicle={data.vehicle} />
      </DocumentSection>
      <div className="px-8 py-2">
        <DocumentTable
          headers={["Désignation", "Qté", "P.U. HT", "TVA", "Total HT"]}
          rows={[
            [
              line.designation,
              line.quantity,
              formatMoney(line.unitPrice),
              `${line.taxRate} %`,
              formatMoney(line.totalHt),
            ],
          ]}
        />
      </div>
      <div className="px-8 py-3">
        <DocumentTotals
          lines={[
            { label: "Total HT", value: formatMoney(data.totals.priceHt) },
            ...(data.totals.discount > 0
              ? [{ label: "Remise", value: `- ${formatMoney(data.totals.discount)}` }]
              : []),
            { label: "Base HT", value: formatMoney(data.totals.baseHt) },
            { label: "TVA", value: formatMoney(data.totals.taxAmount) },
            { label: "Total TTC", value: formatMoney(data.totals.totalTtc), bold: true },
            { label: "Montant payé", value: formatMoney(data.totals.paid) },
            { label: "Reste à payer", value: formatMoney(data.totals.balance) },
          ]}
          highlight={`Net à payer : ${formatMoney(data.totals.totalTtc)}`}
        />
      </div>
      {data.payments.length > 0 && (
        <DocumentSection title="Paiements">
          <ul className="space-y-1 text-xs">
            {data.payments.map((p, i) => (
              <li key={i}>
                {p.date} — {p.method} — {formatMoney(p.amount)}
                {p.reference ? ` (${p.reference})` : ""}
              </li>
            ))}
          </ul>
        </DocumentSection>
      )}
      <div className="px-8 pb-4 text-[10px] text-navy-500">
        {data.legalMentions.map((m, i) => (
          <p key={i}>{m}</p>
        ))}
      </div>
      <DocumentFooter company={data.company} />
    </DocumentLayout>
  );
}
