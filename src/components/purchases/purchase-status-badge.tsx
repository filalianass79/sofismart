import { purchaseStatusLabels } from "@/lib/purchase-labels";
import type { PurchaseStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

const styles: Record<PurchaseStatus, string> = {
  DRAFT: "bg-navy-100 text-navy-700",
  VALIDATED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-morocco-500/15 text-morocco-700",
};

export function PurchaseStatusBadge({ status }: { status: PurchaseStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
        styles[status]
      )}
    >
      {purchaseStatusLabels[status]}
    </span>
  );
}
