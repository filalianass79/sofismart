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
import { isInvoiceImportMime } from "./ocr-service";
import {
  invoiceImportDir,
  invoiceImportPublicUrl,
  resolveInvoiceImportFilePath,
} from "./paths";
import { extractStructuredFromText } from "./invoice-extraction-service";
import { flattenFieldsForDb, mapToWizardDraft } from "./invoice-field-mapper";
import { matchSuppliers } from "./supplier-matcher";
import { matchVehicles } from "./vehicle-matcher";
import { runInvoiceExtractionPipeline } from "./pipeline";
import { runOCR } from "./ocr-service";
import { getAiProviderInfo, isAiExtractionEnabled, runAiExtraction } from "./ai-invoice-extraction-service";
import { mapAiToStructured } from "./ai-mapper";
import { mergeAiConfidence } from "./invoice-confidence-service";
import { updateExtractedFields, getFieldReviewSummary } from "./invoice-human-review-service";
import type { FieldCorrection } from "./invoice-human-review-service";
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

export async function uploadInvoiceFile(
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
  await writeFile(path.join(dir, stored), buffer);
  const publicPath = invoiceImportPublicUrl(stored);

  const record = await prisma.invoiceImport.create({
    data: {
      fileName: sanitizeOriginalName(file.name),
      fileUrl: publicPath,
      fileMimeType: file.type,
      fileSize: buffer.length,
      status: "PENDING",
      extractionStatus: "PENDING",
      ocrStatus: "PENDING",
      aiStatus: isAiExtractionEnabled() ? "PENDING" : "DISABLED",
      uploadedById,
    },
  });

  return record.id;
}

