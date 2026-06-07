"use client";
import { LoadingState } from "@/components/ui/loading";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatFinancialMoney } from "@/lib/financial-privacy";
import { formatVehicleTitle } from "@/lib/vehicle-catalog";
import { TableRowActions } from "@/components/ui/table-row-actions";
import { FilterField, ListFilterToolbar, countActiveFilters } from "@/components/ui/list-filters";
import type { VehicleStatus } from "@/generated/prisma/enums";

type DepotOption = { id: string; name: string };

export type VehicleRow = {
  id: string;
  internalRef: string | null;
  brand: { id: string; label: string };
  carModel: { id: string; label: string };
  version?: string | null;
  plate: string | null;
  status: VehicleStatus;
  isArchived?: boolean;
  costPrice: unknown;
  depot: { id: string; name: string };
  purchase?: { id: string; reference?: string } | null;
  sale?: { id: string } | null;
};

const initialFilters = { brandId: "", status: "", depotId: "" };

const statusLabels: Record<VehicleStatus, string> = {
  IN_STOCK: "En stock",
  RESERVED: "Réservé",
  EXIT_PENDING: "Sortie attente",
  SOLD: "Vendu",
  DELIVERED: "Livré",
  IN_REPAIR: "Réparation",
  IN_TRANSIT: "Transit",
  PREPARATION: "Préparation",
};

const statusClasses: Record<VehicleStatus, string> = {
  IN_STOCK: "bg-emerald-500/15 text-emerald-800",
  RESERVED: "bg-amber-500/15 text-amber-900",
  EXIT_PENDING: "bg-gold-500/20 text-gold-900",
  SOLD: "bg-navy-950/10 text-navy-800",
  DELIVERED: "bg-emerald-500/15 text-emerald-800",
  IN_REPAIR: "bg-violet-500/15 text-violet-900",
  IN_TRANSIT: "bg-sky-500/15 text-sky-900",
  PREPARATION: "bg-gold-500/15 text-gold-900",
};

export function VehiclesList({
  depots,
  initialRows = [],
  canViewFinancials = false,
}: {
  depots: DepotOption[];
  initialRows?: VehicleRow[];
  canViewFinancials?: boolean;
}) {
  const [rows, setRows] = useState<VehicleRow[]>(initialRows);
  const [brandOptions, setBrandOptions] = useState<{ id: string; label: string }[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const hasFilters = Boolean(search.trim() || filters.brandId || filters.status || filters.depotId);

  const activeCount = countActiveFilters(filters);

  useEffect(() => {
    fetch("/api/brands")
      .then((r) => (r.ok ? r.json() : []))
      .then(setBrandOptions);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (filters.brandId) params.set("brandId", filters.brandId);
    if (filters.status) params.set("status", filters.status);
    if (filters.depotId) params.set("depotId", filters.depotId);
    const res = await fetch(`/api/vehicles?${params}`);
    if (res.ok) {
      setRows(await res.json());
    } else {
      const j = await res.json().catch(() => ({}));
      setFetchError((j as { error?: string }).error ?? "Impossible de charger les véhicules");
      if (!hasFilters && initialRows.length > 0) setRows(initialRows);
    }
    setLoading(false);
  }, [search, filters, hasFilters, initialRows]);

  useEffect(() => {
    if (!hasFilters) {
      setRows(initialRows);
      return;
    }
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load, hasFilters, initialRows]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-3xl text-navy-950">Véhicules</h2>
          <p className="text-sm text-navy-600">Stock, filtres et fiches détaillées</p>
        </div>
        <Link
          href="/dashboard/vehicles/new"
          className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-gold-600 to-gold-400 px-4 py-2 text-sm font-semibold text-navy-950 shadow-sm"
        >
          Ajouter un véhicule
        </Link>
      </div>

      <ListFilterToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Recherche rapide : réf., immat., chassis, modèle…"
        activeFiltersCount={activeCount}
        onResetFilters={() => setFilters(initialFilters)}
      >
        <FilterField label="Marque">
          <select
            value={filters.brandId}
            onChange={(e) => setFilters((f) => ({ ...f, brandId: e.target.value }))}
            className="input-sofi w-full"
          >
            <option value="">Toutes</option>
            {brandOptions.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Statut">
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            className="input-sofi w-full"
          >
            <option value="">Tous</option>
            {(Object.keys(statusLabels) as VehicleStatus[]).map((k) => (
              <option key={k} value={k}>
                {statusLabels[k]}
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
            <option value="">Tous dépôts</option>
            {depots.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </FilterField>
      </ListFilterToolbar>

      {fetchError && (
        <p className="rounded-lg border border-morocco-500/30 bg-morocco-500/10 px-3 py-2 text-sm text-morocco-700">
          {fetchError}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-navy-950/10 bg-white shadow-sm">
        {loading ? (
          <LoadingState label="Chargement des véhicules…" />
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-navy-500">
            {hasFilters
              ? "Aucun véhicule ne correspond aux filtres."
              : "Aucun véhicule en stock. Les véhicules créés via un achat apparaissent ici automatiquement."}
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-cream-100 text-xs font-semibold uppercase tracking-wide text-navy-600">
              <tr>
                <th className="px-4 py-3">Réf.</th>
                <th className="px-4 py-3">Véhicule</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Dépôt</th>
                {canViewFinancials && <th className="px-4 py-3 text-right">Prix de revient</th>}
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-950/5">
              {rows.map((v) => (
                <tr key={v.id} className="hover:bg-cream-50">
                  <td className="px-4 py-3 font-mono text-xs text-navy-800">{v.internalRef}</td>
                  <td className="px-4 py-3 text-navy-900">
                    {formatVehicleTitle(v)}
                    <span className="block text-xs text-navy-500">
                      {v.plate ?? "—"}
                      {v.purchase?.reference && (
                        <>
                          {" · "}
                          <Link
                            href={`/dashboard/purchases/${v.purchase.id}`}
                            className="text-gold-700 hover:underline"
                          >
                            Achat {v.purchase.reference}
                          </Link>
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClasses[v.status]}`}
                    >
                      {statusLabels[v.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-navy-700">{v.depot.name}</td>
                  {canViewFinancials && (
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {formatFinancialMoney(Number(v.costPrice), true)}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <TableRowActions
                      detailHref={`/dashboard/vehicles/${v.id}`}
                      editHref={
                        v.isArchived ? undefined : `/dashboard/vehicles/${v.id}/edit`
                      }
                      archive={{
                        url: `/api/vehicles/${v.id}/archive`,
                        method: "PATCH",
                        confirmMessage: `Archiver le véhicule « ${v.internalRef} » ? Il n'apparaîtra plus dans la liste active.`,
                        disabled: Boolean(v.isArchived),
                      }}
                      remove={{
                        url: `/api/vehicles/${v.id}`,
                        method: "DELETE",
                        confirmMessage: `Supprimer définitivement « ${v.internalRef} » ? Cette action est irréversible.`,
                        disabled: Boolean(v.purchase || v.sale),
                        title: v.purchase || v.sale ? "Suppression impossible (achat/vente lié)" : "Supprimer",
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
