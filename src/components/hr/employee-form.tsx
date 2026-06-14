"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { jobFunctionLabels } from "@/lib/employee-labels";
import type { EmployeeJobFunction } from "@/generated/prisma/enums";
import { LoadingOverlay, LoadingButtonContent } from "@/components/ui/loading";
import { useFormFeedback } from "@/hooks/use-form-feedback";
import { highlightInvalidFormFields } from "@/lib/feedback/form-errors";

type Depot = { id: string; name: string };

export type EmployeeFormData = {
  firstName: string;
  lastName: string;
  cin?: string;
  personalEmail?: string;
  professionalEmail?: string;
  phone?: string;
  whatsappPhone?: string;
  whatsappEnabled?: boolean;
  whatsappConsent?: boolean;
  preferredNotificationChannel?: "INTERNAL" | "WHATSAPP" | "EMAIL" | "ALL";
  address?: string;
  city?: string;
  birthDate?: string;
  hireDate?: string;
  jobFunction: EmployeeJobFunction;
  department?: string;
  depotId?: string;
  contractType?: string;
  salary?: number;
  status?: string;
  notes?: string;
};

export function EmployeeForm({
  initial,
  depots,
  employeeId,
  onSuccess,
  onCancel,
}: {
  initial?: EmployeeFormData;
  depots: Depot[];
  employeeId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { showError, reportApiError } = useFormFeedback();
  const [form, setForm] = useState<EmployeeFormData>(
    initial ?? {
      firstName: "",
      lastName: "",
      jobFunction: "EMPLOYE",
      status: "ACTIVE",
    }
  );

  useEffect(() => {
    if (initial) setForm(initial);
  }, [initial, employeeId]);

  const set = (k: keyof EmployeeFormData, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const missing: string[] = [];
    if (!form.firstName.trim()) missing.push("firstName");
    if (!form.lastName.trim()) missing.push("lastName");
    if (missing.length) {
      highlightInvalidFormFields(missing);
      showError("Le prénom et le nom sont obligatoires.", "Champs obligatoires");
      return;
    }
    setLoading(true);
    const url = employeeId ? `/api/employees/${employeeId}` : "/api/employees";
    const method = employeeId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      reportApiError(j, "Erreur enregistrement");
      return;
    }
    if (onSuccess) {
      onSuccess();
      return;
    }
    const emp = await res.json();
    router.push(`/dashboard/settings/employees/${emp.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="relative space-y-4">
      {loading && <LoadingOverlay label="Enregistrement en cours…" />}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="text-navy-700">Prénom *</span>
          <input
            name="firstName"
            value={form.firstName}
            onChange={(e) => set("firstName", e.target.value)}
            className="input-sofi mt-1 w-full"
          />
        </label>
        <label className="text-sm">
          <span className="text-navy-700">Nom *</span>
          <input
            name="lastName"
            value={form.lastName}
            onChange={(e) => set("lastName", e.target.value)}
            className="input-sofi mt-1 w-full"
          />
        </label>
        <label className="text-sm">
          <span className="text-navy-700">CIN</span>
          <input value={form.cin ?? ""} onChange={(e) => set("cin", e.target.value)} className="input-sofi mt-1 w-full" />
        </label>
        <label className="text-sm">
          <span className="text-navy-700">Téléphone</span>
          <input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} className="input-sofi mt-1 w-full" />
        </label>
        <label className="text-sm">
          <span className="text-navy-700">Téléphone WhatsApp</span>
          <input
            value={form.whatsappPhone ?? ""}
            onChange={(e) => set("whatsappPhone", e.target.value)}
            placeholder="2126XXXXXXXX"
            className="input-sofi mt-1 w-full"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.whatsappEnabled ?? false}
            onChange={(e) => setForm((f) => ({ ...f, whatsappEnabled: e.target.checked }))}
          />
          Notifications WhatsApp activées
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.whatsappConsent ?? false}
            onChange={(e) => setForm((f) => ({ ...f, whatsappConsent: e.target.checked }))}
          />
          Consentement WhatsApp (RGPD)
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="text-navy-700">Canal de notification préféré</span>
          <select
            value={form.preferredNotificationChannel ?? "ALL"}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                preferredNotificationChannel: e.target.value as EmployeeFormData["preferredNotificationChannel"],
              }))
            }
            className="input-sofi mt-1 w-full"
          >
            <option value="ALL">Tous les canaux</option>
            <option value="INTERNAL">Application uniquement</option>
            <option value="WHATSAPP">WhatsApp uniquement</option>
            <option value="EMAIL">Email uniquement</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="text-navy-700">Email personnel</span>
          <input type="email" value={form.personalEmail ?? ""} onChange={(e) => set("personalEmail", e.target.value)} className="input-sofi mt-1 w-full" />
        </label>
        <label className="text-sm">
          <span className="text-navy-700">Email professionnel</span>
          <input type="email" value={form.professionalEmail ?? ""} onChange={(e) => set("professionalEmail", e.target.value)} className="input-sofi mt-1 w-full" />
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="text-navy-700">Adresse</span>
          <input value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} className="input-sofi mt-1 w-full" />
        </label>
        <label className="text-sm">
          <span className="text-navy-700">Ville</span>
          <input value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} className="input-sofi mt-1 w-full" />
        </label>
        <label className="text-sm">
          <span className="text-navy-700">Fonction *</span>
          <select value={form.jobFunction} onChange={(e) => set("jobFunction", e.target.value)} className="input-sofi mt-1 w-full">
            {(Object.keys(jobFunctionLabels) as EmployeeJobFunction[]).map((k) => (
              <option key={k} value={k}>
                {jobFunctionLabels[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="text-navy-700">Département</span>
          <input value={form.department ?? ""} onChange={(e) => set("department", e.target.value)} className="input-sofi mt-1 w-full" />
        </label>
        <label className="text-sm">
          <span className="text-navy-700">Dépôt</span>
          <select value={form.depotId ?? ""} onChange={(e) => set("depotId", e.target.value)} className="input-sofi mt-1 w-full">
            <option value="">—</option>
            {depots.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="text-navy-700">Date embauche</span>
          <input type="date" value={form.hireDate?.slice(0, 10) ?? ""} onChange={(e) => set("hireDate", e.target.value)} className="input-sofi mt-1 w-full" />
        </label>
        <label className="text-sm">
          <span className="text-navy-700">Date naissance</span>
          <input type="date" value={form.birthDate?.slice(0, 10) ?? ""} onChange={(e) => set("birthDate", e.target.value)} className="input-sofi mt-1 w-full" />
        </label>
        <label className="text-sm">
          <span className="text-navy-700">Type contrat</span>
          <input value={form.contractType ?? ""} onChange={(e) => set("contractType", e.target.value)} className="input-sofi mt-1 w-full" />
        </label>
        <label className="text-sm">
          <span className="text-navy-700">Statut</span>
          <select value={form.status ?? "ACTIVE"} onChange={(e) => set("status", e.target.value)} className="input-sofi mt-1 w-full">
            <option value="ACTIVE">Actif</option>
            <option value="INACTIVE">Inactif</option>
          </select>
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="text-navy-700">Notes internes</span>
          <textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={3} className="input-sofi mt-1 w-full" />
        </label>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="btn-sofi-primary disabled:opacity-60">
          <LoadingButtonContent loading={loading} loadingLabel="Enregistrement…">
            Enregistrer
          </LoadingButtonContent>
        </button>
        {(onCancel || !onSuccess) && (
          <button
            type="button"
            onClick={() => (onCancel ? onCancel() : router.back())}
            className="btn-sofi-ghost"
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}
