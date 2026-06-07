import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { upsertPurchase, type PurchasePayload } from "@/lib/purchase-service";
import { purchaseWizardSchema } from "@/lib/validations/purchase";
import {
  assertAllowedMime,
  assertFileSize,
  sanitizeOriginalName,
  secureStoredFilename,
} from "@/lib/upload-security";
import { extractTextFromBuffer, isInvoiceImportMime } from "./ocr-service";
import {
  invoiceImportDir,
  invoiceImportPublicUrl,
  resolveInvoiceImportFilePath,
} from "./paths";
import { extractStructuredFromText } from "./invoice-extraction-service";
import { flattenFieldsForDb, mapToWizardDraft } from "./invoice-field-mapper";
import { matchSuppliers } from "./supplier-matcher";
import { matchVehicles } from "./vehicle-matcher";
import type { InvoiceImportPayload, StructuredInvoiceData } from "./types";
import type { PurchaseWizardValues } from "@/lib/validations/purchase";

const INVOICE_MIME = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;

function assertInvoiceImportClient() {
  if (!("invoiceImport" in prisma) || !(prisma as { invoiceImport?: unknown }).invoiceImport) {
    throw new Error(
      "Module import facture indisponible : redémarrez le serveur (npm run dev) après « npm run prisma:generate ».",
    );
  }
}

export async function createInvoiceImportFromFile(
  file: File,
  uploadedById: string | null,
): Promise<string> {
  assertInvoiceImportClient();
  assertAllowedMime(file.type, INVOICE_MIME);
  assertFileSize(file.size);

  const buffer = Buffer.from(await file.arrayBuffer());
  const dir = invoiceImportDir();
  await mkdir(dir, { recursive: true });
  const stored = secureStoredFilename(file.name, file.type);
  const fullPath = path.join(dir, stored);
  await writeFile(fullPath, buffer);
  const publicPath = invoiceImportPublicUrl(stored);

  const record = await prisma.invoiceImport.create({
    data: {
      fileName: sanitizeOriginalName(file.name),
      fileUrl: publicPath,
      fileMimeType: file.type,
      fileSize: buffer.length,
      status: "PROCESSING",
      extractionStatus: "PENDING",
      uploadedById,
    },
  });

  try {
    const { text, pageCount } = await extractTextFromBuffer(buffer, file.type);
    const structured = extractStructuredFromText(text);
    const supplierMatches = await matchSuppliers(structured);
    const vehicleMatches = await matchVehicles(structured);

    const extractionStatus =
      structured.globalConfidence >= 0.55 ? "SUCCESS" : text.length > 50 ? "PARTIAL" : "FAILED";

    await prisma.invoiceImport.update({
      where: { id: record.id },
      data: {
        rawOcrText: text.slice(0, 500_000),
        structuredData: structured as object,
        confidenceScore: structured.globalConfidence,
        pageCount,
        status: "EXTRACTED",
        extractionStatus,
      },
    });

    await saveExtractedFields(record.id, structured);

    const jsonPath = path.join(dir, `${record.id}-ocr.json`);
    await writeFile(jsonPath, JSON.stringify({ structured, supplierMatches, vehicleMatches }, null, 2));
    await prisma.invoiceImport.update({
      where: { id: record.id },
      data: { structuredData: { ...(structured as object), supplierMatches, vehicleMatches } },
    });
  } catch (e) {
    await prisma.invoiceImport.update({
      where: { id: record.id },
      data: {
        status: "FAILED",
        extractionStatus: "FAILED",
        rawOcrText: e instanceof Error ? e.message : "Erreur extraction",
      },
    });
    throw e;
  }

  return record.id;
}

