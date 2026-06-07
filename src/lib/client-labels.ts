import type {
  AcquisitionSource,
  Civility,
  ClientDocumentType,
  ClientType,
  FinancialStatus,
  InteractionType,
  RelationshipStatus,
  ReminderStatus,
} from "@/generated/prisma/enums";

export const clientTypeLabels: Record<ClientType, string> = {
  INDIVIDUAL: "Particulier",
  COMPANY: "Professionnel",
  RESELLER: "Revendeur",
};

export function isProfessionalType(type: ClientType): boolean {
  return type === "COMPANY" || type === "RESELLER";
}

export const civilityLabels: Record<Civility, string> = {
  MR: "Monsieur",
  MRS: "Madame",
  MISS: "Mademoiselle",
};

export const acquisitionSourceLabels: Record<AcquisitionSource, string> = {
  SOCIAL_MEDIA: "Réseaux sociaux",
  WEBSITE: "Site web",
  REFERRAL: "Recommandation",
  ADVERTISING: "Publicité",
  PHONE_CALL: "Appel",
  SHOWROOM: "Visite showroom",
  OTHER: "Autre",
};

export const financialStatusLabels: Record<FinancialStatus, string> = {
  GOOD_PAYER: "Bon payeur",
  AVERAGE: "Moyen",
  RISK: "Risque",
  BLOCKED: "Bloqué",
};

export const relationshipStatusLabels: Record<RelationshipStatus, string> = {
  PROSPECT: "Prospect",
  ACTIVE: "Client actif",
  LOYAL: "Client fidèle",
  INACTIVE: "Client inactif",
  VIP: "Client VIP",
};

export const interactionTypeLabels: Record<InteractionType, string> = {
  NOTE: "Note",
  CALL: "Appel",
  TASK: "Tâche",
  FOLLOW_UP: "Relance",
  MEETING: "Rendez-vous",
};

export const reminderStatusLabels: Record<ReminderStatus, string> = {
  PENDING: "En attente",
  DONE: "Terminé",
  CANCELLED: "Annulé",
};

export const clientDocumentTypeLabels: Record<ClientDocumentType, string> = {
  CIN: "CIN",
  PASSPORT: "Passeport",
  PROOF_OF_ADDRESS: "Justificatif domicile",
  SALE_CONTRACT: "Contrat vente",
  PURCHASE_ORDER: "Bon de commande",
  PAYMENT_RECEIPT: "Reçu paiement",
  FINANCING: "Financement",
  INSURANCE: "Assurance",
  ICE_DOC: "ICE",
  RC_DOC: "RC",
  TAX_ID_DOC: "IF",
  PATENT: "Patente",
  COMPANY_STATUTES: "Statuts société",
  INVOICE: "Facture",
  BANK_DOCUMENT: "Document bancaire",
  OTHER: "Autre",
};
