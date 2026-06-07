"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useForm,
  FormProvider,
  useFieldArray,
  type UseFormRegister,
  type UseFormSetValue,
  type UseFormWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { SofiSpinner, LoadingOverlay } from "@/components/ui/loading";
import { Stepper, type StepItem } from "@/components/ui/stepper";
import { WizardActions } from "@/components/ui/wizard-actions";
import { SupplierFormModal } from "@/components/purchases/supplier-form-modal";
import {
  SupplierCardsStep,
  type SupplierCardRow,
} from "@/components/purchases/supplier-cards-step";
import {
  purchaseWizardSchema,
  supplierStepSchema,
  invoiceStepSchema,
  vehicleStepSchema,
  type PurchaseWizardValues,
} from "@/lib/validations/purchase";
import {
  computePurchaseTotals,
  computeTaxFromRate,
  purchasePaymentStatusFromAmounts,
} from "@/lib/finance";
import { InvoiceStep } from "@/components/purchases/invoice-step";
import {
  paymentMethodLabels,
  purchaseTypeLabels,
  supplierTypeLabels,
  vehicleConditionLabels,
  vehicleOriginLabels,
  vehicleStatusLabels,
  documentCategoryLabels,
} from "@/lib/purchase-labels";
import { formatMoney, cn } from "@/lib/utils";
import {
  VehicleIdentificationFields,
  type VehicleFormValues,
} from "@/components/vehicles/vehicle-identification-fields";
import type { DocumentCategory } from "@/generated/prisma/enums";
import type { InitialVehicleCatalog } from "@/lib/vehicle-catalog";

const STEPS: StepItem[] = [
  { id: "supplier", label: "Fournisseur", hint: "Sélectionner ou créer un fournisseur" },
  { id: "invoice", label: "Facture", hint: "Montants HT, TVA et frais" },
  { id: "vehicle", label: "Véhicule", hint: "Identification et dépôt" },
  { id: "payments", label: "Paiements", hint: "Suivi des règlements" },
  { id: "documents", label: "Documents", hint: "Factures, cartes grises…" },
  { id: "summary", label: "Récapitulatif", hint: "Confirmer l'achat" },
];

const DOC_CATEGORIES = [
  "PURCHASE_INVOICE",
  "CONTRACT",
  "PURCHASE_ORDER",
  "REGISTRATION_CARD",
  "CONFORMITY_CERT",
  "CUSTOMS",
  "TRANSIT_DOC",
  "PAYMENT_RECEIPT",
  "VEHICLE_PHOTO",
  "EXPERTISE_REPORT",
  "PROVISIONAL_INSURANCE",
  "OTHER",
] as const;

type Depot = { id: string; name: string };
type SupplierRow = SupplierCardRow;

const defaultValues: PurchaseWizardValues = {
  supplierId: "",
  invoice: {
    invoiceNumber: "",
    purchaseDate: new Date().toISOString().slice(0, 10),
    invoiceDate: "",
    purchaseType: "LOCAL",
    taxRatePercent: 20,
    amountHT: 0,
    taxAmount: 0,
    notes: "",
    fees: [],
  },
  vehicle: {
    brandId: "",
    modelId: "",
    version: "",
    year: new Date().getFullYear(),
    firstRegistrationDate: "",
    mileage: 0,
    fuel: "",
    transmission: "",
    color: "",
    interiorColor: "",
    matriculeW: "",
    origin: "USED",
    originCountry: "Maroc",
    status: "IN_STOCK",
    depotId: "",
    conditionNotes: "",
    internalRef: "",
  },
  payments: [],
  documents: [],
};

