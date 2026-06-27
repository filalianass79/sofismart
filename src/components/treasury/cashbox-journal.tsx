"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatMoney } from "@/lib/utils";
import {
  CashMovementStatusBadge,
  CashMovementTypeBadge,
} from "./treasury-badges";
import type { CashMovementStatus, CashMovementType } from "@/generated/prisma/enums";
import {
  ListCard,
  ListCardBody,
  ListCardField,
  ListCardHeader,
  ListDataShell,
  ListDesktopTable,
  ListMobileCards,
} from "@/components/ui/responsive-list";

type JournalRow = {
  id: string;
  reference: string;
  operationDate: string;
  type: CashMovementType;
  status: CashMovementStatus;
  reason: string;
  debit: number;
  credit: number;
  runningBalance: number | null;
  createdBy: { name: string | null } | null;
  validatedBy: { name: string | null } | null;
  documents: { id: string; fileUrl: string; fileName: string }[];
};

export function CashboxJournalTable({ cashboxId }: { cashboxId: string }) {
  const [rows, setRows] = useState<JournalRow[]>([]);
  const [summary, setSummary] = useState({ totalDebit: 0, totalCredit: 0, openingBalance: 0, closingBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ from: "", to: "", type: "", status: "", q: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    if (filters.type) params.set("type", filters.type);
    if (filters.status) params.set("status", filters.status);
    if (filters.q) params.set("q", filters.q);
    const res = await fetch(`/api/treasury/cashboxes/${cashboxId}/journal?${params}`);
    if (res.ok) {
      const data = await res.json();
      setRows(data.rows);
      setSummary(data.summary);
    }
    setLoading(false);
  }, [cashboxId, filters]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} className="input-sofi text-sm" />
        <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} className="input-sofi text-sm" />
        <input type="search" placeholder="Recherche…" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} className="input-sofi min-w-[160px] text-sm" />
        <a
          href={`/api/treasury/cashboxes/${cashboxId}/journal/export/excel?${new URLSearchParams(filters)}`}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          Export Excel
        </a>
        <a
          href={`/api/treasury/cashboxes/${cashboxId}/journal/export/pdf?${new URLSearchParams(filters)}`}
          className="rounded-lg border px-3 py-2 text-sm"
          target="_blank"
          rel="noreferrer"
        >
          Export PDF
        </a>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "Solde début", value: summary.openingBalance },
          { label: "Total crédit", value: summary.totalCredit },
          { label: "Total débit", value: summary.totalDebit },
          { label: "Solde fin", value: summary.closingBalance },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-navy-950/10 bg-white p-3 text-sm">
            <p className="text-navy-500">{k.label}</p>
            <p className="font-semibold tabular-nums">{formatMoney(k.value)}</p>
          </div>
        ))}
      </div>

      <ListDataShell loading={loading} empty={rows.length === 0} emptyMessage="Aucun mouvement.">
        <>
          <ListDesktopTable>
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-cream-100 text-xs font-semibold uppercase text-navy-600">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Réf.</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Libellé</th>
                  <th className="px-3 py-2 text-right">Débit</th>
                  <th className="px-3 py-2 text-right">Crédit</th>
                  <th className="px-3 py-2 text-right">Solde</th>
                  <th className="px-3 py-2">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-950/5">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {format(new Date(r.operationDate), "dd/MM/yy HH:mm", { locale: fr })}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{r.reference}</td>
                    <td className="px-3 py-2">
                      <CashMovementTypeBadge type={r.type} />
                    </td>
                    <td className="px-3 py-2 max-w-xs truncate">{r.reason}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-morocco-700">
                      {r.debit ? formatMoney(r.debit) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-emerald-700">
                      {r.credit ? formatMoney(r.credit) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium">
                      {r.runningBalance != null ? formatMoney(r.runningBalance) : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <CashMovementStatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ListDesktopTable>
          <ListMobileCards>
            {rows.map((r) => (
              <ListCard key={r.id}>
                <ListCardHeader
                  title={r.reference}
                  subtitle={format(new Date(r.operationDate), "dd/MM/yy", { locale: fr })}
                  badge={<CashMovementStatusBadge status={r.status} />}
                />
                <ListCardBody>
                  <ListCardField label="Type" value={<CashMovementTypeBadge type={r.type} />} />
                  <ListCardField label="Libellé" value={r.reason} fullWidth />
                  <ListCardField label="Débit" value={r.debit ? formatMoney(r.debit) : "—"} />
                  <ListCardField label="Crédit" value={r.credit ? formatMoney(r.credit) : "—"} />
                  <ListCardField
                    label="Solde"
                    value={r.runningBalance != null ? formatMoney(r.runningBalance) : "—"}
                  />
                </ListCardBody>
              </ListCard>
            ))}
          </ListMobileCards>
        </>
      </ListDataShell>
    </div>
  );
}
