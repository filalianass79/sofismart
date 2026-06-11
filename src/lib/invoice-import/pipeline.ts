import { prisma } from "@/lib/prisma";
import { mapAiToStructured } from "./ai-mapper";
import { isAiExtractionEnabled, runAiExtraction } from "./ai-invoice-extraction-service";
import { extractStructuredFromText } from "./invoice-extraction-service";
import { mergeAiConfidence } from "./invoice-confidence-service";
import { runOCR } from "./ocr-service";
import { matchSuppliers } from "./supplier-matcher";
import { matchVehicles } from "./vehicle-matcher";
import type { StructuredInvoiceData } from "./types";

export type PipelineResult = {
  structured: StructuredInvoiceData;
  supplierMatches: Awaited<ReturnType<typeof matchSuppliers>>;
  vehicleMatches: Awaited<ReturnType<typeof matchVehicles>>;
  ocrScore: number;
  pageCount: number;
  aiUsed: boolean;
  validationErrors: string[];
};

export async function runInvoiceExtractionPipeline(
  importId: string,
  buffer: Buffer,
  mimeType: string,
  uploadedById: string | null,
): Promise<PipelineResult> {
  await prisma.invoiceImport.update({
    where: { id: importId },
    data: { ocrStatus: "PROCESSING", status: "PROCESSING" },
  });

  let ocrResult;
  try {
    ocrResult = await runOCR(buffer, mimeType);
    await prisma.invoiceExtractionRun.create({
      data: {
        invoiceImportId: importId,
        type: "OCR",
        provider: "tesseract",
        model: "fra+eng",
        status: "SUCCESS",
        finishedAt: new Date(),
      },
    });
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
  } catch (e) {
    await prisma.invoiceImport.update({
      where: { id: importId },
      data: {
        ocrStatus: "FAILED",
        status: "FAILED",
        extractionStatus: "FAILED",
      },
    });
    throw e;
  }

  const regexStructured = extractStructuredFromText(ocrResult.cleanedText || ocrResult.rawText);
  let structured = regexStructured;
  let aiUsed = false;
  let validationErrors: string[] = [];
  let aiStatus: "SUCCESS" | "FALLBACK_REGEX" | "DISABLED" | "FAILED" = "DISABLED";

  if (isAiExtractionEnabled()) {
    await prisma.invoiceImport.update({
      where: { id: importId },
      data: { aiStatus: "PROCESSING" },
    });
    try {
      const ai = await runAiExtraction(
        importId,
        {
          rawOcrText: ocrResult.rawText,
          cleanedOcrText: ocrResult.cleanedText,
          ocrBlocks: ocrResult.blocks,
          pageCount: ocrResult.pageCount,
        },
        uploadedById,
      );
      const aiStructured = mapAiToStructured(ai.data);
      structured = mergeAiConfidence(aiStructured, ai.data);
      validationErrors = ai.validationErrors;
      aiUsed = true;
      aiStatus = "SUCCESS";

      await prisma.invoiceImport.update({
        where: { id: importId },
        data: {
          aiStatus: "SUCCESS",
          aiRawResponse: ai.rawResponse.slice(0, 500_000),
          aiStructuredData: ai.data as object,
          validationErrors: validationErrors.length ? validationErrors : undefined,
        },
      });
    } catch (e) {
      aiStatus = "FALLBACK_REGEX";
      await prisma.invoiceImport.update({
        where: { id: importId },
        data: {
          aiStatus: "FALLBACK_REGEX",
          validationErrors: [e instanceof Error ? e.message : "IA indisponible — regex utilisé"],
        },
      });
      await prisma.invoiceExtractionRun.create({
        data: {
          invoiceImportId: importId,
          type: "REGEX",
          provider: "regex",
          model: "heuristic",
          status: "SUCCESS",
          finishedAt: new Date(),
        },
      });
    }
  } else {
    await prisma.invoiceImport.update({
      where: { id: importId },
      data: { aiStatus: "DISABLED" },
    });
    await prisma.invoiceExtractionRun.create({
      data: {
        invoiceImportId: importId,
        type: "REGEX",
        provider: "regex",
        model: "heuristic",
        status: "SUCCESS",
        finishedAt: new Date(),
      },
    });
  }

  const supplierMatches = await matchSuppliers(structured);
  const vehicleMatches = await matchVehicles(structured);

  const extractionStatus =
    structured.globalConfidence >= 0.55 ? "SUCCESS" : ocrResult.cleanedText.length > 50 ? "PARTIAL" : "FAILED";

  await prisma.invoiceImport.update({
    where: { id: importId },
    data: {
      structuredData: { ...(structured as object), supplierMatches, vehicleMatches, aiUsed, aiStatus },
      confidenceScore: structured.globalConfidence,
      status: "EXTRACTED",
      extractionStatus,
    },
  });

  return {
    structured,
    supplierMatches,
    vehicleMatches,
    ocrScore: ocrResult.ocrScore,
    pageCount: ocrResult.pageCount,
    aiUsed,
    validationErrors,
  };
}
