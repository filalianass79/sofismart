"use client";
import { LoadingState } from "@/components/ui/loading";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { depotTypeLabels } from "@/lib/depot-labels";
import { DepotStatusBadge } from "./depot-status-badge";
import { TableRowActions } from "@/components/ui/table-row-actions";
import { FilterField, ListFilterToolbar, countActiveFilters } from "@/components/ui/list-filters";
import type { DepotStatus, DepotType } from "@/generated/prisma/enums";

type DepotRow = {
  id: string;
  reference: string;
  name: string;
  city: string | null;
  manager: { name: string | null } | null;
  maxCapacity: number;
  vehiclesCount: number;
  remainingCapacity: number;
  capacityAlert: boolean;
  depotType: DepotType;
  status: DepotStatus;
};

const initialFilters = { city: "", status: "", depotType: "" };

export function DepotsList() {
  const [rows, setRows] = useState<DepotRow[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);

  const activeCount = countActiveFilters(filters);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (filters.city) params.set("city", filters.city);
    if (filters.status) params.set("status", filters.status);
    if (filters.depotType) params.set("depotType", filters.depotType);
    const res = await fetch(`/api/depots?${params}`);
    if (res.ok) setRows(await res.json());
    setLoading(false);
  }, [search, filters]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-xl text-navy-950">Dépôts</h3>
        <Link
          href="/dashboard/settings/depots/new"
          className="rounded-lg bg-gradient-to-r from-gold-600 to-gold-500 px-4 py-2 text-sm font-semibold text-navy-950"
        >
          + Nouveau dépôt
        </Link>
      </div>

      <ListFilterToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Recherche rapide : nom, référence, ville…"
        activeFiltersCount={activeCount}
        onResetFilters={() => setFilters(initialFilters)}
      >
        <FilterField label="Ville">
          <input
            value={filters.city}
            onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
            placeholder="Ex. Casablanca"
            className="input-sofi w-full"
          />
        </FilterField>
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
        <FilterField label="Type de dépôt">
          <select
            value={filters.depotType}
            onChange={(e) => setFilters((f) => ({ ...f, depotType: e.target.value }))}
            className="input-sofi w-full"
          >
            <option value="">Tous</option>
            {(Object.keys(depotTypeLabels) as DepotType[]).map((k) => (
              <option key={k} value={k}>
                {depotTypeLabels[k]}
              </option>
            ))}
          </select>
        </FilterField>
      </ListFilterToolbar>

      <div className="overflow-x-auto rounded-xl border border-navy-950/10 bg-white shadow-sm">
        {loading ? (
          <LoadingState label="Chargement des dépôts…" />
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-navy-500">Aucun dépôt trouvé.</p>
        ) : (
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-cream-100 text-xs font-semibold uppercase text-navy-600">
              <tr>
                <th className="px-4 py-3">Réf.</th>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Ville</th>
                <th className="px-4 py-3">Responsable</th>
                <th className="px-4 py-3 text-right">Capacité</th>
                <th className="px-4 py-3 text-right">Stockés</th>
                <th className="px-4 py-3 text-right">Reste</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-950/5">
              {rows.map((d) => (
                <tr key={d.id} className={d.capacityAlert ? "bg-morocco-50/40" : ""}>
                  <td className="px-4 py-3 font-mono text-xs">{d.reference}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-navy-900">{d.name}</span>
                    <p className="text-xs text-navy-500">{depotTypeLabels[d.depotType]}</p>
                  </td>
                  <td className="px-4 py-3">{d.city ?? "—"}</td>
                  <td className="px-4 py-3">{d.manager?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-right">{d.maxCapacity}</td>
                  <td className="px-4 py-3 text-right">{d.vehiclesCount}</td>
                  <td
                    className={`px-4 py-3 text-right font-medium ${d.capacityAlert ? "text-morocco-700" : ""}`}
                  >
                    {d.remainingCapacity}
                    {d.capacityAlert && " ⚠"}
                  </td>
                  <td className="px-4 py-3">
                    <DepotStatusBadge status={d.status} />
                  </td>
                  <td className="px-4 py-3">
                    <TableRowActions
                      detailHref={`/dashboard/settings/depots/${d.id}`}
                      editHref={`/dashboard/settings/depots/${d.id}/edit`}
                      archive={{
                        url: `/api/depots/${d.id}`,
                        method: "DELETE",
                        confirmMessage: `Archiver le dépôt « ${d.name} » ?`,
                        disabled: d.status === "ARCHIVED",
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
