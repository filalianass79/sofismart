import type { RelationshipStatus } from "@/generated/prisma/enums";
import { relationshipStatusLabels } from "@/lib/client-labels";
import { cn } from "@/lib/utils";

const styles: Record<RelationshipStatus, string> = {
  PROSPECT: "bg-navy-500/10 text-navy-700",
  ACTIVE: "bg-emerald-500/15 text-emerald-800",
  LOYAL: "bg-gold-500/20 text-gold-900",
  INACTIVE: "bg-navy-500/15 text-navy-600",
  VIP: "bg-gradient-to-r from-gold-500/30 to-gold-400/20 text-navy-950 font-bold",
};

export function RelationshipStatusBadge({ status }: { status: RelationshipStatus }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", styles[status])}>
      {relationshipStatusLabels[status]}
    </span>
  );
}
