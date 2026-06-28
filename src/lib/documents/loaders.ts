import { prisma } from "@/lib/prisma";
import { formatVehicleTitle } from "@/lib/vehicle-catalog";
import { saleTypeLabels } from "@/lib/sale-labels";
import { paymentMethodLabels } from "@/lib/purchase-labels";
import { vehicleOriginLabels } from "@/lib/purchase-labels";

const fuelLabels: Record<string, string> = {
  DIESEL: "Diesel",
  ESSENCE: "Essence",
  HYBRIDE: "Hybride",
  ELECTRIQUE: "Électrique",
};

const transmissionLabels: Record<string, string> = {
  MANUELLE: "Manuelle",
  AUTOMATIQUE: "Automatique",
};
import { exitVoucherScanUrl, deliveryNoteScanUrl } from "@/lib/documents/scan-urls";
import { getCompanyProfile } from "@/lib/services/company-profile-service";
import {
  deliveryNoteStatusLabel,
  exitVoucherStatusLabel,
  saleInvoiceStatusLabel,
} from "@/lib/documents/status-labels";
import type {
  ClientDocumentBlock,
  CompanyDocumentBlock,
  DeliveryNoteDocumentData,
  DocumentPreviewType,
  ExitVoucherDocumentData,
  SalesInvoiceDocumentData,
  VehicleDocumentBlock,
} from "@/lib/documents/types";
import type { DeliveryChecklist } from "@/lib/validations/warehouse";
import type { ClientType, PaymentMethod, SaleType, VehicleOrigin } from "@/generated/prisma/enums";
import { formatInvoiceClientName } from "@/lib/documents/client-display";

function mapCompany(profile: Awaited<ReturnType<typeof getCompanyProfile>>): CompanyDocumentBlock {
  return {
    legalName: profile.legalName,
    tradeName: profile.tradeName,
    legalForm: profile.legalForm,
    ice: profile.ice,
    rc: profile.rc,
    taxId: profile.taxId,
    patent: profile.patent,
    address: profile.address,
    city: profile.city,
    postalCode: profile.postalCode,
    country: profile.country,
    phone: profile.phone,
    email: profile.email,
    website: profile.website,
    bankName: profile.bankName,
    bankAccount: profile.bankAccount,
    logoUrl: profile.logoUrl,
    documentNotes: profile.documentNotes,
  };
}

function mapClient(
  client: {
    name: string;
    type: ClientType;
    cin: string | null;
    ice: string | null;
    rc: string | null;
    taxId: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
  },
  creditOrganizationName?: string | null,
): ClientDocumentBlock {
  return {
    name: formatInvoiceClientName(client.name, creditOrganizationName),
    type: client.type,
    cin: client.cin,
    ice: client.ice,
    rc: client.rc,
    taxId: client.taxId,
    phone: client.phone,
    email: client.email,
    address: [client.address, client.city].filter(Boolean).join(", ") || null,
  };
}

function mapVehicle(vehicle: {
  year: number;
  mileage: number;
  color: string | null;
  plate: string | null;
  vin: string | null;
  fuel: string | null;
  transmission: string | null;
  origin: VehicleOrigin;
  internalRef: string;
  version: string | null;
  brand: { label: string };
  carModel: { label: string };
}): VehicleDocumentBlock {
  return {
    title: formatVehicleTitle(vehicle),
    brand: vehicle.brand.label,
    model: vehicle.carModel.label,
    version: vehicle.version,
    year: vehicle.year,
    mileage: vehicle.mileage,
    color: vehicle.color,
    plate: vehicle.plate,
    vin: vehicle.vin,
    fuel: vehicle.fuel
      ? (fuelLabels[vehicle.fuel] ?? vehicle.fuel)
      : null,
    transmission: vehicle.transmission
      ? (transmissionLabels[vehicle.transmission] ?? vehicle.transmission)
      : null,
    origin: vehicleOriginLabels[vehicle.origin] ?? vehicle.origin,
    internalRef: vehicle.internalRef,
  };
}

