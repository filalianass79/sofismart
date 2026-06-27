"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/utils";
import { Wallet, ArrowDownLeft, ArrowUpRight, Clock, AlertTriangle } from "lucide-react";
import { CashTransferStatusBadge } from "./treasury-badges";
import type { CashTransferStatus } from "@/generated/prisma/enums";

type DashboardData = {
  kpis: {
    totalBalance: number;
    activeCashboxes: number;
    totalInToday: number;
    totalOutToday: number;
    pendingTransfers: number;
    pendingValidation: number;
    lowBalanceCount: number;
  };
  balanceByCashbox: { id: string; name: string; balance: number }[];
  recentMovements: { id: string; reference: string; reason: string; amount: unknown; cashbox: { name: string } }[];
  transfersToConfirm: {
    id: string;
    reference: string;
    amount: unknown;
    status: CashTransferStatus;
    sourceCashbox: { name: string };
  }[];
};

export function TreasuryDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/treasury/dashboard");
    if (res.ok) setData(await res.json());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!data) return <p className="text-sm text-navy-500">Chargement…</p>;

  const cards = [
    { label: "Solde total caisses", value: formatMoney(data.kpis.totalBalance), icon: Wallet },
    { label: "Caisses actives", value: String(data.kpis.activeCashboxes), icon: Wallet },
    { label: "Entrées aujourd'hui", value: formatMoney(data.kpis.totalInToday), icon: ArrowDownLeft },
    { label: "Sorties aujourd'hui", value: formatMoney(data.kpis.totalOutToday), icon: ArrowUpRight },
    { label: "Transferts en attente", value: String(data.kpis.pendingTransfers), icon: Clock },
    { label: "À valider", value: String(data.kpis.pendingValidation), icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl text-navy-950">Trésorerie</h2>
          <p className="text-sm text-navy-600">Vue d&apos;ensemble des caisses et mouvements</p>
        </div>
        <Link
          href="/dashboard/treasury/cashboxes"
          className="rounded-lg border border-navy-950/15 px-4 py-2 text-sm font-medium"
        >
          Toutes les caisses
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-navy-950/10 bg-white p-4 shadow-sm">
            <c.icon className="h-5 w-5 text-gold-600" />
            <p className="mt-2 text-2xl font-semibold text-navy-950">{c.value}</p>
            <p className="text-xs text-navy-600">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-navy-950/10 bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-semibold text-navy-900">Solde par caisse</h3>
          <ul className="space-y-2">
            {data.balanceByCashbox.map((c) => (
              <li key={c.id} className="flex justify-between text-sm">
                <Link href={`/dashboard/treasury/cashboxes/${c.id}`} className="text-gold-800 hover:underline">
                  {c.name}
                </Link>
                <span className="font-medium tabular-nums">{formatMoney(c.balance)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-navy-950/10 bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-semibold text-navy-900">Transferts à confirmer</h3>
          {data.transfersToConfirm.length === 0 ? (
            <p className="text-sm text-navy-500">Aucun transfert en attente</p>
          ) : (
            <ul className="space-y-2">
              {data.transfersToConfirm.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-50/80 p-3 text-sm">
                  <div>
                    <p className="font-medium">{formatMoney(Number(t.amount))}</p>
                    <p className="text-xs text-navy-600">Depuis {t.sourceCashbox.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CashTransferStatusBadge status={t.status} />
                    <Link href={`/dashboard/treasury/cash-transfers/${t.id}`} className="text-xs text-gold-700">
                      Voir →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-navy-950/10 bg-white p-4 shadow-sm">
        <h3 className="mb-3 font-semibold text-navy-900">Derniers mouvements</h3>
        <ul className="divide-y divide-navy-950/5 text-sm">
          {data.recentMovements.map((m) => (
            <li key={m.id} className="flex justify-between py-2">
              <span>
                <span className="font-mono text-xs text-navy-500">{m.reference}</span> — {m.reason}
                <span className="ml-2 text-navy-500">({m.cashbox.name})</span>
              </span>
              <span className="font-medium tabular-nums">{formatMoney(Number(m.amount))}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
