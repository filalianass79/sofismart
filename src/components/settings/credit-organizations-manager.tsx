"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { LoadingOverlay, LoadingButtonContent } from "@/components/ui/loading";
import {
  ListCard,
  ListCardBody,
  ListCardField,
  ListCardFooter,
  ListCardHeader,
  ListDataShell,
  ListDesktopTable,
  ListMobileCards,
} from "@/components/ui/responsive-list";
import { scrollPageToTop } from "@/lib/scroll-to-top";

type CreditOrgRow = {
  id: string;
  name: string;
  code: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  isActive: boolean;
  notes: string | null;
  _count?: { sales: number; proformas: number };
};

const emptyForm = {
  name: "",
  code: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  isActive: true,
  notes: "",
};

export function CreditOrganizationsManager({
  canCreate = false,
  canEdit = false,
  canDelete = false,
}: {
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}) {
  const [rows, setRows] = useState<CreditOrgRow[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/credit-organizations");
    if (res.ok) setRows(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setForm(emptyForm);
    setEditId(null);
  }

  function startEdit(row: CreditOrgRow) {
    setEditId(row.id);
    setForm({
      name: row.name,
      code: row.code ?? "",
      phone: row.phone ?? "",
      email: row.email ?? "",
      address: row.address ?? "",
      city: row.city ?? "",
      isActive: row.isActive,
      notes: row.notes ?? "",
    });
    scrollPageToTop();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const body = {
      ...form,
      code: form.code.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      notes: form.notes.trim() || null,
    };
    const res = await fetch(editId ? `/api/credit-organizations/${editId}` : "/api/credit-organizations", {
      method: editId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      resetForm();
      void load();
    } else {
      const j = await res.json().catch(() => ({}));
      alert(j.error ?? "Erreur");
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Supprimer cet organisme de crédit ?")) return;
    const res = await fetch(`/api/credit-organizations/${id}`, { method: "DELETE" });
    if (res.ok) void load();
    else {
      const j = await res.json().catch(() => ({}));
      alert(j.error ?? "Erreur");
    }
  }

  return (
    <div className="space-y-6">
      {(canCreate || canEdit) && (
        <form
          onSubmit={onSubmit}
          className="relative rounded-xl border border-navy-950/10 bg-white p-5 shadow-sm ring-1 ring-gold-500/10"
        >
          {saving && <LoadingOverlay label="Enregistrement en cours…" />}
          <h3 className="font-display text-lg text-navy-950">
            {editId ? "Modifier l'organisme" : "Nouvel organisme de crédit"}
          </h3>
          <p className="mt-0.5 text-xs text-navy-500">
            Banques et sociétés de financement utilisées sur les factures de vente et proformas.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm sm:col-span-2">
              <span className="font-medium text-navy-700">Nom *</span>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                placeholder="Ex. Crédit Agricole du Maroc"
                className="input-sofi mt-1 w-full"
              />
            </label>
            <label className="text-sm">
              <span className="font-medium text-navy-700">Code</span>
              <input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="Ex. CAM"
                className="input-sofi mt-1 w-full"
              />
            </label>
            <label className="text-sm">
              <span className="font-medium text-navy-700">Ville</span>
              <input
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className="input-sofi mt-1 w-full"
              />
            </label>
            <label className="text-sm">
              <span className="font-medium text-navy-700">Téléphone</span>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="input-sofi mt-1 w-full"
              />
            </label>
            <label className="text-sm">
              <span className="font-medium text-navy-700">E-mail</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="input-sofi mt-1 w-full"
              />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="font-medium text-navy-700">Adresse</span>
              <input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="input-sofi mt-1 w-full"
              />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="font-medium text-navy-700">Notes</span>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="input-sofi mt-1 w-full"
              />
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              Actif (proposé lors de la création de vente / proforma)
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="submit" disabled={saving} className="btn-sofi-primary">
              <Plus className="h-4 w-4" />
              <LoadingButtonContent loading={saving} loadingLabel="Enregistrement…">
                {editId ? "Enregistrer" : "Ajouter"}
              </LoadingButtonContent>
            </button>
            {editId && (
              <button type="button" onClick={resetForm} className="btn-sofi-ghost">
                Annuler
              </button>
            )}
          </div>
        </form>
      )}

      <ListDataShell loading={loading} empty={rows.length === 0} emptyMessage="Aucun organisme de crédit">
        <ListDesktopTable>
          <thead>
            <tr className="border-b border-navy-950/10 text-left text-xs uppercase tracking-wide text-navy-500">
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Usage</th>
              {(canEdit || canDelete) && <th className="px-4 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-navy-950/5 hover:bg-cream-50/80">
                <td className="px-4 py-3 font-medium">{row.name}</td>
                <td className="px-4 py-3 text-navy-600">{row.code ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-navy-600">
                  {[row.phone, row.email].filter(Boolean).join(" · ") || "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      row.isActive
                        ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800"
                        : "rounded-full bg-navy-100 px-2 py-0.5 text-xs font-semibold text-navy-600"
                    }
                  >
                    {row.isActive ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-navy-600">
                  {(row._count?.sales ?? 0) + (row._count?.proformas ?? 0)} doc.
                </td>
                {(canEdit || canDelete) && (
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {canEdit && (
                        <button type="button" onClick={() => startEdit(row)} className="rounded p-1.5 hover:bg-navy-950/5">
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button type="button" onClick={() => void onDelete(row.id)} className="rounded p-1.5 hover:bg-morocco-50">
                          <Trash2 className="h-4 w-4 text-morocco-600" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </ListDesktopTable>

        <ListMobileCards>
          {rows.map((row) => (
            <ListCard key={row.id}>
              <ListCardHeader title={row.name} subtitle={row.code ?? undefined} />
              <ListCardBody>
                <ListCardField label="Contact" value={[row.phone, row.email].filter(Boolean).join(" · ") || "—"} />
                <ListCardField label="Statut" value={row.isActive ? "Actif" : "Inactif"} />
              </ListCardBody>
              {(canEdit || canDelete) && (
                <ListCardFooter>
                  {canEdit && (
                    <button type="button" onClick={() => startEdit(row)} className="btn-sofi-ghost text-sm">
                      Modifier
                    </button>
                  )}
                  {canDelete && (
                    <button type="button" onClick={() => void onDelete(row.id)} className="text-sm text-morocco-600">
                      Supprimer
                    </button>
                  )}
                </ListCardFooter>
              )}
            </ListCard>
          ))}
        </ListMobileCards>
      </ListDataShell>
    </div>
  );
}
