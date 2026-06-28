import { prisma } from "@/lib/prisma";
import { formatVehicleTitle } from "@/lib/vehicle-catalog";
import { getCompanyProfile } from "@/lib/services/company-profile-service";
import { proformaStatusLabels } from "@/lib/proforma-labels";
import type { ProformaDocumentData, ClientDocumentBlock } from "@/lib/documents/types";
import { formatInvoiceClientName } from "@/lib/documents/client-display";

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

function mapTemporaryClient(
  data: Record<string, unknown>,
  creditOrganizationName?: string | null,
): ClientDocumentBlock {
  const type = String(data.type ?? "INDIVIDUAL");
  if (type === "COMPANY") {
    return {
      name: formatInvoiceClientName(String(data.companyName ?? "Client professionnel"), creditOrganizationName),
      type: "COMPANY",
      cin: null,
      ice: (data.ice as string) ?? null,
      rc: (data.rc as string) ?? null,
      taxId: (data.taxId as string) ?? null,
      phone: (data.phone as string) ?? null,
      email: (data.email as string) ?? null,
      address: [data.address, data.city].filter(Boolean).join(", ") || null,
    };
  }
  const name = `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim() || "Client particulier";
  return {
    name: formatInvoiceClientName(name, creditOrganizationName),
    type: "INDIVIDUAL",
    cin: (data.cin as string) ?? null,
    ice: null,
    rc: null,
    taxId: null,
    phone: (data.phone as string) ?? null,
    email: (data.email as string) ?? null,
    address: [data.address, data.city].filter(Boolean).join(", ") || null,
  };
}

export async function loadProformaDocumentData(proformaId: string): Promise<ProformaDocumentData> {
  const row = await prisma.proformaInvoice.findUniqueOrThrow({
    where: { id: proformaId },
    include: {
      client: true,
      creditOrganization: true,
      commercial: true,
      vehicle: { include: { brand: true, carModel: true } },
      lines: { orderBy: { sortOrder: "asc" } },
    },
  });

  const profile = await getCompanyProfile();
  const creditOrgName = row.creditOrganization?.name ?? null;
  const client: ClientDocumentBlock = row.client
    ? {
        name: formatInvoiceClientName(row.client.name, creditOrgName),
        type: row.client.type,
        cin: row.client.cin,
        ice: row.client.ice,
        rc: row.client.rc,
        taxId: row.client.taxId,
        phone: row.client.phone,
        email: row.client.email,
        address: [row.client.address, row.client.city].filter(Boolean).join(", ") || null,
      }
    : mapTemporaryClient((row.temporaryClientData as Record<string, unknown>) ?? {}, creditOrgName);

  const vehicle = row.vehicle;
  const grossHT = Number(row.priceHT) + Number(row.accessoryFees);

  return {
    type: "proforma",
    id: row.id,
    reference: row.reference,
    status: row.status,
    statusLabel: proformaStatusLabels[row.status],
    proformaDate: row.proformaDate.toISOString(),
    validityDate: row.validityDate.toISOString(),
    commercialName: row.commercial.name,
    company: {
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
    },
    client,
    vehicle: {
      title: formatVehicleTitle(vehicle),
      brand: vehicle.brand.label,
      model: vehicle.carModel.label,
      version: vehicle.version,
      year: vehicle.year,
      mileage: vehicle.mileage,
      color: vehicle.color,
      plate: vehicle.plate,
      vin: vehicle.vin,
      fuel: vehicle.fuel ? fuelLabels[vehicle.fuel] ?? vehicle.fuel : null,
      transmission: vehicle.transmission
        ? transmissionLabels[vehicle.transmission] ?? vehicle.transmission
        : null,
      origin: vehicle.origin,
      internalRef: vehicle.internalRef,
    },
    lines: row.lines.map((l) => ({
      designation: l.designation,
      quantity: Number(l.quantity),
      unitPriceHT: Number(l.unitPriceHT),
      discount: Number(l.discount),
      taxRate: Number(l.taxRate),
      totalHT: Number(l.totalHT),
      totalTTC: Number(l.totalTTC),
    })),
    totals: {
      priceHT: Number(row.priceHT),
      accessoryFees: Number(row.accessoryFees),
      discount: Number(row.discount),
      baseHT: grossHT - Number(row.discount),
      taxAmount: Number(row.taxAmount),
      totalTTC: Number(row.totalTTC),
    },
    paymentTerms: row.paymentTerms,
    observations: row.observations,
    legalMentions: [
      "DOCUMENT PROVISOIRE — NON VALABLE COMME FACTURE DÉFINITIVE",
      "Cette facture proforma est émise à titre indicatif.",
      "Elle ne constitue pas une facture fiscale définitive.",
      "La vente définitive reste soumise à validation et disponibilité du véhicule.",
    ],
    pdfUrl: row.pdfUrl,
  };
}
