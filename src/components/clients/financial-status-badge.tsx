import type { FinancialStatus } from "@/generated/prisma/enums";
import { financialStatusLabels } from "@/lib/client-labels";
import { cn } from "@/lib/utils";

const styles: Record<FinancialStatus, string> = {
  GOOD_PAYER: "bg-emerald-500/15 text-emerald-800",
  AVERAGE: "bg-gold-500/20 text-gold-900",
  RISK: "bg-morocco-500/15 text-morocco-700",
  BLOCKED: "bg-navy-500/20 text-navy-700",
};

export function FinancialStatusBadge({ status }: { status: FinancialStatus }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", styles[status])}>
      {financialStatusLabels[status]}
    </span>
  );
}
