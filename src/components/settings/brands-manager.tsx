"use client";
import { LoadingState, LoadingOverlay, LoadingButtonContent } from "@/components/ui/loading";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { CatalogImageUpload } from "@/components/settings/catalog-image-upload";
type BrandRow = {
  id: string;
  label: string;
  logo: string | null;
  _count?: { models: number; vehicles: number };
};

export function BrandsManager() {
  const [rows, setRows] = useState<BrandRow[]>([]);
  const [label, setLabel] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/brands");
    if (res.ok) setRows(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setLabel("");
    setLogo(null);
    setEditId(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const body = { label: label.trim(), logo };
    const res = await fetch(editId ? `/api/brands/${editId}` : "/api/brands", {
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
    if (!confirm("Supprimer cette marque ?")) return;
    const res = await fetch(`/api/brands/${id}`, { method: "DELETE" });
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
          {editId ? "Modifier la marque" : "Nouvelle marque"}
        </h3>
        <p className="mt-0.5 text-xs text-navy-500">Logo affiché sur la fiche véhicule et dans Paramètres.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <label className="text-sm">
            <span className="font-medium text-navy-700">Libellé *</span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              placeholder="Ex. Mercedes-Benz"
              className="input-sofi mt-1 w-full"
            />
          </label>
          <CatalogImageUpload label="Logo" value={logo} onChange={setLogo} aspect="square" />
          <div className="flex flex-wrap gap-2 sm:flex-col">
            <button type="submit" disabled={saving} className="btn-sofi-primary w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              <LoadingButtonContent loading={saving} loadingLabel="Enregistrement…">
                {editId ? "Enregistrer" : "Ajouter"}
              </LoadingButtonContent>
            </button>
            {editId && (
              <button type="button" onClick={resetForm} className="btn-sofi-ghost w-full sm:w-auto">
                Annuler
              </button>
            )}
          </div>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-navy-950/10 bg-white shadow-sm">
        {loading ? (
          <LoadingState label="Chargement du catalogue…" />
        ) : rows.length === 0 ? (
          <p className="p-12 text-center text-sm text-navy-500">
            Aucune marque. Ajoutez la première ci-dessus, puis créez les modèles dans{" "}
            <Link href="/dashboard/settings/models" className="font-medium text-gold-700 hover:underline">
              Modèles
            </Link>
            .
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-cream-100 text-xs font-semibold uppercase tracking-wide text-navy-600">
              <tr>
                <th className="px-4 py-3">Logo</th>
                <th className="px-4 py-3">Libellé</th>
                <th className="px-4 py-3 text-right">Modèles</th>
                <th className="px-4 py-3 text-right">Véhicules</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-950/5">
              {rows.map((b) => (
                <tr key={b.id} className="transition-colors hover:bg-cream-50/80">
                  <td className="px-4 py-3">
                    {b.logo ? (
                      <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-navy-950/10 bg-cream-50">
                        <Image src={b.logo} alt="" fill className="object-contain p-1" />
                      </div>
                    ) : (
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-navy-950/5 text-xs font-bold text-navy-400">
                        {b.label.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-navy-900">{b.label}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-navy-600">{b._count?.models ?? 0}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-navy-600">{b._count?.vehicles ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setEditId(b.id);
                        setLabel(b.label);
                        setLogo(b.logo);
                      }}
                      className="rounded-lg p-2 text-navy-600 hover:bg-navy-950/5"
                      title="Modifier"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(b.id)}
                      className="rounded-lg p-2 hover:bg-morocco-500/10"
                      title="Supprimer"
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
