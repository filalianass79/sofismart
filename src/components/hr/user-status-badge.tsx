import type { AccountStatus } from "@/generated/prisma/enums";
import { accountStatusLabels } from "@/lib/employee-labels";
import { cn } from "@/lib/utils";

const styles: Record<AccountStatus, string> = {
  ACTIVE: "bg-emerald-500/15 text-emerald-800",
  DISABLED: "bg-navy-500/10 text-navy-600",
  PENDING: "bg-gold-500/20 text-gold-900",
  BLOCKED: "bg-morocco-500/15 text-morocco-700",
};

export function UserStatusBadge({ status }: { status: AccountStatus }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", styles[status])}>
      {accountStatusLabels[status]}
    </span>
  );
}
