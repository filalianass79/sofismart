"use client";
import { LoadingState, LoadingOverlay, LoadingButtonContent } from "@/components/ui/loading";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { CatalogImageUpload } from "@/components/settings/catalog-image-upload";
import type { BrandOption } from "@/lib/vehicle-catalog";

type ModelRow = {
  id: string;
  label: string;
  brandId: string;
  photo: string | null;
  brand: { label: string };
};

export function ModelsManager() {
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [rows, setRows] = useState<ModelRow[]>([]);
  const [brandId, setBrandId] = useState("");
  const [label, setLabel] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterBrandId, setFilterBrandId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [bRes, mRes] = await Promise.all([
      fetch("/api/brands"),
      fetch(filterBrandId ? `/api/vehicle-models?brandId=${filterBrandId}` : "/api/vehicle-models"),
    ]);
    if (bRes.ok) setBrands(await bRes.json());
    if (mRes.ok) setRows(await mRes.json());
    setLoading(false);
  }, [filterBrandId]);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setBrandId("");
    setLabel("");
    setPhoto(null);
    setEditId(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const body = { label: label.trim(), brandId, photo };
    const res = await fetch(editId ? `/api/vehicle-models/${editId}` : "/api/vehicle-models", {
      method: editId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      resetForm();
      load();
    } else {
      const j = await res.json().catch(() => ({}));
      alert(j.error ?? "Erreur");
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Supprimer ce modèle ?")) return;
    const res = await fetch(`/api/vehicle-models/${id}`, { method: "DELETE" });
    if (res.ok) load();
    else {
      const j = await res.json().catch(() => ({}));
      alert(j.error ?? "Erreur");
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={onSubmit}
        className="relative rounded-xl border border-navy-950/10 bg-white p-5 shadow-sm ring-1 ring-gold-500/10"
      >
        {saving && <LoadingOverlay label="Enregistrement en cours…" />}
        <h3 className="font-display text-lg text-navy-950">
          {editId ? "Modifier le modèle" : "Nouveau modèle"}
        </h3>
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(140px,1fr)_minmax(180px,1.5fr)_auto_auto] lg:items-end">
          <label className="text-sm">
            <span className="font-medium text-navy-700">Marque *</span>
            <select value={brandId} onChange={(e) => setBrandId(e.target.value)} required className="input-sofi mt-1 w-full">
              <option value="">— Choisir —</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="font-medium text-navy-700">Libellé *</span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              placeholder="Ex. Classe C"
              className="input-sofi mt-1 w-full"
            />
          </label>
          <CatalogImageUpload label="Photo" value={photo} onChange={setPhoto} aspect="wide" />
          <section className="flex flex-wrap gap-2 lg:flex-col">
            <button type="submit" disabled={saving} className="btn-sofi-primary w-full lg:w-auto">
              <Plus className="h-4 w-4" />
              <LoadingButtonContent loading={saving} loadingLabel="Enregistrement…">
                {editId ? "Enregistrer" : "Ajouter"}
              </LoadingButtonContent>
            </button>
            {editId && (
              <button type="button" onClick={resetForm} className="btn-sofi-ghost w-full lg:w-auto">
                Annuler
              </button>
            )}
          </section>
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-navy-950/10 bg-cream-50/60 px-4 py-3">
        <label className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium text-navy-700">Filtrer par marque</span>
          <select value={filterBrandId} onChange={(e) => setFilterBrandId(e.target.value)} className="input-sofi min-w-[160px]">
            <option value="">Toutes les marques</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </label>
        {brands.length === 0 && (
          <p className="text-xs text-navy-500">
            Créez d&apos;abord une marque dans{" "}
            <Link href="/dashboard/settings/brands" className="text-gold-700 hover:underline">
              Marques
            </Link>
            .
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-navy-950/10 bg-white shadow-sm">
        {loading ? (
          <LoadingState label="Chargement des modèles…" />
        ) : rows.length === 0 ? (
          <p className="p-12 text-center text-sm text-navy-500">Aucun modèle pour ce filtre.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-cream-100 text-xs font-semibold uppercase tracking-wide text-navy-600">
              <tr>
                <th className="px-4 py-3">Photo</th>
                <th className="px-4 py-3">Marque</th>
                <th className="px-4 py-3">Modèle</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-950/5">
              {rows.map((m) => (
                <tr key={m.id} className="transition-colors hover:bg-cream-50/80">
                  <td className="px-4 py-3">
                    {m.photo ? (
                      <span className="relative block h-10 w-14 overflow-hidden rounded-md border border-navy-950/10">
                        <Image src={m.photo} alt="" fill className="object-cover" />
                      </span>
                    ) : (
                      <span className="text-navy-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-navy-600">{m.brand.label}</td>
                  <td className="px-4 py-3 font-medium text-navy-900">{m.label}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setEditId(m.id);
                        setBrandId(m.brandId);
                        setLabel(m.label);
                        setPhoto(m.photo);
                      }}
                      className="rounded-lg p-2 hover:bg-navy-950/5"
                    >
                      <Pencil className="h-4 w-4 text-navy-600" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(m.id)}
                      className="rounded-lg p-2 hover:bg-morocco-500/10"
                    >
                      <Trash2 className="h-4 w-4 text-morocco-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
