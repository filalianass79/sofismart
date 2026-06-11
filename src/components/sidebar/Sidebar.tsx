"use client";

import Link from "next/link";
import { memo, useState } from "react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";
import { SidebarNav } from "./SidebarNav";
import { SidebarToggle } from "./SidebarToggle";

export const Sidebar = memo(function Sidebar({ className }: { className?: string }) {
  const { collapsed, mounted } = useSidebar();
  const [search, setSearch] = useState("");

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r border-navy-800/10 bg-navy-950 text-white transition-all duration-300 ease-in-out",
        collapsed ? "w-[70px]" : "w-[280px]",
        !mounted && "w-[280px]",
        className,
      )}
      aria-label="Menu latéral"
    >
      <div
        className={cn(
          "flex items-start border-b border-white/10 transition-all duration-300 ease-in-out",
          collapsed ? "flex-col gap-2 px-2 py-4" : "justify-between gap-2 px-4 py-5",
        )}
      >
        <Link
          href="/dashboard"
          className={cn("min-w-0", collapsed && "flex w-full justify-center")}
          title={collapsed ? "SofiSmart — Accueil" : undefined}
        >
          {collapsed ? (
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold-500/30 to-gold-600/10 font-display text-xl font-bold text-gold-300">
              S
            </span>
          ) : (
            <div>
              <p className="font-display text-2xl tracking-tight">
                <span className="text-white">Sofi</span>
                <span className="bg-gradient-to-r from-gold-300 to-gold-500 bg-clip-text text-transparent">
                  Smart
                </span>
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-widest text-white/50">
                Gestion véhicules
              </p>
            </div>
          )}
        </Link>
        <SidebarToggle className={cn(collapsed && "self-center")} />
      </div>

      <SidebarNav collapsed={collapsed} search={search} onSearchChange={setSearch} />
    </aside>
  );
});
