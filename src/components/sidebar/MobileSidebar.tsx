"use client";

import Link from "next/link";
import { memo, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";
import { SidebarNav } from "./SidebarNav";

export const MobileSidebar = memo(function MobileSidebar() {
  const { mobileOpen, closeMobile, isMobile } = useSidebar();
  const [search, setSearch] = useState("");
  const panelRef = useRef<HTMLElement>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (!mobileOpen) setSearch("");
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen || !isMobile) return;
    panelRef.current?.focus();
  }, [mobileOpen, isMobile]);

  if (!isMobile) return null;

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ease-in-out lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={closeMobile}
        aria-hidden={!mobileOpen}
      />

      <aside
        id="mobile-sidebar"
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(280px,88vw)] flex-col border-r border-navy-800/10 bg-navy-950 text-white shadow-2xl transition-transform duration-300 ease-in-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const start = touchStartX.current;
          const end = e.changedTouches[0]?.clientX;
          touchStartX.current = null;
          if (start != null && end != null && start - end > 60) closeMobile();
        }}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <Link href="/dashboard" onClick={closeMobile} className="font-display text-xl text-white">
            <span>Sofi</span>
            <span className="bg-gradient-to-r from-gold-300 to-gold-500 bg-clip-text text-transparent">
              Smart
            </span>
          </Link>
          <button
            type="button"
            onClick={closeMobile}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <SidebarNav
          collapsed={false}
          search={search}
          onSearchChange={setSearch}
          onNavigate={closeMobile}
          searchAutoFocus={mobileOpen}
        />
      </aside>
    </>
  );
});
