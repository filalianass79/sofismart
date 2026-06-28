import path from "node:path";
import { writeFile, mkdir } from "node:fs/promises";
import { jsPDF } from "jspdf";
import { prisma } from "@/lib/prisma";
import { nextProformaReference } from "@/lib/references";
import { computeProformaAmounts } from "@/lib/proforma-finance";
import { renderProformaPdf } from "@/lib/pdf/proforma-pdf";
import { loadProformaDocumentData } from "@/lib/documents/proforma-loader";
import { createAuditLog } from "@/lib/audit";
import type { ProformaHistoryAction, ProformaStatus } from "@/generated/prisma/enums";
import type { ProformaWizardValues } from "@/lib/validations/proforma";
import { resolveCreditOrganizationId } from "@/lib/validations/credit-organization";
import type { Prisma } from "@/generated/prisma/client";
import { formatVehicleTitle } from "@/lib/vehicle-catalog";

const proformaInclude = {
  client: true,
  creditOrganization: true,
  vehicle: { include: { brand: true, carModel: true, depot: true } },
  commercial: true,
  createdBy: true,
  lines: { orderBy: { sortOrder: "asc" as const } },
  convertedSale: { select: { id: true, reference: true } },
  history: { orderBy: { createdAt: "desc" as const }, take: 20, include: { user: { select: { name: true } } } },
} as const;

export async function logProformaHistory(
  proformaId: string,
  action: ProformaHistoryAction,
  userId?: string,
  metadata?: Record<string, unknown>
) {
  await prisma.proformaHistory.create({
    data: { proformaInvoiceId: proformaId, action, userId, metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined },
  });
}

function resolveClientPayload(payload: ProformaWizardValues) {
  if (payload.clientMode === "EXISTING") {
    return { clientId: payload.clientId!, temporaryClientData: undefined };
  }
  return { clientId: null, temporaryClientData: payload.newClient as Prisma.InputJsonValue };
}

async function assertCreditOrganizationForProforma(payload: ProformaWizardValues) {
  const id = resolveCreditOrganizationId(payload);
  if (!id) return null;
  const org = await prisma.creditOrganization.findFirst({ where: { id, isActive: true } });
  if (!org) throw new Error("Organisme de crédit invalide ou inactif");
  return id;
}

function buildVehicleLineDesignation(vehicle: {
  brand: { label: string };
  carModel: { label: string };
  version: string | null;
  year: number;
  plate: string | null;
  vin: string | null;
}) {
  return formatVehicleTitle(vehicle);
}

