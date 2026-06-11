"use client";

import Link from "next/link";
import { memo, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useNavFilter } from "@/hooks/use-nav-filter";
import {
  ALL_SEARCH_ENTRIES,
  MAGASIN_NAV_ITEMS,
  MAIN_NAV_ITEMS,
  SETTINGS_NAV,
  SETTINGS_NAV_LEGACY,
  type NavItem,
} from "@/lib/navigation/nav-config";
import { cn } from "@/lib/utils";
import { SidebarItem } from "./SidebarItem";
import { SidebarSearch } from "./SidebarSearch";

type SidebarNavProps = {
  collapsed: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onNavigate?: () => void;
  searchAutoFocus?: boolean;
  className?: string;
};

function matchesSearch(item: NavItem, query: string, canSee: (p: string) => boolean): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase().trim();
  if (item.label.toLowerCase().includes(q)) return true;
  return (item.children ?? []).some(
    (c) => canSee(c.perm ?? item.perm) && c.label.toLowerCase().includes(q),
  );
}

function matchesSearchEntry(query: string, label: string, group: string) {
  const q = query.toLowerCase().trim();
  return label.toLowerCase().includes(q) || group.toLowerCase().includes(q);
}

export const SidebarNav = memo(function SidebarNav({
  collapsed,
  search,
  onSearchChange,
  onNavigate,
  searchAutoFocus,
  className,
}: SidebarNavProps) {
  const pathname = usePathname();
  const { canSee } = useNavFilter();

  const showSettings = SETTINGS_NAV_LEGACY.perms.some((p) => canSee(p));

  const mainNav = useMemo(
    () => MAIN_NAV_ITEMS.filter((item) => canSee(item.perm) && matchesSearch(item, search, canSee)),
    [canSee, search],
  );

  const magasinNav = useMemo(
    () => MAGASIN_NAV_ITEMS.filter((item) => canSee(item.perm) && matchesSearch(item, search, canSee)),
    [canSee, search],
  );

  const showSettingsItem = showSettings && matchesSearch(SETTINGS_NAV, search, canSee);

  const searchResults = useMemo(() => {
    const q = search.trim();
    if (!q) return [];
    return ALL_SEARCH_ENTRIES.filter(
      (e) => canSee(e.perm) && matchesSearchEntry(q, e.label, e.group),
    ).slice(0, 12);
  }, [search, canSee]);

  const forceExpanded = search.trim().length > 0;

  return (
    <div className={cn("flex flex-1 flex-col overflow-hidden", className)}>
      <SidebarSearch
        value={search}
        onChange={onSearchChange}
        collapsed={collapsed}
        autoFocus={searchAutoFocus}
      />

      {search.trim() && !collapsed ? (
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {searchResults.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-white/50">Aucun module trouvé</p>
          ) : (
            <ul className="space-y-0.5">
              {searchResults.map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={entry.href}
                    onClick={onNavigate}
                    className="block rounded-lg px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <span className="font-medium">{entry.label}</span>
                    <span className="mt-0.5 block text-[10px] uppercase tracking-wide text-white/40">
                      {entry.group}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden p-2" aria-label="Navigation principale">
          {mainNav.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              pathname={pathname}
              collapsed={collapsed}
              canSee={canSee}
              onNavigate={onNavigate}
              forceExpanded={forceExpanded}
            />
          ))}

          {magasinNav.length > 0 && (
            <>
              {mainNav.length > 0 && <div className="my-2 border-t border-white/10" />}
              {!collapsed && (
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/35">
                  Magasin
                </p>
              )}
              {magasinNav.map((item) => (
                <SidebarItem
                  key={item.id}
                  item={item}
                  pathname={pathname}
                  collapsed={collapsed}
                  canSee={canSee}
                  onNavigate={onNavigate}
                  forceExpanded={forceExpanded}
                />
              ))}
            </>
          )}

          {showSettingsItem && (
            <>
              <div className="my-2 border-t border-white/10" />
              <SidebarItem
                item={SETTINGS_NAV}
                pathname={pathname}
                collapsed={collapsed}
                canSee={canSee}
                onNavigate={onNavigate}
                forceExpanded={forceExpanded}
              />
            </>
          )}
        </nav>
      )}
    </div>
  );
});
