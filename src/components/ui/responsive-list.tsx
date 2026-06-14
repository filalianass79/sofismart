import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LoadingState } from "@/components/ui/loading";

/** En-tête de page liste — titre + actions empilés sur mobile */
export function ListPageHeader({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="font-display text-2xl text-navy-950 sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-navy-600">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

/** Conteneur liste avec états chargement / vide */
export function ListDataShell({
  loading,
  loadingLabel = "Chargement…",
  empty,
  emptyMessage = "Aucun élément trouvé.",
  children,
  className,
}: {
  loading?: boolean;
  loadingLabel?: string;
  empty?: boolean;
  emptyMessage?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-navy-950/10 bg-white shadow-sm",
        className,
      )}
    >
      {loading ? (
        <LoadingState label={loadingLabel} />
      ) : empty ? (
        <p className="px-4 py-10 text-center text-sm text-navy-500 sm:py-12">{emptyMessage}</p>
      ) : (
        children
      )}
    </div>
  );
}

/** Tableau desktop (lg+) */
export function ListDesktopTable({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("hidden overflow-x-auto lg:block", className)}>
      {children}
    </div>
  );
}

/** Grille de cartes mobile / tablette (< lg) */
export function ListMobileCards({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-3 p-3 sm:space-y-4 sm:p-4 lg:hidden", className)}>{children}</div>
  );
}

export function ListCard({
  children,
  className,
  href,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
}) {
  const cls = cn(
    "block rounded-xl border border-navy-950/10 bg-cream-50/30 p-4 shadow-sm transition-all",
    "hover:border-gold-400/35 hover:bg-white hover:shadow-md",
    className,
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(cls, "w-full text-left")}>
        {children}
      </button>
    );
  }
  return <article className={cls}>{children}</article>;
}

export function ListCardHeader({
  title,
  subtitle,
  badge,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-semibold text-navy-950">{title}</h3>
          {badge}
        </div>
        {subtitle && <p className="mt-0.5 truncate text-sm text-navy-600">{subtitle}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}

export function ListCardBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <dl className={cn("mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm sm:grid-cols-3", className)}>
      {children}
    </dl>
  );
}

export function ListCardField({
  label,
  value,
  className,
  fullWidth,
}: {
  label: string;
  value: ReactNode;
  className?: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={cn(fullWidth && "col-span-2 sm:col-span-3", className)}>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-navy-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-navy-900">{value}</dd>
    </div>
  );
}

export function ListCardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-navy-950/8 pt-3",
        className,
      )}
    >
      {children}
    </div>
  );
}