export async function loadExitVoucherDocument(id: string): Promise<ExitVoucherDocumentData> {
  const v = await prisma.exitVoucher.findUnique({
    where: { id },
    include: {
      sale: { include: { client: true, commercial: true } },
      vehicle: { include: { brand: true, carModel: true } },
      depot: true,
      assignedWarehouseUser: { select: { name: true } },
    },
  });
  if (!v || !v.sale.client) throw new Error("Bon de sortie introuvable");

  const profile = await getCompanyProfile();
  const client = mapClient(v.sale.client);
  const vehicle = mapVehicle(v.vehicle);

  return {
    type: "exit-voucher",
    company: mapCompany(profile),
    id: v.id,
    reference: v.reference,
    status: v.status,
    statusLabel: exitVoucherStatusLabel(v.status),
    generatedAt: v.generatedAt.toISOString(),
    saleReference: v.sale.reference,
    depotName: v.depot.name,
    warehouseUser: v.assignedWarehouseUser?.name ?? null,
    commercialName: v.sale.commercial?.name ?? null,
    instruction:
      v.message ??
      "Veuillez procéder à la sortie du véhicule après vérification du présent bon, contrôle de l'identité du client et confirmation des informations véhicule.",
    client,
    vehicle,
    meta: [
      { label: "N° bon de sortie", value: v.reference },
      { label: "Date de génération", value: v.generatedAt.toLocaleString("fr-FR") },
      { label: "Référence vente", value: v.sale.reference },
      { label: "Dépôt", value: v.depot.name },
      { label: "Magasinier", value: v.assignedWarehouseUser?.name ?? "—" },
      { label: "Commercial", value: v.sale.commercial?.name ?? "—" },
      { label: "Statut", value: exitVoucherStatusLabel(v.status) },
    ],
    checklist: [
      { label: "Identité client vérifiée" },
      { label: "Véhicule identifié" },
      { label: "Documents vérifiés" },
      { label: "Autorisation de sortie confirmée" },
      { label: "Véhicule préparé pour livraison" },
    ],
    qrScanUrl: exitVoucherScanUrl(v.secureToken),
    pdfUrl: v.pdfPath,
    saleId: v.saleId,
  };
}

export async function loadDeliveryNoteDocument(id: string): Promise<DeliveryNoteDocumentData> {
  const dn = await prisma.deliveryNote.findUnique({
    where: { id },
    include: {
      sale: { include: { commercial: true } },
      client: true,
      vehicle: { include: { brand: true, carModel: true } },
      depot: true,
      exitVoucher: true,
      generatedBy: { select: { name: true } },
    },
  });
  if (!dn) throw new Error("Bon de livraison introuvable");

  const profile = await getCompanyProfile();
  const checklist = (dn.checklist as DeliveryChecklist | null) ?? {
    vehicleDelivered: false,
    registrationCard: false,
    keysHanded: false,
    documentsHanded: false,
    accessoriesHanded: false,
    visualInspection: false,
    clientSignature: false,
  };

  return {
    type: "delivery-note",
    company: mapCompany(profile),
    id: dn.id,
    reference: dn.reference,
    status: dn.status,
    statusLabel: deliveryNoteStatusLabel(dn.status),
    generatedAt: dn.generatedAt.toISOString(),
    saleReference: dn.sale.reference,
    exitVoucherReference: dn.exitVoucher?.reference ?? null,
    depotName: dn.depot.name,
    depotAddress: [dn.depot.address, dn.depot.city].filter(Boolean).join(", ") || null,
    warehouseUser: dn.generatedBy?.name ?? null,
    clientMessage:
      "Le client reconnaît avoir reçu le véhicule décrit ci-dessus en bon état apparent, avec les clés, documents et accessoires remis lors de la livraison.",
    client: mapClient(dn.client),
    vehicle: mapVehicle(dn.vehicle),
    meta: [
      { label: "N° bon de livraison", value: dn.reference },
      { label: "Date génération", value: dn.generatedAt.toLocaleString("fr-FR") },
      { label: "Référence vente", value: dn.sale.reference },
      { label: "Bon de sortie", value: dn.exitVoucher?.reference ?? "—" },
      { label: "Dépôt", value: dn.depot.name },
      { label: "Magasinier", value: dn.generatedBy?.name ?? "—" },
    ],
    checklist: [
      { label: "Véhicule remis au client", checked: checklist.vehicleDelivered },
      { label: "Clés remises", checked: checklist.keysHanded },
      { label: "Carte grise remise", checked: checklist.registrationCard },
      { label: "Documents remis", checked: checklist.documentsHanded },
      { label: "Accessoires remis", checked: checklist.accessoriesHanded },
      { label: "Contrôle visuel effectué", checked: checklist.visualInspection },
      { label: "Signature client obtenue", checked: checklist.clientSignature },
    ],
    qrScanUrl: deliveryNoteScanUrl(dn.qrToken),
    pdfUrl: dn.pdfUrl,
    saleId: dn.saleId,
  };
}

