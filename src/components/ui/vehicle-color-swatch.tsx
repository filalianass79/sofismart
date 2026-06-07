import { getVehicleColorHex } from "@/lib/vehicle-catalog";
import { cn } from "@/lib/utils";

export function VehicleColorSwatch({
  color,
  className,
  size = "md",
}: {
  color: string | null | undefined;
  className?: string;
  size?: "sm" | "md";
}) {
  if (!color) return <span className="text-navy-400">—</span>;
  const hex = getVehicleColorHex(color);
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "shrink-0 rounded-full border border-navy-950/20 shadow-inner",
          size === "sm" ? "h-4 w-4" : "h-5 w-5"
        )}
        style={{ backgroundColor: hex }}
        title={color}
      />
      <span>{color}</span>
    </span>
  );
}
