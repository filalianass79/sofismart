"use client";
import { LoadingState } from "@/components/ui/loading";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatMoney } from "@/lib/utils";
import { formatVehicleTitle } from "@/lib/vehicle-catalog";
import { SalePaymentStatusBadge, SaleRecordStatusBadge } from "./sale-status-badge";
import { TableRowActions } from "@/components/ui/table-row-actions";
import { FilterField, ListFilterToolbar, countActiveFilters } from "@/components/ui/list-filters";
import type { SalePaymentStatus, SaleRecordStatus, SaleType } from "@/generated/prisma/enums";

const RECORD_STATUS_FILTER_VALUES = ["PENDING_VALIDATION", "VALIDATED", "DRAFT"] as const;

function isRecordStatusFilter(value: string | null): value is (typeof RECORD_STATUS_FILTER_VALUES)[number] {
  return RECORD_STATUS_FILTER_VALUES.includes(value as (typeof RECORD_STATUS_FILTER_VALUES)[number]);
}

type SaleRow = {
  id: string;
  reference: string;
  saleDate: string;
  status: SaleRecordStatus;
  finalPrice: unknown;
  margin: unknown;
  saleType: SaleType;
  paymentStatus: SalePaymentStatus;
  amountPaid: number;
  amountDue: number;
  client: { name: string };
  vehicle: {
    brand: { label: string };
    carModel: { label: string };
    version?: string | null;
    internalRef: string | null;
  };
  commercial: { name: string | null } | null;
};

const initialFilters = { paymentStatus: "", saleType: "", recordStatus: "" };

export function SalesList({ canViewFinancials = false }: { canViewFinancials?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const statusFromUrl = searchParams.get("status");
  const [rows, setRows] = useState<SaleRow[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(() => ({
    ...initialFilters,
    recordStatus: isRecordStatusFilter(statusFromUrl) ? statusFromUrl : "",
  }));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fromUrl = searchParams.get("status");
    const recordStatus = isRecordStatusFilter(fromUrl) ? fromUrl : "";
    setFilters((f) => (f.recordStatus === recordStatus ? f : { ...f, recordStatus }));
  }, [searchParams]);

  const activeCount = countActiveFilters(filters);

  const updateFilters = useCallback((patch: Partial<typeof initialFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (filters.paymentStatus) params.set("paymentStatus", filters.paymentStatus);
    if (filters.saleType) params.set("saleType", filters.saleType);
    if (filters.recordStatus) params.set("status", filters.recordStatus);
    const res = await fetch(`/api/sales?${params}`);
    if (res.ok) setRows(await res.json());
    setLoading(false);
  }, [search, filters]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (filters.paymentStatus) params.set("paymentStatus", filters.paymentStatus);
      if (filters.saleType) params.set("saleType", filters.saleType);
      if (filters.recordStatus) params.set("status", filters.recordStatus);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 300);
    return () => clearTimeout(t);
  }, [search, filters, pathname, router]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl text-navy-950">Ventes</h2>
        <Link
          href="/dashboard/sales/new"
          className="rounded-lg bg-gradient-to-r from-gold-600 to-gold-500 px-4 py-2 text-sm font-semibold text-navy-950"
        >
          + Nouvelle vente
        </Link>
      </div>

      <ListFilterToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Recherche rapide : réf., client, véhicule…"
        activeFiltersCount={activeCount}
        onResetFilters={() => setFilters(initialFilters)}
      >
        <FilterField label="Statut vente">
          <select
            value={filters.recordStatus}
            onChange={(e) => updateFilters({ recordStatus: e.target.value })}
            className="input-sofi w-full"
          >
            <option value="">Tous (hors annulées)</option>
            <option value="PENDING_VALIDATION">En attente de validation</option>
            <option value="VALIDATED">Validées</option>
            <option value="DRAFT">Brouillons</option>
          </select>
        </FilterField>
        <FilterField label="Statut paiement">
          <select
            value={filters.paymentStatus}
            onChange={(e) => updateFilters({ paymentStatus: e.target.value })}
            className="input-sofi w-full"
          >
            <option value="">Tous</option>
            <option value="UNPAID">Non payé</option>
            <option value="PARTIAL">Partiel</option>
            <option value="PAID">Payé</option>
          </select>
        </FilterField>
        <FilterField label="Type de vente">
          <select
            value={filters.saleType}
            onChange={(e) => updateFilters({ saleType: e.target.value })}
            className="input-sofi w-full"
          >
            <option value="">Tous</option>
            <option value="RETAIL">Détail</option>
            <option value="WHOLESALE">Gros</option>
            <option value="EXPORT">Export</option>
          </select>
        </FilterField>
      </ListFilterToolbar>

      <div className="overflow-hidden rounded-xl border border-navy-950/10 bg-white shadow-sm">
        {loading ? (
          <LoadingState label="Chargement des ventes…" />
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-navy-500">Aucune vente trouvée.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-cream-100 text-xs font-semibold uppercase text-navy-600">
                <tr>
                  <th className="px-4 py-3">Réf.</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Véhicule</th>
                  <th className="px-4 py-3 text-right">Prix final</th>
                  {canViewFinancials && <th className="px-4 py-3 text-right">Marge</th>}
                  <th className="px-4 py-3 text-right">Payé</th>
                  <th className="px-4 py-3 text-right">Reste</th>
                  <th className="px-4 py-3">Paiement</th>
                  <th className="px-4 py-3">Commercial</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-950/5">
                {rows.map((s) => (
                  <tr key={s.id} className="hover:bg-cream-50/80">
                    <td className="px-4 py-3 font-mono text-xs">{s.reference}</td>
                    <td className="px-4 py-3">
                      <SaleRecordStatusBadge status={s.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {format(new Date(s.saleDate), "dd/MM/yyyy", { locale: fr })}
                    </td>
                    <td className="px-4 py-3">{s.client.name}</td>
                    <td className="px-4 py-3">{formatVehicleTitle(s.vehicle)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatMoney(Number(s.finalPrice))}
                    </td>
                    {canViewFinancials && (
                      <td className="px-4 py-3 text-right tabular-nums text-emerald-800">
                        {formatMoney(Number(s.margin))}
                      </td>
                    )}
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatMoney(s.amountPaid)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatMoney(s.amountDue)}
                    </td>
                    <td className="px-4 py-3">
                      <SalePaymentStatusBadge status={s.paymentStatus} />
                    </td>
                    <td className="px-4 py-3 text-navy-600">{s.commercial?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <TableRowActions detailHref={`/dashboard/sales/${s.id}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
