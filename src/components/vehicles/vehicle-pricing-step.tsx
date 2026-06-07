"use client";

import type { UseFormRegister, UseFormWatch } from "react-hook-form";
import { formatMoney } from "@/lib/utils";
import type { VehicleWizardValues } from "@/lib/validations/vehicle";

export function VehiclePricingStep({
  register,
  watch,
}: {
  register: UseFormRegister<VehicleWizardValues>;
  watch: UseFormWatch<VehicleWizardValues>;
}) {
  const purchasePrice = watch("pricing.purchasePrice");
  const extraFeesTotal = watch("pricing.extraFeesTotal");
  const costPrice = Number(purchasePrice || 0) + Number(extraFeesTotal || 0);

  return (
    <div className="space-y-4">
      <header>
        <h3 className="font-display text-xl text-navy-950">Tarification</h3>
        <p className="mt-1 text-sm text-navy-500">
          Prix d&apos;achat et frais annexes (hors module Achats). Le prix de revient est calculé automatiquement.
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="font-medium text-navy-700">Prix d&apos;achat (MAD)</span>
          <input
            type="number"
            step="0.01"
            min={0}
            {...register("pricing.purchasePrice", { valueAsNumber: true })}
            className="input-sofi mt-1 w-full"
          />
        </label>
        <label className="text-sm">
          <span className="font-medium text-navy-700">Frais annexes (MAD)</span>
          <input
            type="number"
            step="0.01"
            min={0}
            {...register("pricing.extraFeesTotal", { valueAsNumber: true })}
            className="input-sofi mt-1 w-full"
          />
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="font-medium text-navy-700">Prix de revient (calculé)</span>
          <input
            type="text"
            readOnly
            value={formatMoney(costPrice)}
            className="input-sofi mt-1 w-full border-gold-500/30 bg-gold-500/15 font-semibold tabular-nums text-navy-950"
          />
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="font-medium text-navy-700">Prix de vente estimé (MAD)</span>
          <input
            type="number"
            step="0.01"
            min={0}
            {...register("vehicle.targetSalePrice", { valueAsNumber: true })}
            className="input-sofi mt-1 w-full"
          />
        </label>
      </div>
    </div>
  );
}
