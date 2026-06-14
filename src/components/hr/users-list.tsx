"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { UserStatusBadge } from "./user-status-badge";
import { TableRowActions } from "@/components/ui/table-row-actions";
import { FilterField, ListFilterToolbar, countActiveFilters } from "@/components/ui/list-filters";
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
import type { AccountStatus } from "@/generated/prisma/enums";

type RoleOption = { id: string; name: string };

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  accountStatus: AccountStatus;
  lastLoginAt: string | null;
  roleId: string | null;
  employee: { firstName: string; lastName: string } | null;
  appRole: { id: string; name: string } | null;
};

const initialFilters = { roleId: "", accountStatus: "" };

export function UsersList({
  roles,
  canCreate,
  canEdit,
  canManagePermissions,
}: {
  roles: RoleOption[];
  canCreate: boolean;
  canEdit: boolean;
  canManagePermissions: boolean;
}) {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);

  const activeCount = countActiveFilters(filters);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-xl text-navy-950">Utilisateurs</h3>
        {canCreate && (
          <Link
            href="/dashboard/settings/users/new"
            className="rounded-lg bg-gradient-to-r from-gold-600 to-gold-500 px-4 py-2 text-sm font-semibold text-navy-950"
          >
            + Nouvel utilisateur
          </Link>
        )}
      </div>

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
            <option value="DISABLED">Désactivé</option>
            <option value="PENDING">En attente</option>
            <option value="BLOCKED">Bloqué</option>
          </select>
        </FilterField>
      </ListFilterToolbar>

      <ListDataShell loading={loading} loadingLabel="Chargement des utilisateurs…" empty={rows.length === 0} emptyMessage="Aucun utilisateur trouvé.">
        <ListDesktopTable>
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
                      editHref={
                        canManagePermissions ? `/dashboard/settings/users/${u.id}/permissions` : undefined
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
        </ListDesktopTable>
        <ListMobileCards>
          {rows.map((u) => (
            <ListCard key={u.id}>
              <ListCardHeader
                title={u.employee ? `${u.employee.firstName} ${u.employee.lastName}` : u.name ?? u.username}
                subtitle={u.email}
                badge={<UserStatusBadge status={u.accountStatus} />}
              />
              <ListCardBody>
                <ListCardField label="Rôle" value={u.appRole?.name ?? "—"} />
                <ListCardField
                  label="Dernière connexion"
                  value={u.lastLoginAt ? format(new Date(u.lastLoginAt), "dd/MM/yy HH:mm", { locale: fr }) : "—"}
                  fullWidth
                />
              </ListCardBody>
              <ListCardFooter>
                <TableRowActions
                  detailHref={`/dashboard/settings/users/${u.id}`}
                  editHref={canManagePermissions ? `/dashboard/settings/users/${u.id}/permissions` : undefined}
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
              </ListCardFooter>
            </ListCard>
          ))}
        </ListMobileCards>
      </ListDataShell>
    </div>
  );
}
