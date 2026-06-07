"use client";

import type { ProformaStatus } from "@/generated/prisma/enums";
import { proformaStatusLabels } from "@/lib/proforma-labels";
import { cn } from "@/lib/utils";

export function ProformaStatusBadge({ status }: { status: ProformaStatus | string }) {
  const label = proformaStatusLabels[status as ProformaStatus] ?? status;
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
        status === "DRAFT" && "bg-navy-100 text-navy-700",
        status === "GENERATED" && "bg-gold-100 text-gold-900",
        status === "PRINTED" && "bg-emerald-100 text-emerald-800",
        status === "CONVERTED_TO_SALE" && "bg-blue-100 text-blue-800",
        status === "EXPIRED" && "bg-amber-100 text-amber-900",
        status === "CANCELLED" && "bg-morocco-100 text-morocco-800",
        !["DRAFT", "GENERATED", "PRINTED", "CONVERTED_TO_SALE", "EXPIRED", "CANCELLED"].includes(
          String(status),
        ) && "bg-cream-100 text-navy-700",
      )}
    >
      {label}
    </span>
  );
}
