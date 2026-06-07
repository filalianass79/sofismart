"use client";
import { LoadingState } from "@/components/ui/loading";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { clientTypeLabels } from "@/lib/client-labels";
import { formatMoney } from "@/lib/utils";
import { FinancialStatusBadge } from "./financial-status-badge";
import { FilterField, ListFilterToolbar, countActiveFilters } from "@/components/ui/list-filters";
import { TableRowActions } from "@/components/ui/table-row-actions";
import type { ClientType, FinancialStatus } from "@/generated/prisma/enums";

const initialFilters = { type: "", city: "", financialStatus: "" };

type ClientRow = {
  id: string;
  reference: string;
  type: ClientType;
  name: string;
  cin: string | null;
  ice: string | null;
  phone: string | null;
  city: string | null;
  financialStatus: FinancialStatus;
  isArchived: boolean;
  outstandingAmount: number;
  totalSales?: number;
  vehiclesCount?: number;
  lastSaleDate?: string | null;
  assignedCommercial?: { name: string | null } | null;
};

export function ClientsList() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);

  const activeCount = countActiveFilters(filters);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ withBalance: "1", archived: "0" });
    if (search.trim()) params.set("q", search.trim());
    if (filters.type) params.set("type", filters.type);
    if (filters.city) params.set("city", filters.city);
    if (filters.financialStatus) params.set("financialStatus", filters.financialStatus);
    const res = await fetch(`/api/clients?${params}`);
    if (res.ok) setClients(await res.json());
    setLoading(false);
  }, [search, filters]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl text-navy-950">Clients</h2>
        <div className="flex flex-wrap gap-2">
          <a
            href="/api/reports/excel?type=clients"
            className="rounded-lg border border-navy-950/15 px-3 py-2 text-sm font-medium"
          >
            Export Excel
          </a>
          <Link
            href="/dashboard/clients/new"
            className="rounded-lg bg-gradient-to-r from-gold-600 to-gold-500 px-4 py-2 text-sm font-semibold text-navy-950"
          >
            + Nouveau client
          </Link>
        </div>
      </div>

      <ListFilterToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Recherche rapide : nom, tél., CIN, ICE, référence…"
        activeFiltersCount={activeCount}
        onResetFilters={() => setFilters(initialFilters)}
      >
        <FilterField label="Type de client">
          <select
            value={filters.type}
            onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
            className="input-sofi w-full"
          >
            <option value="">Tous</option>
            <option value="INDIVIDUAL">Particuliers</option>
            <option value="COMPANY">Professionnels</option>
            <option value="RESELLER">Revendeurs</option>
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
        <FilterField label="Statut financier">
          <select
            value={filters.financialStatus}
            onChange={(e) => setFilters((f) => ({ ...f, financialStatus: e.target.value }))}
            className="input-sofi w-full"
          >
            <option value="">Tous</option>
            <option value="GOOD_PAYER">Bon payeur</option>
            <option value="AVERAGE">Moyen</option>
            <option value="RISK">À risque</option>
            <option value="BLOCKED">Bloqué</option>
          </select>
        </FilterField>
      </ListFilterToolbar>

      <div className="overflow-hidden rounded-xl border border-navy-950/10 bg-white shadow-sm">
        {loading ? (
          <LoadingState label="Chargement des clients…" />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-cream-100 text-xs font-semibold uppercase text-navy-600">
              <tr>
                <th className="px-4 py-3">Réf.</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Ville</th>
                <th className="px-4 py-3 text-right">Ventes</th>
                <th className="px-4 py-3 text-right">Solde</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Dernier achat</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-950/5">
              {clients.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-navy-400">
                    Aucun client trouvé
                  </td>
                </tr>
              )}
              {clients.map((c) => (
                <tr key={c.id} className={`hover:bg-cream-50/80 ${c.isArchived ? "opacity-60" : ""}`}>
                  <td className="px-4 py-3 font-mono text-xs">{c.reference}</td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/clients/${c.id}`} className="font-medium hover:text-gold-700">
                      {c.name}
                    </Link>
                    <p className="text-xs text-navy-500">{clientTypeLabels[c.type]}</p>
                  </td>
                  <td className="px-4 py-3 text-navy-600">
                    {c.phone ?? "—"}
                    <br />
                    <span className="text-xs">{c.cin ?? c.ice ?? ""}</span>
                  </td>
                  <td className="px-4 py-3">{c.city ?? "—"}</td>
                  <td className="px-4 py-3 text-right">{c.vehiclesCount ?? 0}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    {formatMoney(c.outstandingAmount)}
                  </td>
                  <td className="px-4 py-3">
                    <FinancialStatusBadge status={c.financialStatus} />
                  </td>
                  <td className="px-4 py-3 text-navy-600">
                    {c.lastSaleDate
                      ? format(new Date(c.lastSaleDate), "dd/MM/yy", { locale: fr })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <TableRowActions
                      detailHref={`/dashboard/clients/${c.id}`}
                      editHref={c.isArchived ? undefined : `/dashboard/clients/${c.id}/edit`}
                      archive={{
                        url: `/api/clients/${c.id}/archive`,
                        method: "PATCH",
                        confirmMessage: `Archiver le client « ${c.name} » ?`,
                        disabled: c.isArchived,
                      }}
                      remove={{
                        url: `/api/clients/${c.id}`,
                        method: "DELETE",
                        confirmMessage: `Supprimer définitivement « ${c.name} » ?`,
                        disabled: (c.vehiclesCount ?? 0) > 0,
                        title:
                          (c.vehiclesCount ?? 0) > 0
                            ? "Suppression impossible (ventes liées)"
                            : "Supprimer",
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
