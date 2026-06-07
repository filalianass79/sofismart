import { formatMoney } from "@/lib/utils";
import type { TimeBucket } from "@/lib/services/admin-dashboard-service";

export function AdminBarChart({
  buckets,
  valueKey = "revenue",
  height = 200,
  colorClass = "from-gold-500 to-gold-300",
}: {
  buckets: TimeBucket[];
  valueKey?: "revenue" | "margin" | "count";
  height?: number;
  colorClass?: string;
}) {
  const values = buckets.map((b) => b[valueKey]);
  const max = Math.max(1, ...values);

  if (buckets.length === 0) {
    return <p className="py-12 text-center text-sm text-navy-500">Aucune donnée sur cette période.</p>;
  }

  return (
    <div className="flex items-end gap-1 sm:gap-1.5" style={{ height }}>
      {buckets.map((b) => {
        const v = b[valueKey];
        const pct = Math.max(4, Math.round((v / max) * 100));
        return (
          <div
            key={b.key}
            className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
            style={{ height }}
          >
            <div
              className="flex w-full max-w-[2.5rem] flex-1 flex-col justify-end"
              title={`${b.label}: ${valueKey === "count" ? v : formatMoney(v)}`}
            >
              <div
                className={`w-full rounded-t-md bg-gradient-to-t ${colorClass}`}
                style={{ height: `${pct}%`, minHeight: 4 }}
              />
            </div>
            <span className="max-w-full truncate text-center text-[9px] text-navy-500 sm:text-[10px]">
              {b.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
