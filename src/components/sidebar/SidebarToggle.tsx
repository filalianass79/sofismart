"use client";

import { memo } from "react";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";

type SidebarToggleProps = {
  variant?: "sidebar" | "mobile";
  className?: string;
};

export const SidebarToggle = memo(function SidebarToggle({
  variant = "sidebar",
  className,
}: SidebarToggleProps) {
  const { collapsed, toggleCollapsed, toggleMobile, mobileOpen } = useSidebar();

  if (variant === "mobile") {
    return (
      <button
        type="button"
        onClick={toggleMobile}
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-lg text-navy-700 transition-colors hover:bg-navy-950/5",
          className,
        )}
        aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
        aria-controls="mobile-sidebar"
        aria-expanded={mobileOpen}
      >
        <Menu className="h-5 w-5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleCollapsed}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-all duration-300 ease-in-out hover:bg-white/10 hover:text-white",
        className,
      )}
      aria-expanded={!collapsed}
      aria-label={collapsed ? "Développer le menu latéral" : "Réduire le menu latéral"}
    >
      {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
    </button>
  );
});
