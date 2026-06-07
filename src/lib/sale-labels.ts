import type {
  DeliveryStatus,
  ExitVoucherStatus,
  SalePaymentStatus,
  SaleRecordStatus,
  SaleType,
} from "@/generated/prisma/enums";

export const saleTypeLabels: Record<SaleType, string> = {
  CASH: "Comptant",
  CREDIT: "Crédit",
  LEASING: "Leasing",
  TRADE_IN: "Reprise",
  OTHER: "Autre",
};

export const salePaymentStatusLabels: Record<SalePaymentStatus, string> = {
  UNPAID: "Non payé",
  PARTIAL: "Partiellement payé",
  PAID: "Payé",
  OVERDUE: "En retard",
};

export const saleRecordStatusLabels: Record<SaleRecordStatus, string> = {
  DRAFT: "Brouillon",
  PENDING_VALIDATION: "En attente validation",
  VALIDATED: "Validée",
  CANCELLED: "Annulée",
};

export const deliveryStatusLabels: Record<DeliveryStatus, string> = {
  NOT_STARTED: "Non démarrée",
  EXIT_PENDING: "Sortie en attente",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
};

export const exitVoucherStatusLabels: Record<ExitVoucherStatus, string> = {
  PENDING: "En attente",
  DELIVERED: "Livré",
  CANCELLED: "Annulé",
  EXPIRED: "Expiré",
};
