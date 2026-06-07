import { ProformaTable } from "@/components/proformas/proforma-table";

export default function ProformasPage() {
  return (
    <article className="space-y-6">
      <header>
        <h2 className="font-display text-3xl text-navy-950">Factures proforma</h2>
        <p className="mt-1 text-sm text-navy-600">
          Documents commerciaux provisoires — sans validation administrateur ni impact stock.
        </p>
      </header>
      <ProformaTable />
    </article>
  );
}
