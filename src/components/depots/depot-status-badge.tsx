import { depotStatusLabels } from "@/lib/depot-labels";
import type { DepotStatus } from "@/generated/prisma/enums";

const styles: Record<DepotStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800",
  INACTIVE: "bg-navy-100 text-navy-700",
  ARCHIVED: "bg-navy-200/60 text-navy-600",
};

export function DepotStatusBadge({ status }: { status: DepotStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {depotStatusLabels[status]}
    </span>
  );
}
