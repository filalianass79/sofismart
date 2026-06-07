import type { DepotStatus, DepotType } from "@/generated/prisma/enums";

export const depotTypeLabels: Record<DepotType, string> = {
  MAIN: "Principal",
  SECONDARY: "Secondaire",
  TRANSIT: "Transit",
  PREPARATION: "Préparation",
  REPAIR: "Réparation",
};

export const depotStatusLabels: Record<DepotStatus, string> = {
  ACTIVE: "Actif",
  INACTIVE: "Inactif",
  ARCHIVED: "Archivé",
};
