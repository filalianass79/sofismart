"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useNavFilter } from "@/hooks/use-nav-filter";
import { cn } from "@/lib/utils";
import {
  MAIN_NAV_ITEMS,
  MAGASIN_NAV_ITEMS,
  SETTINGS_NAV,
  type NavItem,
} from "@/lib/navigation/nav-config";

const STORAGE_KEY = "sofismart-sidebar-collapsed";

function NavLink({
  item,
  pathname,
  collapsed,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
}) {
  const prefix = item.activePrefix ?? item.href;
  const active =
    pathname === item.href ||
    (prefix !== "/dashboard" && pathname.startsWith(prefix));

  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors",
        collapsed ? "justify-center px-2" : cn("gap-3 px-3", item.indent && "ml-4"),
        active
          ? "bg-gradient-to-r from-gold-600/25 to-gold-400/10 text-gold-200"
          : "text-white/75 hover:bg-white/5 hover:text-white",
      )}
    >
      <Icon className="h-5 w-5 shrink-0 opacity-90" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { canSee } = useNavFilter();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* ignore */
    }
    setMounted(true);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const mainNav = MAIN_NAV_ITEMS.filter((item) => canSee(item.perm));
  const magasinNav = MAGASIN_NAV_ITEMS.filter((item) => canSee(item.perm));
  const showSettings = SETTINGS_NAV.perms.some((p) => canSee(p));
  const SettingsIcon = SETTINGS_NAV.icon;

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r border-navy-800/10 bg-navy-950 text-white transition-[width] duration-200 ease-in-out",
        collapsed ? "w-[4.5rem]" : "w-64",
        !mounted && "w-64",
      )}
    >
      <div
        className={cn(
          "border-b border-white/10 py-5 transition-all",
          collapsed ? "px-2" : "px-5",
        )}
      >
        <Link
          href="/dashboard"
          className={cn("block", collapsed && "flex justify-center")}
          title={collapsed ? "SofiSmart — Accueil" : undefined}
        >
          {collapsed ? (
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold-500/30 to-gold-600/10 font-display text-xl font-bold text-gold-300">
              S
            </span>
          ) : (
            <>
              <p className="font-display text-2xl tracking-tight">
                <span className="text-white">Sofi</span>
                <span className="bg-gradient-to-r from-gold-300 to-gold-500 bg-clip-text text-transparent">
                  Smart
                </span>
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-widest text-white/50">
                Gestion véhicules
              </p>
            </>
          )}
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden p-2">
        {mainNav.map((item) => (
          <NavLink key={item.id} item={item} pathname={pathname} collapsed={collapsed} />
        ))}

        {magasinNav.length > 0 && (
          <>
            {mainNav.length > 0 && <div className="my-2 border-t border-white/10" />}
            {magasinNav.map((item) => (
              <NavLink key={item.id} item={item} pathname={pathname} collapsed={collapsed} />
            ))}
          </>
        )}

        {showSettings && (
          <>
            <div className="my-2 border-t border-white/10" />
            <Link
              href={SETTINGS_NAV.href}
              title={collapsed ? SETTINGS_NAV.label : undefined}
              className={cn(
                "flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors",
                collapsed ? "justify-center px-2" : "gap-3 px-3",
                pathname.startsWith("/dashboard/settings")
                  ? "bg-gradient-to-r from-gold-600/25 to-gold-400/10 text-gold-200"
                  : "text-white/75 hover:bg-white/5 hover:text-white",
              )}
            >
              <SettingsIcon className="h-5 w-5 shrink-0 opacity-90" />
              {!collapsed && <span className="truncate">{SETTINGS_NAV.label}</span>}
            </Link>
          </>
        )}
      </nav>

      <div className="border-t border-white/10 p-2">
        <button
          type="button"
          onClick={toggleCollapsed}
          className={cn(
            "flex w-full items-center rounded-lg py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white",
            collapsed ? "justify-center px-2" : "gap-3 px-3",
          )}
          title={collapsed ? "Ouvrir le menu" : "Réduire le menu"}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Ouvrir le menu latéral" : "Réduire le menu latéral"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-5 w-5 shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="h-5 w-5 shrink-0" />
              <span>Réduire</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
