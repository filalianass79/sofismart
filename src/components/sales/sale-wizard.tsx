"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { userCanValidateSales } from "@/lib/rbac/can-validate-sale";
import { useForm, FormProvider, useFieldArray, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, FileCheck } from "lucide-react";
import { Stepper, truncateStepperText, type StepItem } from "@/components/ui/stepper";
import { WizardActions } from "@/components/ui/wizard-actions";
import { LoadingOverlay } from "@/components/ui/loading";
import { SaleClientStep } from "./wizard/sale-client-step";
import { SaleVehicleStep } from "./wizard/sale-vehicle-step";
import { saleTypeLabels } from "@/lib/sale-labels";
import { saleWizardSchema, type SaleWizardValues } from "@/lib/validations/sale";
import { computeSaleAmounts } from "@/lib/finance";
import { formatMoney } from "@/lib/utils";

const STEPS: StepItem[] = [
  { id: "client", label: "Client", hint: "Sélection" },
  { id: "vehicle", label: "Véhicule", hint: "Choix stock" },
  { id: "conditions", label: "Conditions", hint: "Prix, commercial" },
  { id: "payments", label: "Paiements", hint: "Encaissements" },
  { id: "summary", label: "Récap", hint: "Validation" },
];

type Commercial = { id: string; name: string | null };

function firstFormError(errors: FieldErrors): string | null {
  for (const value of Object.values(errors)) {
    if (!value || typeof value !== "object") continue;
    if ("message" in value && typeof value.message === "string") return value.message;
    const nested = firstFormError(value as FieldErrors);
    if (nested) return nested;
  }
  return null;
}

function parseApiError(body: unknown): string {
  if (!body || typeof body !== "object") return "Erreur lors de la validation";
  const err = (body as { error?: unknown }).error;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "fieldErrors" in err) {
    const fieldErrors = (err as { fieldErrors?: Record<string, string[] | undefined> }).fieldErrors;
    if (fieldErrors) {
      const msg = Object.values(fieldErrors).flat().find(Boolean);
      if (msg) return msg;
    }
    const formErrors = (err as { formErrors?: string[] }).formErrors;
    if (formErrors?.[0]) return formErrors[0];
  }
  return "Erreur lors de la validation";
}