async function saveExtractedFields(importId: string, structured: StructuredInvoiceData) {
  await prisma.invoiceExtractedField.deleteMany({ where: { invoiceImportId: importId } });
  await prisma.invoiceLineItem.deleteMany({ where: { invoiceImportId: importId } });

  const fields = flattenFieldsForDb(structured);
  if (fields.length) {
    await prisma.invoiceExtractedField.createMany({
      data: fields.map((f) => ({
        invoiceImportId: importId,
        fieldKey: f.fieldKey,
        fieldLabel: f.fieldLabel,
        extractedValue: f.extractedValue,
        confidence: f.confidence,
        sourceText: f.sourceText ?? null,
      })),
    });
  }

  if (structured.lineItems.length) {
    await prisma.invoiceLineItem.createMany({
      data: structured.lineItems.map((l, i) => ({
        invoiceImportId: importId,
        designation: l.designation,
        quantity: l.quantity,
        discount: l.discount,
        unitPriceHT: l.unitPriceHT,
        taxRate: l.taxRate,
        taxAmount: l.taxAmount,
        totalHT: l.totalHT,
        totalTTC: l.totalTTC,
        lineType: l.lineType,
        confidence: l.confidence,
        sortOrder: i,
      })),
    });
  }
}

export async function reprocessInvoiceImport(importId: string): Promise<void> {
  const imp = await prisma.invoiceImport.findUnique({ where: { id: importId } });
  if (!imp) throw new Error("Import introuvable");

  const fullPath = resolveInvoiceImportFilePath(imp.fileUrl);
  const buffer = await readFile(fullPath);
  const { text, pageCount } = await extractTextFromBuffer(buffer, imp.fileMimeType);
  const structured = extractStructuredFromText(text);
  const supplierMatches = await matchSuppliers(structured);
  const vehicleMatches = await matchVehicles(structured);

  await prisma.invoiceImport.update({
    where: { id: importId },
    data: {
      rawOcrText: text.slice(0, 500_000),
      structuredData: { ...(structured as object), supplierMatches, vehicleMatches },
      confidenceScore: structured.globalConfidence,
      pageCount,
      status: "EXTRACTED",
      extractionStatus: structured.globalConfidence >= 0.55 ? "SUCCESS" : "PARTIAL",
    },
  });
  await saveExtractedFields(importId, structured);
}

export async function getInvoiceImportPayload(importId: string): Promise<InvoiceImportPayload> {
  const imp = await prisma.invoiceImport.findUnique({
    where: { id: importId },
    include: { extractedFields: true, lineItems: { orderBy: { sortOrder: "asc" } } },
  });
  if (!imp) throw new Error("Import introuvable");

  const structured = (imp.structuredData ?? extractStructuredFromText(imp.rawOcrText ?? "")) as StructuredInvoiceData & {
    supplierMatches?: InvoiceImportPayload["supplierMatches"];
    vehicleMatches?: InvoiceImportPayload["vehicleMatches"];
  };

  if (imp.lineItems.length) {
    structured.lineItems = imp.lineItems.map((l) => ({
      id: l.id,
      designation: l.designation ?? "",
      quantity: Number(l.quantity),
      discount: Number(l.discount),
      unitPriceHT: Number(l.unitPriceHT),
      taxRate: Number(l.taxRate),
      taxAmount: Number(l.taxAmount),
      totalHT: Number(l.totalHT),
      totalTTC: Number(l.totalTTC),
      lineType: l.lineType,
      confidence: Number(l.confidence),
    }));
  }

  const supplierMatches =
    structured.supplierMatches ?? (await matchSuppliers(structured));
  const vehicleMatches = structured.vehicleMatches ?? (await matchVehicles(structured));

  const wizardDraft = await mapToWizardDraft(structured, {
    supplierId: supplierMatches[0]?.id,
    brandId: undefined,
    modelId: undefined,
  });

  return {
    importId: imp.id,
    fileUrl: imp.fileUrl,
    fileMimeType: imp.fileMimeType,
    fileName: imp.fileName,
    pageCount: imp.pageCount,
    status: imp.status,
    extractionStatus: imp.extractionStatus,
    confidenceScore: Number(imp.confidenceScore ?? structured.globalConfidence ?? 0),
    rawOcrText: imp.rawOcrText,
    structured,
    wizardDraft,
    supplierMatches,
    vehicleMatches,
    purchaseId: imp.purchaseId,
  };
}

