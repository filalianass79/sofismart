"use client";

import { memo, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type SidebarTooltipProps = {
  label: string;
  children: ReactNode;
  side?: "right" | "bottom";
  className?: string;
};

export const SidebarTooltip = memo(function SidebarTooltip({
  label,
  children,
  side = "right",
  className,
}: SidebarTooltipProps) {
  return (
    <div className={cn("group/tooltip relative", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-[60] whitespace-nowrap rounded-md bg-navy-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg ring-1 ring-white/10 transition-opacity duration-200",
          "group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100",
          side === "right" && "left-full top-1/2 ml-2.5 -translate-y-1/2",
          side === "bottom" && "left-1/2 top-full mt-2 -translate-x-1/2",
        )}
      >
        {label}
      </span>
    </div>
  );
});
