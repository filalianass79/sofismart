"use client";
import { LoadingState } from "@/components/ui/loading";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus } from "lucide-react";
import { UserStatusBadge } from "@/components/hr/user-status-badge";
import { UserWizard } from "@/components/hr/user-wizard";
import { UserPermissionsEditor } from "@/app/dashboard/settings/users/[id]/permissions/user-permissions-editor";
import { TableRowActions } from "@/components/ui/table-row-actions";
import { FilterField, ListFilterToolbar, countActiveFilters } from "@/components/ui/list-filters";
import type { AccountStatus } from "@/generated/prisma/enums";

type RoleOption = { id: string; name: string; code: string };
type EmployeeOption = {
  id: string;
  reference: string;
  firstName: string;
  lastName: string;
  professionalEmail: string | null;
  personalEmail: string | null;
  phone: string | null;
  jobFunction: string;
};

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  accountStatus: AccountStatus;
  lastLoginAt: string | null;
  employee: { firstName: string; lastName: string } | null;
  appRole: { id: string; name: string } | null;
};

type Perm = { id: string; module: string; action: string };

const initialFilters = { roleId: "", accountStatus: "" };
const settingsFormCard =
  "rounded-xl border border-navy-950/10 bg-white p-5 shadow-sm ring-1 ring-gold-500/10";

export function UsersManager({
  employees: initialEmployees,
  roles,
  canCreate,
  canEdit,
  canManagePermissions,
}: {
  employees: EmployeeOption[];
  roles: RoleOption[];
  canCreate: boolean;
  canEdit: boolean;
  canManagePermissions: boolean;
}) {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [employees, setEmployees] = useState(initialEmployees);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [permissionsUserId, setPermissionsUserId] = useState<string | null>(null);
  const [permissionsUserEmail, setPermissionsUserEmail] = useState("");
  const [allPermissions, setAllPermissions] = useState<Perm[]>([]);
  const [userPermissions, setUserPermissions] = useState<{ permissionId: string; allowed: boolean }[]>([]);
  const [loadingPerms, setLoadingPerms] = useState(false);

  const activeCount = countActiveFilters(filters);
  const panelOpen = formOpen || !!permissionsUserId;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (filters.roleId) params.set("roleId", filters.roleId);
    if (filters.accountStatus) params.set("accountStatus", filters.accountStatus);
    const res = await fetch(`/api/users?${params}`);
    if (res.ok) setRows(await res.json());
    setLoading(false);
  }, [search, filters]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function refreshEmployees() {
    const linkedRes = await fetch("/api/users");
    if (!linkedRes.ok) return;
    const users: { employeeId: string | null }[] = await linkedRes.json();
    const linked = new Set(users.map((u) => u.employeeId).filter(Boolean));
    const empRes = await fetch("/api/employees?status=ACTIVE");
    if (empRes.ok) {
      const all = await empRes.json();
      setEmployees(all.filter((e: { id: string }) => !linked.has(e.id)));
    }
  }

  function closePanel() {
    setFormOpen(false);
    setPermissionsUserId(null);
    setPermissionsUserEmail("");
    setUserPermissions([]);
  }

  async function openCreate() {
    await refreshEmployees();
    setPermissionsUserId(null);
    setFormOpen(true);
  }

  async function openPermissions(userId: string, email: string) {
    setFormOpen(false);
    setPermissionsUserId(userId);
    setPermissionsUserEmail(email);
    setLoadingPerms(true);
    const [pRes, uRes] = await Promise.all([
      fetch("/api/permissions"),
      fetch(`/api/users/${userId}/permissions`),
    ]);
    setLoadingPerms(false);
    if (pRes.ok) setAllPermissions(await pRes.json());
    if (uRes.ok) {
      const rows = await uRes.json();
      setUserPermissions(
        rows.map((r: { permissionId: string; allowed: boolean }) => ({
          permissionId: r.permissionId,
          allowed: r.allowed,
        }))
      );
    }
  }

  return (
    <article className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-xl text-navy-950">Utilisateurs</h3>
        {canCreate && !panelOpen && (
          <button type="button" onClick={openCreate} className="btn-sofi-primary">
            <Plus className="h-4 w-4" />
            Nouvel utilisateur
          </button>
        )}
      </header>

      {formOpen && (
        <section className={settingsFormCard}>
          <h4 className="font-display text-lg text-navy-950">Nouvel utilisateur</h4>
          <div className="mt-4">
            <UserWizard
              employees={employees}
              roles={roles}
              onSuccess={() => {
                closePanel();
                load();
              }}
              onCancel={closePanel}
            />
          </div>
        </section>
      )}

      {permissionsUserId && (
        <section className={settingsFormCard}>
          <h4 className="font-display text-lg text-navy-950">Permissions — {permissionsUserEmail}</h4>
          <p className="mt-1 text-sm text-navy-600">
            Ajustez les droits spécifiques de ce compte (en complément du rôle).
          </p>
          {loadingPerms ? (
            <LoadingState label="Chargement des permissions…" minHeight="min-h-[8rem]" size="sm" />
          ) : (
            <div className="mt-4">
              <UserPermissionsEditor
                key={permissionsUserId}
                userId={permissionsUserId}
                permissions={allPermissions}
                userPermissions={userPermissions}
                onSaved={closePanel}
                onCancel={closePanel}
              />
            </div>
          )}
        </section>
      )}

      <ListFilterToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Recherche rapide : email, nom, salarié…"
        activeFiltersCount={activeCount}
        onResetFilters={() => setFilters(initialFilters)}
      >
        <FilterField label="Rôle">
          <select
            value={filters.roleId}
            onChange={(e) => setFilters((f) => ({ ...f, roleId: e.target.value }))}
            className="input-sofi w-full"
          >
            <option value="">Tous</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Statut compte">
          <select
            value={filters.accountStatus}
            onChange={(e) => setFilters((f) => ({ ...f, accountStatus: e.target.value }))}
            className="input-sofi w-full"
          >
            <option value="">Tous</option>
            <option value="ACTIVE">Actif</option>
            <option value="INACTIVE">Inactif</option>
            <option value="LOCKED">Verrouillé</option>
          </select>
        </FilterField>
      </ListFilterToolbar>

      <section className="overflow-hidden rounded-xl border border-navy-950/10 bg-white shadow-sm">
        {loading ? (
          <LoadingState label="Chargement des utilisateurs…" />
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-navy-500">Aucun utilisateur trouvé.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-cream-100 text-xs font-semibold uppercase text-navy-600">
              <tr>
                <th className="px-4 py-3">Salarié</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rôle</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Dernière connexion</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-950/5">
              {rows.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium">
                    {u.employee
                      ? `${u.employee.firstName} ${u.employee.lastName}`
                      : u.name ?? u.username}
                  </td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.appRole?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <UserStatusBadge status={u.accountStatus} />
                  </td>
                  <td className="px-4 py-3 text-navy-600">
                    {u.lastLoginAt
                      ? format(new Date(u.lastLoginAt), "dd/MM/yy HH:mm", { locale: fr })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <TableRowActions
                      detailHref={`/dashboard/settings/users/${u.id}`}
                      onEdit={
                        canManagePermissions ? () => openPermissions(u.id, u.email) : undefined
                      }
                      archive={
                        canEdit && u.accountStatus === "ACTIVE"
                          ? {
                              url: `/api/users/${u.id}/deactivate`,
                              method: "PATCH",
                              confirmMessage: "Désactiver ce compte utilisateur ?",
                              title: "Désactiver",
                            }
                          : undefined
                      }
                      onComplete={load}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </article>
  );
}
