import type { PrismaClient } from "../src/generated/prisma/client";
import type { NotificationEventType } from "../src/generated/prisma/enums";

const DEFAULT_SETTINGS: {
  eventType: NotificationEventType;
  internalEnabled: boolean;
  whatsappEnabled: boolean;
  recipientRoles: string[];
  sendToClient?: boolean;
}[] = [
  { eventType: "SALE_VALIDATION_REQUEST", internalEnabled: true, whatsappEnabled: false, recipientRoles: ["GERANT", "ADMIN"] },
  { eventType: "SALE_VALIDATED", internalEnabled: true, whatsappEnabled: true, recipientRoles: ["MAGASINIER", "RESPONSABLE_DEPOT"], sendToClient: false },
  { eventType: "EXIT_VOUCHER_GENERATED", internalEnabled: true, whatsappEnabled: true, recipientRoles: ["MAGASINIER", "RESPONSABLE_DEPOT"] },
  { eventType: "DELIVERY_CONFIRMED", internalEnabled: true, whatsappEnabled: false, recipientRoles: ["COMMERCIAL", "GERANT", "ADMIN"] },
  { eventType: "PAYMENT_RECEIVED", internalEnabled: true, whatsappEnabled: false, recipientRoles: ["COMPTABLE", "GERANT"] },
  { eventType: "PAYMENT_OVERDUE", internalEnabled: true, whatsappEnabled: true, recipientRoles: ["COMPTABLE", "GERANT"] },
  { eventType: "PURCHASE_VALIDATED", internalEnabled: true, whatsappEnabled: false, recipientRoles: ["GERANT", "ADMIN"] },
  { eventType: "USER_CREATED", internalEnabled: true, whatsappEnabled: false, recipientRoles: [] },
  { eventType: "PASSWORD_RESET", internalEnabled: true, whatsappEnabled: false, recipientRoles: [] },
];

const TEMPLATES: {
  key: string;
  name: string;
  channel: "INTERNAL" | "WHATSAPP";
  eventType: NotificationEventType;
  subject?: string;
  body: string;
  variables: string[];
}[] = [
  {
    key: "sale_validated_internal",
    name: "Vente validée (interne)",
    channel: "INTERNAL",
    eventType: "SALE_VALIDATED",
    subject: "Nouvelle vente validée à livrer",
    body: "Une vente a été validée pour le véhicule {vehicleBrand} {vehicleModel} immatriculé {registrationNumber}. Merci de préparer la sortie depuis le dépôt {depotName}. Réf. {saleReference}",
    variables: ["vehicleBrand", "vehicleModel", "registrationNumber", "depotName", "saleReference"],
  },
  {
    key: "sale_validated_whatsapp",
    name: "Vente validée (WhatsApp)",
    channel: "WHATSAPP",
    eventType: "SALE_VALIDATED",
    body: `Bonjour {employeeName},
Une nouvelle vente a été validée.

Véhicule : {vehicleBrand} {vehicleModel}
Immatriculation : {registrationNumber}
Client : {clientName}
Dépôt : {depotName}
Référence : {saleReference}

Merci de préparer la sortie du véhicule.
Lien : {actionUrl}`,
    variables: ["employeeName", "vehicleBrand", "vehicleModel", "registrationNumber", "clientName", "depotName", "saleReference", "actionUrl"],
  },
  {
    key: "exit_voucher_whatsapp",
    name: "Bon de sortie (WhatsApp)",
    channel: "WHATSAPP",
    eventType: "EXIT_VOUCHER_GENERATED",
    body: `Bonjour {employeeName},
Le bon de sortie {exitVoucherReference} a été généré pour {vehicleBrand} {vehicleModel}.
Lien : {documentUrl}`,
    variables: ["employeeName", "exitVoucherReference", "vehicleBrand", "vehicleModel", "documentUrl"],
  },
  {
    key: "payment_overdue_whatsapp",
    name: "Paiement en retard (WhatsApp)",
    channel: "WHATSAPP",
    eventType: "PAYMENT_OVERDUE",
    body: `Alerte paiement en retard.
Client : {clientName}
Montant restant : {remainingAmount} MAD
Échéance : {dueDate}
Vente : {saleReference}`,
    variables: ["clientName", "remainingAmount", "dueDate", "saleReference"],
  },
];

export async function seedNotifications(prisma: PrismaClient) {
  for (const s of DEFAULT_SETTINGS) {
    await prisma.notificationSetting.upsert({
      where: { eventType: s.eventType },
      update: {
        internalEnabled: s.internalEnabled,
        whatsappEnabled: s.whatsappEnabled,
        recipientRoles: s.recipientRoles,
        sendToClient: s.sendToClient ?? false,
        isActive: true,
      },
      create: {
        eventType: s.eventType,
        internalEnabled: s.internalEnabled,
        whatsappEnabled: s.whatsappEnabled,
        recipientRoles: s.recipientRoles,
        sendToClient: s.sendToClient ?? false,
        sendToEmployee: true,
        isActive: true,
      },
    });
  }

  for (const t of TEMPLATES) {
    await prisma.notificationTemplate.upsert({
      where: { key_channel: { key: t.key, channel: t.channel } },
      update: {
        name: t.name,
        eventType: t.eventType,
        subject: t.subject,
        body: t.body,
        variables: t.variables,
        isActive: true,
      },
      create: {
        key: t.key,
        name: t.name,
        channel: t.channel,
        eventType: t.eventType,
        subject: t.subject,
        body: t.body,
        variables: t.variables,
        isActive: true,
      },
    });
  }
}
