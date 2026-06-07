"use client";
import { LoadingState } from "@/components/ui/loading";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { jobFunctionLabels } from "@/lib/employee-labels";
import { EmployeeStatusBadge } from "./employee-status-badge";
import { TableRowActions } from "@/components/ui/table-row-actions";
import { FilterField, ListFilterToolbar, countActiveFilters } from "@/components/ui/list-filters";
import type { EmployeeJobFunction, EmployeeStatus } from "@/generated/prisma/enums";

type DepotOption = { id: string; name: string };

type EmployeeRow = {
  id: string;
  reference: string;
  firstName: string;
  lastName: string;
  jobFunction: EmployeeJobFunction;
  status: EmployeeStatus;
  depot: { id: string; name: string } | null;
  user: { id: string } | null;
};

const initialFilters = { status: "", function: "", depotId: "" };

export function EmployeesList({
  depots,
  canCreate,
}: {
  depots: DepotOption[];
  canCreate: boolean;
}) {
  const [rows, setRows] = useState<EmployeeRow[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);

  const activeCount = countActiveFilters(filters);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (filters.status) params.set("status", filters.status);
    if (filters.function) params.set("function", filters.function);
    if (filters.depotId) params.set("depotId", filters.depotId);
    const res = await fetch(`/api/employees?${params}`);
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
        <h3 className="font-display text-xl text-navy-950">Salariés</h3>
        {canCreate && (
          <Link
            href="/dashboard/settings/employees/new"
            className="rounded-lg bg-gradient-to-r from-gold-600 to-gold-500 px-4 py-2 text-sm font-semibold text-navy-950"
          >
            + Ajouter un salarié
          </Link>
        )}
      </div>

      <ListFilterToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Recherche rapide : nom, réf., CIN, téléphone…"
        activeFiltersCount={activeCount}
        onResetFilters={() => setFilters(initialFilters)}
      >
        <FilterField label="Statut">
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            className="input-sofi w-full"
          >
            <option value="">Tous</option>
            <option value="ACTIVE">Actif</option>
            <option value="INACTIVE">Inactif</option>
            <option value="ARCHIVED">Archivé</option>
          </select>
        </FilterField>
        <FilterField label="Fonction">
          <select
            value={filters.function}
            onChange={(e) => setFilters((f) => ({ ...f, function: e.target.value }))}
            className="input-sofi w-full"
          >
            <option value="">Toutes</option>
            {(Object.keys(jobFunctionLabels) as EmployeeJobFunction[]).map((k) => (
              <option key={k} value={k}>
                {jobFunctionLabels[k]}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Dépôt">
          <select
            value={filters.depotId}
            onChange={(e) => setFilters((f) => ({ ...f, depotId: e.target.value }))}
            className="input-sofi w-full"
          >
            <option value="">Tous</option>
            {depots.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </FilterField>
      </ListFilterToolbar>

      <div className="overflow-hidden rounded-xl border border-navy-950/10 bg-white shadow-sm">
        {loading ? (
          <LoadingState label="Chargement des salariés…" />
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-navy-500">Aucun salarié trouvé.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-cream-100 text-xs font-semibold uppercase text-navy-600">
              <tr>
                <th className="px-4 py-3">Réf.</th>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Fonction</th>
                <th className="px-4 py-3">Dépôt</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Compte</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-950/5">
              {rows.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3 font-mono text-xs">{e.reference}</td>
                  <td className="px-4 py-3 font-medium">
                    {e.firstName} {e.lastName}
                  </td>
                  <td className="px-4 py-3">{jobFunctionLabels[e.jobFunction]}</td>
                  <td className="px-4 py-3 text-navy-600">{e.depot?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <EmployeeStatusBadge status={e.status} />
                  </td>
                  <td className="px-4 py-3 text-navy-600">{e.user ? "Oui" : "Non"}</td>
                  <td className="px-4 py-3">
                    <TableRowActions
                      detailHref={`/dashboard/settings/employees/${e.id}`}
                      editHref={`/dashboard/settings/employees/${e.id}/edit`}
                      archive={{
                        url: `/api/employees/${e.id}/archive`,
                        method: "PATCH",
                        confirmMessage: `Archiver ${e.firstName} ${e.lastName} ?`,
                        disabled: e.status === "ARCHIVED",
                      }}
                      onComplete={load}
                    />
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
