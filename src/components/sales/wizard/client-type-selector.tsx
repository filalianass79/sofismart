"use client";

import { cn } from "@/lib/utils";
import { Building2, User } from "lucide-react";

export function ClientTypeSelector({
  value,
  onChange,
}: {
  value: "INDIVIDUAL" | "COMPANY";
  onChange: (v: "INDIVIDUAL" | "COMPANY") => void;
}) {
  const options = [
    { id: "INDIVIDUAL" as const, label: "Particulier", icon: User },
    { id: "COMPANY" as const, label: "Professionnel", icon: Building2 },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(
            "flex items-center gap-3 rounded-xl border-2 p-4 text-left transition",
            value === o.id
              ? "border-gold-500 bg-gold-500/10 shadow-sm"
              : "border-navy-950/10 bg-white hover:border-gold-500/40"
          )}
        >
          <o.icon className={cn("h-8 w-8", value === o.id ? "text-gold-700" : "text-navy-400")} />
          <span className="font-semibold text-navy-900">{o.label}</span>
        </button>
      ))}
    </div>
  );
}
