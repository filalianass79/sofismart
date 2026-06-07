import type { EmployeeStatus } from "@/generated/prisma/enums";
import { employeeStatusLabels } from "@/lib/employee-labels";
import { cn } from "@/lib/utils";

const styles: Record<EmployeeStatus, string> = {
  ACTIVE: "bg-emerald-500/15 text-emerald-800",
  INACTIVE: "bg-navy-500/10 text-navy-700",
  ARCHIVED: "bg-navy-500/20 text-navy-600",
};

export function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", styles[status])}>
      {employeeStatusLabels[status]}
    </span>
  );
}
