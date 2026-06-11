"use client";

import Link from "next/link";
import { memo, useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavChild, NavItem } from "@/lib/navigation/nav-config";
import { SidebarTooltip } from "./SidebarTooltip";
import { useSidebar } from "./sidebar-context";

function isPathActive(pathname: string, href: string, activePrefix?: string) {
  const prefix = activePrefix ?? href;
  return pathname === href || (prefix !== "/dashboard" && pathname.startsWith(prefix));
}

function isItemActive(pathname: string, item: NavItem) {
  if (isPathActive(pathname, item.href, item.activePrefix)) return true;
  return (item.children ?? []).some((c) => isPathActive(pathname, c.href, item.activePrefix));
}

type SidebarItemProps = {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  canSee: (perm: string) => boolean;
  onNavigate?: () => void;
  forceExpanded?: boolean;
};

export const SidebarItem = memo(function SidebarItem({
  item,
  pathname,
  collapsed,
  canSee,
  onNavigate,
  forceExpanded,
}: SidebarItemProps) {
  const { closeMobile } = useSidebar();
  const [open, setOpen] = useState(false);
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const submenuId = useId();

  const visibleChildren = (item.children ?? []).filter((c) => canSee(c.perm ?? item.perm));
  const hasChildren = visibleChildren.length > 0;
  const active = isItemActive(pathname, item);
  const Icon = item.icon;

  useEffect(() => {
    if (active && hasChildren && !collapsed) setOpen(true);
  }, [active, hasChildren, collapsed]);

  useEffect(() => {
    if (!flyoutOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (flyoutRef.current && !flyoutRef.current.contains(e.target as Node)) {
        setFlyoutOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [flyoutOpen]);

  const handleNavigate = useCallback(() => {
    onNavigate?.();
    closeMobile();
    setFlyoutOpen(false);
  }, [onNavigate, closeMobile]);

  const linkClass = (isActive: boolean, indented = false) =>
    cn(
      "flex items-center rounded-lg text-sm font-medium transition-all duration-300 ease-in-out",
      collapsed ? "justify-center px-2 py-2.5" : cn("gap-3 px-3 py-2.5", indented && "ml-2 pl-5"),
      isActive
        ? "border-l-4 border-gold-400 bg-gradient-to-r from-gold-600/25 to-gold-400/10 text-gold-200"
        : "border-l-4 border-transparent text-white/75 hover:bg-white/5 hover:text-white",
    );

  const renderChildLink = (child: NavChild, indented = true) => {
    const childActive = isPathActive(pathname, child.href, item.activePrefix);
    return (
      <Link
        key={child.id}
        href={child.href}
        onClick={handleNavigate}
        className={linkClass(childActive, indented && !collapsed)}
      >
        {!collapsed && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-50" />}
        {!collapsed && <span className="truncate">{child.label}</span>}
      </Link>
    );
  };

  if (!hasChildren) {
    const link = (
      <Link
        href={item.href}
        onClick={handleNavigate}
        className={linkClass(active)}
        aria-current={active ? "page" : undefined}
      >
        <Icon className={cn("h-5 w-5 shrink-0", active ? "text-gold-300" : "opacity-90")} />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );

    if (collapsed) {
      return <SidebarTooltip label={item.label}>{link}</SidebarTooltip>;
    }
    return link;
  }

  if (collapsed) {
    return (
      <div
        ref={flyoutRef}
        className="relative"
        onMouseEnter={() => setFlyoutOpen(true)}
        onMouseLeave={() => setFlyoutOpen(false)}
        onFocus={() => setFlyoutOpen(true)}
        onBlur={(e) => {
          if (!flyoutRef.current?.contains(e.relatedTarget as Node)) setFlyoutOpen(false);
        }}
      >
        <SidebarTooltip label={item.label} side="right">
          <button
            type="button"
            className={cn(linkClass(active), "w-full")}
            aria-expanded={flyoutOpen}
            aria-controls={submenuId}
            aria-haspopup="true"
            onClick={() => setFlyoutOpen((v) => !v)}
          >
            <Icon className={cn("h-5 w-5 shrink-0", active ? "text-gold-300" : "opacity-90")} />
          </button>
        </SidebarTooltip>
        {flyoutOpen && (
          <div
            id={submenuId}
            role="menu"
            className="absolute left-full top-0 z-50 ml-2 min-w-[12rem] rounded-xl border border-white/10 bg-navy-900 py-1.5 shadow-2xl ring-1 ring-black/20"
          >
            <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gold-400/90">
              {item.label}
            </p>
            {visibleChildren.map((child) => {
              const childActive = isPathActive(pathname, child.href, item.activePrefix);
              return (
                <Link
                  key={child.id}
                  href={child.href}
                  role="menuitem"
                  onClick={handleNavigate}
                  className={cn(
                    "block px-3 py-2 text-sm transition-colors",
                    childActive
                      ? "bg-gold-500/15 font-medium text-gold-200"
                      : "text-white/80 hover:bg-white/5 hover:text-white",
                  )}
                >
                  {child.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const expanded = forceExpanded || open;

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-0.5">
        <Link
          href={item.href}
          onClick={handleNavigate}
          className={cn(linkClass(active), "min-w-0 flex-1")}
          aria-current={active ? "page" : undefined}
        >
          <Icon className={cn("h-5 w-5 shrink-0", active ? "text-gold-300" : "opacity-90")} />
          <span className="truncate">{item.label}</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mr-1 rounded-md p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          aria-expanded={expanded}
          aria-controls={submenuId}
          aria-label={expanded ? `Replier ${item.label}` : `Déplier ${item.label}`}
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", expanded && "rotate-180")} />
        </button>
      </div>
      <div
        id={submenuId}
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-0.5 border-l border-white/10 pl-2">
            {visibleChildren.map((child) => renderChildLink(child))}
          </div>
        </div>
      </div>
    </div>
  );
});
