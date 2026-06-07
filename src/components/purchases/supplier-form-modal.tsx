"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import {
  supplierCreateSchema,
  type SupplierCreateValues,
} from "@/lib/validations/purchase";
import { supplierTypeLabels } from "@/lib/purchase-labels";
import type { SupplierType } from "@/generated/prisma/enums";
import { LoadingOverlay, LoadingButtonContent } from "@/components/ui/loading";

type Supplier = SupplierCreateValues & { id: string };

export function SupplierFormModal({
  open,
  onClose,
  onSaved,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (s: Supplier) => void;
  initial?: Partial<SupplierCreateValues> & { id?: string };
}) {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SupplierCreateValues>({
    resolver: zodResolver(supplierCreateSchema),
    defaultValues: {
      type: "DEALERSHIP",
      country: "Maroc",
      ...initial,
    },
  });

  const type = watch("type");

  if (!open) return null;

  async function onSubmit(data: SupplierCreateValues) {
    setError(null);
    const url = initial?.id ? `/api/suppliers/${initial.id}` : "/api/suppliers";
    const res = await fetch(url, {
      method: initial?.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(j.error ?? "Erreur");
      return;
    }
    onSaved(j);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-navy-950/10 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-navy-950/10 px-5 py-4">
          <h3 className="font-display text-xl text-navy-950">
            {initial?.id ? "Modifier le fournisseur" : "Nouveau fournisseur"}
          </h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-navy-950/5">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="relative space-y-3 p-5">
          {isSubmitting && <LoadingOverlay label="Enregistrement en cours…" className="rounded-b-xl" />}
          {error && (
            <p className="rounded-lg bg-morocco-500/10 px-3 py-2 text-sm text-morocco-700">{error}</p>
          )}
          <label className="block text-sm">
            <span className="text-navy-700">Type *</span>
            <select {...register("type")} className="input-sofi mt-1 w-full">
              {(Object.keys(supplierTypeLabels) as SupplierType[]).map((t) => (
                <option key={t} value={t}>
                  {supplierTypeLabels[t]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-navy-700">Nom / raison sociale *</span>
            <input {...register("name")} className="input-sofi mt-1 w-full" />
            {errors.name && <p className="mt-1 text-xs text-morocco-600">{errors.name.message}</p>}
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-navy-700">CIN{type === "INDIVIDUAL" ? " *" : ""}</span>
              <input {...register("cin")} className="input-sofi mt-1 w-full" />
              {errors.cin && <p className="mt-1 text-xs text-morocco-600">{errors.cin.message}</p>}
            </label>
            <label className="block text-sm">
              <span className="text-navy-700">ICE</span>
              <input {...register("ice")} className="input-sofi mt-1 w-full" />
            </label>
            <label className="block text-sm">
              <span className="text-navy-700">RC</span>
              <input {...register("rc")} className="input-sofi mt-1 w-full" />
            </label>
            <label className="block text-sm">
              <span className="text-navy-700">Identifiant fiscal</span>
              <input {...register("taxId")} className="input-sofi mt-1 w-full" />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-navy-700">Téléphone</span>
              <input {...register("phone")} className="input-sofi mt-1 w-full" />
            </label>
            <label className="block text-sm">
              <span className="text-navy-700">Email</span>
              <input type="email" {...register("email")} className="input-sofi mt-1 w-full" />
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-navy-700">Adresse</span>
            <textarea {...register("address")} rows={2} className="input-sofi mt-1 w-full" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-navy-700">Ville</span>
              <input {...register("city")} className="input-sofi mt-1 w-full" />
            </label>
            <label className="block text-sm">
              <span className="text-navy-700">Pays</span>
              <input {...register("country")} className="input-sofi mt-1 w-full" />
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-navy-700">Notes</span>
            <textarea {...register("notes")} rows={2} className="input-sofi mt-1 w-full" />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-navy-600 hover:bg-navy-950/5">
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-gradient-to-r from-gold-600 to-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 disabled:opacity-60"
            >
              <LoadingButtonContent loading={isSubmitting} loadingLabel="Enregistrement…">
                Enregistrer
              </LoadingButtonContent>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
