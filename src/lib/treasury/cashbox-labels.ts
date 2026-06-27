import type {
  CashboxStatus,
  CashboxType,
  CashMovementStatus,
  CashMovementType,
  CashTransferStatus,
} from "@/generated/prisma/enums";

export const cashboxTypeLabels: Record<CashboxType, string> = {
  EMPLOYEE: "Caisse employé",
  DEPOT: "Caisse dépôt",
  MAIN: "Caisse principale",
  TEMPORARY: "Caisse temporaire",
};

export const cashboxStatusLabels: Record<CashboxStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  BLOCKED: "Bloquée",
  CLOSED: "Fermée",
};

export const cashMovementTypeLabels: Record<CashMovementType, string> = {
  CREDIT: "Crédit",
  DEBIT: "Débit",
  TRANSFER_OUT: "Transfert sortant",
  TRANSFER_IN: "Transfert entrant",
  ADJUSTMENT: "Ajustement",
  REVERSAL: "Contrepassation",
};

export const cashMovementStatusLabels: Record<CashMovementStatus, string> = {
  DRAFT: "Brouillon",
  PENDING_VALIDATION: "En attente",
  VALIDATED: "Validé",
  REJECTED: "Refusé",
  CANCELLED: "Annulé",
  REVERSED: "Contrepassé",
};

export const cashTransferStatusLabels: Record<CashTransferStatus, string> = {
  PENDING_RECEPTION: "En attente réception",
  ACCEPTED: "Accepté",
  REJECTED: "Refusé",
  CANCELLED: "Annulé",
};

export const creditPaymentMethods = [
  { value: "CASH", label: "Espèces" },
  { value: "TRANSFER", label: "Virement" },
  { value: "CHECK", label: "Chèque" },
  { value: "REFUND", label: "Remboursement" },
  { value: "ADVANCE", label: "Avance reçue" },
  { value: "OTHER", label: "Autre" },
] as const;

export const debitPaymentMethods = [
  { value: "CASH", label: "Espèces" },
  { value: "SUPPLIER", label: "Paiement fournisseur" },
  { value: "TRAVEL", label: "Frais déplacement" },
  { value: "DEPOT", label: "Frais dépôt" },
  { value: "ADVANCE", label: "Avance salarié" },
  { value: "ACCESSORY", label: "Achat accessoire" },
  { value: "OTHER", label: "Autre" },
] as const;
