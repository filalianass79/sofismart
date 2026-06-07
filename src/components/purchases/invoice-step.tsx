"use client";

import { useEffect, useMemo } from "react";
import { Trash2 } from "lucide-react";
import type { UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { computePurchaseTotals, computeTaxFromRate } from "@/lib/finance";
import { feeTypeLabels, purchaseTypeLabels } from "@/lib/purchase-labels";
import { formatMoney } from "@/lib/utils";
import type { PurchaseWizardValues } from "@/lib/validations/purchase";
import type { PurchaseFeeType } from "@/generated/prisma/enums";

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function InvoiceStep({
  register,
  setValue,
  watch,
  feeFields,
  appendFee,
  removeFee,
}: {
  register: UseFormRegister<PurchaseWizardValues>;
  setValue: UseFormSetValue<PurchaseWizardValues>;
  watch: UseFormWatch<PurchaseWizardValues>;
  feeFields: { id: string }[];
  appendFee: (v: PurchaseWizardValues["invoice"]["fees"][0]) => void;
  removeFee: (i: number) => void;
}) {
  const amountHT = watch("invoice.amountHT");
  const taxRatePercent = watch("invoice.taxRatePercent");
  const fees = watch("invoice.fees");

  const totals = useMemo(() => {
    const ht = num(amountHT);
    const rate = num(taxRatePercent) || 20;
    const tax = computeTaxFromRate(ht, rate);
    return computePurchaseTotals({
      amountHT: ht,
      taxAmount: tax,
      discount: 0,
      fees: fees ?? [],
    });
  }, [amountHT, taxRatePercent, fees]);

  useEffect(() => {
    setValue("invoice.taxAmount", totals.taxAmount, { shouldValidate: false });
  }, [totals.taxAmount, setValue]);

  return (
    <div className="space-y-4">
      <h3 className="font-display text-xl text-navy-950">Facture d&apos;achat</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm">
          <span className="text-navy-700">N° facture fournisseur</span>
          <input {...register("invoice.invoiceNumber")} className="input-sofi mt-1 w-full" />
        </label>
        <label className="text-sm">
          <span className="text-navy-700">Date d&apos;achat *</span>
          <input type="date" {...register("invoice.purchaseDate")} className="input-sofi mt-1 w-full" />
        </label>
        <label className="text-sm">
          <span className="text-navy-700">Date facture</span>
          <input type="date" {...register("invoice.invoiceDate")} className="input-sofi mt-1 w-full" />
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="text-navy-700">Type d&apos;achat</span>
          <select {...register("invoice.purchaseType")} className="input-sofi mt-1 w-full">
            {Object.entries(purchaseTypeLabels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm">
          <span className="text-navy-700">Montant HT *</span>
          <input
            type="number"
            step="0.01"
            min={0}
            {...register("invoice.amountHT", { valueAsNumber: true })}
            className="input-sofi mt-1 w-full tabular-nums"
          />
        </label>
        <label className="text-sm">
          <span className="text-navy-700">Taux TVA (%)</span>
          <input
            type="number"
            step="0.1"
            min={0}
            max={100}
            {...register("invoice.taxRatePercent", { valueAsNumber: true })}
            className="input-sofi mt-1 w-full tabular-nums"
          />
        </label>
        <label className="text-sm">
          <span className="text-navy-700">Montant TVA</span>
          <input
            type="text"
            readOnly
            value={formatMoney(totals.taxAmount)}
            className="input-sofi mt-1 w-full bg-cream-50 tabular-nums"
          />
        </label>
        <label className="text-sm">
          <span className="text-navy-700">Montant TTC</span>
          <input
            type="text"
            readOnly
            value={formatMoney(totals.amountTTC)}
            className="input-sofi mt-1 w-full bg-cream-100 font-semibold tabular-nums text-navy-950"
          />
        </label>
        <label className="text-sm">
          <span className="text-navy-700">Prix total d&apos;achat</span>
          <input
            type="text"
            readOnly
            value={formatMoney(totals.totalPurchasePrice)}
            className="input-sofi mt-1 w-full bg-gold-500/15 font-semibold tabular-nums text-navy-950"
          />
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="text-navy-700">Coût d&apos;achat (prix de revient)</span>
          <input
            type="text"
            readOnly
            value={formatMoney(totals.costPrice)}
            className="input-sofi mt-1 w-full bg-gold-500/25 font-bold tabular-nums text-gold-900"
            title="Prix total d'achat + frais"
          />
        </label>
      </div>
      <p className="text-xs text-navy-500">
        Montants recalculés en direct : TTC = HT + TVA, prix d&apos;achat = TTC, coût = prix d&apos;achat + frais.
      </p>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="font-semibold text-navy-900">Frais liés à l&apos;achat</h4>
          <button
            type="button"
            onClick={() => appendFee({ type: "TRANSPORT", amount: 0, label: "", notes: "" })}
            className="text-sm font-medium text-gold-700 hover:text-gold-600"
          >
            + Ajouter une ligne
          </button>
        </div>
        <div className="space-y-2">
          {feeFields.map((field, i) => (
            <div key={field.id} className="grid gap-2 rounded-lg border border-navy-950/10 p-3 sm:grid-cols-12">
              <select {...register(`invoice.fees.${i}.type`)} className="input-sofi sm:col-span-4">
                {(Object.keys(feeTypeLabels) as PurchaseFeeType[]).map((t) => (
                  <option key={t} value={t}>
                    {feeTypeLabels[t]}
                  </option>
                ))}
              </select>
              <input {...register(`invoice.fees.${i}.label`)} placeholder="Libellé" className="input-sofi sm:col-span-4" />
              <input
                type="number"
                step="0.01"
                min={0}
                {...register(`invoice.fees.${i}.amount`, { valueAsNumber: true })}
                className="input-sofi sm:col-span-3 tabular-nums"
              />
              <button type="button" onClick={() => removeFee(i)} className="text-morocco-600 sm:col-span-1">
                <Trash2 className="mx-auto h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
      <label className="block text-sm">
        <span className="text-navy-700">Observations</span>
        <textarea {...register("invoice.notes")} rows={3} className="input-sofi mt-1 w-full" />
      </label>
    </div>
  );
}
