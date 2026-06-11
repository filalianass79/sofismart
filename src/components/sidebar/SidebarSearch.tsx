"use client";

import { memo, useId } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarSearchProps = {
  value: string;
  onChange: (value: string) => void;
  collapsed: boolean;
  className?: string;
  autoFocus?: boolean;
};

export const SidebarSearch = memo(function SidebarSearch({
  value,
  onChange,
  collapsed,
  className,
  autoFocus,
}: SidebarSearchProps) {
  const id = useId();

  if (collapsed) {
    return (
      <div className={cn("flex justify-center px-2 py-2", className)} title="Rechercher un module">
        <Search className="h-5 w-5 text-white/40" aria-hidden />
      </div>
    );
  }

  return (
    <div className={cn("relative px-3 py-2", className)}>
      <label htmlFor={id} className="sr-only">
        Rechercher un module
      </label>
      <Search
        className="pointer-events-none absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
        aria-hidden
      />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Rechercher un module…"
        autoFocus={autoFocus}
        className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-8 text-sm text-white placeholder:text-white/40 outline-none ring-gold-400/30 transition-colors focus:border-gold-500/40 focus:bg-white/10 focus:ring-2"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-5 top-1/2 -translate-y-1/2 rounded p-0.5 text-white/50 hover:text-white"
          aria-label="Effacer la recherche"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
});
