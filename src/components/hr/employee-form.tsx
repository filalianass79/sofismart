"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { jobFunctionLabels } from "@/lib/employee-labels";
import type { EmployeeJobFunction } from "@/generated/prisma/enums";
import { LoadingOverlay, LoadingButtonContent } from "@/components/ui/loading";

type Depot = { id: string; name: string };

export type EmployeeFormData = {
  firstName: string;
  lastName: string;
  cin?: string;
  personalEmail?: string;
  professionalEmail?: string;
  phone?: string;
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
  const [error, setError] = useState("");
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
    setLoading(true);
    setError("");
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
      setError(j.error?.toString?.() ?? "Erreur enregistrement");
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
      {error && <p className="text-sm text-morocco-600">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="text-navy-700">Prénom *</span>
          <input required value={form.firstName} onChange={(e) => set("firstName", e.target.value)} className="input-sofi mt-1 w-full" />
        </label>
        <label className="text-sm">
          <span className="text-navy-700">Nom *</span>
          <input required value={form.lastName} onChange={(e) => set("lastName", e.target.value)} className="input-sofi mt-1 w-full" />
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
