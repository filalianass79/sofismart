import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type KpiAccent = "gold" | "navy" | "emerald" | "sky" | "amber" | "morocco";

const KPI_ACCENTS: Record<KpiAccent, string> = {
  gold: "from-gold-500/20 to-gold-400/5 border-gold-400/25 text-gold-700",
  navy: "from-navy-950/8 to-navy-950/2 border-navy-950/15 text-navy-800",
  emerald: "from-emerald-500/15 to-emerald-400/5 border-emerald-400/25 text-emerald-800",
  sky: "from-sky-500/15 to-sky-400/5 border-sky-400/25 text-sky-800",
  amber: "from-amber-500/15 to-amber-400/5 border-amber-400/25 text-amber-800",
  morocco: "from-morocco-500/15 to-morocco-400/5 border-morocco-400/25 text-morocco-800",
};

export function DashboardHero({
  eyebrow,
  title,
  description,
  stats,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  stats?: { label: string; value: string }[];
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-navy-950/10 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 p-6 text-white shadow-lg sm:p-8">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold-500/10 blur-3xl"
        aria-hidden
      />
      <div className="relative flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-300/90">{eyebrow}</p>
          <h3 className="mt-1 font-display text-2xl sm:text-3xl">{title}</h3>
          {description && <p className="mt-2 text-sm text-white/70">{description}</p>}
        </div>
        {stats && stats.length > 0 && (
          <div className="flex flex-wrap gap-6 text-right text-sm">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-white/60">{s.label}</p>
                <p className="font-display text-xl text-gold-300">{s.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function KpiCard({
  title,
  value,
  hint,
  icon: Icon,
  accent = "gold",
  href,
}: {
  title: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  accent?: KpiAccent;
  href?: string;
}) {
  const inner = (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 shadow-sm transition-all hover:shadow-md",
        KPI_ACCENTS[accent],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">{title}</p>
          <p className="mt-2 font-display text-2xl tracking-tight text-navy-950 sm:text-3xl">{value}</p>
          {hint && <p className="mt-1 text-xs text-navy-600">{hint}</p>}
        </div>
        <div className="rounded-xl bg-white/70 p-2.5 shadow-sm">
          <Icon className="h-6 w-6 shrink-0 opacity-90" />
        </div>
      </div>
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400">
        {inner}
      </Link>
    );
  }
  return inner;
}

export function DashboardPanel({
  title,
  subtitle,
  children,
  className,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  action?: { href: string; label: string };
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-navy-950/10 bg-white p-5 shadow-sm sm:p-6",
        className,
      )}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-lg text-navy-950">{title}</h3>
          {subtitle && <p className="mt-0.5 text-sm text-navy-500">{subtitle}</p>}
        </div>
        {action && (
          <Link
            href={action.href}
            className="inline-flex items-center gap-1 text-sm font-medium text-gold-700 hover:text-gold-800"
          >
            {action.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export function QuickAction({
  href,
  label,
  icon: Icon,
  variant = "primary",
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  variant?: "primary" | "ghost";
}) {
  const cls =
    variant === "primary"
      ? "border-gold-500/30 bg-gradient-to-br from-gold-500/15 to-gold-400/5 hover:border-gold-400/50 hover:shadow-md"
      : "border-navy-950/10 bg-white hover:border-navy-950/20 hover:shadow-md";

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl border p-4 shadow-sm transition-all",
        cls,
      )}
    >
      <div className="rounded-lg bg-white/80 p-2 shadow-sm">
        <Icon className="h-5 w-5 text-gold-600" />
      </div>
      <span className="text-sm font-semibold text-navy-900">{label}</span>
      <ArrowRight className="ml-auto h-4 w-4 text-navy-400" />
    </Link>
  );
}

export function ActivityList({
  emptyMessage,
  children,
}: {
  emptyMessage?: string;
  children: React.ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <ul className="divide-y divide-navy-950/5">
      {children}
      {!hasChildren && emptyMessage && (
        <li className="py-8 text-center text-sm text-navy-500">{emptyMessage}</li>
      )}
    </ul>
  );
}

export function ActivityItem({
  href,
  title,
  subtitle,
  meta,
  badge,
}: {
  href?: string;
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: React.ReactNode;
}) {
  const inner = (
    <div className="flex items-center justify-between gap-3 py-3.5">
      <div className="min-w-0">
        <p className="truncate font-medium text-navy-950">{title}</p>
        {subtitle && <p className="truncate text-sm text-navy-600">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {meta && <span className="text-sm font-medium tabular-nums text-navy-800">{meta}</span>}
        {badge}
      </div>
    </div>
  );

  if (href) {
    return (
      <li>
        <Link href={href} className="-mx-1 block rounded-lg px-1 transition-colors hover:bg-cream-50/80">
          {inner}
        </Link>
      </li>
    );
  }
  return <li>{inner}</li>;
}

export function CapacityBar({
  label,
  current,
  max,
  href,
}: {
  label: string;
  current: number;
  max: number;
  href?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;
  const high = pct >= 85;

  const content = (
    <div className="rounded-xl border border-navy-950/8 bg-cream-50/50 p-4">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-navy-900">{label}</span>
        <span className={high ? "font-semibold text-morocco-600" : "text-navy-600"}>
          {current}/{max}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-navy-950/10">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            high ? "bg-morocco-500" : "bg-gradient-to-r from-gold-600 to-gold-400",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-navy-500">{pct}% de capacité</p>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }
  return content;
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-navy-950/15 bg-cream-50/50 py-10 text-center">
      <p className="text-sm text-navy-500">{message}</p>
    </div>
  );
}
