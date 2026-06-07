"use client";

import { useMemo, useState } from "react";
import { Filter, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdvancedFilterToggle({
  open,
  onClick,
  activeCount = 0,
  className,
}: {
  open: boolean;
  onClick: () => void;
  activeCount?: number;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group inline-flex shrink-0 items-center gap-2.5 pb-0.5 transition-colors",
        className
      )}
      aria-expanded={open}
      aria-controls="advanced-filters-panel"
    >
      <Filter
        className={cn(
          "h-5 w-5 text-navy-900 transition-colors",
          open && "text-gold-600"
        )}
        strokeWidth={2.25}
      />
      <span className="relative">
        <span
          className={cn(
            "text-sm font-bold tracking-tight text-navy-900 group-hover:text-navy-800",
            open && "text-navy-950"
          )}
        >
          Filtre avancé
        </span>
        <span
          className={cn(
            "absolute -bottom-0.5 left-0 h-0.5 w-full rounded-full bg-gold-500 transition-opacity",
            open || activeCount > 0 ? "opacity-100" : "opacity-70 group-hover:opacity-100"
          )}
        />
      </span>
      {activeCount > 0 && (
        <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-500 px-1.5 text-[10px] font-bold text-navy-950">
          {activeCount}
        </span>
      )}
    </button>
  );
}

export function ListSearchInput({
  value,
  onChange,
  placeholder = "Recherche rapide…",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative min-w-0 flex-1", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-sofi w-full py-2.5 pl-10 pr-10"
        aria-label="Recherche rapide"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-navy-400 hover:bg-navy-950/5 hover:text-navy-700"
          aria-label="Effacer la recherche"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function ListFilterToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  advancedOpen: controlledOpen,
  onAdvancedOpenChange,
  activeFiltersCount = 0,
  onResetFilters,
  children,
  className,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  advancedOpen?: boolean;
  onAdvancedOpenChange?: (open: boolean) => void;
  activeFiltersCount?: number;
  onResetFilters?: () => void;
  children?: React.ReactNode;
  className?: string;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onAdvancedOpenChange ?? setInternalOpen;

  return (
    <div className={cn("space-y-0", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
        <ListSearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />
        <AdvancedFilterToggle
          open={open}
          onClick={() => setOpen(!open)}
          activeCount={activeFiltersCount}
        />
      </div>

      {open && (
        <div
          id="advanced-filters-panel"
          className="mt-3 rounded-xl border border-navy-950/10 bg-white p-4 shadow-sm"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-navy-500">
              Critères de filtrage
            </p>
            {onResetFilters && activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={onResetFilters}
                className="text-xs font-medium text-gold-700 hover:text-gold-600 hover:underline"
              >
                Réinitialiser
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{children}</div>
        </div>
      )}
    </div>
  );
}

export function FilterField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block text-sm", className)}>
      <span className="mb-1 block text-xs font-medium text-navy-600">{label}</span>
      {children}
    </label>
  );
}

/** Compte les clés d'un objet filtres dont la valeur est renseignée */
export function countActiveFilters(filters: Record<string, string | undefined | null>) {
  return Object.values(filters).filter((v) => v != null && String(v).trim() !== "").length;
}

/** Filtre local sur plusieurs champs texte */
export function matchQuickSearch(
  q: string,
  fields: (string | null | undefined)[]
): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const hay = fields.filter(Boolean).join(" ").toLowerCase();
  return hay.includes(needle);
}

export function useListFilters<T extends Record<string, string>>(
  initial: T
): {
  filters: T;
  setFilter: (key: keyof T, value: string) => void;
  resetFilters: () => void;
  activeCount: number;
} {
  const [filters, setFilters] = useState(initial);
  const activeCount = useMemo(() => countActiveFilters(filters), [filters]);
  const setFilter = (key: keyof T, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };
  const resetFilters = () => setFilters(initial);
  return { filters, setFilter, resetFilters, activeCount };
}