export async function loadSalesInvoiceDocument(saleId: string): Promise<SalesInvoiceDocumentData> {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      client: true,
      creditOrganization: true,
      vehicle: { include: { brand: true, carModel: true } },
      commercial: { select: { name: true } },
      payments: { orderBy: { paidAt: "asc" } },
    },
  });
  if (!sale?.client) throw new Error("Vente ou client introuvable");

  const rows = await prisma.$queryRaw<{ invoiceNumber: string | null; invoicePdfPath: string | null }[]>`
    SELECT "invoiceNumber", "invoicePdfPath" FROM "Sale" WHERE "id" = ${saleId} LIMIT 1
  `;
  const invoiceNumber = rows[0]?.invoiceNumber ?? `FACT-${sale.reference}`;
  const pdfUrl = rows[0]?.invoicePdfPath ?? null;

  const profile = await getCompanyProfile();
  const price = Number(sale.price);
  const discount = Number(sale.discount);
  const baseHt = Number(sale.finalPrice);
  const taxAmount = Number(sale.taxAmount);
  const totalTtc = baseHt + taxAmount;
  const taxRate = baseHt > 0 ? Math.round((taxAmount / baseHt) * 10000) / 100 : 0;
  const paid = sale.payments.reduce((a, p) => a + Number(p.amount), 0);
  const v = sale.vehicle;

  return {
    type: "sales-invoice",
    id: sale.id,
    saleId: sale.id,
    reference: invoiceNumber,
    invoiceNumber,
    status: sale.status,
    statusLabel: saleInvoiceStatusLabel(sale.status),
    invoiceDate: sale.saleDate.toISOString(),
    saleReference: sale.reference,
    saleType: saleTypeLabels[sale.saleType as SaleType],
    commercialName: sale.commercial?.name ?? null,
    company: mapCompany(profile),
    client: mapClient(sale.client, sale.creditOrganization?.name),
    vehicle: mapVehicle(v),
    lines: [
      {
        designation: `Vente véhicule ${formatVehicleTitle(v)}${v.vin ? ` - Châssis ${v.vin}` : ""}`,
        quantity: 1,
        unitPrice: price,
        discount,
        taxRate,
        totalHt: price,
      },
    ],
    totals: {
      priceHt: price,
      discount,
      baseHt,
      taxAmount,
      totalTtc,
      paid,
      balance: Math.max(0, totalTtc - paid),
    },
    payments: sale.payments.map((p) => ({
      date: p.paidAt.toLocaleDateString("fr-FR"),
      method:
        paymentMethodLabels[p.method as PaymentMethod] ?? String(p.method ?? "—"),
      amount: Number(p.amount),
      reference: p.reference,
    })),
    warranty:
      sale.warranty && sale.warrantyDurationMonths
        ? `Garantie ${sale.warrantyDurationMonths} mois`
        : null,
    specialConditions: sale.specialConditions,
    legalMentions: [
      "Facture générée électroniquement par SOFISMART.",
      "Les montants sont exprimés en MAD sauf indication contraire.",
      "Toute réclamation doit être formulée selon les conditions de vente en vigueur.",
      "Merci pour votre confiance.",
    ],
    pdfUrl,
  };
}

export async function loadCommercialDocument(type: DocumentPreviewType, id: string) {
  switch (type) {
    case "exit-voucher":
      return loadExitVoucherDocument(id);
    case "delivery-note":
      return loadDeliveryNoteDocument(id);
    case "sales-invoice":
      return loadSalesInvoiceDocument(id);
    case "proforma": {
      const { loadProformaDocumentData } = await import("@/lib/documents/proforma-loader");
      return loadProformaDocumentData(id);
    }
  }
}

export { pdfDownloadUrl, pdfFileName } from "@/lib/documents/pdf-urls";
