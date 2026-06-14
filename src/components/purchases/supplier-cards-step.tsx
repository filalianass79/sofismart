"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Building2, Phone, Hash } from "lucide-react";
import { supplierTypeLabels } from "@/lib/purchase-labels";
import { cn } from "@/lib/utils";
import type { SupplierType } from "@/generated/prisma/enums";

export type SupplierCardRow = {
  id: string;
  name: string;
  type: SupplierType;
  cin?: string | null;
  ice?: string | null;
  rc?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
};

export function SupplierCardsStep({
  suppliers,
  selectedId,
  onSelect,
  onNew,
  error,
}: {
  suppliers: SupplierCardRow[];
  selectedId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  error?: string;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return suppliers;
    return suppliers.filter((s) => {
      const hay = [s.name, s.ice, s.cin, s.rc, s.phone, s.email, s.city, supplierTypeLabels[s.type]]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(term);
    });
  }, [suppliers, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-xl text-navy-950">Choisir un fournisseur</h3>
        <button
          type="button"
          onClick={onNew}
          className="inline-flex items-center gap-2 rounded-lg bg-navy-950 px-4 py-2 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" /> Nouveau fournisseur
        </button>
      </div>

      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher par nom, raison sociale, ICE, CIN, téléphone, email, ville…"
          className="input-sofi w-full pl-10"
          autoFocus
        />
      </label>

      {error && <p className="text-sm text-morocco-600">{error}</p>}

      <p className="text-xs text-navy-500">
        {filtered.length} fournisseur{filtered.length !== 1 ? "s" : ""} — cliquez sur une carte pour continuer
      </p>

      <div
        data-field="supplierId"
        className="grid max-h-[min(420px,50vh)] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3"
      >
        {filtered.map((s) => {
          const active = selectedId === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              className={cn(
                "rounded-xl border p-4 text-left transition-all hover:shadow-md",
                active
                  ? "border-gold-500 bg-gold-500/15 ring-2 ring-gold-400/40"
                  : "border-navy-950/10 bg-white hover:border-gold-400/50 hover:bg-cream-50"
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                    active ? "bg-gold-500 text-navy-950" : "bg-navy-950/5 text-navy-600"
                  )}
                >
                  <Building2 className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-navy-950">{s.name}</p>
                  <p className="mt-0.5 text-xs font-medium text-gold-700">
                    {supplierTypeLabels[s.type]}
                  </p>
                  <div className="mt-2 space-y-0.5 text-xs text-navy-600">
                    {(s.ice || s.cin) && (
                      <p className="flex items-center gap-1">
                        <Hash className="h-3 w-3 shrink-0" />
                        {s.ice ? `ICE ${s.ice}` : `CIN ${s.cin}`}
                      </p>
                    )}
                    {s.phone && (
                      <p className="flex items-center gap-1">
                        <Phone className="h-3 w-3 shrink-0" />
                        {s.phone}
                      </p>
                    )}
                    {s.city && <p>{s.city}</p>}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="rounded-lg border border-dashed border-navy-950/15 py-8 text-center text-sm text-navy-400">
          Aucun fournisseur ne correspond à votre recherche.
        </p>
      )}
    </div>
  );
}
