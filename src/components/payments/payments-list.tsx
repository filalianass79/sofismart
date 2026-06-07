"use client";
import { LoadingState } from "@/components/ui/loading";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatMoney } from "@/lib/utils";
import { paymentCategoryLabels, paymentValidationLabels } from "@/lib/payment-labels";
import type { PaymentCategory, PaymentValidationStatus } from "@/generated/prisma/enums";
import { TableRowActions } from "@/components/ui/table-row-actions";
import { FilterField, ListFilterToolbar, countActiveFilters } from "@/components/ui/list-filters";

type Row = {
  id: string;
  paymentReference: string | null;
  category: PaymentCategory | null;
  paidAt: string;
  amount: unknown;
  method: string;
  validationStatus: PaymentValidationStatus;
  dueDate: string | null;
  client: { name: string } | null;
  supplier: { name: string } | null;
  saleId?: string | null;
  purchaseId?: string | null;
  sale: { reference: string } | null;
  purchase: { reference: string } | null;
  overdue?: boolean;
};

const initialFilters = { category: "", status: "", method: "", overdue: "" };

export function PaymentsList() {
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);

  const activeCount = countActiveFilters(filters);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (filters.category) params.set("category", filters.category);
    if (filters.status) params.set("status", filters.status);
    if (filters.method) params.set("method", filters.method);
    if (filters.overdue === "1") params.set("overdue", "1");
    const res = await fetch(`/api/payments?${params}`);
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
        <h2 className="font-display text-3xl text-navy-950">Paiements</h2>
        <Link
          href="/dashboard/payments/new"
          className="rounded-lg bg-gradient-to-r from-gold-600 to-gold-500 px-4 py-2 text-sm font-semibold text-navy-950"
        >
          + Nouveau paiement
        </Link>
      </div>

      <ListFilterToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Recherche rapide : réf., client, fournisseur, vente…"
        activeFiltersCount={activeCount}
        onResetFilters={() => setFilters(initialFilters)}
      >
        <FilterField label="Type">
          <select
            value={filters.category}
            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
            className="input-sofi w-full"
          >
            <option value="">Tous</option>
            {(Object.keys(paymentCategoryLabels) as PaymentCategory[]).map((k) => (
              <option key={k} value={k}>
                {paymentCategoryLabels[k]}
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
            <option value="PENDING">En attente</option>
            <option value="VALIDATED">Validé</option>
            <option value="CANCELLED">Annulé</option>
          </select>
        </FilterField>
        <FilterField label="Mode">
          <select
            value={filters.method}
            onChange={(e) => setFilters((f) => ({ ...f, method: e.target.value }))}
            className="input-sofi w-full"
          >
            <option value="">Tous</option>
            <option value="CASH">Espèces</option>
            <option value="CHECK">Chèque</option>
            <option value="TRANSFER">Virement</option>
            <option value="CARD">Carte</option>
          </select>
        </FilterField>
        <FilterField label="Échéance">
          <select
            value={filters.overdue}
            onChange={(e) => setFilters((f) => ({ ...f, overdue: e.target.value }))}
            className="input-sofi w-full"
          >
            <option value="">Toutes</option>
            <option value="1">En retard uniquement</option>
          </select>
        </FilterField>
      </ListFilterToolbar>

      <div className="overflow-hidden rounded-xl border border-navy-950/10 bg-white shadow-sm">
        {loading ? (
          <LoadingState label="Chargement des paiements…" />
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-navy-500">Aucun paiement trouvé.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-cream-100 text-xs font-semibold uppercase text-navy-600">
              <tr>
                <th className="px-4 py-3">Réf.</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Tiers</th>
                <th className="px-4 py-3">Lié</th>
                <th className="px-4 py-3 text-right">Montant</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Échéance</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-950/5">
              {rows.map((p) => (
                <tr key={p.id} className={p.overdue ? "bg-morocco-50/50" : ""}>
                  <td className="px-4 py-3 font-mono text-xs">{p.paymentReference ?? p.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-xs">{p.category ? paymentCategoryLabels[p.category] : "—"}</td>
                  <td className="px-4 py-3">{format(new Date(p.paidAt), "dd/MM/yyyy", { locale: fr })}</td>
                  <td className="px-4 py-3">{p.client?.name ?? p.supplier?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-xs">{p.sale?.reference ?? p.purchase?.reference ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatMoney(Number(p.amount))}</td>
                  <td className="px-4 py-3 text-xs">{paymentValidationLabels[p.validationStatus]}</td>
                  <td className="px-4 py-3 text-xs">
                    {p.dueDate ? format(new Date(p.dueDate), "dd/MM/yyyy", { locale: fr }) : "—"}
                    {p.overdue && " ⚠"}
                  </td>
                  <td className="px-4 py-3">
                    <TableRowActions
                      detailHref={
                        p.saleId
                          ? `/dashboard/sales/${p.saleId}`
                          : p.purchaseId
                            ? `/dashboard/purchases/${p.purchaseId}`
                            : `/dashboard/payments/new`
                      }
                      archive={
                        p.validationStatus === "PENDING"
                          ? {
                              url: `/api/payments/${p.id}`,
                              method: "DELETE",
                              confirmMessage: "Supprimer ce paiement en attente ?",
                            }
                          : p.validationStatus === "VALIDATED"
                            ? {
                                url: `/api/payments/${p.id}/cancel`,
                                method: "POST",
                                body: { reason: "Annulation depuis la liste" },
                                confirmMessage: "Annuler ce paiement ?",
                                title: "Annuler",
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
      </div>
    </div>
  );
}
