import type {
  CashboxStatus,
  CashMovementStatus,
  CashMovementType,
  CashTransferStatus,
} from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";
import {
  cashboxStatusLabels,
  cashMovementStatusLabels,
  cashMovementTypeLabels,
  cashTransferStatusLabels,
} from "@/lib/treasury/cashbox-labels";

function badge(cls: string, label: string) {
  return <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", cls)}>{label}</span>;
}

export function CashboxStatusBadge({ status }: { status: CashboxStatus }) {
  const map: Record<CashboxStatus, string> = {
    ACTIVE: "bg-emerald-100 text-emerald-800",
    INACTIVE: "bg-navy-100 text-navy-600",
    BLOCKED: "bg-morocco-100 text-morocco-800",
    CLOSED: "bg-navy-200 text-navy-700",
  };
  return badge(map[status], cashboxStatusLabels[status]);
}

export function CashMovementStatusBadge({ status }: { status: CashMovementStatus }) {
  const map: Record<CashMovementStatus, string> = {
    DRAFT: "bg-navy-100 text-navy-600",
    PENDING_VALIDATION: "bg-amber-100 text-amber-900",
    VALIDATED: "bg-emerald-100 text-emerald-800",
    REJECTED: "bg-morocco-100 text-morocco-800",
    CANCELLED: "bg-navy-200 text-navy-700",
    REVERSED: "bg-purple-100 text-purple-800",
  };
  return badge(map[status], cashMovementStatusLabels[status]);
}

export function CashMovementTypeBadge({ type }: { type: CashMovementType }) {
  return badge("bg-gold-100 text-gold-900", cashMovementTypeLabels[type]);
}

export function CashTransferStatusBadge({ status }: { status: CashTransferStatus }) {
  const map: Record<CashTransferStatus, string> = {
    PENDING_RECEPTION: "bg-amber-100 text-amber-900",
    ACCEPTED: "bg-emerald-100 text-emerald-800",
    REJECTED: "bg-morocco-100 text-morocco-800",
    CANCELLED: "bg-navy-200 text-navy-700",
  };
  return badge(map[status], cashTransferStatusLabels[status]);
}
