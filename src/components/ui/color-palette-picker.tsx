"use client";

import { Check } from "lucide-react";
import { vehicleColorPalette } from "@/lib/vehicle-catalog";
import { cn } from "@/lib/utils";

export function ColorPalettePicker({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap gap-2.5">
        {vehicleColorPalette.map((c) => {
          const selected = value === c.value;
          return (
            <button
              key={c.value}
              type="button"
              title={c.value}
              onClick={() => onChange(c.value)}
              className={cn(
                "relative h-10 w-10 rounded-full border-2 shadow-sm transition-all hover:scale-105 sm:h-11 sm:w-11",
                selected
                  ? "border-gold-500 ring-2 ring-gold-400/60 ring-offset-2 ring-offset-cream-50"
                  : "border-navy-950/15"
              )}
              style={{ backgroundColor: c.hex }}
              aria-label={c.value}
              aria-pressed={selected}
            >
              {selected && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Check
                    className={cn(
                      "h-4 w-4 drop-shadow",
                      c.value === "Blanc" || c.value === "Jaune" || c.value === "Beige" || c.value === "Argent"
                        ? "text-navy-900"
                        : "text-white"
                    )}
                    strokeWidth={3}
                  />
                </span>
              )}
            </button>
          );
        })}
      </div>
      {value ? (
        <p className="text-xs text-navy-600">
          Sélection : <span className="font-medium text-navy-900">{value}</span>
        </p>
      ) : (
        <p className="text-xs text-navy-500">Choisissez une couleur dans la palette</p>
      )}
    </div>
  );
}
