import type { PrismaClient } from "../src/generated/prisma/client";
import type { NotificationEventType } from "../src/generated/prisma/enums";
import { renderEmailButton } from "../src/lib/notifications/email/email-renderer";

const EMAIL_SETTINGS: {
  eventType: NotificationEventType;
  emailEnabled: boolean;
  recipientRoles: string[];
  sendToClient?: boolean;
  attachDocuments?: boolean;
}[] = [
  { eventType: "SALE_VALIDATION_REQUEST", emailEnabled: true, recipientRoles: ["GERANT", "ADMIN"] },
  { eventType: "SALE_VALIDATED", emailEnabled: true, recipientRoles: ["MAGASINIER", "RESPONSABLE_DEPOT"] },
  { eventType: "EXIT_VOUCHER_GENERATED", emailEnabled: true, recipientRoles: ["MAGASINIER", "RESPONSABLE_DEPOT"], attachDocuments: true },
  { eventType: "DELIVERY_CONFIRMED", emailEnabled: true, recipientRoles: ["COMMERCIAL", "GERANT"] },
  { eventType: "PAYMENT_RECEIVED", emailEnabled: false, recipientRoles: ["COMPTABLE"], sendToClient: true },
  { eventType: "PAYMENT_OVERDUE", emailEnabled: true, recipientRoles: ["COMPTABLE", "GERANT"] },
  { eventType: "PURCHASE_VALIDATED", emailEnabled: true, recipientRoles: ["GERANT", "ADMIN"] },
  { eventType: "USER_CREATED", emailEnabled: true, recipientRoles: [] },
  { eventType: "PASSWORD_RESET", emailEnabled: true, recipientRoles: [] },
];

function tpl(body: string, button?: { label: string; urlVar: string }) {
  let html = `<p>Bonjour {employeeName},</p>${body}`;
  if (button) html += renderEmailButton(button.label, `{${button.urlVar}}`);
  return html;
}

const EMAIL_TEMPLATES: {
  key: string;
  name: string;
  eventType: NotificationEventType;
  subjectTemplate: string;
  htmlTemplate: string;
  variables: string[];
}[] = [
  {
    key: "sale_validation_request_email",
    name: "Demande validation vente — gérant",
    eventType: "SALE_VALIDATION_REQUEST",
    subjectTemplate: "Validation requise — vente {saleReference}",
    htmlTemplate: tpl(
      `<p><strong>{commercialName}</strong> demande la validation de la vente <strong>{saleReference}</strong>.</p>
<ul><li>Client : {clientName}</li><li>Véhicule : {vehicleLabel}</li></ul>
<p>Cliquez ci-dessous pour valider immédiatement cette vente (facture et bon de sortie).</p>`,
      { label: "Valider la vente", urlVar: "validateUrl" },
    ),
    variables: [
      "employeeName",
      "commercialName",
      "saleReference",
      "clientName",
      "vehicleLabel",
      "validateUrl",
      "actionUrl",
    ],
  },
  {
    key: "sale_validated_email",
    name: "Vente validée — magasinier",
    eventType: "SALE_VALIDATED",
    subjectTemplate: "Nouvelle vente validée - sortie véhicule à préparer",
    htmlTemplate: tpl(
      `<p>Une vente a été validée pour le dépôt <strong>{depotName}</strong>.</p>
<ul><li>Vente : {saleReference}</li><li>Client : {clientName}</li>
<li>Véhicule : {vehicleBrand} {vehicleModel}</li><li>Immat. : {registrationNumber}</li></ul>
<p>Merci de préparer la sortie du véhicule.</p>`,
      { label: "Voir le bon de sortie", urlVar: "actionUrl" },
    ),
    variables: ["employeeName", "saleReference", "clientName", "vehicleBrand", "vehicleModel", "registrationNumber", "depotName", "actionUrl"],
  },
  {
    key: "exit_voucher_email",
    name: "Bon de sortie généré",
    eventType: "EXIT_VOUCHER_GENERATED",
    subjectTemplate: "Bon de sortie généré - {exitVoucherReference}",
    htmlTemplate: tpl(
      `<p>Le bon de sortie <strong>{exitVoucherReference}</strong> a été généré pour {vehicleBrand} {vehicleModel}.</p>`,
      { label: "Consulter le bon", urlVar: "documentUrl" },
    ),
    variables: ["employeeName", "exitVoucherReference", "vehicleBrand", "vehicleModel", "documentUrl"],
  },
  {
    key: "delivery_confirmed_email",
    name: "Livraison confirmée",
    eventType: "DELIVERY_CONFIRMED",
    subjectTemplate: "Livraison confirmée - {saleReference}",
    htmlTemplate: tpl(
      `<p>La livraison du véhicule {vehicleBrand} {vehicleModel} a été confirmée.</p>
<ul><li>Client : {clientName}</li><li>Vente : {saleReference}</li></ul>`,
    ),
    variables: ["employeeName", "saleReference", "clientName", "vehicleBrand", "vehicleModel"],
  },
  {
    key: "password_reset_email",
    name: "Réinitialisation mot de passe",
    eventType: "PASSWORD_RESET",
    subjectTemplate: "Réinitialisation de votre mot de passe SOFISMART",
    htmlTemplate: `<p>Bonjour {employeeName},</p>
<p>Un administrateur a réinitialisé votre mot de passe SOFISMART.</p>
<p>Connectez-vous avec votre email <strong>{loginEmail}</strong> et changez votre mot de passe dès la première connexion.</p>`,
    variables: ["employeeName", "loginEmail"],
  },
];

export async function seedEmails(prisma: PrismaClient) {
  for (const s of EMAIL_SETTINGS) {
    await prisma.emailNotificationSetting.upsert({
      where: { eventType: s.eventType },
      update: {
        emailEnabled: s.emailEnabled,
        recipientRoles: s.recipientRoles,
        sendToClient: s.sendToClient ?? false,
        attachDocuments: s.attachDocuments ?? false,
        isActive: true,
      },
      create: {
        eventType: s.eventType,
        emailEnabled: s.emailEnabled,
        recipientRoles: s.recipientRoles,
        sendToClient: s.sendToClient ?? false,
        attachDocuments: s.attachDocuments ?? false,
        isActive: true,
      },
    });
  }

  for (const t of EMAIL_TEMPLATES) {
    await prisma.emailTemplate.upsert({
      where: { key: t.key },
      update: {
        name: t.name,
        eventType: t.eventType,
        subjectTemplate: t.subjectTemplate,
        htmlTemplate: t.htmlTemplate,
        variables: t.variables,
        isActive: true,
      },
      create: {
        key: t.key,
        name: t.name,
        eventType: t.eventType,
        subjectTemplate: t.subjectTemplate,
        htmlTemplate: t.htmlTemplate,
        variables: t.variables,
        isActive: true,
      },
    });
  }
}
