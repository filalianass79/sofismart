import type { PrismaClient } from "../src/generated/prisma/client";
import type { NotificationEventType } from "../src/generated/prisma/enums";

const WHATSAPP_TEMPLATES: {
  key: string;
  name: string;
  eventType: NotificationEventType;
  metaTemplateName: string;
  body: string;
  variables: string[];
}[] = [
  {
    key: "sale_validation_request",
    name: "Demande validation vente",
    eventType: "SALE_VALIDATION_REQUEST",
    metaTemplateName: "sale_validation_request",
    body: `Bonjour {employeeName},
Une vente nécessite votre validation.

Référence : {saleReference}
Client : {clientName}
Véhicule : {vehicleLabel}
Montant : {amount} MAD

Lien : {actionUrl}`,
    variables: ["employeeName", "saleReference", "clientName", "vehicleLabel", "amount", "actionUrl"],
  },
  {
    key: "sale_validated_warehouse",
    name: "Vente validée — magasin",
    eventType: "SALE_VALIDATED",
    metaTemplateName: "sale_validated_warehouse",
    body: `Bonjour {employeeName},
Une vente a été validée pour votre dépôt.

Véhicule : {vehicleLabel}
Immatriculation : {registrationNumber}
Client : {clientName}
Dépôt : {depotName}

Merci de préparer la sortie.
Lien : {actionUrl}`,
    variables: ["employeeName", "vehicleLabel", "registrationNumber", "clientName", "depotName", "actionUrl"],
  },
  {
    key: "exit_voucher_generated",
    name: "Bon de sortie généré",
    eventType: "EXIT_VOUCHER_GENERATED",
    metaTemplateName: "exit_voucher_generated",
    body: `Bonjour {employeeName},
Le bon de sortie {exitVoucherReference} est généré.

Véhicule : {vehicleLabel}
Dépôt : {depotName}

Lien : {documentUrl}`,
    variables: ["employeeName", "exitVoucherReference", "vehicleLabel", "depotName", "documentUrl"],
  },
  {
    key: "delivery_confirmed",
    name: "Livraison confirmée",
    eventType: "DELIVERY_CONFIRMED",
    metaTemplateName: "delivery_confirmed",
    body: `Bonjour {employeeName},
La livraison a été confirmée.

Vente : {saleReference}
Véhicule : {vehicleLabel}
Client : {clientName}
Livré par : {warehouseEmployeeName}`,
    variables: ["employeeName", "saleReference", "vehicleLabel", "clientName", "warehouseEmployeeName"],
  },
  {
    key: "purchase_validation_request",
    name: "Demande validation achat",
    eventType: "PURCHASE_VALIDATION_REQUEST",
    metaTemplateName: "purchase_validation_request",
    body: `Bonjour {employeeName},
Un achat nécessite votre validation.

Référence : {purchaseReference}
Fournisseur : {supplierName}
Véhicule : {vehicleLabel}
Montant : {amount} MAD

Lien : {actionUrl}`,
    variables: ["employeeName", "purchaseReference", "supplierName", "vehicleLabel", "amount", "actionUrl"],
  },
  {
    key: "payment_overdue_alert",
    name: "Alerte paiement en retard",
    eventType: "PAYMENT_OVERDUE",
    metaTemplateName: "payment_overdue_alert",
    body: `Bonjour {employeeName},
Alerte paiement en retard.

Client/Fournisseur : {thirdPartyName}
Montant restant : {remainingAmount} MAD
Échéance : {dueDate}

Lien : {actionUrl}`,
    variables: ["employeeName", "thirdPartyName", "remainingAmount", "dueDate", "actionUrl"],
  },
];

export async function seedWhatsAppTemplates(prisma: PrismaClient) {
  for (const t of WHATSAPP_TEMPLATES) {
    await prisma.whatsAppTemplate.upsert({
      where: { key: t.key },
      update: {
        name: t.name,
        eventType: t.eventType,
        metaTemplateName: t.metaTemplateName,
        body: t.body,
        variables: t.variables,
        isActive: true,
      },
      create: {
        key: t.key,
        name: t.name,
        eventType: t.eventType,
        language: "fr",
        metaTemplateName: t.metaTemplateName,
        body: t.body,
        variables: t.variables,
        isActive: true,
      },
    });
  }
}

export async function seedWhatsAppSettings(prisma: PrismaClient) {
  const updates: {
    eventType: NotificationEventType;
    whatsappEnabled: boolean;
    recipientRoles: string[];
    sendToCommercial?: boolean;
    sendToWarehouse?: boolean;
    sendToManager?: boolean;
  }[] = [
    { eventType: "SALE_VALIDATION_REQUEST", whatsappEnabled: true, recipientRoles: ["GERANT", "ADMIN", "DIRECTEUR"], sendToManager: true },
    { eventType: "SALE_VALIDATED", whatsappEnabled: true, recipientRoles: ["MAGASINIER", "RESPONSABLE_DEPOT"], sendToCommercial: true, sendToWarehouse: true },
    { eventType: "EXIT_VOUCHER_GENERATED", whatsappEnabled: true, recipientRoles: ["MAGASINIER", "RESPONSABLE_DEPOT"], sendToWarehouse: true },
    { eventType: "DELIVERY_CONFIRMED", whatsappEnabled: true, recipientRoles: ["COMMERCIAL", "GERANT", "ADMIN"], sendToCommercial: true, sendToManager: true },
    { eventType: "PURCHASE_VALIDATION_REQUEST", whatsappEnabled: true, recipientRoles: ["GERANT", "ADMIN", "DIRECTEUR"], sendToManager: true },
    { eventType: "PAYMENT_OVERDUE", whatsappEnabled: true, recipientRoles: ["COMPTABLE", "GERANT"], sendToManager: true },
  ];

  for (const u of updates) {
    await prisma.notificationSetting.upsert({
      where: { eventType: u.eventType },
      update: {
        whatsappEnabled: u.whatsappEnabled,
        recipientRoles: u.recipientRoles,
        sendToCommercial: u.sendToCommercial ?? false,
        sendToWarehouse: u.sendToWarehouse ?? false,
        sendToManager: u.sendToManager ?? false,
      },
      create: {
        eventType: u.eventType,
        whatsappEnabled: u.whatsappEnabled,
        recipientRoles: u.recipientRoles,
        sendToCommercial: u.sendToCommercial ?? false,
        sendToWarehouse: u.sendToWarehouse ?? false,
        sendToManager: u.sendToManager ?? false,
        internalEnabled: true,
        sendToEmployee: true,
        isActive: true,
      },
    });
  }
}
