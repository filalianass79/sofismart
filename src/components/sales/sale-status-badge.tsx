import {
  deliveryStatusLabels,
  exitVoucherStatusLabels,
  salePaymentStatusLabels,
  saleRecordStatusLabels,
} from "@/lib/sale-labels";
import type {
  DeliveryStatus,
  ExitVoucherStatus,
  SalePaymentStatus,
  SaleRecordStatus,
} from "@/generated/prisma/enums";

export function SalePaymentStatusBadge({ status }: { status: SalePaymentStatus }) {
  const cls =
    status === "PAID"
      ? "bg-emerald-100 text-emerald-800"
      : status === "PARTIAL"
        ? "bg-amber-100 text-amber-900"
        : status === "OVERDUE"
          ? "bg-morocco-100 text-morocco-800"
          : "bg-navy-100 text-navy-700";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {salePaymentStatusLabels[status]}
    </span>
  );
}

export function SaleRecordStatusBadge({ status }: { status: SaleRecordStatus }) {
  const cls =
    status === "VALIDATED"
      ? "bg-emerald-100 text-emerald-800"
      : status === "PENDING_VALIDATION"
        ? "bg-amber-100 text-amber-900"
        : status === "DRAFT"
          ? "bg-navy-100 text-navy-700"
          : "bg-morocco-100 text-morocco-800";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {saleRecordStatusLabels[status]}
    </span>
  );
}

export function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  const cls =
    status === "DELIVERED"
      ? "bg-emerald-100 text-emerald-800"
      : status === "EXIT_PENDING"
        ? "bg-gold-500/20 text-gold-900"
        : status === "CANCELLED"
          ? "bg-morocco-100 text-morocco-800"
          : "bg-navy-100 text-navy-600";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {deliveryStatusLabels[status]}
    </span>
  );
}

export function ExitVoucherStatusBadge({ status }: { status: ExitVoucherStatus }) {
  const cls =
    status === "DELIVERED"
      ? "bg-emerald-100 text-emerald-800"
      : status === "PENDING"
        ? "bg-amber-100 text-amber-900"
        : "bg-morocco-100 text-morocco-800";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {exitVoucherStatusLabels[status]}
    </span>
  );
}