export function PurchaseWizard({
  depots,
  suppliers: initialSuppliers,
  purchaseId,
  initialValues,
  initialCatalog,
}: {
  depots: Depot[];
  suppliers: SupplierRow[];
  purchaseId?: string;
  initialValues?: PurchaseWizardValues;
  initialCatalog?: InitialVehicleCatalog;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftId, setDraftId] = useState(purchaseId);
  const [uploading, setUploading] = useState(false);

  const methods = useForm<PurchaseWizardValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(purchaseWizardSchema) as any,
    defaultValues: initialValues ?? defaultValues,
    values: initialValues,
    mode: "onBlur",
  });

  const { register, control, watch, setValue, getValues, trigger, reset, formState: { errors } } = methods;

  useEffect(() => {
    if (initialValues) reset(initialValues);
  }, [initialValues, reset]);
  const { fields: feeFields, append: appendFee, remove: removeFee } = useFieldArray({
    control,
    name: "invoice.fees",
  });
  const { fields: payFields, append: appendPay, remove: removePay } = useFieldArray({
    control,
    name: "payments",
  });

  const supplierId = watch("supplierId");
  const invoice = watch("invoice");
  const vehicle = watch("vehicle");
  const payments = watch("payments");
  const documents = watch("documents");

  const totals = useMemo(() => {
    const ht = Number(invoice.amountHT) || 0;
    const rate = Number(invoice.taxRatePercent) || 20;
    const tax = computeTaxFromRate(ht, rate);
    return computePurchaseTotals({
      amountHT: ht,
      taxAmount: tax,
      discount: 0,
      fees: invoice.fees,
    });
  }, [invoice.amountHT, invoice.taxRatePercent, invoice.fees]);

  const totalPaid = payments.reduce((a, p) => a + Number(p.amount || 0), 0);
  const balance = Math.max(0, totals.totalPurchasePrice - totalPaid);
  const payStatus = purchasePaymentStatusFromAmounts(totals.totalPurchasePrice, totalPaid);

  const selectedSupplier = suppliers.find((s) => s.id === supplierId);
  const depot = depots.find((d) => d.id === vehicle.depotId);

  const summaries = useMemo(
    () => [
      selectedSupplier
        ? [selectedSupplier.name, supplierTypeLabels[selectedSupplier.type]]
        : [],
      invoice.purchaseDate
        ? [
            purchaseTypeLabels[invoice.purchaseType],
            `Total ${formatMoney(totals.totalPurchasePrice)}`,
            `Revient ${formatMoney(totals.costPrice)}`,
          ]
        : [],
      vehicle.brandId
        ? ["Véhicule sélectionné", depot?.name ?? "Dépôt à choisir"]
        : [],
      [
        totalPaid > 0 ? `Payé ${formatMoney(totalPaid)}` : "Aucun paiement",
        balance > 0 ? `Reste ${formatMoney(balance)}` : "Soldé",
      ],
      [`${documents.length} document(s)`],
      selectedSupplier && vehicle.brandId
        ? [selectedSupplier.name, formatMoney(totals.totalPurchasePrice)]
        : [],
    ],
    [
      selectedSupplier,
      invoice,
      totals,
      vehicle,
      depot,
      totalPaid,
      balance,
      documents.length,
    ]
  );

  const validateStep = useCallback(async () => {
    const v = getValues();
    if (step === 0) return supplierStepSchema.safeParse({ supplierId: v.supplierId }).success;
    if (step === 1) return invoiceStepSchema.safeParse(v.invoice).success;
    if (step === 2) return vehicleStepSchema.safeParse(v.vehicle).success;
    return true;
  }, [step, getValues]);

  async function save(status: "DRAFT" | "VALIDATED") {
    setError(null);
    if (status === "VALIDATED") {
      const ok = await trigger();
      if (!ok) {
        setError("Corrigez les erreurs du formulaire avant validation.");
        return;
      }
    }
    setLoading(true);
    const body = { ...getValues(), status };
    const url = draftId ? `/api/purchases/${draftId}` : "/api/purchases";
    const res = await fetch(url, {
      method: draftId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(j.error ?? "Erreur lors de l'enregistrement");
      return;
    }
    setDraftId(j.id);
    if (status === "VALIDATED") {
      router.push(`/dashboard/purchases/${j.id}`);
      router.refresh();
    }
  }

  async function onUpload(files: FileList | null, category: string) {
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("category", category);
      if (draftId) fd.append("purchaseId", draftId);
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

  return (
    <FormProvider {...methods}>
      <div className="space-y-6">
        <Stepper
          steps={STEPS}
          current={step}
          summaries={summaries}
          onStepClick={(i) => setStep(i)}
        />
        {error && (
          <div className="rounded-lg border border-morocco-500/40 bg-morocco-500/10 px-4 py-3 text-sm text-morocco-700">
            {error}
          </div>
        )}

        <div className="relative rounded-xl border border-navy-950/10 bg-white p-6 shadow-sm">
          {loading && <LoadingOverlay label="Enregistrement de l'achat…" />}
          {step === 0 && (
            <SupplierCardsStep
              suppliers={suppliers}
              selectedId={supplierId}
              onSelect={(id) => {
                setValue("supplierId", id);
                setError(null);
                setStep(1);
              }}
              onNew={() => setModalOpen(true)}
              error={errors.supplierId?.message}
            />
          )}
          {step === 1 && (
            <InvoiceStep
              register={register}
              setValue={setValue}
              watch={watch}
              feeFields={feeFields}
              appendFee={appendFee}
              removeFee={removeFee}
            />
          )}
          {step === 2 && (
            <div className="space-y-4">
              <header>
                <h3 className="font-display text-xl text-navy-950">Identification véhicule</h3>
                <p className="mt-1 text-sm text-navy-500">
                  Catalogue géré dans Paramètres. Les champs optionnels peuvent être complétés ultérieurement.
                </p>
              </header>
              <VehicleIdentificationFields
                register={register as unknown as UseFormRegister<VehicleFormValues>}
                watch={watch as unknown as UseFormWatch<VehicleFormValues>}
                setValue={setValue as unknown as UseFormSetValue<VehicleFormValues>}
                depots={depots}
                showCostHint
                costPrice={totals.costPrice}
                vehicleOriginLabels={vehicleOriginLabels}
                vehicleConditionLabels={vehicleConditionLabels}
                vehicleStatusLabels={vehicleStatusLabels}
                initialCatalog={initialCatalog}
              />
            </div>
          )}
          {step === 3 && (
            <PaymentsStep
              register={register}
              payFields={payFields}
              appendPay={appendPay}
              removePay={removePay}
              totalDue={totals.totalPurchasePrice}
              totalPaid={totalPaid}
              balance={balance}
            />
          )}
          {step === 4 && (
            <DocumentsStep
              documents={documents}
              uploading={uploading}
              onUpload={onUpload}
              onRemove={(id) =>
                setValue(
                  "documents",
                  documents.filter((d) => d.id !== id)
                )
              }
            />
          )}
          {step === 5 && (
            <SummaryStep
              supplier={selectedSupplier}
              invoice={invoice}
              vehicle={vehicle}
              totals={totals}
              payments={payments}
              documents={documents}
              totalPaid={totalPaid}
              balance={balance}
              payStatus={payStatus}
              depots={depots}
            />
          )}
        </div>

        <WizardActions
          step={step}
          totalSteps={STEPS.length}
          onPrev={() => setStep((s) => s - 1)}
          showNext={step > 0 && step < STEPS.length - 1}
          onNext={async () => {
            const ok = await validateStep();
            if (!ok) {
              await trigger(step === 1 ? "invoice" : "vehicle");
              setError("Complétez les champs obligatoires de cette étape.");
              return;
            }
            setError(null);
            if (step >= 2 && !draftId) await save("DRAFT");
            setStep((s) => s + 1);
          }}
          onDraft={async () => {
            if (step < 2) {
              setError("Complétez l'étape « Véhicule » avant d'enregistrer le brouillon.");
              return;
            }
            const ok = await validateStep();
            if (step === 2 && !ok) {
              await trigger("vehicle");
              setError("Complétez les champs obligatoires du véhicule.");
              return;
            }
            await save("DRAFT");
          }}
          onValidate={() => save("VALIDATED")}
          loading={loading}
          submitLabel="Valider l'achat"
        />
      </div>

      <SupplierFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={(s) => {
          setSuppliers((prev) => [...prev, s]);
          setValue("supplierId", s.id);
          setError(null);
          setStep(1);
        }}
      />
    </FormProvider>
  );
}

function PaymentsStep({
  register,
  payFields,
  appendPay,
  removePay,
  totalDue,
  totalPaid,
  balance,
}: {
  register: ReturnType<typeof useForm<PurchaseWizardValues>>["register"];
  payFields: { id: string }[];
  appendPay: (v: PurchaseWizardValues["payments"][0]) => void;
  removePay: (i: number) => void;
  totalDue: number;
  totalPaid: number;
  balance: number;
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-display text-xl text-navy-950">Paiements fournisseur</h3>
      <div className="grid gap-3 rounded-lg bg-cream-50 p-4 sm:grid-cols-3 text-sm">
        <div><span className="text-navy-500">Total à payer</span><p className="font-semibold tabular-nums">{formatMoney(totalDue)}</p></div>
        <div><span className="text-navy-500">Déjà payé</span><p className="font-semibold tabular-nums text-emerald-700">{formatMoney(totalPaid)}</p></div>
        <div><span className="text-navy-500">Reste</span><p className={cn("font-semibold tabular-nums", balance > 0 && "text-morocco-600")}>{formatMoney(balance)}</p></div>
      </div>
      <button
        type="button"
        onClick={() =>
          appendPay({
            amount: 0,
            paidAt: new Date().toISOString().slice(0, 10),
            method: "TRANSFER",
            reference: "",
            bank: "",
            checkNumber: "",
            dueDate: "",
            notes: "",
          })
        }
        className="text-sm font-medium text-gold-700"
      >
        + Ajouter un paiement
      </button>
      {payFields.map((field, i) => (
        <div key={field.id} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-6">
          <input type="number" step="0.01" {...register(`payments.${i}.amount`)} placeholder="Montant" className="input-sofi" />
          <input type="date" {...register(`payments.${i}.paidAt`)} className="input-sofi" />
          <select {...register(`payments.${i}.method`)} className="input-sofi">
            {Object.entries(paymentMethodLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <input {...register(`payments.${i}.reference`)} placeholder="Référence" className="input-sofi sm:col-span-2" />
          <button type="button" onClick={() => removePay(i)}><Trash2 className="h-4 w-4 text-morocco-600" /></button>
        </div>
      ))}
    </div>
  );
}

function DocumentsStep({
  documents,
  uploading,
  onUpload,
  onRemove,
}: {
  documents: PurchaseWizardValues["documents"];
  uploading: boolean;
  onUpload: (files: FileList | null, cat: string) => void;
  onRemove: (id: string) => void;
}) {
  const [category, setCategory] = useState<DocumentCategory>("PURCHASE_INVOICE");
  return (
    <div className="space-y-4">
      <h3 className="font-display text-xl text-navy-950">Documents</h3>
      <div className="flex flex-wrap gap-2">
        <select value={category} onChange={(e) => setCategory(e.target.value as DocumentCategory)} className="input-sofi">
          {DOC_CATEGORIES.map((c) => (
            <option key={c} value={c}>{documentCategoryLabels[c]}</option>
          ))}
        </select>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-navy-950 px-4 py-2 text-sm text-white">
          {uploading ? <SofiSpinner size="xs" label="Envoi du fichier" /> : null}
          Choisir fichiers (PDF, JPG, PNG)
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => onUpload(e.target.files, category)}
          />
        </label>
      </div>
      <ul className="divide-y rounded-lg border">
        {documents.map((d) => (
          <li key={d.id} className="flex items-center justify-between px-4 py-2 text-sm">
            <span>{documentCategoryLabels[d.category as DocumentCategory] ?? d.category} — {d.originalName}</span>
            <button type="button" onClick={() => onRemove(d.id)} className="text-morocco-600"><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
        {documents.length === 0 && <li className="px-4 py-6 text-center text-navy-400">Aucun document</li>}
      </ul>
    </div>
  );
}

function SummaryStep({
  supplier,
  invoice,
  vehicle,
  totals,
  payments,
  documents,
  totalPaid,
  balance,
  payStatus,
  depots,
}: {
  supplier?: SupplierRow;
  invoice: PurchaseWizardValues["invoice"];
  vehicle: PurchaseWizardValues["vehicle"];
  totals: ReturnType<typeof computePurchaseTotals>;
  payments: PurchaseWizardValues["payments"];
  documents: PurchaseWizardValues["documents"];
  totalPaid: number;
  balance: number;
  payStatus: string;
  depots: Depot[];
}) {
  const depot = depots.find((d) => d.id === vehicle.depotId);
  return (
    <div className="space-y-4">
      <h3 className="font-display text-xl text-navy-950">Récapitulatif</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <SummaryCard title="Fournisseur">
          <p className="font-semibold">{supplier?.name ?? "—"}</p>
          {supplier && <p className="text-navy-600">{supplierTypeLabels[supplier.type]}</p>}
        </SummaryCard>
        <SummaryCard title="Facture">
          <p>Date : {invoice.purchaseDate}</p>
          <p>Type : {purchaseTypeLabels[invoice.purchaseType]}</p>
          <p className="font-semibold">Total : {formatMoney(totals.totalPurchasePrice)}</p>
          <p>Frais : {formatMoney(totals.totalExpenses)}</p>
          <p className="text-gold-700 font-semibold">Prix de revient : {formatMoney(totals.costPrice)}</p>
        </SummaryCard>
        <SummaryCard title="Véhicule">
          <VehicleSummaryLines vehicle={vehicle} depotName={depot?.name} />
        </SummaryCard>
        <SummaryCard title="Paiements">
          <p>Payé : {formatMoney(totalPaid)}</p>
          <p>Reste : {formatMoney(balance)}</p>
          <p>Statut : {payStatus}</p>
          <p>{payments.length} ligne(s) de paiement</p>
        </SummaryCard>
      </div>
      <p className="text-sm text-navy-500">{documents.length} document(s) joint(s)</p>
    </div>
  );
}

function VehicleSummaryLines({
  vehicle,
  depotName,
}: {
  vehicle: PurchaseWizardValues["vehicle"];
  depotName?: string;
}) {
  const [title, setTitle] = useState("—");

  useEffect(() => {
    if (!vehicle.brandId) {
      setTitle("—");
      return;
    }
    Promise.all([
      fetch("/api/brands").then((r) => (r.ok ? r.json() : [])),
      vehicle.modelId
        ? fetch(`/api/vehicle-models?brandId=${vehicle.brandId}`).then((r) => (r.ok ? r.json() : []))
        : Promise.resolve([]),
    ]).then(([brands, models]) => {
      const b = brands.find((x: { id: string }) => x.id === vehicle.brandId);
      const m = models.find((x: { id: string }) => x.id === vehicle.modelId);
      const line = [b?.label, m?.label, vehicle.version].filter(Boolean).join(" ");
      setTitle(line || "Véhicule");
    });
  }, [vehicle.brandId, vehicle.modelId, vehicle.version]);

  return (
    <>
      <p className="font-semibold">{title}</p>
      <p>
        {vehicle.year} — {vehicleOriginLabels[vehicle.origin]}
      </p>
      <p>Dépôt : {depotName ?? "—"}</p>
      {vehicle.vin && <p>N° de Chassis : {vehicle.vin}</p>}
      {vehicle.color && <p>Couleur : {vehicle.color}</p>}
      {vehicle.plate && <p>Immatriculation : {vehicle.plate}</p>}
      {vehicle.matriculeW && <p>Matricule W : {vehicle.matriculeW}</p>}
    </>
  );
}

function SummaryCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-navy-950/10 bg-cream-50/50 p-4">
      <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-navy-500">{title}</h4>
      <div className="space-y-1 text-sm text-navy-800">{children}</div>
    </div>
  );
}