async function saveExtractedFields(
  importId: string,
  structured: StructuredInvoiceData,
  source: "AI_DETECTED" | "REGEX_DETECTED" = "REGEX_DETECTED",
) {
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
        source,
        status: f.confidence >= 0.85 ? "AI_DETECTED" : f.confidence >= 0.6 ? "NEEDS_REVIEW" : "NEEDS_REVIEW",
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

export async function createInvoiceImportFromFile(
  file: File,
  uploadedById: string | null,
): Promise<string> {
  const importId = await uploadInvoiceFile(file, uploadedById);
  const imp = await prisma.invoiceImport.findUnique({ where: { id: importId } });
  if (!imp) throw new Error("Import introuvable");

  const buffer = await readFile(resolveInvoiceImportFilePath(imp.fileUrl));
  try {
    const result = await runInvoiceExtractionPipeline(importId, buffer, imp.fileMimeType, uploadedById);
    await saveExtractedFields(importId, result.structured, result.aiUsed ? "AI_DETECTED" : "REGEX_DETECTED");

    const dir = invoiceImportDir();
    const jsonPath = path.join(dir, `${importId}-extraction.json`);
    await writeFile(
      jsonPath,
      JSON.stringify(
        {
          structured: result.structured,
          supplierMatches: result.supplierMatches,
          vehicleMatches: result.vehicleMatches,
          aiUsed: result.aiUsed,
          validationErrors: result.validationErrors,
        },
        null,
        2,
      ),
    );
  } catch (e) {
    await prisma.invoiceImport.update({
      where: { id: importId },
      data: {
        status: "FAILED",
        extractionStatus: "FAILED",
        rawOcrText: e instanceof Error ? e.message : "Erreur extraction",
      },
    });
    throw e;
  }

  return importId;
}

export async function runOcrOnly(importId: string): Promise<void> {
  const imp = await prisma.invoiceImport.findUnique({ where: { id: importId } });
  if (!imp) throw new Error("Import introuvable");

  const buffer = await readFile(resolveInvoiceImportFilePath(imp.fileUrl));
  const ocrResult = await runOCR(buffer, imp.fileMimeType);

  await prisma.invoiceImport.update({
    where: { id: importId },
    data: {
      ocrStatus: "SUCCESS",
      rawOcrText: ocrResult.rawText.slice(0, 500_000),
      cleanedOcrText: ocrResult.cleanedText.slice(0, 500_000),
      ocrJson: ocrResult.ocrJson as object,
      pageCount: ocrResult.pageCount,
    },
  });
}

export async function runAiOnly(importId: string, userId: string | null): Promise<void> {
  const imp = await prisma.invoiceImport.findUnique({ where: { id: importId } });
  if (!imp) throw new Error("Import introuvable");

  const cleaned = imp.cleanedOcrText ?? imp.rawOcrText ?? "";
  if (!cleaned.trim()) throw new Error("OCR requis avant extraction IA");

  await prisma.invoiceImport.update({ where: { id: importId }, data: { aiStatus: "PROCESSING" } });

  const ai = await runAiExtraction(
    importId,
    { rawOcrText: imp.rawOcrText ?? "", cleanedOcrText: cleaned },
    userId,
  );

  const structured = mapAiToStructured(ai.data);
  const merged = mergeAiConfidence(structured, ai.data);
  const supplierMatches = await matchSuppliers(merged);
  const vehicleMatches = await matchVehicles(merged);

  await prisma.invoiceImport.update({
    where: { id: importId },
    data: {
      aiStatus: "SUCCESS",
      aiRawResponse: ai.rawResponse.slice(0, 500_000),
      aiStructuredData: ai.data as object,
      validationErrors: ai.validationErrors.length ? ai.validationErrors : undefined,
      structuredData: { ...(merged as object), supplierMatches, vehicleMatches, aiUsed: true },
      confidenceScore: merged.globalConfidence,
      status: "EXTRACTED",
      extractionStatus: merged.globalConfidence >= 0.55 ? "SUCCESS" : "PARTIAL",
    },
  });

  await saveExtractedFields(importId, merged, "AI_DETECTED");
}

export async function reprocessInvoiceImport(importId: string, userId: string | null): Promise<void> {
  const imp = await prisma.invoiceImport.findUnique({ where: { id: importId } });
  if (!imp) throw new Error("Import introuvable");

  const buffer = await readFile(resolveInvoiceImportFilePath(imp.fileUrl));
  const result = await runInvoiceExtractionPipeline(importId, buffer, imp.fileMimeType, userId);
  await saveExtractedFields(importId, result.structured, result.aiUsed ? "AI_DETECTED" : "REGEX_DETECTED");
}

export async function getInvoiceImportPayload(importId: string): Promise<InvoiceImportPayload> {
  const imp = await prisma.invoiceImport.findUnique({
    where: { id: importId },
    include: {
      extractedFields: true,
      lineItems: { orderBy: { sortOrder: "asc" } },
      extractionRuns: { orderBy: { createdAt: "desc" }, take: 10 },
    },
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

  const supplierMatches = structured.supplierMatches ?? (await matchSuppliers(structured));
  const vehicleMatches = structured.vehicleMatches ?? (await matchVehicles(structured));

  const wizardDraft = await mapToWizardDraft(structured, {
    supplierId: supplierMatches[0]?.id,
    brandId: undefined,
    modelId: undefined,
  });

  const validationErrors = Array.isArray(imp.validationErrors)
    ? (imp.validationErrors as string[])
    : imp.validationErrors
      ? [String(imp.validationErrors)]
      : null;

  return {
    importId: imp.id,
    fileUrl: imp.fileUrl,
    fileMimeType: imp.fileMimeType,
    fileName: imp.fileName,
    pageCount: imp.pageCount,
    status: imp.status,
    extractionStatus: imp.extractionStatus,
    ocrStatus: imp.ocrStatus,
    aiStatus: imp.aiStatus,
    confidenceScore: Number(imp.confidenceScore ?? structured.globalConfidence ?? 0),
    rawOcrText: imp.rawOcrText,
    cleanedOcrText: imp.cleanedOcrText,
    aiStructuredData: imp.aiStructuredData,
    validationErrors,
    extractionRuns: imp.extractionRuns.map((r) => ({
      id: r.id,
      type: r.type,
      provider: r.provider,
      model: r.model,
      status: r.status,
      estimatedCost: r.estimatedCost ? Number(r.estimatedCost) : null,
      startedAt: r.startedAt.toISOString(),
      finishedAt: r.finishedAt?.toISOString() ?? null,
    })),
    structured,
    wizardDraft,
    supplierMatches,
    vehicleMatches,
    purchaseId: imp.purchaseId,
    ...(() => {
      const ai = getAiProviderInfo();
      return { aiEnabled: ai.enabled, aiProvider: ai.activeProvider, aiModel: ai.activeModel };
    })(),
  };
}

export async function updateImportFields(importId: string, corrections: FieldCorrection[]) {
  await updateExtractedFields(importId, corrections);
  return getFieldReviewSummary(importId);
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

export { isInvoiceImportMime, getFieldReviewSummary };
