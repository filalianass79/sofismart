"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatMoney } from "@/lib/utils";
import { CashTransferStatusBadge } from "./treasury-badges";
import type { CashTransferStatus } from "@/generated/prisma/enums";
import { useFormFeedback } from "@/hooks/use-form-feedback";

type Transfer = {
  id: string;
  reference: string;
  transferCode: string;
  amount: unknown;
  status: CashTransferStatus;
  reason: string;
  notes: string | null;
  sentAt: string | Date;
  receivedAt: string | Date | null;
  rejectionReason: string | null;
  sourceCashbox: { name: string; reference: string };
  destinationCashbox: { name: string; reference: string };
  senderEmployee: { firstName: string; lastName: string } | null;
  receiverEmployee: { firstName: string; lastName: string } | null;
};

export function TransferDetailsView({ transfer, canReceive }: { transfer: Transfer; canReceive: boolean }) {
  const router = useRouter();
  const { showSuccess, showError } = useFormFeedback();
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [loading, setLoading] = useState(false);

  async function accept() {
    if (!confirm("Confirmer la réception de ce transfert ?")) return;
    setLoading(true);
    const res = await fetch(`/api/treasury/transfers/${transfer.id}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setLoading(false);
    if (!res.ok) {
      showError((await res.json().catch(() => ({})) as { error?: string }).error ?? "Erreur");
      return;
    }
    showSuccess("Transfert accepté");
    router.refresh();
  }

  async function reject() {
    if (!rejectReason.trim()) {
      showError("Motif de refus obligatoire");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/treasury/transfers/${transfer.id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rejectionReason: rejectReason }),
    });
    setLoading(false);
    if (!res.ok) {
      showError("Refus impossible");
      return;
    }
    showSuccess("Transfert refusé");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/treasury/cash-transfers" className="text-sm text-gold-700 hover:underline">
        ← Transferts
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-gold-700">{transfer.reference}</p>
          <h2 className="font-display text-3xl text-navy-950">Transfert {transfer.transferCode}</h2>
        </div>
        <CashTransferStatusBadge status={transfer.status} />
      </div>

      <div className="rounded-xl border border-navy-950/10 bg-white p-5">
        <p className="text-3xl font-semibold tabular-nums">{formatMoney(Number(transfer.amount))}</p>
        <p className="mt-2 text-sm text-navy-600">{transfer.reason}</p>
        <p className="mt-1 text-xs text-navy-500">
          Envoyé le {format(new Date(transfer.sentAt), "dd MMM yyyy HH:mm", { locale: fr })}
        </p>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-xl border p-4">
          <dt className="text-navy-500">Source</dt>
          <dd className="font-medium">{transfer.sourceCashbox.name}</dd>
        </div>
        <div className="rounded-xl border p-4">
          <dt className="text-navy-500">Destination</dt>
          <dd className="font-medium">{transfer.destinationCashbox.name}</dd>
        </div>
      </dl>

      {transfer.status === "PENDING_RECEPTION" && canReceive && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => void accept()}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
          >
            Confirmer réception
          </button>
          <button type="button" onClick={() => setShowReject(true)} className="rounded-lg border border-morocco-400 px-4 py-2 text-sm text-morocco-800">
            Refuser
          </button>
        </div>
      )}

      {showReject && (
        <div className="rounded-xl border border-morocco-200 bg-morocco-50/50 p-4">
          <label className="text-sm font-medium">Motif de refus *</label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="input-sofi mt-1 w-full"
            rows={3}
          />
          <button type="button" disabled={loading} onClick={() => void reject()} className="mt-2 rounded-lg bg-morocco-600 px-4 py-2 text-sm text-white">
            Confirmer le refus
          </button>
        </div>
      )}

      {transfer.rejectionReason && (
        <p className="text-sm text-morocco-700">Motif refus : {transfer.rejectionReason}</p>
      )}
    </div>
  );
}