export function SaleWizard({
  commercials,
  defaultCommercialId,
}: {
  commercials: Commercial[];
  defaultCommercialId?: string;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const canValidateSale = userCanValidateSales(
    session?.user?.permissions,
    session?.user?.roleCode ?? session?.user?.role
  );
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submittedSale, setSubmittedSale] = useState<{
    id: string;
    reference: string;
    status: string;
    invoiceNumber?: string | null;
    exitVoucher?: { id: string; reference: string; secureToken: string };
  } | null>(null);

  const form = useForm<SaleWizardValues>({
    resolver: zodResolver(saleWizardSchema) as never,
    defaultValues: {
      clientMode: "EXISTING",
      clientId: "",
      vehicleId: "",
      commercialId: defaultCommercialId ?? commercials[0]?.id ?? "",
      saleDate: new Date().toISOString().slice(0, 10),
      price: 0,
      discount: 0,
      taxRatePercent: 20,
      saleType: "CASH",
      payments: [],
      warranty: false,
      status: "VALIDATED",
      pendingDocuments: [],
    },
  });

  const { register, watch, handleSubmit, control, trigger } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "payments" });

  const clientMode = watch("clientMode");
  const clientId = watch("clientId");
  const newClient = watch("newClient");
  const vehicleId = watch("vehicleId");
  const price = watch("price");
  const discount = watch("discount");
  const taxRatePercent = watch("taxRatePercent");
  const commercialId = watch("commercialId");

  const clientLabel =
    clientMode === "EXISTING"
      ? clientId
        ? "Client sélectionné"
        : "—"
      : newClient?.type === "COMPANY"
        ? newClient.companyName
        : `${newClient?.type === "INDIVIDUAL" ? newClient.firstName : ""} ${newClient?.type === "INDIVIDUAL" ? newClient.lastName : ""}`.trim();

  const amounts = useMemo(() => {
    if (!vehicleId) return null;
    return computeSaleAmounts({
      price: Number(price) || 0,
      discount: Number(discount) || 0,
      taxRatePercent: Number(taxRatePercent) || 20,
      costPrice: 0,
    });
  }, [vehicleId, price, discount, taxRatePercent]);

  const totalPaid = watch("payments")?.reduce((a, p) => a + Number(p.amount || 0), 0) ?? 0;
  const due = amounts?.finalPrice ?? 0;
  const balance = Math.max(0, due - totalPaid);
  const saleType = watch("saleType");

  async function validateCurrentStep(): Promise<boolean> {
    if (step === 0) return trigger(["clientMode", "clientId", "newClient"]);
    if (step === 1) return trigger(["vehicleId"]);
    if (step === 2) return trigger(["commercialId", "price", "discount", "saleDate"]);
    return true;
  }

  function onInvalid(errors: FieldErrors<SaleWizardValues>) {
    const msg = firstFormError(errors);
    setError(
      msg ??
        "Formulaire incomplet. Vérifiez le client, le véhicule, le prix de vente (> 0) et les paiements."
    );
  }

  async function onSubmit(data: SaleWizardValues) {
    setLoading(true);
    setError("");
    const payload = {
      ...data,
      status: canValidateSale ? ("VALIDATED" as const) : ("PENDING_VALIDATION" as const),
      payments: data.payments.filter((p) => Number(p.amount) >= 0.01),
      warrantyDurationMonths: data.warranty ? data.warrantyDurationMonths : undefined,
      clientId: data.clientMode === "EXISTING" ? data.clientId : undefined,
    };
    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(parseApiError(j));
      return;
    }
    const sale = await res.json();
    setSubmittedSale({
      id: sale.id,
      reference: sale.reference,
      status: sale.status,
      invoiceNumber: sale.invoiceNumber,
      exitVoucher: sale.exitVoucher,
    });
  }

  async function saveDraft() {
    setLoading(true);
    const data = form.getValues();
    const res = await fetch("/api/sales/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, status: "DRAFT" }),
    });
    setLoading(false);
    if (res.ok) router.push("/dashboard/sales");
    else setError("Échec enregistrement brouillon");
  }

  const summaries = useMemo(
    () => [
      [truncateStepperText(clientLabel || "—", 28)],
      [vehicleId ? "Véhicule OK" : "—"],
      amounts
        ? [
            truncateStepperText(formatMoney(amounts.finalPrice), 22),
            truncateStepperText(saleTypeLabels[saleType as keyof typeof saleTypeLabels], 18),
          ]
        : [],
      [totalPaid > 0 ? truncateStepperText(`Payé ${formatMoney(totalPaid)}`, 24) : "Sans paiement"],
      submittedSale
        ? [truncateStepperText(submittedSale.reference, 24)]
        : amounts
          ? [truncateStepperText(formatMoney(amounts.finalPrice), 22)]
          : [],
    ],
    [clientLabel, vehicleId, amounts, saleType, totalPaid, submittedSale]
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="relative space-y-6">
        {loading && <LoadingOverlay label="Traitement de la vente…" />}
        <Stepper
          steps={STEPS}
          current={step}
          summaries={summaries}
          onStepClick={(i) => !submittedSale && i < STEPS.length && setStep(i)}
        />
        {error && <p className="text-sm text-morocco-600">{error}</p>}

        {step === 0 && (
          <SaleClientStep
            onClientSelected={async () => {
              const ok = await trigger(["clientMode", "clientId"]);
              if (ok) {
                setError("");
                setStep(1);
              }
            }}
          />
        )}
        {step === 1 && (
          <SaleVehicleStep
            onVehicleSelected={async () => {
              const ok = await trigger(["vehicleId"]);
              if (ok) {
                setError("");
                setStep(2);
              }
            }}
          />
        )}

        {step === 2 && (
          <section className="rounded-xl border border-navy-950/10 bg-white p-6 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="text-navy-700">Date vente</span>
                <input type="date" {...register("saleDate")} className="input-sofi mt-1 w-full" />
              </label>
              <label className="text-sm">
                <span className="text-navy-700">Commercial *</span>
                <select {...register("commercialId")} className="input-sofi mt-1 w-full">
                  {commercials.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="text-navy-700">Prix de vente</span>
                <input type="number" step="0.01" {...register("price", { valueAsNumber: true })} className="input-sofi mt-1 w-full" />
              </label>
              <label className="text-sm">
                <span className="text-navy-700">Remise</span>
                <input type="number" step="0.01" {...register("discount", { valueAsNumber: true })} className="input-sofi mt-1 w-full" />
              </label>
              <label className="text-sm">
                <span className="text-navy-700">TVA %</span>
                <input type="number" {...register("taxRatePercent", { valueAsNumber: true })} className="input-sofi mt-1 w-full" />
              </label>
              <label className="text-sm">
                <span className="text-navy-700">Mode vente</span>
                <select {...register("saleType")} className="input-sofi mt-1 w-full">
                  {Object.entries(saleTypeLabels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input type="checkbox" {...register("warranty")} />
                Garantie
              </label>
              {watch("warranty") && (
                <label className="text-sm">
                  <span className="text-navy-700">Durée (mois)</span>
                  <input
                    type="number"
                    {...register("warrantyDurationMonths", {
                      setValueAs: (v) => (v === "" || Number.isNaN(Number(v)) ? undefined : Number(v)),
                    })}
                    className="input-sofi mt-1 w-full"
                  />
                </label>
              )}
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-3 rounded-xl border border-navy-950/10 bg-white p-6 shadow-sm">
            <div className="flex justify-between text-sm">
              <span>Total dû : {formatMoney(due)}</span>
              <span>Reste : {formatMoney(balance)}</span>
            </div>
            <button
              type="button"
              onClick={() =>
                append({ amount: balance, method: "TRANSFER", paidAt: new Date().toISOString().slice(0, 10), validationStatus: "VALIDATED" })
              }
              className="text-sm text-gold-700"
            >
              <Plus className="inline h-4 w-4" /> Ajouter paiement
            </button>
            {fields.map((f, i) => (
              <div key={f.id} className="grid gap-2 rounded border border-navy-950/10 p-3 sm:grid-cols-5">
                <input type="number" step="0.01" {...register(`payments.${i}.amount`, { valueAsNumber: true })} className="input-sofi" placeholder="Montant" />
                <select {...register(`payments.${i}.method`)} className="input-sofi">
                  <option value="CASH">Espèces</option>
                  <option value="TRANSFER">Virement</option>
                  <option value="CHECK">Chèque</option>
                  <option value="CREDIT">Crédit</option>
                  <option value="BILL_OF_EXCHANGE">Effet</option>
                </select>
                <input type="date" {...register(`payments.${i}.paidAt`)} className="input-sofi" />
                <select {...register(`payments.${i}.validationStatus`)} className="input-sofi">
                  <option value="PENDING">En attente</option>
                  <option value="VALIDATED">Validé</option>
                </select>
                <button type="button" onClick={() => remove(i)}>
                  <Trash2 className="h-4 w-4 text-morocco-600" />
                </button>
              </div>
            ))}
          </section>
        )}

        {step === 4 && !submittedSale && (
          <section className="rounded-xl border border-gold-500/30 bg-gold-500/5 p-6 text-sm space-y-2">
            <p>
              <strong>Client :</strong> {clientLabel}
            </p>
            <p>
              <strong>Commercial :</strong> {commercials.find((c) => c.id === commercialId)?.name ?? "—"}
            </p>
            {amounts && (
              <>
                <p>
                  <strong>Prix final :</strong> {formatMoney(amounts.finalPrice)}
                </p>
                <p>
                  <strong>Payé / Reste :</strong> {formatMoney(totalPaid)} / {formatMoney(balance)}
                </p>
              </>
            )}
            <p className="text-navy-600 pt-2">
              {canValidateSale
                ? "À la validation, un bon de sortie et une facture de vente seront générés automatiquement."
                : "Votre demande sera envoyée aux gérants et administrateurs. Après validation, vous pourrez télécharger la facture et le bon de sortie."}
            </p>
          </section>
        )}

        {step === 4 && submittedSale?.status === "PENDING_VALIDATION" && (
          <section className="rounded-xl border border-amber-400/40 bg-amber-50/80 p-6 text-sm space-y-4">
            <p className="flex items-center gap-2 font-semibold text-amber-950">
              <FileCheck className="h-5 w-5" /> Demande envoyée — {submittedSale.reference}
            </p>
            <p className="text-amber-900/90">
              Les gérants et administrateurs ont été notifiés. Vous recevrez une notification dès validation pour
              générer et télécharger la facture et le bon de sortie.
            </p>
            <button
              type="button"
              onClick={() => router.push(`/dashboard/sales/${submittedSale.id}`)}
              className="btn-sofi-ghost"
            >
              Voir la fiche vente
            </button>
          </section>
        )}

        {step === 4 && submittedSale?.status === "VALIDATED" && (
          <section className="rounded-xl border border-emerald-600/30 bg-emerald-50/50 p-6 text-sm space-y-4">
            <p className="flex items-center gap-2 font-semibold text-emerald-900">
              <FileCheck className="h-5 w-5" /> Vente {submittedSale.reference} validée
            </p>
            {submittedSale.invoiceNumber && <p>Facture : {submittedSale.invoiceNumber}</p>}
            {submittedSale.exitVoucher && <p>Bon de sortie : {submittedSale.exitVoucher.reference}</p>}
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/dashboard/documents/preview/sales-invoice/${submittedSale.id}`}
                className="btn-sofi-primary"
              >
                Prévisualiser facture
              </Link>
              <a
                href={`/api/sales/${submittedSale.id}/invoice/pdf`}
                target="_blank"
                rel="noreferrer"
                className="btn-sofi-ghost"
              >
                Télécharger facture PDF
              </a>
              {submittedSale.exitVoucher && (
                <>
                  <Link
                    href={`/dashboard/documents/preview/exit-voucher/${submittedSale.exitVoucher.id}`}
                    className="btn-sofi-ghost"
                  >
                    Prévisualiser bon de sortie
                  </Link>
                  <a
                    href={`/api/exit-vouchers/${submittedSale.exitVoucher.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-sofi-ghost"
                  >
                    PDF bon de sortie
                  </a>
                  <a
                    href={`/dashboard/warehouse/exit-vouchers/scan/${submittedSale.exitVoucher.secureToken}`}
                    className="btn-sofi-ghost"
                  >
                    Voir bon / QR
                  </a>
                </>
              )}
              <button type="button" onClick={() => router.push(`/dashboard/sales/${submittedSale.id}`)} className="btn-sofi-ghost">
                Fiche vente
              </button>
            </div>
            {submittedSale.exitVoucher && (
              <p className="text-navy-600">Le magasinier du dépôt a été notifié.</p>
            )}
          </section>
        )}

        {!submittedSale && (
          <WizardActions
            step={step}
            totalSteps={STEPS.length}
            onPrev={() => setStep((s) => s - 1)}
            showNext={(step >= 2 && step <= 3) || (step === 0 && clientMode === "NEW")}
            onValidate={() => void handleSubmit(onSubmit, onInvalid)()}
            onNext={async () => {
              const ok = await validateCurrentStep();
              if (ok) {
                setError("");
                setStep((s) => s + 1);
              } else if (step === 0) {
                setError("Complétez les informations du nouveau client.");
              } else if (step === 1) {
                setError("Sélectionnez un véhicule.");
              }
            }}
            onDraft={saveDraft}
            onCancel={() => router.back()}
            loading={loading}
            isLastStep={step === 4}
            submitLabel={canValidateSale ? "Valider la vente" : "Demander la validation"}
          />
        )}
      </form>
    </FormProvider>
  );
}
