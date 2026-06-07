"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { PaymentStatusBadge } from "@/components/purchases/payment-status-badge";
import { PurchaseStatusBadge } from "@/components/purchases/purchase-status-badge";
import { formatPurchaseMoney } from "@/lib/purchase-privacy";
import { sumFees } from "@/lib/finance";
import { FilterField, ListFilterToolbar, countActiveFilters } from "@/components/ui/list-filters";
import type { PurchasePaymentStatus, PurchaseStatus } from "@/generated/prisma/enums";

const initialFilters = { status: "", paymentStatus: "" };

export type PurchaseRow = {
  id: string;
  reference: string;
  purchaseDate: string;
  status: PurchaseStatus;
  paymentStatus: PurchasePaymentStatus;
  totalPurchasePrice: string | number;
  basePrice: string | number;
  supplier: { id: string; name: string; type: string };
  vehicle: {
    id: string;
    brandLabel: string;
    modelLabel: string;
    vin: string | null;
    plate: string | null;
    status: string;
  } | null;
  fees: { amount: string | number }[];
  payments: { amount: string | number }[];
};

export function PurchasesList({
  initialRows,
  canViewFinancials,
  canEdit,
  canCreate,
  canDelete,
}: {
  initialRows: PurchaseRow[];
  canViewFinancials: boolean;
  canEdit: boolean;
  canCreate: boolean;
  canDelete: boolean;
}) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(initialFilters);

  const activeCount = countActiveFilters(filters);

  const rows = useMemo(() => {
    return initialRows.filter((p) => {
      if (filters.status && p.status !== filters.status) return false;
      if (filters.paymentStatus && p.paymentStatus !== filters.paymentStatus) return false;
      if (!search.trim()) return true;
      const hay = [
        p.reference,
        p.supplier.name,
        p.vehicle?.brandLabel,
        p.vehicle?.modelLabel,
        p.vehicle?.vin,
        p.vehicle?.plate,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(search.toLowerCase());
    });
  }, [initialRows, search, filters]);

  async function onDelete(id: string) {
    if (!confirm("Supprimer cet achat ? Cette action est irréversible.")) return;
    const res = await fetch(`/api/purchases/${id}`, { method: "DELETE" });
    if (res.ok) window.location.reload();
    else {
      const j = await res.json().catch(() => ({}));
      alert(j.error ?? "Erreur");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl text-navy-950">Achats</h2>
        <div className="flex flex-wrap gap-2">
          {canViewFinancials && (
            <a
              href="/api/reports/excel?type=purchases"
              className="inline-flex items-center gap-2 rounded-lg border border-navy-950/15 bg-white px-4 py-2.5 text-sm font-semibold text-navy-800 hover:bg-cream-50"
            >
              <Download className="h-4 w-4" /> Export Excel
            </a>
          )}
          {canCreate && (
            <>
              <Link
                href="/dashboard/purchases/import"
                className="inline-flex items-center gap-2 rounded-lg border border-gold-500/40 bg-gold-500/10 px-4 py-2.5 text-sm font-semibold text-navy-900"
              >
                <Plus className="h-4 w-4" /> Importer facture
              </Link>
              <Link
                href="/dashboard/purchases/new"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold-600 to-gold-500 px-4 py-2.5 text-sm font-bold text-navy-950 shadow-sm"
              >
                <Plus className="h-4 w-4" /> Nouvel achat
              </Link>
            </>
          )}
        </div>
      </div>

      <ListFilterToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Recherche rapide : réf., fournisseur, véhicule, VIN…"
        activeFiltersCount={activeCount}
        onResetFilters={() => setFilters(initialFilters)}
      >
        <FilterField label="Statut achat">
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            className="input-sofi w-full"
          >
            <option value="">Tous</option>
            <option value="DRAFT">Brouillon</option>
            <option value="VALIDATED">Validé</option>
            <option value="CANCELLED">Annulé</option>
          </select>
        </FilterField>
        <FilterField label="Paiement">
          <select
            value={filters.paymentStatus}
            onChange={(e) => setFilters((f) => ({ ...f, paymentStatus: e.target.value }))}
            className="input-sofi w-full"
          >
            <option value="">Tous</option>
            <option value="UNPAID">Non payé</option>
            <option value="PARTIAL">Partiel</option>
            <option value="PAID">Payé</option>
          </select>
        </FilterField>
      </ListFilterToolbar>

      <div className="overflow-x-auto rounded-xl border border-navy-950/10 bg-white shadow-sm">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="bg-cream-100 text-xs font-semibold uppercase text-navy-600">
            <tr>
              <th className="px-4 py-3">Réf.</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Fournisseur</th>
              <th className="px-4 py-3">Véhicule</th>
              {canViewFinancials && (
                <>
                  <th className="px-4 py-3 text-right">Prix revient</th>
                  <th className="px-4 py-3 text-right">Payé</th>
                  <th className="px-4 py-3 text-right">Reste</th>
                </>
              )}
              <th className="px-4 py-3">Statuts</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-950/5">
            {rows.map((p) => {
              const fees = sumFees(p.fees);
              const paid = p.payments.reduce((a, x) => a + Number(x.amount), 0);
              const due = Number(p.totalPurchasePrice || p.basePrice) + fees;
              const cost = due;
              const balance = Math.max(0, Number(p.totalPurchasePrice || p.basePrice) - paid);
              return (
                <tr key={p.id} className="hover:bg-cream-50/80">
                  <td className="px-4 py-3 font-medium text-navy-950">{p.reference}</td>
                  <td className="px-4 py-3">{new Date(p.purchaseDate).toLocaleDateString("fr-FR")}</td>
                  <td className="px-4 py-3">{p.supplier.name}</td>
                  <td className="px-4 py-3">
                    {p.vehicle ? (
                      <>
                        {p.vehicle.brandLabel} {p.vehicle.modelLabel}
                        {p.vehicle.vin && (
                          <span className="block text-xs text-navy-500">Châssis : {p.vehicle.vin}</span>
                        )}
                      </>
                    ) : (
                      <span className="text-navy-400">—</span>
                    )}
                  </td>
                  {canViewFinancials && (
                    <>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatPurchaseMoney(cost, true)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatPurchaseMoney(paid, true)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatPurchaseMoney(balance, true)}
                      </td>
                    </>
                  )}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <PurchaseStatusBadge status={p.status} />
                      <PaymentStatusBadge status={p.paymentStatus} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Link
                        href={`/dashboard/purchases/${p.id}`}
                        className="rounded p-1.5 hover:bg-navy-950/5"
                        title="Détail"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      {canEdit && (
                        <Link
                          href={`/dashboard/purchases/${p.id}/edit`}
                          className="rounded p-1.5 hover:bg-navy-950/5"
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(p.id)}
                          className="rounded p-1.5 hover:bg-morocco-500/10 text-morocco-600"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={canViewFinancials ? 9 : 6} className="px-4 py-12 text-center text-navy-400">
                  Aucun achat trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
