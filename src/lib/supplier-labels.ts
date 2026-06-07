import type { SupplierRecordStatus, SupplierType } from "@/generated/prisma/enums";

export const supplierTypeLabels: Record<SupplierType, string> = {
  DEALERSHIP: "Concessionnaire",
  COMPANY: "Société de groupe",
  IMPORTER: "Importateur",
  INDIVIDUAL: "Particulier",
  GARAGE: "Garage",
  TRANSPORTER: "Transporteur",
  OTHER: "Autre",
};

export const supplierStatusLabels: Record<SupplierRecordStatus, string> = {
  ACTIVE: "Actif",
  INACTIVE: "Inactif",
  ARCHIVED: "Archivé",
};
