"use client";

import Link from "next/link";
import { memo, useCallback, useEffect, useId, useRef, useState } from "react";
import { Search } from "lucide-react";
import { DashboardHeaderUser } from "@/components/dashboard-header-user";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ALL_SEARCH_ENTRIES } from "@/lib/navigation/nav-config";
import { useNavFilter } from "@/hooks/use-nav-filter";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";
import { SidebarToggle } from "./SidebarToggle";

type MobileHeaderProps = {
  name?: string | null;
  email?: string | null;
  roleLabel?: string | null;
};

export const MobileHeader = memo(function MobileHeader({
  name,
  email,
  roleLabel,
}: MobileHeaderProps) {
  const { isMobile, openMobile } = useSidebar();
  const { canSee } = useNavFilter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputId = useId();
  const searchRef = useRef<HTMLDivElement>(null);

  const results = query.trim()
    ? ALL_SEARCH_ENTRIES.filter(
        (e) =>
          canSee(e.perm) &&
          (e.label.toLowerCase().includes(query.toLowerCase()) ||
            e.group.toLowerCase().includes(query.toLowerCase())),
      ).slice(0, 8)
    : [];

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setQuery("");
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) closeSearch();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeSearch();
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [searchOpen, closeSearch]);

  if (!isMobile) return null;

  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-navy-950/10 bg-white/95 px-3 py-3 backdrop-blur lg:hidden">
      <SidebarToggle variant="mobile" />

      <Link href="/dashboard" className="min-w-0 flex-1 font-display text-lg text-navy-950">
        <span>Sofi</span>
        <span className="bg-gradient-to-r from-gold-600 to-gold-400 bg-clip-text text-transparent">
          Smart
        </span>
      </Link>

      <div ref={searchRef} className="relative">
        <button
          type="button"
          onClick={() => setSearchOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-navy-700 hover:bg-navy-950/5"
          aria-expanded={searchOpen}
          aria-controls={`${inputId}-panel`}
          aria-label="Recherche rapide"
        >
          <Search className="h-5 w-5" />
        </button>

        {searchOpen && (
          <div
            id={`${inputId}-panel`}
            className="absolute right-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-1.5rem))] rounded-xl border border-navy-950/10 bg-white p-2 shadow-xl"
          >
            <label htmlFor={inputId} className="sr-only">
              Rechercher un module
            </label>
            <input
              id={inputId}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher…"
              autoFocus
              className="input-sofi w-full"
            />
            {results.length > 0 && (
              <ul className="mt-2 max-h-56 overflow-y-auto">
                {results.map((entry) => (
                  <li key={entry.id}>
                    <Link
                      href={entry.href}
                      onClick={closeSearch}
                      className="block rounded-lg px-2 py-2 text-sm hover:bg-cream-100"
                    >
                      <span className="font-medium text-navy-900">{entry.label}</span>
                      <span className="block text-[10px] uppercase text-navy-500">{entry.group}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {query.trim() && results.length === 0 && (
              <p className="px-2 py-3 text-center text-xs text-navy-500">Aucun résultat</p>
            )}
            <button
              type="button"
              onClick={() => {
                closeSearch();
                openMobile();
              }}
              className={cn(
                "mt-2 w-full rounded-lg py-2 text-center text-xs font-medium text-gold-800 hover:bg-gold-500/10",
              )}
            >
              Ouvrir le menu complet
            </button>
          </div>
        )}
      </div>

      <NotificationBell />
      <DashboardHeaderUser name={name} email={email} roleLabel={roleLabel} />
    </header>
  );
});
