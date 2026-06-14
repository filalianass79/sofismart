"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Stepper, type StepItem } from "@/components/ui/stepper";
import { WizardActions } from "@/components/ui/wizard-actions";
import { LoadingOverlay } from "@/components/ui/loading";
import { SaleClientStep } from "@/components/sales/wizard/sale-client-step";
import { ProformaVehicleStep } from "./proforma-vehicle-step";
import { ProformaTotalsBox } from "./proforma-totals-box";
import {
  proformaInvoiceSchema,
  type ProformaWizardValues,
} from "@/lib/validations/proforma";
import { computeProformaAmounts } from "@/lib/proforma-finance";
import { formatMoney } from "@/lib/utils";
import { useFormFeedback } from "@/hooks/use-form-feedback";
import { parseApiError } from "@/lib/feedback/parse-api-error";

const STEPS: StepItem[] = [
  { id: "client", label: "Client", hint: "Sélection" },
  { id: "vehicle", label: "Véhicule", hint: "Stock" },
  { id: "conditions", label: "Conditions", hint: "Prix & validité" },
  { id: "summary", label: "Récap", hint: "Génération" },
];

type Commercial = { id: string; name: string | null };

function defaultValidityDate(days = 15) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function ProformaWizard({
  commercials,
  defaultCommercialId,
  editId,
  initialValues,
}: {
  commercials: Commercial[];
  defaultCommercialId?: string;
  editId?: string;
  initialValues?: Partial<ProformaWizardValues>;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { onFormInvalid, reportError } = useFormFeedback();

  const form = useForm<ProformaWizardValues>({
    resolver: zodResolver(proformaInvoiceSchema) as never,
    defaultValues: {
      clientMode: "EXISTING",
      clientId: "",
      vehicleId: "",
      commercialId: defaultCommercialId ?? commercials[0]?.id ?? "",
      proformaDate: new Date().toISOString().slice(0, 10),
      validityDate: defaultValidityDate(),
      priceHT: 0,
      discount: 0,
      accessoryFees: 0,
      taxRate: 20,
      paymentTerms: "Acompte à la commande, solde à la livraison",
      observations: "",
      saveAsDraft: true,
      ...initialValues,
    },
  });

  const { register, watch, trigger } = form;
  const values = watch();
  const amounts = useMemo(
    () =>
      computeProformaAmounts({
        priceHT: Number(values.priceHT || 0),
        discount: Number(values.discount || 0),
        accessoryFees: Number(values.accessoryFees || 0),
        taxRate: Number(values.taxRate || 20),
      }),
    [values.priceHT, values.discount, values.accessoryFees, values.taxRate],
  );

  async function validateStep(idx: number) {
    if (idx === 0) return trigger(["clientMode", "clientId", "newClient"] as never);
    if (idx === 1) return trigger(["vehicleId"]);
    if (idx === 2)
      return trigger([
        "proformaDate",
        "validityDate",
        "commercialId",
        "priceHT",
        "discount",
        "accessoryFees",
        "taxRate",
      ] as never);
    return true;
  }

  async function nextStep() {
    const ok = await validateStep(step);
    if (!ok) {
      onFormInvalid(form.formState.errors, "Vérifiez les champs obligatoires.");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function submit(saveAsDraft: boolean) {
    const ok = await trigger();
    if (!ok) {
      onFormInvalid(form.formState.errors, "Vérifiez les champs obligatoires.");
      return;
    }
    setLoading(true);
    const payload = form.getValues();
    try {
      const url = editId ? `/api/proformas/${editId}` : "/api/proformas";
      const method = editId ? "PUT" : "POST";
      let res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, saveAsDraft: true }),
      });
      let body = await res.json();
      if (!res.ok) throw new Error(parseApiError(body, "Erreur enregistrement"));

      const id = (editId ?? body.id) as string;
      if (!saveAsDraft) {
        res = await fetch(`/api/proformas/${id}/generate`, { method: "POST" });
        body = await res.json();
        if (!res.ok) throw new Error(parseApiError(body, "Erreur génération"));
      }
      router.push(`/dashboard/proformas/${id}`);
      router.refresh();
    } catch (e) {
      reportError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormProvider {...form}>
      <div className="relative space-y-6">
        {loading && <LoadingOverlay label="Traitement…" />}
        <Stepper steps={STEPS} current={step} />

        {step === 0 && <SaleClientStep onClientSelected={() => nextStep()} />}
        {step === 1 && <ProformaVehicleStep onVehicleSelected={() => nextStep()} />}
        {step === 2 && (
          <section className="space-y-4 rounded-xl border border-navy-950/10 bg-white p-6 shadow-sm">
            <h3 className="font-display text-xl text-navy-950">Conditions proforma</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                Date proforma
                <input type="date" className="input-sofi mt-1" {...register("proformaDate")} />
              </label>
              <label className="block text-sm">
                Date validité
                <input type="date" className="input-sofi mt-1" {...register("validityDate")} />
              </label>
              <label className="block text-sm sm:col-span-2">
                Commercial responsable
                <select className="input-sofi mt-1" {...register("commercialId")}>
                  {commercials.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name ?? c.id}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                Prix véhicule HT (MAD)
                <input type="number" step="0.01" className="input-sofi mt-1" {...register("priceHT")} />
              </label>
              <label className="block text-sm">
                Remise (MAD)
                <input type="number" step="0.01" className="input-sofi mt-1" {...register("discount")} />
              </label>
              <label className="block text-sm">
                Frais accessoires HT
                <input type="number" step="0.01" className="input-sofi mt-1" {...register("accessoryFees")} />
              </label>
              <label className="block text-sm">
                TVA (%)
                <input type="number" step="0.01" className="input-sofi mt-1" {...register("taxRate")} />
              </label>
              <label className="block text-sm sm:col-span-2">
                Conditions de paiement
                <textarea className="input-sofi mt-1" rows={2} {...register("paymentTerms")} />
              </label>
              <label className="block text-sm sm:col-span-2">
                Observations
                <textarea className="input-sofi mt-1" rows={2} {...register("observations")} />
              </label>
            </div>
            <ProformaTotalsBox amounts={amounts} />
          </section>
        )}
        {step === 3 && (
          <section className="space-y-4 rounded-xl border border-navy-950/10 bg-white p-6 shadow-sm">
            <h3 className="font-display text-xl text-navy-950">Récapitulatif</h3>
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              FACTURE PROFORMA — document provisoire, sans validation administrateur. Le stock véhicule
              n&apos;est pas modifié.
            </p>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-navy-500">Client</dt>
                <dd className="font-medium">
                  {values.clientMode === "EXISTING" ? values.clientId || "—" : "Nouveau client"}
                </dd>
              </div>
              <div>
                <dt className="text-navy-500">Véhicule</dt>
                <dd className="font-medium">{values.vehicleId ? "Sélectionné" : "—"}</dd>
              </div>
              <div>
                <dt className="text-navy-500">Validité</dt>
                <dd>{values.validityDate}</dd>
              </div>
              <div>
                <dt className="text-navy-500">Total TTC</dt>
                <dd className="text-lg font-semibold text-gold-800">{formatMoney(amounts.totalTTC)}</dd>
              </div>
            </dl>
            <ProformaTotalsBox amounts={amounts} />
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={() => submit(true)}
                className="rounded-lg border px-4 py-2 text-sm font-semibold"
              >
                Enregistrer brouillon
              </button>
              <button
                type="button"
                onClick={() => submit(false)}
                className="rounded-lg bg-navy-950 px-4 py-2 text-sm font-semibold text-white"
              >
                Générer proforma PDF
              </button>
              {editId && (
                <Link
                  href={`/dashboard/proformas/${editId}/preview`}
                  className="rounded-lg border border-gold-400 px-4 py-2 text-sm font-semibold text-gold-900"
                >
                  Prévisualiser
                </Link>
              )}
            </div>
          </section>
        )}

        <WizardActions
          step={step}
          totalSteps={STEPS.length}
          onPrev={() => setStep((s) => Math.max(0, s - 1))}
          onNext={nextStep}
          onCancel={() => router.push("/dashboard/proformas")}
          showNext={step < STEPS.length - 1}
          showDraft={false}
        />
      </div>
    </FormProvider>
  );
}
