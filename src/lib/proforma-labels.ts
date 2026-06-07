import type { ProformaStatus } from "@/generated/prisma/enums";

export const proformaStatusLabels: Record<ProformaStatus, string> = {
  DRAFT: "Brouillon",
  GENERATED: "Générée",
  SENT: "Envoyée",
  PRINTED: "Imprimée",
  CONVERTED_TO_SALE: "Convertie en vente",
  EXPIRED: "Expirée",
  CANCELLED: "Annulée",
};

export function isProformaEditable(status: ProformaStatus): boolean {
  return status === "DRAFT";
}

export function isProformaActive(status: ProformaStatus): boolean {
  return !["CANCELLED", "CONVERTED_TO_SALE", "EXPIRED"].includes(status);
}
