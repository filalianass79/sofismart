"use client";

import { useCallback, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import Link from "next/link";
import { Building2 } from "lucide-react";

type CreditOrgRow = {
  id: string;
  name: string;
  code: string | null;
  city: string | null;
  isActive: boolean;
};

export function CreditOrganizationStep({ onContinue }: { onContinue?: () => void }) {
  const { register, watch, setValue, formState } = useFormContext();
  const financedByCreditOrg = watch("financedByCreditOrg");
  const creditOrganizationId = watch("creditOrganizationId");
  const [orgs, setOrgs] = useState<CreditOrgRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/credit-organizations?activeOnly=1");
    if (res.ok) setOrgs(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!financedByCreditOrg) {
      setValue("creditOrganizationId", "");
    }
  }, [financedByCreditOrg, setValue]);

  return (
    <section className="space-y-5 rounded-xl border border-navy-950/10 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold-500/15 text-gold-800">
          <Building2 className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-display text-xl text-navy-950">Financement crédit</h3>
          <p className="mt-1 text-sm text-navy-600">
            Indiquez si la vente est financée par un organisme de crédit (banque, société de financement…).
          </p>
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="sr-only">Financement par organisme de crédit</legend>
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-navy-950/10 px-4 py-3 hover:bg-cream-50">
          <input
            type="radio"
            value="false"
            checked={!financedByCreditOrg}
            onChange={() => setValue("financedByCreditOrg", false, { shouldValidate: true })}
          />
          <span className="text-sm font-medium text-navy-900">Non — vente sans organisme de crédit</span>
        </label>
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-navy-950/10 px-4 py-3 hover:bg-cream-50">
          <input
            type="radio"
            value="true"
            checked={!!financedByCreditOrg}
            onChange={() => setValue("financedByCreditOrg", true, { shouldValidate: true })}
          />
          <span className="text-sm font-medium text-navy-900">
            Oui — financement par un organisme de crédit
          </span>
        </label>
      </fieldset>

      {financedByCreditOrg && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-navy-700">
            Organisme de crédit *
            <select
              className="input-sofi mt-1 w-full"
              {...register("creditOrganizationId")}
              value={creditOrganizationId ?? ""}
            >
              <option value="">— Sélectionner —</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                  {o.code ? ` (${o.code})` : ""}
                  {o.city ? ` — ${o.city}` : ""}
                </option>
              ))}
            </select>
          </label>
          {formState.errors.creditOrganizationId && (
            <p className="text-sm text-morocco-600">
              {String(formState.errors.creditOrganizationId.message)}
            </p>
          )}
          {loading && <p className="text-xs text-navy-500">Chargement des organismes…</p>}
          {!loading && orgs.length === 0 && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              Aucun organisme actif.{" "}
              <Link href="/dashboard/settings/credit-organizations" className="font-semibold underline">
                Ajouter un organisme
              </Link>
            </p>
          )}
        </div>
      )}

      {onContinue && (
        <div className="flex justify-end pt-2">
          <button type="button" onClick={onContinue} className="btn-sofi-primary">
            Continuer
          </button>
        </div>
      )}
    </section>
  );
}