export async function saveDraftFromImport(
  importId: string,
  wizard: PurchaseWizardValues,
): Promise<{ purchaseId: string }> {
  const parsed = purchaseWizardSchema.safeParse(wizard);
  if (!parsed.success) {
    throw new Error("Données invalides pour le brouillon");
  }

  const imp = await prisma.invoiceImport.findUnique({ where: { id: importId } });
  const existingId = imp?.purchaseId ?? undefined;

  const purchase = await upsertPurchase(
    { ...parsed.data, status: "DRAFT" } as PurchasePayload,
    existingId,
  );

  await attachInvoiceFileToPurchase(importId, purchase.id);

  await prisma.invoiceImport.update({
    where: { id: importId },
    data: { purchaseId: purchase.id, status: "DRAFT_SAVED" },
  });

  return { purchaseId: purchase.id };
}

export async function validateImportedPurchase(
  importId: string,
  wizard: PurchaseWizardValues,
  options?: { createSupplier?: Record<string, unknown>; forceVehicle?: boolean },
): Promise<{ purchaseId: string }> {
  const parsed = purchaseWizardSchema.safeParse(wizard);
  if (!parsed.success) {
    throw new Error("Validation formulaire échouée");
  }

  if (!parsed.data.supplierId && !options?.createSupplier) {
    throw new Error("Fournisseur obligatoire avant validation");
  }

  let supplierId = parsed.data.supplierId;
  if (!supplierId && options?.createSupplier) {
    const { supplierCreateSchema } = await import("@/lib/validations/purchase");
    const sup = supplierCreateSchema.parse(options.createSupplier);
    const created = await prisma.supplier.create({
      data: {
        type: sup.type,
        name: sup.name,
        cin: sup.cin || null,
        ice: sup.ice || null,
        rc: sup.rc || null,
        taxId: sup.taxId || null,
        phone: sup.phone || null,
        email: sup.email || null,
        address: sup.address || null,
        city: sup.city || null,
        country: sup.country || "Maroc",
        notes: sup.notes || null,
      },
    });
    supplierId = created.id;
    parsed.data.supplierId = supplierId;
  }

  const payload = await getInvoiceImportPayload(importId);
  if (payload.vehicleMatches.length > 0 && !options?.forceVehicle) {
    throw new Error("VEHICLE_DUPLICATE");
  }

  const imp = await prisma.invoiceImport.findUnique({ where: { id: importId } });
  const purchase = await upsertPurchase(
    { ...parsed.data, supplierId, status: "VALIDATED" } as PurchasePayload,
    imp?.purchaseId ?? undefined,
  );

  await attachInvoiceFileToPurchase(importId, purchase.id);

  await prisma.invoiceImport.update({
    where: { id: importId },
    data: { purchaseId: purchase.id, status: "VALIDATED" },
  });

  return { purchaseId: purchase.id };
}

async function attachInvoiceFileToPurchase(importId: string, purchaseId: string) {
  const imp = await prisma.invoiceImport.findUnique({ where: { id: importId } });
  if (!imp) return;

  const existing = await prisma.document.findFirst({
    where: { invoiceImportId: importId, purchaseId },
  });
  if (existing) return;

  await prisma.document.create({
    data: {
      category: "PURCHASE_INVOICE",
      title: "Facture importée",
      originalName: imp.fileName,
      path: imp.fileUrl,
      mimeType: imp.fileMimeType,
      size: imp.fileSize,
      purchaseId,
      invoiceImportId: importId,
      extractedData: imp.structuredData ?? undefined,
      uploadedById: imp.uploadedById,
    },
  });
}

export { isInvoiceImportMime };
