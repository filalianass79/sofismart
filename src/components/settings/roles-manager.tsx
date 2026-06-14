"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { RolePermissionsEditor } from "@/app/dashboard/settings/roles/[id]/permissions/role-permissions-editor";
import { LoadingState, LoadingOverlay, LoadingButtonContent } from "@/components/ui/loading";
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

type RoleRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  _count?: { users: number };
};

type Perm = { id: string; module: string; action: string };

const settingsFormCard =
  "rounded-xl border border-navy-950/10 bg-white p-5 shadow-sm ring-1 ring-gold-500/10";

export function RolesManager() {
  const [rows, setRows] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [permissionsRoleId, setPermissionsRoleId] = useState<string | null>(null);
  const [permissionsRoleName, setPermissionsRoleName] = useState("");
  const [allPermissions, setAllPermissions] = useState<Perm[]>([]);
  const [rolePermissions, setRolePermissions] = useState<{ permissionId: string; allowed: boolean }[]>([]);
  const [loadingPerms, setLoadingPerms] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/roles");
    if (res.ok) setRows(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function closePanels() {
    setFormOpen(false);
    setPermissionsRoleId(null);
    setCode("");
    setName("");
    setDescription("");
  }

  async function onCreateRole(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim(), name: name.trim(), description: description.trim() || null }),
    });
    setSaving(false);
    if (res.ok) {
      closePanels();
      load();
      scrollPageToTop();
    } else {
      const j = await res.json().catch(() => ({}));
      alert((j as { error?: string }).error ?? "Erreur");
    }
  }

  async function openPermissions(role: RoleRow) {
    setFormOpen(false);
    setPermissionsRoleId(role.id);
    setPermissionsRoleName(role.name);
    setLoadingPerms(true);
    const [pRes, rRes] = await Promise.all([
      fetch("/api/permissions"),
      fetch(`/api/roles/${role.id}/permissions`),
    ]);
    setLoadingPerms(false);
    if (pRes.ok) setAllPermissions(await pRes.json());
    if (rRes.ok) {
      const data = await rRes.json();
      setRolePermissions(
        data.map((r: { permissionId: string; allowed: boolean }) => ({
          permissionId: r.permissionId,
          allowed: r.allowed,
        }))
      );
    }
  }

  const panelOpen = formOpen || !!permissionsRoleId;

  return (
    <article className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-xl text-navy-950">Rôles</h3>
        {!panelOpen && (
          <button
            type="button"
            onClick={() => {
              setPermissionsRoleId(null);
              setFormOpen(true);
            }}
            className="btn-sofi-primary"
          >
            <Plus className="h-4 w-4" />
            Nouveau rôle
          </button>
        )}
      </header>

      {formOpen && (
        <form onSubmit={onCreateRole} className={`relative ${settingsFormCard}`}>
          {saving && <LoadingOverlay label="Création du rôle…" />}
          <h4 className="font-display text-lg text-navy-950">Nouveau rôle</h4>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="font-medium text-navy-700">Code *</span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                placeholder="EX. VENDEUR"
                className="input-sofi mt-1 w-full font-mono uppercase"
              />
            </label>
            <label className="text-sm">
              <span className="font-medium text-navy-700">Nom *</span>
              <input value={name} onChange={(e) => setName(e.target.value)} required className="input-sofi mt-1 w-full" />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="font-medium text-navy-700">Description</span>
              <input value={description} onChange={(e) => setDescription(e.target.value)} className="input-sofi mt-1 w-full" />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="submit" disabled={saving} className="btn-sofi-primary disabled:opacity-60">
              <LoadingButtonContent loading={saving} loadingLabel="Enregistrement…">
                Ajouter
              </LoadingButtonContent>
            </button>
            <button type="button" onClick={closePanels} className="btn-sofi-ghost">
              Annuler
            </button>
          </div>
        </form>
      )}

      {permissionsRoleId && (
        <section className={settingsFormCard}>
          <h4 className="font-display text-lg text-navy-950">Permissions — {permissionsRoleName}</h4>
          {loadingPerms ? (
            <LoadingState label="Chargement des permissions…" minHeight="min-h-[8rem]" size="sm" />
          ) : (
            <div className="mt-4">
              <RolePermissionsEditor
                key={permissionsRoleId}
                roleId={permissionsRoleId}
                permissions={allPermissions}
                rolePermissions={rolePermissions}
                onSaved={closePanels}
                onCancel={closePanels}
              />
            </div>
          )}
        </section>
      )}

      <ListDataShell loading={loading} loadingLabel="Chargement des rôles…" empty={rows.length === 0} emptyMessage="Aucun rôle.">
        <ListDesktopTable>
          <table className="w-full text-left text-sm">
            <thead className="bg-cream-100 text-xs font-semibold uppercase text-navy-600">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3 text-right">Utilisateurs</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-950/5">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-cream-50/80">
                  <td className="px-4 py-3 font-mono text-xs">{r.code}</td>
                  <td className="px-4 py-3 font-medium text-navy-900">{r.name}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r._count?.users ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openPermissions(r)}
                      className="text-sm font-medium text-gold-700 hover:underline"
                    >
                      Modifier les permissions
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ListDesktopTable>
        <ListMobileCards>
          {rows.map((r) => (
            <ListCard key={r.id}>
              <ListCardHeader title={r.name} subtitle={r.code} />
              <ListCardBody>
                <ListCardField label="Code" value={r.code} />
                <ListCardField label="Utilisateurs" value={r._count?.users ?? 0} />
              </ListCardBody>
              <ListCardFooter>
                <button
                  type="button"
                  onClick={() => openPermissions(r)}
                  className="text-sm font-medium text-gold-700 hover:underline"
                >
                  Modifier les permissions
                </button>
              </ListCardFooter>
            </ListCard>
          ))}
        </ListMobileCards>
      </ListDataShell>
    </article>
  );
}
