const LABELS: Record<string, string> = {
  IN_STOCK: "Disponible",
  RESERVED: "Réservé",
  PREPARATION: "En préparation",
  EXIT_PENDING: "Sortie en attente",
  SOLD: "Vendu",
  DELIVERED: "Livré",
  IN_TRANSIT: "En transit",
  REPAIR: "En réparation",
};

const STYLES: Record<string, string> = {
  IN_STOCK: "bg-emerald-100 text-emerald-800",
  RESERVED: "bg-amber-100 text-amber-900",
  PREPARATION: "bg-sky-100 text-sky-900",
  EXIT_PENDING: "bg-orange-100 text-orange-900",
  SOLD: "bg-navy-100 text-navy-800",
  DELIVERED: "bg-violet-100 text-violet-900",
  REPAIR: "bg-morocco-100 text-morocco-800",
};

export function VehicleStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status] ?? "bg-navy-100 text-navy-700"}`}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
