"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FormProvider,
  useForm,
  type UseFormRegister,
  type UseFormSetValue,
  type UseFormWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Stepper, truncateStepperText, type StepItem } from "@/components/ui/stepper";
import { WizardActions } from "@/components/ui/wizard-actions";
import { LoadingOverlay } from "@/components/ui/loading";
import {
  VehicleIdentificationFields,
  type VehicleFormValues,
} from "@/components/vehicles/vehicle-identification-fields";
import { VehiclePricingStep } from "@/components/vehicles/vehicle-pricing-step";
import { VehicleDocumentsStep } from "@/components/vehicles/vehicle-documents-step";
import {
  vehicleConditionLabels,
  vehicleOriginLabels,
  vehicleStatusLabels,
  documentCategoryLabels,
} from "@/lib/purchase-labels";
import { formatMoney } from "@/lib/utils";
import {
  vehicleEditStepSchema,
  vehiclePricingStepSchema,
  vehicleWizardSchema,
  type VehicleWizardValues,
} from "@/lib/validations/vehicle";
import { defaultVehicleWizardValues } from "@/lib/vehicle-wizard-data";
import type { DocumentCategory } from "@/generated/prisma/enums";
import type { InitialVehicleCatalog } from "@/lib/vehicle-catalog";

const STEPS: StepItem[] = [
  { id: "identification", label: "Identification", hint: "Marque, modèle, dépôt" },
  { id: "pricing", label: "Tarification", hint: "Prix d'achat et revient" },
  { id: "documents", label: "Documents", hint: "Cartes grises, photos…" },
  { id: "summary", label: "Récapitulatif", hint: "Confirmer" },
];

type Depot = { id: string; name: string };

