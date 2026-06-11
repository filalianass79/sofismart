import type { AiExtractionResult } from "./ai-extraction-schema";
import type { ExtractedScalar, StructuredInvoiceData } from "./types";

export type ConfidenceLevel = "high" | "medium" | "low" | "none";

export function confidenceLevel(score: number): ConfidenceLevel {
  if (score >= 0.85) return "high";
  if (score >= 0.6) return "medium";
  if (score > 0) return "low";
  return "none";
}

export function fieldStatusFromConfidence(
  confidence: number,
  source: "AI_DETECTED" | "OCR_DETECTED" | "REGEX_DETECTED",
): "VALIDATED" | "NEEDS_REVIEW" | "AI_DETECTED" | "OCR_DETECTED" | "DETECTED" {
  if (confidence >= 0.85) return source === "AI_DETECTED" ? "AI_DETECTED" : "DETECTED";
  if (confidence >= 0.6) return "NEEDS_REVIEW";
  return "NEEDS_REVIEW";
}

export function summarizeExtraction(structured: StructuredInvoiceData) {
  return {
    global: structured.globalConfidence,
    detected: structured.detectedCount,
    lowConfidence: structured.lowConfidenceCount,
    missing: structured.missingCount,
    level: confidenceLevel(structured.globalConfidence),
  };
}

export function mergeAiConfidence(
  structured: StructuredInvoiceData,
  ai: AiExtractionResult,
): StructuredInvoiceData {
  const fieldConf = ai.confidence?.fields ?? {};
  const global = ai.confidence?.global ?? structured.globalConfidence;

  function boost<T>(scalar: ExtractedScalar<T>, key: string): ExtractedScalar<T> {
    const aiConf = fieldConf[key];
    if (aiConf !== undefined && aiConf > scalar.confidence) {
      return { ...scalar, confidence: aiConf };
    }
    return scalar;
  }

  return {
    ...structured,
    supplier: {
      name: boost(structured.supplier.name, "supplier.name"),
      ice: boost(structured.supplier.ice, "supplier.ice"),
      rc: boost(structured.supplier.rc, "supplier.rc"),
      taxId: boost(structured.supplier.taxId, "supplier.taxId"),
      phone: boost(structured.supplier.phone, "supplier.phone"),
      email: structured.supplier.email,
      address: boost(structured.supplier.address, "supplier.address"),
      city: boost(structured.supplier.city, "supplier.city"),
    },
    invoice: {
      ...structured.invoice,
      invoiceNumber: boost(structured.invoice.invoiceNumber, "invoice.invoiceNumber"),
      amountHT: boost(structured.invoice.amountHT, "invoice.amountHT"),
      taxAmount: boost(structured.invoice.taxAmount, "invoice.taxAmount"),
      amountTTC: boost(structured.invoice.amountTTC, "invoice.amountTTC"),
    },
    vehicle: {
      ...structured.vehicle,
      vin: boost(structured.vehicle.vin, "vehicle.vin"),
      plate: boost(structured.vehicle.plate, "vehicle.registrationNumber"),
      brandLabel: boost(structured.vehicle.brandLabel, "vehicle.brand"),
      modelLabel: boost(structured.vehicle.modelLabel, "vehicle.model"),
    },
    globalConfidence: Math.max(structured.globalConfidence, global),
    detectedCount: structured.detectedCount,
    lowConfidenceCount: structured.lowConfidenceCount,
    missingCount: structured.missingCount,
  };
}
