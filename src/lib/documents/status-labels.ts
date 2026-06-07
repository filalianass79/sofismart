import type { DeliveryNoteStatus, ExitVoucherStatus, SaleRecordStatus } from "@/generated/prisma/enums";

export function exitVoucherStatusLabel(status: ExitVoucherStatus | string): string {
  const map: Record<string, string> = {
    PENDING: "En attente de sortie",
    DELIVERED: "Sortie effectuée",
    CANCELLED: "Annulé",
    EXPIRED: "Expiré",
  };
  return map[status] ?? status;
}

export function deliveryNoteStatusLabel(status: DeliveryNoteStatus | string): string {
  const map: Record<string, string> = {
    DRAFT: "Brouillon",
    GENERATED: "Généré",
    DELIVERED: "Livré",
    SIGNED_UPLOADED: "Signé déposé",
    CANCELLED: "Annulé",
  };
  return map[status] ?? status;
}

export function saleInvoiceStatusLabel(status: SaleRecordStatus | string): string {
  const map: Record<string, string> = {
    DRAFT: "Brouillon",
    PENDING_VALIDATION: "En attente validation",
    VALIDATED: "Validée",
    CANCELLED: "Annulée",
  };
  return map[status] ?? status;
}