export function VehicleWizard({
  depots,
  vehicleId: initialVehicleId,
  initialValues,
  initialCatalog,
  mode = "create",
  canViewFinancials = true,
}: {
  depots: Depot[];
  vehicleId?: string;
  initialValues?: VehicleWizardValues;
  initialCatalog?: InitialVehicleCatalog;
  mode?: "create" | "edit";
  canViewFinancials?: boolean;
}) {
  const router = useRouter();
  const steps = useMemo(
    () => (canViewFinancials ? STEPS : STEPS.filter((s) => s.id !== "pricing")),
    [canViewFinancials],
  );
  const [step, setStep] = useState(0);
  const [vehicleId, setVehicleId] = useState(initialVehicleId);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const methods = useForm<VehicleWizardValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(vehicleWizardSchema) as any,
    defaultValues: initialValues ?? defaultVehicleWizardValues,
    values: initialValues,
    mode: "onBlur",
  });

  const { register, watch, setValue, getValues, trigger, reset } = methods;

  useEffect(() => {
    if (initialValues) reset(initialValues);
  }, [initialValues, reset]);
  const vehicle = watch("vehicle");
  const pricing = watch("pricing");
  const documents = watch("documents");
  const costPrice = Number(pricing.purchasePrice || 0) + Number(pricing.extraFeesTotal || 0);
  const depot = depots.find((d) => d.id === vehicle.depotId);

  const summaries = useMemo(() => {
    const pricingSummary =
      canViewFinancials && costPrice > 0
        ? [truncateStepperText(`Revient ${formatMoney(costPrice)}`, 28)]
        : canViewFinancials
          ? ["Sans montant"]
          : ["Tarification masquée"];
    const recapSummary = vehicle.internalRef
      ? [
          truncateStepperText(vehicle.internalRef, 24),
          canViewFinancials ? truncateStepperText(formatMoney(costPrice), 22) : "—",
        ]
      : [];
    const base = [
      vehicle.brandId
        ? [
            truncateStepperText(vehicle.internalRef || "—", 20),
            truncateStepperText(depot?.name ?? "Dépôt", 22),
          ]
        : [],
      ...(canViewFinancials ? [pricingSummary] : []),
      [`${documents.length} document(s)`],
      recapSummary,
    ];
    return canViewFinancials ? base : base.filter((_, i) => i !== 1);
  }, [vehicle, depot, costPrice, documents.length, canViewFinancials]);

  const validateStep = useCallback(async () => {
    const v = getValues();
    const stepId = steps[step]?.id;
    if (stepId === "identification") return vehicleEditStepSchema.safeParse(v.vehicle).success;
    if (stepId === "pricing") return vehiclePricingStepSchema.safeParse(v.pricing).success;
    return true;
  }, [step, getValues, steps]);

  async function persistDraft(): Promise<string | null> {
    const payload = getValues();
    const parsed = vehicleWizardSchema.safeParse(payload);
    if (!parsed.success) {
      setError("Données invalides pour l'enregistrement.");
      return null;
    }
    const url = vehicleId ? `/api/vehicles/${vehicleId}` : "/api/vehicles";
    const res = await fetch(url, {
      method: vehicleId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError((j as { error?: string }).error ?? "Erreur lors de l'enregistrement");
      return null;
    }
    const id = (j as { id: string }).id;
    setVehicleId(id);
    return id;
  }

  async function onUpload(files: FileList | null, category: string) {
    if (!files?.length || !vehicleId) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("category", category);
      fd.append("vehicleId", vehicleId);
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      if (res.ok) {
        const doc = await res.json();
        const current = getValues("documents");
        setValue("documents", [
          ...current,
          { id: doc.id, category: doc.category, originalName: doc.originalName, path: doc.path },
        ]);
      }
    }
    setUploading(false);
  }

  async function onRemoveDocument(id: string) {
    const res = await fetch(`/api/documents/files/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Impossible de supprimer le fichier");
      return;
    }
    setValue(
      "documents",
      getValues("documents").filter((d) => d.id !== id),
    );
  }

  async function finalize() {
    setError(null);
    const ok = await trigger();
    if (!ok) {
      setError("Corrigez les erreurs du formulaire avant validation.");
      return;
    }
    setLoading(true);
    const id = vehicleId ?? (await persistDraft());
    if (!id) {
      setLoading(false);
      return;
    }
    const payload = getValues();
    const res = await fetch(`/api/vehicles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError((j as { error?: string }).error ?? "Erreur");
      return;
    }
    router.push(`/dashboard/vehicles/${id}`);
    router.refresh();
  }

  return (
    <FormProvider {...methods}>
      <div className="space-y-6">
        <Stepper steps={steps} current={step} summaries={summaries} onStepClick={(i) => setStep(i)} />
        {error && (
          <div className="rounded-lg border border-morocco-500/40 bg-morocco-500/10 px-4 py-3 text-sm text-morocco-700">
            {error}
          </div>
        )}

        <div className="relative rounded-xl border border-navy-950/10 bg-white p-6 shadow-sm">
          {loading && (
            <LoadingOverlay label={mode === "edit" ? "Mise à jour…" : "Enregistrement du véhicule…"} />
          )}
          {step === 0 && (
            <div className="space-y-4">
              <header>
                <h3 className="font-display text-xl text-navy-950">Identification</h3>
                <p className="mt-1 text-sm text-navy-500">
                  Référence interne, catalogue et affectation au dépôt.
                </p>
              </header>
              <label className="block text-sm">
                <span className="font-medium text-navy-700">Référence interne *</span>
                <input
                  {...register("vehicle.internalRef")}
                  required
                  className="input-sofi mt-1 w-full font-mono"
                  placeholder="V-2025-001"
                />
              </label>
              <VehicleIdentificationFields
                register={register as unknown as UseFormRegister<VehicleFormValues>}
                watch={watch as unknown as UseFormWatch<VehicleFormValues>}
                setValue={setValue as unknown as UseFormSetValue<VehicleFormValues>}
                depots={depots}
                showAllStatuses={mode === "edit"}
                hideTargetSalePrice
                vehicleOriginLabels={vehicleOriginLabels}
                vehicleConditionLabels={vehicleConditionLabels}
                vehicleStatusLabels={vehicleStatusLabels}
                initialCatalog={initialCatalog}
              />
            </div>
          )}
          {steps[step]?.id === "pricing" && <VehiclePricingStep register={register} watch={watch} />}
          {steps[step]?.id === "documents" && (
            <VehicleDocumentsStep
              documents={documents}
              uploading={uploading}
              onUpload={onUpload}
              onRemove={onRemoveDocument}
              vehicleSaved={Boolean(vehicleId)}
            />
          )}
          {steps[step]?.id === "summary" && (
            <VehicleSummaryStep
              vehicle={vehicle}
              pricing={pricing}
              costPrice={costPrice}
              documents={documents}
              depotName={depot?.name}
              canViewFinancials={canViewFinancials}
            />
          )}
        </div>

        <WizardActions
          step={step}
          totalSteps={steps.length}
          onPrev={() => setStep((s) => s - 1)}
          showNext={step < steps.length - 1}
          onNext={async () => {
            const ok = await validateStep();
            const stepId = steps[step]?.id;
            if (!ok) {
              await trigger(stepId === "identification" ? "vehicle" : "pricing");
              setError("Complétez les champs obligatoires de cette étape.");
              return;
            }
            setError(null);
            if (stepId === "identification" || (stepId === "pricing" && !vehicleId)) {
              setLoading(true);
              await persistDraft();
              setLoading(false);
            }
            setStep((s) => s + 1);
          }}
          onDraft={async () => {
            setLoading(true);
            const id = await persistDraft();
            setLoading(false);
            if (id) router.push(`/dashboard/vehicles/${id}`);
          }}
          draftLabel="Enregistrer et quitter"
          showDraft={step < steps.length - 1}
          onValidate={finalize}
          loading={loading}
          submitLabel={mode === "edit" ? "Enregistrer les modifications" : "Créer le véhicule"}
        />
      </div>
    </FormProvider>
  );
}

