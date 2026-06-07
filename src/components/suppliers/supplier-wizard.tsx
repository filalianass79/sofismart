"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Stepper } from "@/components/ui/stepper";
import { WizardActions } from "@/components/ui/wizard-actions";
import { LoadingOverlay } from "@/components/ui/loading";
import { supplierWizardSchema, type SupplierWizardValues } from "@/lib/validations/supplier";
import { supplierTypeLabels } from "@/lib/supplier-labels";
import type { SupplierType } from "@/generated/prisma/enums";

const steps = [
  { id: "type", label: "Type", hint: "Catégorie du fournisseur" },
  { id: "info", label: "Informations", hint: "Coordonnées et identité" },
  { id: "finance", label: "Finances", hint: "Banque et délais" },
  { id: "summary", label: "Récapitulatif", hint: "Confirmer la fiche" },
];

export function SupplierWizard({ supplierId, initial }: { supplierId?: string; initial?: Partial<SupplierWizardValues> }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const form = useForm<SupplierWizardValues>({
    resolver: zodResolver(supplierWizardSchema) as never,
    defaultValues: { type: "DEALERSHIP", country: "Maroc", ...initial },
  });

  const { register, watch, handleSubmit } = form;
  const type = watch("type") as SupplierType;
  const isIndividual = type === "INDIVIDUAL";
  const values = watch();

  const summaries = useMemo(
    () => [
      [supplierTypeLabels[type]],
      isIndividual
        ? [`${values.firstName ?? ""} ${values.lastName ?? ""}`.trim(), values.phone, values.city].filter(
            Boolean
          ) as string[]
        : [values.companyName, values.ice, values.city].filter(Boolean) as string[],
      [values.bankName, values.iban].filter(Boolean) as string[],
      [
        isIndividual
          ? `${values.firstName ?? ""} ${values.lastName ?? ""}`.trim()
          : values.companyName || "—",
      ],
    ],
    [type, isIndividual, values]
  );

  async function onSubmit(data: SupplierWizardValues) {
    setLoading(true);
    setError("");
    const url = supplierId ? `/api/suppliers/${supplierId}` : "/api/suppliers";
    const method = supplierId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError((j as { error?: string }).error ?? "Erreur");
      return;
    }
    const s = await res.json();
    router.push(`/dashboard/suppliers/${s.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="relative space-y-6">
      {loading && <LoadingOverlay label="Enregistrement du fournisseur…" />}
      <Stepper steps={steps} current={step} summaries={summaries} onStepClick={(i) => setStep(i)} />
      {error && <p className="text-sm text-morocco-600">{error}</p>}

      {step === 0 && (
        <section className="rounded-xl border border-navy-950/10 bg-white p-6">
          <label className="block text-sm">
            <span className="text-navy-700">Type fournisseur</span>
            <select {...register("type")} className="input-sofi mt-1 w-full">
              {(Object.keys(supplierTypeLabels) as SupplierType[]).map((k) => (
                <option key={k} value={k}>
                  {supplierTypeLabels[k]}
                </option>
              ))}
            </select>
          </label>
        </section>
      )}

      {step === 1 && (
        <section className="rounded-xl border border-navy-950/10 bg-white p-6 grid gap-3 sm:grid-cols-2">
          {isIndividual ? (
            <>
              <label className="text-sm">
                Prénom
                <input {...register("firstName")} className="input-sofi mt-1 w-full" />
              </label>
              <label className="text-sm">
                Nom
                <input {...register("lastName")} className="input-sofi mt-1 w-full" />
              </label>
              <label className="text-sm">
                CIN
                <input {...register("cin")} className="input-sofi mt-1 w-full" />
              </label>
            </>
          ) : (
            <>
              <label className="text-sm sm:col-span-2">
                Raison sociale
                <input {...register("companyName")} className="input-sofi mt-1 w-full" />
              </label>
              <label className="text-sm">
                ICE
                <input {...register("ice")} className="input-sofi mt-1 w-full" />
              </label>
              <label className="text-sm">
                RC
                <input {...register("rc")} className="input-sofi mt-1 w-full" />
              </label>
              <label className="text-sm">
                Contact
                <input {...register("contactName")} className="input-sofi mt-1 w-full" />
              </label>
              <label className="text-sm">
                Tél. contact
                <input {...register("contactPhone")} className="input-sofi mt-1 w-full" />
              </label>
            </>
          )}
          <label className="text-sm">
            Téléphone
            <input {...register("phone")} className="input-sofi mt-1 w-full" />
          </label>
          <label className="text-sm">
            Email
            <input type="email" {...register("email")} className="input-sofi mt-1 w-full" />
          </label>
          <label className="text-sm">
            Ville
            <input {...register("city")} className="input-sofi mt-1 w-full" />
          </label>
          <label className="text-sm sm:col-span-2">
            Adresse
            <textarea {...register("address")} rows={2} className="input-sofi mt-1 w-full" />
          </label>
        </section>
      )}

      {step === 2 && (
        <section className="rounded-xl border border-navy-950/10 bg-white p-6 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Banque
            <input {...register("bankName")} className="input-sofi mt-1 w-full" />
          </label>
          <label className="text-sm">
            IBAN / RIB
            <input {...register("iban")} className="input-sofi mt-1 w-full" />
          </label>
          <label className="text-sm">
            Délai paiement (jours)
            <input type="number" {...register("paymentDelay", { valueAsNumber: true })} className="input-sofi mt-1 w-full" />
          </label>
          <label className="text-sm sm:col-span-2">
            Notes
            <textarea {...register("notes")} rows={2} className="input-sofi mt-1 w-full" />
          </label>
        </section>
      )}

      {step === 3 && (
        <section className="rounded-xl border border-gold-500/30 bg-gold-500/5 p-6 text-sm space-y-2">
          <p>
            <strong>Type :</strong> {supplierTypeLabels[type]}
          </p>
          <p>
            <strong>Nom :</strong>{" "}
            {isIndividual
              ? `${values.firstName ?? ""} ${values.lastName ?? ""}`.trim()
              : values.companyName || "—"}
          </p>
          <p>
            <strong>Ville :</strong> {values.city || "—"}
          </p>
        </section>
      )}

      <WizardActions
        step={step}
        totalSteps={steps.length}
        onPrev={() => setStep((s) => s - 1)}
        onNext={() => setStep((s) => s + 1)}
        onCancel={() => router.back()}
        loading={loading}
        showDraft={false}
        submitLabel="Créer le fournisseur"
      />
    </form>
  );
}
