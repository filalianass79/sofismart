"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatMoney } from "@/lib/utils";
import { cashboxTypeLabels } from "@/lib/treasury/cashbox-labels";
import type { CashboxStatus, CashboxType } from "@/generated/prisma/enums";
import { CashboxStatusBadge } from "./treasury-badges";
import {
  ListCard,
  ListCardBody,
  ListCardField,
  ListCardFooter,
  ListCardHeader,
  ListDataShell,
  ListDesktopTable,
  ListMobileCards,
  ListPageHeader,
} from "@/components/ui/responsive-list";

type Row = {
  id: string;
  reference: string;
  name: string;
  type: CashboxType;
  status: CashboxStatus;
  currency: string;
  currentBalance: unknown;
  employee: { firstName: string; lastName: string } | null;
  depot: { name: string } | null;
  movements: { operationDate: string }[];
};

export function CashboxTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    const res = await fetch(`/api/treasury/cashboxes?${params}`);
    if (res.ok) setRows(await res.json());
    setLoading(false);
  }, [q]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="space-y-4">
      <ListPageHeader title="Caisses" subtitle="Gestion des caisses employés, dépôts et trésorerie centrale">
        <Link
          href="/dashboard/treasury/cashboxes/new"
          className="rounded-lg bg-gradient-to-r from-gold-600 to-gold-500 px-4 py-2 text-sm font-semibold text-navy-950"
        >
          + Nouvelle caisse
        </Link>
      </ListPageHeader>

      <input
        type="search"
        placeholder="Rechercher référence ou nom…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="input-sofi w-full max-w-md"
      />

      <ListDataShell loading={loading} empty={rows.length === 0} emptyMessage="Aucune caisse trouvée.">
        <>
          <ListDesktopTable>
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="bg-cream-100 text-xs font-semibold uppercase text-navy-600">
                <tr>
                  <th className="px-4 py-3">Réf.</th>
                  <th className="px-4 py-3">Nom</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Responsable</th>
                  <th className="px-4 py-3">Dépôt</th>
                  <th className="px-4 py-3 text-right">Solde</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Dernier mvt</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-950/5">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-cream-50/80">
                    <td className="px-4 py-3 font-mono text-xs">{r.reference}</td>
                    <td className="px-4 py-3 font-medium">{r.name}</td>
                    <td className="px-4 py-3">{cashboxTypeLabels[r.type]}</td>
                    <td className="px-4 py-3">
                      {r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : "—"}
                    </td>
                    <td className="px-4 py-3">{r.depot?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {formatMoney(Number(r.currentBalance))}
                    </td>
                    <td className="px-4 py-3">
                      <CashboxStatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-navy-600">
                      {r.movements[0]
                        ? format(new Date(r.movements[0].operationDate), "dd/MM/yy", { locale: fr })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/dashboard/treasury/cashboxes/${r.id}`} className="text-xs text-gold-700 hover:underline">
                        Détail
                      </Link>
                      {" · "}
                      <Link href={`/dashboard/treasury/cashboxes/${r.id}/journal`} className="text-xs text-gold-700 hover:underline">
                        Journal
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ListDesktopTable>
          <ListMobileCards>
            {rows.map((r) => (
              <ListCard key={r.id} href={`/dashboard/treasury/cashboxes/${r.id}`}>
                <ListCardHeader
                  title={r.name}
                  subtitle={r.reference}
                  badge={<CashboxStatusBadge status={r.status} />}
                />
                <ListCardBody>
                  <ListCardField label="Type" value={cashboxTypeLabels[r.type]} />
                  <ListCardField
                    label="Solde"
                    value={formatMoney(Number(r.currentBalance))}
                  />
                  <ListCardField
                    label="Responsable"
                    value={r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : "—"}
                  />
                  <ListCardField label="Dépôt" value={r.depot?.name ?? "—"} />
                </ListCardBody>
                <ListCardFooter>
                  <Link href={`/dashboard/treasury/cashboxes/${r.id}/journal`} className="text-xs font-medium text-gold-700">
                    Journal →
                  </Link>
                </ListCardFooter>
              </ListCard>
            ))}
          </ListMobileCards>
        </>
      </ListDataShell>
    </div>
  );
}