function VehicleSummaryStep({
  vehicle,
  pricing,
  costPrice,
  documents,
  depotName,
  canViewFinancials,
}: {
  vehicle: VehicleWizardValues["vehicle"];
  pricing: VehicleWizardValues["pricing"];
  costPrice: number;
  documents: VehicleWizardValues["documents"];
  depotName?: string;
  canViewFinancials: boolean;
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-display text-xl text-navy-950">Récapitulatif</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <SummaryCard title="Identification">
          <p className="font-mono text-sm">{vehicle.internalRef}</p>
          <p className="text-navy-700">Année {vehicle.year} — {vehicleStatusLabels[vehicle.status]}</p>
          <p className="text-navy-600">Dépôt : {depotName ?? "—"}</p>
          {vehicle.plate && <p className="text-navy-600">Immat. {vehicle.plate}</p>}
        </SummaryCard>
        {canViewFinancials ? (
          <SummaryCard title="Tarification">
            <p>Achat : {formatMoney(pricing.purchasePrice)}</p>
            <p>Frais : {formatMoney(pricing.extraFeesTotal)}</p>
            <p className="font-semibold text-gold-700">Revient : {formatMoney(costPrice)}</p>
            {vehicle.targetSalePrice != null && (
              <p>Vente estimée : {formatMoney(vehicle.targetSalePrice)}</p>
            )}
          </SummaryCard>
        ) : (
          <SummaryCard title="Tarification">
            <p className="text-navy-600">Montants réservés au gérant et à l&apos;administrateur.</p>
          </SummaryCard>
        )}
      </div>
      <SummaryCard title="Documents">
        {documents.length === 0 ? (
          <p className="text-sm text-navy-500">Aucun document joint</p>
        ) : (
          <ul className="space-y-1 text-sm text-navy-700">
            {documents.map((d) => (
              <li key={d.id}>
                {documentCategoryLabels[d.category as DocumentCategory] ?? d.category} — {d.originalName}
              </li>
            ))}
          </ul>
        )}
      </SummaryCard>
      <p className="text-xs text-navy-500">
        Pour un achat complet (fournisseur, facture, paiements), utilisez le{" "}
        <Link href="/dashboard/purchases/new" className="font-medium text-gold-700 hover:underline">
          module Achats
        </Link>
        .
      </p>
    </div>
  );
}

function SummaryCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="rounded-lg border border-navy-950/10 bg-cream-50/50 p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-navy-500">{title}</h4>
      <div className="mt-2 space-y-1 text-sm">{children}</div>
    </article>
  );
}
