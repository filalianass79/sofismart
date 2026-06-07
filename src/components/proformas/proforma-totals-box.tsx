import { formatMoney } from "@/lib/utils";

export function ProformaTotalsBox({
  amounts,
}: {
  amounts: {
    grossHT: number;
    discount: number;
    baseHT: number;
    taxAmount: number;
    totalTTC: number;
    accessoryFees: number;
  };
}) {
  return (
    <div className="rounded-lg bg-cream-50 p-4 text-sm">
      <div className="flex justify-between">
        <span>Total HT</span>
        <span>{formatMoney(amounts.grossHT)}</span>
      </div>
      {amounts.discount > 0 && (
        <div className="flex justify-between text-morocco-700">
          <span>Remise</span>
          <span>- {formatMoney(amounts.discount)}</span>
        </div>
      )}
      <div className="flex justify-between">
        <span>Base HT</span>
        <span>{formatMoney(amounts.baseHT)}</span>
      </div>
      <div className="flex justify-between">
        <span>TVA</span>
        <span>{formatMoney(amounts.taxAmount)}</span>
      </div>
      <div className="mt-2 flex justify-between border-t border-navy-950/10 pt-2 text-base font-semibold text-navy-950">
        <span>Total TTC</span>
        <span className="text-gold-800">{formatMoney(amounts.totalTTC)}</span>
      </div>
    </div>
  );
}
