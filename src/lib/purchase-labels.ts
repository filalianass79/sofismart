import type {
  Currency,
  DocumentCategory,
  PaymentMethod,
  PurchaseFeeType,
  PurchasePaymentStatus,
  PurchaseStatus,
  PurchaseType,
  SupplierType,
  VehicleCondition,
  VehicleOrigin,
  VehicleStatus,
} from "@/generated/prisma/enums";

export const supplierTypeLabels: Record<SupplierType, string> = {
  DEALERSHIP: "Concessionnaire",
  COMPANY: "Société de groupe",
  IMPORTER: "Importateur",
  INDIVIDUAL: "Particulier",
  GARAGE: "Garage",
  TRANSPORTER: "Transporteur",
  OTHER: "Autre",
};

export const purchaseTypeLabels: Record<PurchaseType, string> = {
  LOCAL: "Achat local",
  IMPORT: "Achat import",
  DEALERSHIP: "Achat concessionnaire",
  INDIVIDUAL: "Achat particulier",
  GROUP: "Achat groupe",
};

export const currencyLabels: Record<Currency, string> = {
  MAD: "MAD",
  EUR: "EUR",
  USD: "USD",
};

export const purchaseStatusLabels: Record<PurchaseStatus, string> = {
  DRAFT: "Brouillon",
  VALIDATED: "Validé",
  CANCELLED: "Annulé",
};

export const purchasePaymentStatusLabels: Record<PurchasePaymentStatus, string> = {
  UNPAID: "Non payé",
  PARTIAL: "Partiellement payé",
  PAID: "Payé",
};

export const feeTypeLabels: Record<PurchaseFeeType, string> = {
  TRANSPORT: "Transport",
  CUSTOMS: "Douane",
  TRANSIT: "Transit",
  HOMOLOGATION: "Homologation",
  REPAIR: "Réparation",
  CLEANING: "Nettoyage",
  REGISTRATION: "Immatriculation",
  INSURANCE: "Assurance provisoire",
  EXPERTISE: "Expertise",
  COMMISSION: "Commission",
  OTHER: "Autres frais",
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: "Espèces",
  TRANSFER: "Virement",
  CHECK: "Chèque",
  CREDIT: "Crédit",
  BILL_OF_EXCHANGE: "Effet",
  OTHER: "Autre",
};

export const vehicleOriginLabels: Record<VehicleOrigin, string> = {
  NEW: "Neuf",
  USED: "Occasion",
  IMPORTED: "Importé",
};

export const vehicleStatusLabels: Record<VehicleStatus, string> = {
  IN_STOCK: "En stock",
  RESERVED: "Réservé",
  EXIT_PENDING: "Sortie en attente",
  SOLD: "Vendu",
  DELIVERED: "Livré",
  IN_REPAIR: "En réparation",
  IN_TRANSIT: "En transit",
  PREPARATION: "En préparation",
};

export const vehicleConditionLabels: Record<VehicleCondition, string> = {
  EXCELLENT: "Très bon état",
  GOOD: "Bon état",
  AVERAGE: "Moyen",
  NEEDS_REPAIR: "À réparer",
};

export const documentCategoryLabels: Record<DocumentCategory, string> = {
  PURCHASE_INVOICE: "Facture d'achat",
  PURCHASE_ORDER: "Bon de commande",
  CONTRACT: "Contrat d'achat",
  REGISTRATION_CARD: "Carte grise",
  PROVISIONAL_REGISTRATION_CARD: "Carte grise provisoire",
  CONFORMITY_CERT: "Certificat de conformité",
  CUSTOMS: "Document douanier",
  TRANSIT_DOC: "Document de transit",
  PAYMENT_RECEIPT: "Justificatif de paiement",
  FINANCING_CONTRACT: "Contrat de financement",
  VEHICLE_PHOTO: "Photo véhicule",
  EXPERTISE_REPORT: "Rapport d'expertise",
  PROVISIONAL_INSURANCE: "Assurance provisoire",
  SALE_INVOICE: "Facture de vente",
  CLIENT_DOC: "Document client",
  SUPPLIER_DOC: "Document fournisseur",
  OTHER: "Autre document",
};