export async function listProformas(filters: {
  q?: string;
  status?: ProformaStatus;
  commercialId?: string;
  clientId?: string;
  expired?: "1" | "0";
}) {
  const now = new Date();
  return prisma.proformaInvoice.findMany({
    where: {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.commercialId ? { commercialId: filters.commercialId } : {}),
      ...(filters.clientId ? { clientId: filters.clientId } : {}),
      ...(filters.expired === "1"
        ? { validityDate: { lt: now }, status: { in: ["GENERATED", "SENT", "PRINTED"] } }
        : filters.expired === "0"
          ? { OR: [{ validityDate: { gte: now } }, { status: { in: ["DRAFT", "CONVERTED_TO_SALE", "CANCELLED"] } }] }
          : {}),
      ...(filters.q
        ? {
            OR: [
              { reference: { contains: filters.q, mode: "insensitive" } },
              { client: { name: { contains: filters.q, mode: "insensitive" } } },
              { vehicle: { internalRef: { contains: filters.q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    orderBy: { proformaDate: "desc" },
    include: {
      client: { select: { id: true, name: true, type: true } },
      vehicle: { include: { brand: true, carModel: true } },
      commercial: { select: { id: true, name: true } },
    },
  });
}

export async function getProformaById(id: string) {
  const row = await prisma.proformaInvoice.findUnique({ where: { id }, include: proformaInclude });
  if (!row) return null;
  if (
    row.validityDate < new Date() &&
    ["GENERATED", "SENT", "PRINTED"].includes(row.status)
  ) {
    await prisma.proformaInvoice.update({ where: { id }, data: { status: "EXPIRED" } });
    await logProformaHistory(id, "EXPIRED");
    return prisma.proformaInvoice.findUnique({ where: { id }, include: proformaInclude });
  }
  return row;
}

async function assertVehicleAvailableForProforma(vehicleId: string) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: { sale: true, brand: true, carModel: true },
  });
  if (!vehicle) throw new Error("Véhicule introuvable");
  if (vehicle.isArchived) throw new Error("Véhicule archivé");
  if (vehicle.sale && vehicle.sale.status !== "CANCELLED" && vehicle.sale.status !== "DRAFT") {
    throw new Error("Ce véhicule est déjà lié à une vente");
  }
  return vehicle;
}

async function writeProformaPdf(proformaId: string): Promise<string> {
  const data = await loadProformaDocumentData(proformaId);
  const doc = new jsPDF();
  await renderProformaPdf(doc, data);
  const dir = path.join(process.cwd(), "public", "uploads", "proformas");
  await mkdir(dir, { recursive: true });
  const safeRef = data.reference.replace(/\//g, "-");
  const fileName = `${safeRef}.pdf`;
  const relPath = `/uploads/proformas/${fileName}`;
  await writeFile(path.join(dir, fileName), Buffer.from(doc.output("arraybuffer")));
  return relPath;
}

export async function createProforma(payload: ProformaWizardValues, userId: string, asDraft = true) {
  const vehicle = await assertVehicleAvailableForProforma(payload.vehicleId);
  const amounts = computeProformaAmounts(payload);
  const reference = await nextProformaReference(prisma);
  const { clientId, temporaryClientData } = resolveClientPayload(payload);
  const creditOrganizationId = await assertCreditOrganizationForProforma(payload);
  const designation = buildVehicleLineDesignation(vehicle);

  const proforma = await prisma.$transaction(async (tx) => {
    const row = await tx.proformaInvoice.create({
      data: {
        reference,
        clientId,
        temporaryClientData,
        creditOrganizationId,
        vehicleId: payload.vehicleId,
        commercialId: payload.commercialId,
        proformaDate: new Date(payload.proformaDate),
        validityDate: new Date(payload.validityDate),
        priceHT: amounts.priceHT,
        discount: amounts.discount,
        accessoryFees: amounts.accessoryFees,
        taxRate: amounts.taxRate,
        taxAmount: amounts.taxAmount,
        totalTTC: amounts.totalTTC,
        paymentTerms: payload.paymentTerms,
        observations: payload.observations,
        status: asDraft ? "DRAFT" : "GENERATED",
        createdById: userId,
        generatedAt: asDraft ? undefined : new Date(),
        lines: {
          create: [
            {
              designation,
              quantity: 1,
              unitPriceHT: amounts.grossHT,
              discount: amounts.discount,
              taxRate: amounts.taxRate,
              taxAmount: amounts.taxAmount,
              totalHT: amounts.baseHT,
              totalTTC: amounts.totalTTC,
              sortOrder: 0,
            },
          ],
        },
      },
    });
    await tx.proformaHistory.create({
      data: {
        proformaInvoiceId: row.id,
        action: asDraft ? "CREATED" : "GENERATED",
        userId,
      },
    });
    return row;
  });

  if (!asDraft) {
    const pdfUrl = await writeProformaPdf(proforma.id);
    await prisma.proformaInvoice.update({ where: { id: proforma.id }, data: { pdfUrl } });
  }

  await createAuditLog({
    actorUserId: userId,
    action: asDraft ? "PROFORMA_DRAFT_CREATED" : "PROFORMA_GENERATED",
    module: "proformas",
    targetType: "ProformaInvoice",
    targetId: proforma.id,
    newValues: { reference },
  });

  return getProformaById(proforma.id);
}

export async function updateProforma(id: string, payload: ProformaWizardValues, userId: string) {
  const existing = await prisma.proformaInvoice.findUnique({ where: { id } });
  if (!existing) throw new Error("Proforma introuvable");
  if (existing.status !== "DRAFT") throw new Error("Seuls les brouillons sont modifiables");

  const vehicle = await assertVehicleAvailableForProforma(payload.vehicleId);
  const amounts = computeProformaAmounts(payload);
  const { clientId, temporaryClientData } = resolveClientPayload(payload);
  const creditOrganizationId = await assertCreditOrganizationForProforma(payload);
  const designation = buildVehicleLineDesignation(vehicle);

  await prisma.$transaction(async (tx) => {
    await tx.proformaLine.deleteMany({ where: { proformaInvoiceId: id } });
    await tx.proformaInvoice.update({
      where: { id },
      data: {
        clientId,
        temporaryClientData,
        creditOrganizationId,
        vehicleId: payload.vehicleId,
        commercialId: payload.commercialId,
        proformaDate: new Date(payload.proformaDate),
        validityDate: new Date(payload.validityDate),
        priceHT: amounts.priceHT,
        discount: amounts.discount,
        accessoryFees: amounts.accessoryFees,
        taxRate: amounts.taxRate,
        taxAmount: amounts.taxAmount,
        totalTTC: amounts.totalTTC,
        paymentTerms: payload.paymentTerms,
        observations: payload.observations,
        lines: {
          create: [
            {
              designation,
              quantity: 1,
              unitPriceHT: amounts.grossHT,
              discount: amounts.discount,
              taxRate: amounts.taxRate,
              taxAmount: amounts.taxAmount,
              totalHT: amounts.baseHT,
              totalTTC: amounts.totalTTC,
            },
          ],
        },
      },
    });
    await tx.proformaHistory.create({
      data: { proformaInvoiceId: id, action: "UPDATED", userId },
    });
  });

  return getProformaById(id);
}

export async function generateProforma(id: string, userId: string) {
  const existing = await prisma.proformaInvoice.findUnique({ where: { id } });
  if (!existing) throw new Error("Proforma introuvable");
  if (existing.status === "CANCELLED" || existing.status === "CONVERTED_TO_SALE") {
    throw new Error("Proforma non modifiable");
  }

  const pdfUrl = await writeProformaPdf(id);
  await prisma.proformaInvoice.update({
    where: { id },
    data: { status: "GENERATED", pdfUrl, generatedAt: new Date() },
  });
  await logProformaHistory(id, "GENERATED", userId);
  return getProformaById(id);
}

export async function recordProformaPrint(id: string, userId: string) {
  const row = await prisma.proformaInvoice.findUnique({ where: { id } });
  if (!row) throw new Error("Proforma introuvable");
  if (!["GENERATED", "SENT", "PRINTED"].includes(row.status)) {
    throw new Error("Générez la proforma avant impression");
  }
  await logProformaHistory(id, "PRINTED", userId);
  await prisma.proformaInvoice.update({
    where: { id },
    data: {
      status: row.status === "GENERATED" || row.status === "SENT" ? "PRINTED" : row.status,
      printedAt: new Date(),
    },
  });
  return getProformaById(id);
}

export async function recordProformaDownload(id: string, userId: string) {
  const row = await prisma.proformaInvoice.findUnique({ where: { id } });
  if (!row) throw new Error("Proforma introuvable");
  if (!row.pdfUrl) await generateProforma(id, userId);
  await logProformaHistory(id, "DOWNLOADED", userId);
  return getProformaById(id);
}

export async function cancelProforma(id: string, userId: string, reason?: string) {
  const row = await prisma.proformaInvoice.findUnique({ where: { id } });
  if (!row) throw new Error("Proforma introuvable");
  if (row.status === "CONVERTED_TO_SALE") throw new Error("Proforma déjà convertie");
  if (row.status === "CANCELLED") throw new Error("Proforma déjà annulée");

  await prisma.proformaInvoice.update({ where: { id }, data: { status: "CANCELLED" } });
  await logProformaHistory(id, "CANCELLED", userId, reason ? { reason } : undefined);
  await createAuditLog({
    actorUserId: userId,
    action: "PROFORMA_CANCELLED",
    module: "proformas",
    targetType: "ProformaInvoice",
    targetId: id,
  });
  return getProformaById(id);
}

export async function convertProformaToSale(id: string, userId: string, canValidateSale: boolean) {
  const proforma = await prisma.proformaInvoice.findUnique({
    where: { id },
    include: { vehicle: true, client: true },
  });
  if (!proforma) throw new Error("Proforma introuvable");
  if (proforma.status === "CONVERTED_TO_SALE") throw new Error("Déjà convertie");
  if (proforma.status === "CANCELLED") throw new Error("Proforma annulée");
  if (proforma.convertedSaleId) throw new Error("Vente déjà liée");

  const vehicle = await assertVehicleAvailableForProforma(proforma.vehicleId);
  const { nextSaleReference } = await import("@/lib/references");

  const sale = await prisma.$transaction(async (tx) => {
    const reference = await nextSaleReference(tx);
    const created = await tx.sale.create({
      data: {
        reference,
        vehicleId: proforma.vehicleId,
        clientId: proforma.clientId,
        creditOrganizationId: proforma.creditOrganizationId,
        depotId: vehicle.depotId,
        commercialId: proforma.commercialId,
        saleDate: new Date(),
        price: proforma.priceHT,
        discount: proforma.discount,
        taxAmount: proforma.taxAmount,
        finalPrice: proforma.totalTTC,
        costPrice: vehicle.costPrice,
        margin: Number(proforma.totalTTC) - Number(vehicle.costPrice),
        status: canValidateSale ? "PENDING_VALIDATION" : "DRAFT",
        draftClient: proforma.temporaryClientData ?? undefined,
        notes: proforma.observations,
        specialConditions: proforma.paymentTerms,
      },
    });
    await tx.proformaInvoice.update({
      where: { id },
      data: { status: "CONVERTED_TO_SALE", convertedSaleId: created.id },
    });
    await tx.proformaHistory.create({
      data: {
        proformaInvoiceId: id,
        action: "CONVERTED_TO_SALE",
        userId,
        metadata: { saleId: created.id, saleReference: reference },
      },
    });
    return created;
  });

  await createAuditLog({
    actorUserId: userId,
    action: "PROFORMA_CONVERTED",
    module: "proformas",
    targetType: "ProformaInvoice",
    targetId: id,
    newValues: { saleId: sale.id, saleReference: sale.reference },
  });

  return { proforma: await getProformaById(id), sale };
}

export { proformaInclude };
