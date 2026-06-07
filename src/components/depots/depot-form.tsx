"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { depotSchema, type DepotInput } from "@/lib/validations/depot";
import { depotTypeLabels, depotStatusLabels } from "@/lib/depot-labels";
import type { DepotType, DepotStatus } from "@/generated/prisma/enums";
import { LoadingOverlay, LoadingButtonContent } from "@/components/ui/loading";

type Manager = { id: string; name: string | null; email: string };

export function DepotForm({
  depotId,
  initial,
  managers,
  onSuccess,
  onCancel,
}: {
  depotId?: string;
  initial?: Partial<DepotInput>;
  managers: Manager[];
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const form = useForm<DepotInput>({
    resolver: zodResolver(depotSchema) as never,
    defaultValues: {
      maxCapacity: 50,
      depotType: "MAIN",
      status: "ACTIVE",
      ...initial,
    },
  });

  const { register, handleSubmit } = form;

  async function onSubmit(data: DepotInput) {
    setLoading(true);
    setError("");
    const url = depotId ? `/api/depots/${depotId}` : "/api/depots";
    const method = depotId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError((j as { error?: string }).error ?? "Erreur");
      return;
    }
    onSuccess?.();
  }

  const fields = (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm sm:col-span-2">
        <span className="font-medium text-navy-700">Nom dépôt *</span>
        <input {...register("name")} className="input-sofi mt-1 w-full" />
      </label>
      <label className="text-sm">
        <span className="font-medium text-navy-700">Ville</span>
        <input {...register("city")} className="input-sofi mt-1 w-full" />
      </label>
      <label className="text-sm">
        <span className="font-medium text-navy-700">Téléphone</span>
        <input {...register("phone")} className="input-sofi mt-1 w-full" />
      </label>
      <label className="text-sm sm:col-span-2">
        <span className="font-medium text-navy-700">Adresse</span>
        <textarea {...register("address")} rows={2} className="input-sofi mt-1 w-full" />
      </label>
      <label className="text-sm">
        <span className="font-medium text-navy-700">Responsable</span>
        <select {...register("managerId")} className="input-sofi mt-1 w-full">
          <option value="">—</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name ?? m.email}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        <span className="font-medium text-navy-700">Capacité max *</span>
        <input type="number" {...register("maxCapacity", { valueAsNumber: true })} className="input-sofi mt-1 w-full" />
      </label>
      <label className="text-sm">
        <span className="font-medium text-navy-700">Type</span>
        <select {...register("depotType")} className="input-sofi mt-1 w-full">
          {(Object.keys(depotTypeLabels) as DepotType[]).map((k) => (
            <option key={k} value={k}>
              {depotTypeLabels[k]}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        <span className="font-medium text-navy-700">Statut</span>
        <select {...register("status")} className="input-sofi mt-1 w-full">
          {(Object.keys(depotStatusLabels) as DepotStatus[]).map((k) => (
            <option key={k} value={k}>
              {depotStatusLabels[k]}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm sm:col-span-2">
        <span className="font-medium text-navy-700">Notes</span>
        <textarea {...register("notes")} rows={2} className="input-sofi mt-1 w-full" />
      </label>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="relative space-y-4">
      {loading && <LoadingOverlay label="Enregistrement en cours…" />}
      {error && <p className="text-sm text-morocco-600">{error}</p>}
      {fields}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={loading} className="btn-sofi-primary disabled:opacity-60">
          <LoadingButtonContent loading={loading} loadingLabel={depotId ? "Enregistrement…" : "Ajout…"}>
            {depotId ? "Enregistrer" : "Ajouter"}
          </LoadingButtonContent>
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-sofi-ghost">
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}
