"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { DashboardPeriod } from "@/lib/services/admin-dashboard-service";

const PERIODS: { id: DashboardPeriod; label: string }[] = [
  { id: "day", label: "Par jour" },
  { id: "month", label: "Par mois" },
  { id: "year", label: "Par année" },
];

export function AdminPeriodToolbar({ current }: { current: DashboardPeriod }) {
  const searchParams = useSearchParams();

  function hrefFor(period: DashboardPeriod) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", period);
    const qs = params.toString();
    return qs ? `/dashboard?${qs}` : "/dashboard";
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-navy-950/10 bg-white/80 p-1.5 shadow-sm backdrop-blur-sm">
      <span className="px-2 text-xs font-semibold uppercase tracking-wide text-navy-500">Période</span>
      {PERIODS.map((p) => (
        <Link
          key={p.id}
          href={hrefFor(p.id)}
          scroll={false}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-all",
            current === p.id
              ? "bg-gradient-to-r from-navy-950 to-navy-800 text-white shadow-md"
              : "text-navy-600 hover:bg-cream-100",
          )}
        >
          {p.label}
        </Link>
      ))}
    </div>
  );
}
