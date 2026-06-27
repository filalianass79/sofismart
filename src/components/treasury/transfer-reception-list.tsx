"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/utils";
import { CashTransferStatusBadge } from "./treasury-badges";
import type { CashTransferStatus } from "@/generated/prisma/enums";
import { ListPageHeader } from "@/components/ui/responsive-list";

type Row = {
  id: string;
  reference: string;
  transferCode: string;
  amount: unknown;
  status: CashTransferStatus;
  sourceCashbox: { name: string };
  destinationCashbox: { name: string };
};

export function TransferReceptionList() {
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState("PENDING_RECEPTION");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const res = await fetch(`/api/treasury/transfers?${params}`);
    if (res.ok) setRows(await res.json());
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <ListPageHeader title="Transferts entre caisses" />
      <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-sofi text-sm">
        <option value="">Tous</option>
        <option value="PENDING_RECEPTION">En attente réception</option>
        <option value="ACCEPTED">Acceptés</option>
        <option value="REJECTED">Refusés</option>
      </select>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-white p-4">
            <div>
              <p className="font-medium">{formatMoney(Number(r.amount))}</p>
              <p className="text-xs text-navy-600">
                {r.sourceCashbox.name} → {r.destinationCashbox.name}
              </p>
              <p className="font-mono text-[10px] text-navy-400">{r.transferCode}</p>
            </div>
            <div className="flex items-center gap-2">
              <CashTransferStatusBadge status={r.status} />
              <Link href={`/dashboard/treasury/cash-transfers/${r.id}`} className="text-sm text-gold-700">
                Détail →
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
