"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Code2,
  FileText,
  FileUp,
  Loader2,
  RefreshCw,
  Save,
  ScanText,
} from "lucide-react";
import { SofiSpinner } from "@/components/ui/loading";
import { formatMoney } from "@/lib/utils";
import type { InvoiceImportPayload } from "@/lib/invoice-import/types";
import type { PurchaseWizardValues } from "@/lib/validations/purchase";
import { InvoicePreviewPanel } from "./invoice-preview-panel";
import { FieldConfidenceBadge } from "./field-confidence-badge";
import { useDepotOptions } from "@/hooks/use-depot-options";

type Depot = { id: string; name: string };
type SupplierRow = { id: string; name: string; type: string };

const defaultWizard: PurchaseWizardValues = {
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
    vin: "",
    plate: "",
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

function mergeWizard(draft: Partial<PurchaseWizardValues>): PurchaseWizardValues {
  return {
    ...defaultWizard,
    ...draft,
    invoice: { ...defaultWizard.invoice, ...draft.invoice },
    vehicle: { ...defaultWizard.vehicle, ...draft.vehicle },
  };
}

export function PurchaseInvoiceImportWorkspace({
  depots,
  suppliers,
  canEdit,
}: {
  depots: Depot[];
  suppliers: SupplierRow[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"invoice" | "form">("form");
  const [uploading, setUploading] = useState(false);
  const [importId, setImportId] = useState<string | null>(null);
  const [payload, setPayload] = useState<InvoiceImportPayload | null>(null);
  const [wizard, setWizard] = useState<PurchaseWizardValues>(defaultWizard);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [debugPanel, setDebugPanel] = useState<"none" | "ocr" | "ai">("none");
  const [debugContent, setDebugContent] = useState<string>("");
  const { depots: depotOptions, loading: depotsLoading } = useDepotOptions(depots);

  const loadImport = useCallback(async (id: string) => {
    const res = await fetch(`/api/purchases/invoice-import/${id}`);
    const j = await res.json();
    if (!res.ok) throw new Error(j.error ?? "Chargement impossible");
    setPayload(j);
    setWizard(mergeWizard(j.wizardDraft));
    if (j.supplierMatches?.[0]) {
      setWizard((w) => ({ ...w, supplierId: j.supplierMatches[0].id }));
    }
  }, []);

  async function onUpload(file: File) {
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/purchases/invoice-import", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Import échoué");
      setImportId(j.importId);
      await loadImport(j.importId);
      setTab("form");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setUploading(false);
    }
  }

  async function reprocess() {
    if (!importId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/purchases/invoice-import/${importId}/reprocess`, { method: "POST" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Erreur");
      setPayload(j);
      setWizard(mergeWizard(j.wizardDraft));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function runOcr() {
    if (!importId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/purchases/invoice-import/${importId}/run-ocr`, { method: "POST" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Erreur OCR");
      setPayload(j);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function runAi() {
    if (!importId) return;
    if (!payload?.aiEnabled && !confirm("L'extraction IA n'est pas configurée. Continuer quand même ?")) return;
    if (!confirm("Relancer l'extraction IA ? (consommation API possible)")) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/purchases/invoice-import/${importId}/run-ai-extraction`, { method: "POST" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Erreur IA");
      setPayload(j);
      setWizard(mergeWizard(j.wizardDraft));
      if (j.supplierMatches?.[0]) {
        setWizard((w) => ({ ...w, supplierId: j.supplierMatches[0].id }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function showDebug(kind: "ocr" | "ai") {
    if (!importId) return;
    const endpoint =
      kind === "ocr"
        ? `/api/purchases/invoice-import/${importId}/ocr-text`
        : `/api/purchases/invoice-import/${importId}/ai-json`;
    const res = await fetch(endpoint);
    const j = await res.json();
    setDebugPanel(kind);
    setDebugContent(JSON.stringify(j, null, 2));
  }

  async function saveDraft() {
    if (!importId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/purchases/invoice-import/${importId}/save-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wizard }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Erreur");
      router.push(`/dashboard/purchases/${j.purchaseId}/edit`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function validatePurchase(forceVehicle = false) {
    if (!importId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/purchases/invoice-import/${importId}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wizard, forceVehicle }),
      });
      const j = await res.json();
      if (res.status === 409 && j.code === "VEHICLE_DUPLICATE") {
        if (confirm("Un véhicule existe déjà (VIN/immat.). Confirmer quand même ?")) {
          await validatePurchase(true);
        }
        return;
      }
      if (!res.ok) throw new Error(j.error ?? "Validation échouée");
      router.push(`/dashboard/purchases/${j.purchaseId}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  const conf = payload?.structured;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dashboard/purchases" className="text-sm text-gold-700 hover:underline">
            ← Achats
          </Link>
          <h2 className="font-display text-2xl text-navy-950">Import facture d&apos;achat</h2>
          <p className="text-sm text-navy-600">
            OCR + IA — extraction structurée puis validation humaine obligatoire
          </p>
        </div>
        {importId && canEdit && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={runOcr}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg border border-navy-950/15 px-3 py-2 text-sm font-medium"
              title="Relancer OCR uniquement"
            >
              <ScanText className="h-4 w-4" /> OCR
            </button>
            <button
              type="button"
              onClick={runAi}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg border border-violet-400/40 bg-violet-500/10 px-3 py-2 text-sm font-medium text-violet-900"
              title="Relancer extraction IA"
            >
              <Brain className="h-4 w-4" /> IA
            </button>
            <button
              type="button"
              onClick={reprocess}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg border border-navy-950/15 px-3 py-2 text-sm font-medium"
            >
              <RefreshCw className="h-4 w-4" /> Pipeline complet
            </button>
            <button type="button" onClick={() => showDebug("ocr")} className="inline-flex items-center gap-1 rounded-lg border px-2 py-2 text-xs" title="Texte OCR">
              <FileText className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => showDebug("ai")} className="inline-flex items-center gap-1 rounded-lg border px-2 py-2 text-xs" title="JSON IA">
              <Code2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={saveDraft}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg border border-gold-500/40 bg-gold-500/10 px-3 py-2 text-sm font-semibold"
            >
              <Save className="h-4 w-4" /> Brouillon
            </button>
            <button
              type="button"
              onClick={() => validatePurchase(false)}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-navy-950 px-4 py-2 text-sm font-semibold text-white"
            >
              <CheckCircle2 className="h-4 w-4" /> Valider achat
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-morocco-500/30 bg-morocco-500/10 px-4 py-3 text-sm text-morocco-800">
          {error}
        </p>
      )}

      {!importId && (
        <label className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gold-400/50 bg-gold-500/5 p-8 transition hover:bg-gold-500/10">
          <input
            type="file"
            accept=".pdf,image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={uploading || !canEdit}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
            }}
          />
          {uploading ? (
            <SofiSpinner label="Extraction en cours…" />
          ) : (
            <>
              <FileUp className="h-10 w-10 text-gold-600" />
              <p className="mt-3 font-semibold text-navy-900">Glisser ou cliquer pour importer</p>
              <p className="text-sm text-navy-500">PDF, JPG, PNG, WEBP — max 10 Mo</p>
            </>
          )}
        </label>
      )}

      {importId && payload && (
        <>
          <div className="flex gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setTab("invoice")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium ${tab === "invoice" ? "bg-navy-950 text-white" : "bg-white border"}`}
            >
              Facture
            </button>
            <button
              type="button"
              onClick={() => setTab("form")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium ${tab === "form" ? "bg-navy-950 text-white" : "bg-white border"}`}
            >
              Formulaire
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
            <div className={tab === "form" ? "hidden lg:block" : ""}>
              <InvoicePreviewPanel
                fileUrl={payload.fileUrl}
                fileMimeType={payload.fileMimeType}
                fileName={payload.fileName}
              />
            </div>

            <div className={`space-y-4 ${tab === "invoice" ? "hidden lg:block" : ""}`}>
              {conf && (
                <section className="rounded-xl border border-navy-950/10 bg-gradient-to-br from-cream-50 to-white p-4">
                  <h3 className="font-semibold text-navy-950">Résumé extraction</h3>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-navy-500">Confiance</p>
                      <p className="font-display text-xl text-gold-700">
                        {Math.round((payload.confidenceScore ?? 0) * 100)} %
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-navy-500">Détectés</p>
                      <p className="font-semibold">{conf.detectedCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-navy-500">À vérifier</p>
                      <p className="font-semibold text-amber-800">{conf.lowConfidenceCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-navy-500">Manquants</p>
                      <p className="font-semibold">{conf.missingCount}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-navy-500">
                    OCR : {payload.ocrStatus} — IA : {payload.aiStatus}
                    {payload.aiEnabled
                      ? ` (${payload.aiProvider ?? "ia"} / ${payload.aiModel ?? "—"})`
                      : " (IA désactivée — configurez AI_API_KEY)"}{" "}
                    — {payload.pageCount} page(s)
                  </p>
                  {payload.validationErrors && payload.validationErrors.length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs text-amber-800">
                      {payload.validationErrors.map((w) => (
                        <li key={w}>⚠ {w}</li>
                      ))}
                    </ul>
                  )}
                  {payload.extractionRuns.length > 0 && (
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-left text-[10px] text-navy-600">
                        <thead>
                          <tr>
                            <th className="pr-2">Type</th>
                            <th className="pr-2">Provider</th>
                            <th className="pr-2">Statut</th>
                            <th>Coût est.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payload.extractionRuns.slice(0, 5).map((r) => (
                            <tr key={r.id}>
                              <td className="pr-2 font-medium">{r.type}</td>
                              <td className="pr-2">{r.provider ?? "—"}</td>
                              <td className="pr-2">{r.status}</td>
                              <td>{r.estimatedCost != null ? `${(r.estimatedCost * 100).toFixed(2)} cts` : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              )}

              {debugPanel !== "none" && (
                <section className="rounded-xl border border-navy-950/10 bg-navy-950 p-3 text-xs text-emerald-100">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-semibold uppercase tracking-wide">
                      {debugPanel === "ocr" ? "Texte OCR" : "JSON IA"}
                    </span>
                    <button type="button" onClick={() => setDebugPanel("none")} className="text-white/70 hover:text-white">
                      Fermer
                    </button>
                  </div>
                  <pre className="max-h-48 overflow-auto whitespace-pre-wrap">{debugContent}</pre>
                </section>
              )}

              {payload.vehicleMatches.length > 0 && (
                <div className="flex gap-2 rounded-lg border border-amber-400/40 bg-amber-50 p-3 text-sm text-amber-950">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold">Véhicule déjà en base</p>
                    {payload.vehicleMatches.map((v) => (
                      <p key={v.id}>
                        <Link href={`/dashboard/vehicles/${v.id}`} className="text-gold-800 underline">
                          {v.internalRef}
                        </Link>{" "}
                        — {v.brandLabel} {v.modelLabel}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <FormSection title="Fournisseur">
                <label className="block text-sm">
                  <span className="flex items-center justify-between gap-2 font-medium">
                    Fournisseur existant
                    {conf && <FieldConfidenceBadge confidence={conf.supplier.name.confidence} />}
                  </span>
                  <select
                    value={wizard.supplierId}
                    onChange={(e) => setWizard((w) => ({ ...w, supplierId: e.target.value }))}
                    className="input-sofi mt-1 w-full"
                    disabled={!canEdit}
                  >
                    <option value="">— Sélectionner —</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
                {payload.supplierMatches.length > 0 && (
                  <p className="mt-2 text-xs text-emerald-800">
                    Correspondance : {payload.supplierMatches[0].name} (
                    {Math.round(payload.supplierMatches[0].score * 100)} %)
                  </p>
                )}
              </FormSection>

              <FormSection title="Facture">
                <div className="grid gap-3 sm:grid-cols-2">
                  <LabeledInput
                    label="N° facture"
                    confidence={conf?.invoice.invoiceNumber.confidence}
                    value={wizard.invoice.invoiceNumber ?? ""}
                    onChange={(v) =>
                      setWizard((w) => ({ ...w, invoice: { ...w.invoice, invoiceNumber: v } }))
                    }
                    disabled={!canEdit}
                  />
                  <LabeledInput
                    label="Date achat"
                    type="date"
                    confidence={conf?.invoice.purchaseDate.confidence}
                    value={wizard.invoice.purchaseDate}
                    onChange={(v) =>
                      setWizard((w) => ({ ...w, invoice: { ...w.invoice, purchaseDate: v } }))
                    }
                    disabled={!canEdit}
                  />
                  <LabeledInput
                    label="Montant HT"
                    type="number"
                    confidence={conf?.invoice.amountHT.confidence}
                    value={String(wizard.invoice.amountHT)}
                    onChange={(v) =>
                      setWizard((w) => ({
                        ...w,
                        invoice: { ...w.invoice, amountHT: Number(v) || 0 },
                      }))
                    }
                    disabled={!canEdit}
                  />
                  <LabeledInput
                    label="TVA"
                    type="number"
                    confidence={conf?.invoice.taxAmount.confidence}
                    value={String(wizard.invoice.taxAmount)}
                    onChange={(v) =>
                      setWizard((w) => ({
                        ...w,
                        invoice: { ...w.invoice, taxAmount: Number(v) || 0 },
                      }))
                    }
                    disabled={!canEdit}
                  />
                </div>
                {conf && (
                  <p className="mt-2 text-sm text-navy-600">
                    TTC détecté : {formatMoney(Number(conf.invoice.amountTTC.value))}
                  </p>
                )}
              </FormSection>

              <FormSection title="Véhicule">
                <div className="grid gap-3 sm:grid-cols-2">
                  <LabeledInput
                    label="VIN / Châssis"
                    confidence={conf?.vehicle.vin.confidence}
                    value={wizard.vehicle.vin ?? ""}
                    onChange={(v) =>
                      setWizard((w) => ({ ...w, vehicle: { ...w.vehicle, vin: v } }))
                    }
                    disabled={!canEdit}
                  />
                  <LabeledInput
                    label="Immatriculation"
                    confidence={conf?.vehicle.plate.confidence}
                    value={wizard.vehicle.plate ?? ""}
                    onChange={(v) =>
                      setWizard((w) => ({ ...w, vehicle: { ...w.vehicle, plate: v } }))
                    }
                    disabled={!canEdit}
                  />
                  <LabeledInput
                    label="Couleur"
                    value={wizard.vehicle.color ?? ""}
                    onChange={(v) =>
                      setWizard((w) => ({ ...w, vehicle: { ...w.vehicle, color: v } }))
                    }
                    disabled={!canEdit}
                  />
                  <label className="block text-sm">
                    <span className="font-medium">Dépôt</span>
                    <select
                      value={wizard.vehicle.depotId}
                      onChange={(e) =>
                        setWizard((w) => ({
                          ...w,
                          vehicle: { ...w.vehicle, depotId: e.target.value },
                        }))
                      }
                      className="input-sofi mt-1 w-full"
                      disabled={!canEdit || depotsLoading}
                    >
                      <option value="">{depotsLoading ? "Chargement…" : "—"}</option>
                      {depotOptions.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <p className="mt-2 text-xs text-navy-500">
                  Marque/modèle : complétez dans le brouillon si non détectés (
                  {String(conf?.vehicle.brandLabel.value ?? "")}{" "}
                  {String(conf?.vehicle.modelLabel.value ?? "")})
                </p>
              </FormSection>

              {conf && conf.lineItems.length > 0 && (
                <FormSection title="Lignes facture">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="text-navy-500">
                        <tr>
                          <th className="py-1">Désignation</th>
                          <th className="py-1 text-right">HT</th>
                          <th className="py-1">Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {conf.lineItems.map((l, i) => (
                          <tr key={i} className="border-t border-navy-950/5">
                            <td className="py-1 pr-2">{l.designation}</td>
                            <td className="py-1 text-right tabular-nums">
                              {formatMoney(l.totalHT)}
                            </td>
                            <td className="py-1">{l.lineType}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </FormSection>
              )}

              {saving && (
                <div className="flex items-center gap-2 text-sm text-navy-600">
                  <Loader2 className="h-4 w-4 animate-spin" /> Enregistrement…
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-navy-950/10 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-navy-600">{title}</h3>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
  confidence,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  confidence?: number;
  disabled?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 flex items-center justify-between gap-2 font-medium text-navy-800">
        {label}
        {confidence !== undefined && <FieldConfidenceBadge confidence={confidence} />}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="input-sofi w-full"
      />
    </label>
  );
}
