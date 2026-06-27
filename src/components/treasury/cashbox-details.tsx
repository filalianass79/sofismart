"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatMoney } from "@/lib/utils";
import { cashboxTypeLabels } from "@/lib/treasury/cashbox-labels";
import type { CashboxStatus, CashboxType } from "@/generated/prisma/enums";
import { CashboxStatusBadge } from "./treasury-badges";
import { MovementModal, TransferModal } from "./treasury-modals";
import { useFormFeedback } from "@/hooks/use-form-feedback";

type Cashbox = {
  id: string;
  reference: string;
  name: string;
  type: CashboxType;
  status: CashboxStatus;
  currentBalance: unknown;
  currency: string;
  description: string | null;
  employee: { firstName: string; lastName: string } | null;
  depot: { name: string } | null;
};

export function CashboxDetailsView({
  cashbox,
  allCashboxes,
}: {
  cashbox: Cashbox;
  allCashboxes: { id: string; name: string; reference: string }[];
}) {
  const router = useRouter();
  const { showSuccess, showError } = useFormFeedback();
  const [modal, setModal] = useState<"credit" | "debit" | "transfer" | null>(null);

  async function blockOrClose(action: "block" | "close") {
    if (!confirm(action === "block" ? "Bloquer cette caisse ?" : "Fermer définitivement cette caisse ?")) return;
    const res = await fetch(`/api/treasury/cashboxes/${cashbox.id}/${action}`, { method: "POST" });
    if (!res.ok) {
      showError("Action impossible");
      return;
    }
    showSuccess(action === "block" ? "Caisse bloquée" : "Caisse fermée");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm text-gold-700">{cashbox.reference}</p>
          <h2 className="font-display text-3xl text-navy-950">{cashbox.name}</h2>
          <p className="text-navy-600">{cashboxTypeLabels[cashbox.type]}</p>
        </div>
        <CashboxStatusBadge status={cashbox.status} />
      </div>

      <div className="rounded-xl border border-gold-400/30 bg-gradient-to-br from-gold-50 to-white p-6 shadow-sm">
        <p className="text-sm text-navy-600">Solde actuel</p>
        <p className="font-display text-4xl font-semibold tabular-nums text-navy-950">
          {formatMoney(Number(cashbox.currentBalance))}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {cashbox.status === "ACTIVE" && (
          <>
            <button type="button" onClick={() => setModal("credit")} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white">
              Créditer
            </button>
            <button type="button" onClick={() => setModal("debit")} className="rounded-lg bg-morocco-600 px-4 py-2 text-sm font-medium text-white">
              Débiter
            </button>
            <button type="button" onClick={() => setModal("transfer")} className="rounded-lg border border-gold-500 px-4 py-2 text-sm font-medium text-gold-800">
              Transférer
            </button>
          </>
        )}
        <Link href={`/dashboard/treasury/cashboxes/${cashbox.id}/journal`} className="rounded-lg border px-4 py-2 text-sm">
          Journal
        </Link>
        <Link href={`/dashboard/treasury/cashboxes/${cashbox.id}/edit`} className="rounded-lg border px-4 py-2 text-sm">
          Modifier
        </Link>
        {cashbox.status === "ACTIVE" && (
          <>
            <button type="button" onClick={() => void blockOrClose("block")} className="rounded-lg border border-amber-400 px-4 py-2 text-sm text-amber-900">
              Bloquer
            </button>
            <button type="button" onClick={() => void blockOrClose("close")} className="rounded-lg border border-navy-300 px-4 py-2 text-sm">
              Fermer
            </button>
          </>
        )}
      </div>

      <dl className="grid gap-3 rounded-xl border border-navy-950/10 bg-white p-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-navy-500">Responsable</dt>
          <dd>{cashbox.employee ? `${cashbox.employee.firstName} ${cashbox.employee.lastName}` : "—"}</dd>
        </div>
        <div>
          <dt className="text-navy-500">Dépôt</dt>
          <dd>{cashbox.depot?.name ?? "—"}</dd>
        </div>
        {cashbox.description && (
          <div className="sm:col-span-2">
            <dt className="text-navy-500">Description</dt>
            <dd>{cashbox.description}</dd>
          </div>
        )}
      </dl>

      <MovementModal
        mode="credit"
        cashboxId={cashbox.id}
        cashboxName={cashbox.name}
        open={modal === "credit"}
        onClose={() => setModal(null)}
        onSuccess={() => router.refresh()}
      />
      <MovementModal
        mode="debit"
        cashboxId={cashbox.id}
        cashboxName={cashbox.name}
        open={modal === "debit"}
        onClose={() => setModal(null)}
        onSuccess={() => router.refresh()}
      />
      <TransferModal
        sourceCashboxId={cashbox.id}
        sourceName={cashbox.name}
        cashboxes={allCashboxes}
        open={modal === "transfer"}
        onClose={() => setModal(null)}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
