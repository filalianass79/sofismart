"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Stepper } from "@/components/ui/stepper";
import { WizardActions } from "@/components/ui/wizard-actions";
import { LoadingOverlay } from "@/components/ui/loading";
import { paymentWizardSchema, type PaymentWizardValues } from "@/lib/validations/payment";
import { paymentCategoryLabels } from "@/lib/payment-labels";
import { formatMoney } from "@/lib/utils";
import type { PaymentCategory } from "@/generated/prisma/enums";

const steps = [
  { id: "type", label: "Type", hint: "Client, fournisseur, vente…" },
  { id: "party", label: "Tiers", hint: "Lien avec l'opération" },
  { id: "info", label: "Paiement", hint: "Montant et mode" },
  { id: "summary", label: "Récapitulatif", hint: "Confirmer l'encaissement" },
];

type Option = { id: string; label: string };

export function PaymentWizard({
  clients,
  suppliers,
  sales,
  purchases,
}: {
  clients: Option[];
  suppliers: Option[];
  sales: Option[];
  purchases: Option[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const form = useForm<PaymentWizardValues>({
    resolver: zodResolver(paymentWizardSchema) as never,
    defaultValues: {
      category: "SALE",
      currency: "MAD",
      paidAt: new Date().toISOString().slice(0, 10),
      method: "TRANSFER",
      direction: "FROM_CLIENT",
      validationStatus: "VALIDATED",
      amount: 0,
    },
  });

  const { register, watch, handleSubmit } = form;
  const category = watch("category") as PaymentCategory;
  const values = watch();

  const clientLabel = clients.find((c) => c.id === values.clientId)?.label;
  const supplierLabel = suppliers.find((s) => s.id === values.supplierId)?.label;

  const summaries = useMemo(
    () => [
      [paymentCategoryLabels[category]],
      [
        clientLabel ?? supplierLabel ?? "—",
        values.saleId ? sales.find((s) => s.id === values.saleId)?.label : null,
        values.purchaseId ? purchases.find((p) => p.id === values.purchaseId)?.label : null,
      ].filter(Boolean) as string[],
      [formatMoney(Number(values.amount)), values.method, values.paidAt].filter(Boolean) as string[],
      [paymentCategoryLabels[category], formatMoney(Number(values.amount))],
    ],
    [category, clientLabel, supplierLabel, values, sales, purchases]
  );

  async function onSubmit(data: PaymentWizardValues) {
    setLoading(true);
    setError("");
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError((j as { error?: string }).error ?? "Erreur");
      return;
    }
    router.push("/dashboard/payments");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="relative space-y-6">
      {loading && <LoadingOverlay label="Enregistrement du paiement…" />}
      <Stepper steps={steps} current={step} summaries={summaries} onStepClick={(i) => setStep(i)} />
      {error && <p className="text-sm text-morocco-600">{error}</p>}

      {step === 0 && (
        <section className="rounded-xl border border-navy-950/10 bg-white p-6">
          <label className="block text-sm">
            Type de paiement
            <select {...register("category")} className="input-sofi mt-1 w-full">
              {(Object.keys(paymentCategoryLabels) as PaymentCategory[]).map((k) => (
                <option key={k} value={k}>
                  {paymentCategoryLabels[k]}
                </option>
              ))}
            </select>
          </label>
        </section>
      )}

      {step === 1 && (
        <section className="rounded-xl border border-navy-950/10 bg-white p-6 grid gap-3">
          {(category === "CLIENT" || category === "SALE") && (
            <>
              <label className="text-sm">
                Client
                <select {...register("clientId")} className="input-sofi mt-1 w-full">
                  <option value="">—</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              {category === "SALE" && (
                <label className="text-sm">
                  Vente liée
                  <select {...register("saleId")} className="input-sofi mt-1 w-full">
                    <option value="">—</option>
                    {sales.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </>
          )}
          {(category === "SUPPLIER" || category === "PURCHASE") && (
            <>
              <label className="text-sm">
                Fournisseur
                <select {...register("supplierId")} className="input-sofi mt-1 w-full">
                  <option value="">—</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              {category === "PURCHASE" && (
                <label className="text-sm">
                  Achat lié
                  <select {...register("purchaseId")} className="input-sofi mt-1 w-full">
                    <option value="">—</option>
                    {purchases.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </>
          )}
        </section>
      )}

      {step === 2 && (
        <section className="rounded-xl border border-navy-950/10 bg-white p-6 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Date
            <input type="date" {...register("paidAt")} className="input-sofi mt-1 w-full" />
          </label>
          <label className="text-sm">
            Montant *
            <input type="number" step="0.01" {...register("amount", { valueAsNumber: true })} className="input-sofi mt-1 w-full" />
          </label>
          <label className="text-sm">
            Mode
            <select {...register("method")} className="input-sofi mt-1 w-full">
              <option value="CASH">Espèces</option>
              <option value="TRANSFER">Virement</option>
              <option value="CHECK">Chèque</option>
              <option value="CREDIT">Crédit</option>
              <option value="BILL_OF_EXCHANGE">Effet</option>
            </select>
          </label>
          <label className="text-sm">
            Banque
            <input {...register("bank")} className="input-sofi mt-1 w-full" />
          </label>
          <label className="text-sm">
            Réf. virement
            <input {...register("transferReference")} className="input-sofi mt-1 w-full" />
          </label>
          <label className="text-sm">
            Échéance
            <input type="date" {...register("dueDate")} className="input-sofi mt-1 w-full" />
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
            <strong>Type :</strong> {paymentCategoryLabels[category]}
          </p>
          <p>
            <strong>Montant :</strong> {formatMoney(Number(values.amount))}
          </p>
          <p>
            <strong>Mode :</strong> {values.method}
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
        submitLabel="Enregistrer le paiement"
      />
    </form>
  );
}
