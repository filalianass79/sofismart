"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormFeedback } from "@/hooks/use-form-feedback";
import { cashboxTypeLabels } from "@/lib/treasury/cashbox-labels";
import type { CashboxType } from "@/generated/prisma/enums";

type Employee = { id: string; firstName: string; lastName: string; reference: string };
type Depot = { id: string; name: string };

export function CashboxForm({
  employees,
  depots,
  initial,
  cashboxId,
}: {
  employees: Employee[];
  depots: Depot[];
  initial?: Record<string, unknown>;
  cashboxId?: string;
}) {
  const router = useRouter();
  const { showError, showSuccess, reportError } = useFormFeedback();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: (initial?.name as string) ?? "",
    type: ((initial?.type as CashboxType) ?? "EMPLOYEE") as CashboxType,
    employeeId: (initial?.employeeId as string) ?? "",
    depotId: (initial?.depotId as string) ?? "",
    initialBalance: Number(initial?.initialBalance ?? 0),
    authorizedLimit: initial?.authorizedLimit != null ? Number(initial.authorizedLimit) : "",
    description: (initial?.description as string) ?? "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      reportError("Le nom est obligatoire", ["name"]);
      return;
    }
    setLoading(true);
    const url = cashboxId ? `/api/treasury/cashboxes/${cashboxId}` : "/api/treasury/cashboxes";
    const method = cashboxId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        employeeId: form.employeeId || null,
        depotId: form.depotId || null,
        authorizedLimit: form.authorizedLimit === "" ? null : Number(form.authorizedLimit),
        initialBalance: cashboxId ? undefined : form.initialBalance,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      showError((j as { error?: string }).error ?? "Erreur enregistrement");
      return;
    }
    const data = await res.json();
    showSuccess(cashboxId ? "Caisse mise à jour" : "Caisse créée");
    router.push(`/dashboard/treasury/cashboxes/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-4 rounded-xl border border-navy-950/10 bg-white p-6 shadow-sm">
      <div>
        <label className="text-sm font-medium text-navy-800">Nom caisse *</label>
        <input
          id="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="input-sofi mt-1 w-full"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-navy-800">Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as CashboxType })}
            className="input-sofi mt-1 w-full"
          >
            {(Object.keys(cashboxTypeLabels) as CashboxType[]).map((t) => (
              <option key={t} value={t}>
                {cashboxTypeLabels[t]}
              </option>
            ))}
          </select>
        </div>
        {!cashboxId && (
          <div>
            <label className="text-sm font-medium text-navy-800">Solde initial</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.initialBalance}
              onChange={(e) => setForm({ ...form, initialBalance: Number(e.target.value) })}
              className="input-sofi mt-1 w-full"
            />
          </div>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-navy-800">Employé responsable</label>
          <select
            value={form.employeeId}
            onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
            className="input-sofi mt-1 w-full"
          >
            <option value="">— Aucun —</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.reference} — {emp.firstName} {emp.lastName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-navy-800">Dépôt</label>
          <select
            value={form.depotId}
            onChange={(e) => setForm({ ...form, depotId: e.target.value })}
            className="input-sofi mt-1 w-full"
          >
            <option value="">— Aucun —</option>
            {depots.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-navy-800">Plafond autorisé (découvert)</label>
        <input
          type="number"
          min={0}
          step="0.01"
          value={form.authorizedLimit}
          onChange={(e) => setForm({ ...form, authorizedLimit: e.target.value })}
          className="input-sofi mt-1 w-full"
          placeholder="Optionnel"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-navy-800">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="input-sofi mt-1 w-full"
          rows={3}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-gradient-to-r from-gold-600 to-gold-500 px-5 py-2.5 text-sm font-semibold text-navy-950 disabled:opacity-60"
      >
        {loading ? "Enregistrement…" : cashboxId ? "Mettre à jour" : "Créer la caisse"}
      </button>
    </form>
  );
}
