import type { PaymentCategory, PaymentValidationStatus } from "@/generated/prisma/enums";

export const paymentCategoryLabels: Record<PaymentCategory, string> = {
  CLIENT: "Paiement client",
  SUPPLIER: "Paiement fournisseur",
  PURCHASE: "Paiement achat",
  SALE: "Paiement vente",
  MISC: "Divers",
};

export const paymentValidationLabels: Record<PaymentValidationStatus, string> = {
  PENDING: "En attente",
  VALIDATED: "Validé",
  REJECTED: "Rejeté",
  CANCELLED: "Annulé",
};
