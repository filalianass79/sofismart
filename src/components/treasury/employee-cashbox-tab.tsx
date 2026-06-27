"use client";

import { formatMoney } from "@/lib/utils";
import Link from "next/link";
import type { CashTransferStatus } from "@/generated/prisma/enums";
import { CashTransferStatusBadge } from "./treasury-badges";

type Props = {
  boxes: { id: string; reference: string; name: string; currentBalance: unknown; status: string }[];
  pendingTransfers: { id: string; amount: unknown; reason: string; sourceCashbox: { name: string } }[];
  sentTransfers: { id: string; amount: unknown; status: CashTransferStatus; destinationCashbox: { name: string } }[];
};

export function EmployeeCashboxTab({ boxes, pendingTransfers, sentTransfers }: Props) {
  if (boxes.length === 0) {
    return <p className="text-sm text-navy-500">Aucune caisse affectée à cet employé.</p>;
  }

  return (
    <div className="space-y-4">
      {boxes.map((box) => (
        <div key={box.id} className="rounded-xl border border-navy-950/10 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-mono text-xs text-gold-700">{box.reference}</p>
              <p className="font-semibold text-navy-950">{box.name}</p>
            </div>
            <p className="text-xl font-semibold tabular-nums">{formatMoney(Number(box.currentBalance))}</p>
          </div>
          <Link href={`/dashboard/treasury/cashboxes/${box.id}/journal`} className="mt-2 inline-block text-sm text-gold-700">
            Voir journal →
          </Link>
        </div>
      ))}

      {pendingTransfers.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-amber-900">Réceptions en attente</h4>
          <ul className="space-y-2">
            {pendingTransfers.map((t) => (
              <li key={t.id} className="rounded-lg bg-amber-50 p-3 text-sm">
                {formatMoney(Number(t.amount))} depuis {t.sourceCashbox.name}
                <Link href={`/dashboard/treasury/cash-transfers/${t.id}`} className="ml-2 text-gold-700">
                  Valider →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {sentTransfers.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-navy-800">Transferts envoyés</h4>
          <ul className="space-y-1 text-sm">
            {sentTransfers.map((t) => (
              <li key={t.id} className="flex justify-between">
                <span>
                  {formatMoney(Number(t.amount))} → {t.destinationCashbox.name}
                </span>
                <CashTransferStatusBadge status={t.status} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
