"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Stepper } from "@/components/ui/stepper";
import { WizardActions } from "@/components/ui/wizard-actions";
import { LoadingOverlay } from "@/components/ui/loading";
import { clientWizardSchema, type ClientWizardValues } from "@/lib/validations/client";
import {
  acquisitionSourceLabels,
  civilityLabels,
  clientTypeLabels,
  financialStatusLabels,
  relationshipStatusLabels,
} from "@/lib/client-labels";
import { formatMoney } from "@/lib/utils";
import type { ClientType } from "@/generated/prisma/enums";

const steps = [
  { id: "type", label: "Type client", hint: "Particulier ou professionnel" },
  { id: "info", label: "Informations", hint: "Coordonnées et identité" },
  { id: "finance", label: "Finances", hint: "Crédit et mode de paiement" },
  { id: "docs", label: "Documents", hint: "Pièces jointes (optionnel)" },
  { id: "summary", label: "Récapitulatif", hint: "Vérification avant validation" },
];

type Commercial = { id: string; name: string | null; email: string };

export function ClientWizard({
  commercials,
  clientId,
  initial,
}: {
  commercials: Commercial[];
  clientId?: string;
  initial?: Partial<ClientWizardValues>;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const form = useForm<ClientWizardValues>({
    resolver: zodResolver(clientWizardSchema) as never,
    defaultValues: {
      type: "INDIVIDUAL",
      country: "Maroc",
      financialStatus: "GOOD_PAYER",
      relationshipStatus: "PROSPECT",
      vatExempt: false,
      phone: "",
      ...initial,
    },
  });

  const { register, watch, handleSubmit } = form;
  const type = watch("type") as ClientType;
  const isPro = type === "COMPANY" || type === "RESELLER";

  async function onSubmit(data: ClientWizardValues) {
    setLoading(true);
    setError("");
    const url = clientId ? `/api/clients/${clientId}` : "/api/clients";
    const method = clientId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(JSON.stringify(j.error) || "Erreur");
      return;
    }
    const client = await res.json();
    router.push(`/dashboard/clients/${client.id}`);
    router.refresh();
  }

  function next() {
    if (step < steps.length - 1) setStep((s) => s + 1);
  }
  function prev() {
    if (step > 0) setStep((s) => s - 1);
  }

  const v = watch();
  const displayName = isPro
    ? (v.companyName as string) || "—"
    : `${v.firstName ?? ""} ${v.lastName ?? ""}`.trim() || "—";

  const summaries = useMemo(
    () => [
      [clientTypeLabels[type]],
      [displayName, v.phone ? `Tél. ${v.phone}` : null, v.city ?? null].filter(Boolean) as string[],
      [
        financialStatusLabels[v.financialStatus as keyof typeof financialStatusLabels],
        v.creditLimit ? `Plafond ${formatMoney(Number(v.creditLimit))}` : null,
      ].filter(Boolean) as string[],
      ["Documents : optionnel"],
      [displayName, v.phone ?? ""].filter(Boolean) as string[],
    ],
    [type, displayName, v.phone, v.city, v.financialStatus, v.creditLimit]
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="relative space-y-6">
      {loading && <LoadingOverlay label="Enregistrement du client…" />}
      <Stepper
        steps={steps}
        current={step}
        summaries={summaries}
        onStepClick={(i) => setStep(i)}
      />
      {error && <p className="text-sm text-morocco-600">{error}</p>}

      {step === 0 && (
        <section className="rounded-xl border border-navy-950/10 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-navy-900">Type de client</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["INDIVIDUAL", "COMPANY"] as const).map((t) => (
              <label
                key={t}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-colors ${
                  type === t ? "border-gold-500 bg-gold-500/10" : "border-navy-950/10 hover:border-gold-400/40"
                }`}
              >
                <input type="radio" value={t} {...register("type")} className="sr-only" />
                <p className="font-semibold text-navy-950">{clientTypeLabels[t]}</p>
                <p className="mt-1 text-xs text-navy-600">
                  {t === "INDIVIDUAL" ? "Personne physique" : "Société, entreprise, revendeur"}
                </p>
              </label>
            ))}
          </div>
          {type === "COMPANY" && (
            <label className="mt-4 block text-sm">
              <span className="text-navy-700">Sous-type</span>
              <select {...register("type")} className="input-sofi mt-1 w-full max-w-xs">
                <option value="COMPANY">Entreprise</option>
                <option value="RESELLER">Revendeur</option>
              </select>
            </label>
          )}
        </section>
      )}

      {step === 1 && (
        <section className="rounded-xl border border-navy-950/10 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-navy-900">Informations principales</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {!isPro && (
              <>
                <label className="text-sm">
                  <span className="text-navy-700">Civilité</span>
                  <select {...register("civility")} className="input-sofi mt-1 w-full">
                    <option value="">—</option>
                    {Object.entries(civilityLabels).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="text-navy-700">Prénom *</span>
                  <input {...register("firstName")} className="input-sofi mt-1 w-full" />
                </label>
                <label className="text-sm">
                  <span className="text-navy-700">Nom *</span>
                  <input {...register("lastName")} className="input-sofi mt-1 w-full" />
                </label>
                <label className="text-sm">
                  <span className="text-navy-700">CIN</span>
                  <input {...register("cin")} className="input-sofi mt-1 w-full" />
                </label>
                <label className="text-sm">
                  <span className="text-navy-700">Date naissance</span>
                  <input type="date" {...register("birthDate")} className="input-sofi mt-1 w-full" />
                </label>
                <label className="text-sm">
                  <span className="text-navy-700">Profession</span>
                  <input {...register("profession")} className="input-sofi mt-1 w-full" />
                </label>
              </>
            )}
            {isPro && (
              <>
                <label className="text-sm sm:col-span-2">
                  <span className="text-navy-700">Raison sociale *</span>
                  <input {...register("companyName")} className="input-sofi mt-1 w-full" />
                </label>
                <label className="text-sm">
                  <span className="text-navy-700">Nom commercial</span>
                  <input {...register("tradeName")} className="input-sofi mt-1 w-full" />
                </label>
                <label className="text-sm">
                  <span className="text-navy-700">ICE</span>
                  <input {...register("ice")} className="input-sofi mt-1 w-full" />
                </label>
                <label className="text-sm">
                  <span className="text-navy-700">RC</span>
                  <input {...register("rc")} className="input-sofi mt-1 w-full" />
                </label>
                <label className="text-sm">
                  <span className="text-navy-700">IF</span>
                  <input {...register("taxId")} className="input-sofi mt-1 w-full" />
                </label>
                <label className="text-sm">
                  <span className="text-navy-700">Patente</span>
                  <input {...register("patent")} className="input-sofi mt-1 w-full" />
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className="text-navy-700">Activité</span>
                  <input {...register("activity")} className="input-sofi mt-1 w-full" />
                </label>
                <label className="text-sm">
                  <span className="text-navy-700">Responsable</span>
                  <input {...register("mainContactName")} className="input-sofi mt-1 w-full" />
                </label>
                <label className="text-sm">
                  <span className="text-navy-700">Fonction responsable</span>
                  <input {...register("mainContactRole")} className="input-sofi mt-1 w-full" />
                </label>
              </>
            )}
            <label className="text-sm">
              <span className="text-navy-700">Téléphone *</span>
              <input {...register("phone")} className="input-sofi mt-1 w-full" placeholder="+2126..." />
            </label>
            <label className="text-sm">
              <span className="text-navy-700">Tél. secondaire</span>
              <input {...register("secondaryPhone")} className="input-sofi mt-1 w-full" />
            </label>
            <label className="text-sm">
              <span className="text-navy-700">Email</span>
              <input type="email" {...register("email")} className="input-sofi mt-1 w-full" />
            </label>
            {isPro && (
              <label className="text-sm">
                <span className="text-navy-700">Site web</span>
                <input {...register("website")} className="input-sofi mt-1 w-full" />
              </label>
            )}
            <label className="text-sm sm:col-span-2">
              <span className="text-navy-700">Adresse</span>
              <input {...register("address")} className="input-sofi mt-1 w-full" />
            </label>
            <label className="text-sm">
              <span className="text-navy-700">Ville</span>
              <input {...register("city")} className="input-sofi mt-1 w-full" />
            </label>
            <label className="text-sm">
              <span className="text-navy-700">Pays</span>
              <input {...register("country")} className="input-sofi mt-1 w-full" />
            </label>
            <label className="text-sm">
              <span className="text-navy-700">Source acquisition</span>
              <select {...register("acquisitionSource")} className="input-sofi mt-1 w-full">
                <option value="">—</option>
                {Object.entries(acquisitionSourceLabels).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="text-navy-700">Commercial assigné</span>
              <select {...register("assignedCommercialId")} className="input-sofi mt-1 w-full">
                <option value="">—</option>
                {commercials.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name ?? c.email}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="text-navy-700">Notes</span>
              <textarea {...register("notes")} rows={2} className="input-sofi mt-1 w-full" />
            </label>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="rounded-xl border border-navy-950/10 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-navy-900">Informations financières</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="text-navy-700">Plafond crédit (MAD)</span>
              <input type="number" step="0.01" {...register("creditLimit")} className="input-sofi mt-1 w-full" />
            </label>
            <label className="text-sm">
              <span className="text-navy-700">Délai paiement (jours)</span>
              <input type="number" {...register("paymentDelay")} className="input-sofi mt-1 w-full" />
            </label>
            <label className="text-sm">
              <span className="text-navy-700">Mode paiement préféré</span>
              <select {...register("preferredPaymentMethod")} className="input-sofi mt-1 w-full">
                <option value="">—</option>
                <option value="CASH">Espèces</option>
                <option value="TRANSFER">Virement</option>
                <option value="CHECK">Chèque</option>
                <option value="CREDIT">Crédit</option>
                <option value="OTHER">Autre</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="text-navy-700">Statut financier</span>
              <select {...register("financialStatus")} className="input-sofi mt-1 w-full">
                {Object.entries(financialStatusLabels).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="text-navy-700">Relation client</span>
              <select {...register("relationshipStatus")} className="input-sofi mt-1 w-full">
                {Object.entries(relationshipStatusLabels).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="text-navy-700">Banque</span>
              <input {...register("bankName")} className="input-sofi mt-1 w-full" />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="text-navy-700">RIB / IBAN</span>
              <input {...register("iban")} className="input-sofi mt-1 w-full" />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="text-navy-700">Conditions paiement</span>
              <input {...register("paymentTerms")} className="input-sofi mt-1 w-full" />
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" {...register("vatExempt")} className="h-4 w-4" />
              Exonération TVA
            </label>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="rounded-xl border border-navy-950/10 bg-white p-6 shadow-sm">
          <p className="text-sm text-navy-600">
            Les documents pourront être ajoutés après la création du client, depuis la fiche détail (onglet Documents).
          </p>
        </section>
      )}

      {step === 4 && (
        <section className="rounded-xl border border-gold-500/30 bg-gold-500/5 p-6">
          <h3 className="mb-3 font-semibold text-navy-950">Récapitulatif</h3>
          <ul className="space-y-1 text-sm text-navy-800">
            <li>
              <strong>Type :</strong> {clientTypeLabels[type]}
            </li>
            <li>
              <strong>Nom :</strong>{" "}
              {isPro
                ? watch("companyName")
                : `${watch("firstName")} ${watch("lastName")}`}
            </li>
            <li>
              <strong>Téléphone :</strong> {watch("phone")}
            </li>
            <li>
              <strong>Crédit :</strong> {watch("creditLimit") ? formatMoney(Number(watch("creditLimit"))) : "—"}
            </li>
          </ul>
        </section>
      )}

      <WizardActions
        step={step}
        totalSteps={steps.length}
        onPrev={prev}
        onNext={next}
        onCancel={() => router.back()}
        loading={loading}
        showDraft={false}
        submitLabel={clientId ? "Mettre à jour" : "Créer le client"}
      />
    </form>
  );
}
