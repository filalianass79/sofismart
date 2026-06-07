"use client";
import { LoadingState } from "@/components/ui/loading";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/utils";
import { supplierTypeLabels } from "@/lib/supplier-labels";
import type { SupplierType } from "@/generated/prisma/enums";
import { TableRowActions } from "@/components/ui/table-row-actions";
import { FilterField, ListFilterToolbar, countActiveFilters } from "@/components/ui/list-filters";

type Row = {
  id: string;
  reference: string;
  type: SupplierType;
  name: string;
  cin: string | null;
  ice: string | null;
  phone: string | null;
  city: string | null;
  balance: unknown;
  status: string;
  isArchived?: boolean;
  stats?: { totalPurchases: number; balance: number };
};

const initialFilters = { type: "", status: "", city: "" };

export function SuppliersList() {
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);

  const activeCount = countActiveFilters(filters);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (filters.type) params.set("type", filters.type);
    if (filters.status) params.set("status", filters.status);
    if (filters.city) params.set("city", filters.city);
    const res = await fetch(`/api/suppliers?${params}`);
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
        <h2 className="font-display text-3xl text-navy-950">Fournisseurs</h2>
        <Link
          href="/dashboard/suppliers/new"
          className="rounded-lg bg-gradient-to-r from-gold-600 to-gold-500 px-4 py-2 text-sm font-semibold text-navy-950"
        >
          + Nouveau fournisseur
        </Link>
      </div>

      <ListFilterToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Recherche rapide : nom, réf., CIN, ICE, téléphone…"
        activeFiltersCount={activeCount}
        onResetFilters={() => setFilters(initialFilters)}
      >
        <FilterField label="Type">
          <select
            value={filters.type}
            onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
            className="input-sofi w-full"
          >
            <option value="">Tous</option>
            {(Object.keys(supplierTypeLabels) as SupplierType[]).map((k) => (
              <option key={k} value={k}>
                {supplierTypeLabels[k]}
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
            <option value="ACTIVE">Actif</option>
            <option value="INACTIVE">Inactif</option>
            <option value="ARCHIVED">Archivé</option>
          </select>
        </FilterField>
        <FilterField label="Ville">
          <input
            value={filters.city}
            onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
            placeholder="Ex. Casablanca"
            className="input-sofi w-full"
          />
        </FilterField>
      </ListFilterToolbar>

      <div className="overflow-hidden rounded-xl border border-navy-950/10 bg-white shadow-sm">
        {loading ? (
          <LoadingState label="Chargement des fournisseurs…" />
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-navy-500">Aucun fournisseur trouvé.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-cream-100 text-xs font-semibold uppercase text-navy-600">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">CIN / ICE</th>
                <th className="px-4 py-3">Téléphone</th>
                <th className="px-4 py-3">Ville</th>
                <th className="px-4 py-3 text-right">Achats</th>
                <th className="px-4 py-3 text-right">Solde</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-950/5">
              {rows.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 text-xs">{supplierTypeLabels[s.type]}</td>
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-xs">{s.cin ?? s.ice ?? "—"}</td>
                  <td className="px-4 py-3">{s.phone ?? "—"}</td>
                  <td className="px-4 py-3">{s.city ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {formatMoney(s.stats?.totalPurchases ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-right">{formatMoney(s.stats?.balance ?? Number(s.balance))}</td>
                  <td className="px-4 py-3">
                    <TableRowActions
                      detailHref={`/dashboard/suppliers/${s.id}`}
                      archive={{
                        url: `/api/suppliers/${s.id}/archive`,
                        method: "PATCH",
                        confirmMessage: `Archiver le fournisseur « ${s.name} » ?`,
                        disabled: s.isArchived || s.status === "ARCHIVED",
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
