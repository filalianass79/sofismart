import { purchasePaymentStatusLabels } from "@/lib/purchase-labels";
import type { PurchasePaymentStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

const styles: Record<PurchasePaymentStatus, string> = {
  UNPAID: "bg-morocco-500/15 text-morocco-700",
  PARTIAL: "bg-amber-100 text-amber-800",
  PAID: "bg-emerald-100 text-emerald-800",
};

export function PaymentStatusBadge({ status }: { status: PurchasePaymentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
        styles[status]
      )}
    >
      {purchasePaymentStatusLabels[status]}
    </span>
  );
}
