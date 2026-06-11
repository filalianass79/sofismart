import type { AiExtractionResult } from "./ai-extraction-schema";
import type { ExtractedScalar, InvoiceLineExtracted, StructuredInvoiceData } from "./types";
import { fieldStatusFromConfidence } from "./invoice-confidence-service";

function aiField<T>(
  value: T | null | undefined,
  confidence: number,
  fieldKey: string,
  fieldConf: Record<string, number>,
): ExtractedScalar<T extends string | number ? T : string> {
  const conf = fieldConf[fieldKey] ?? confidence;
  const v = (value ?? (typeof value === "number" ? 0 : "")) as T extends string | number ? T : string;
  return {
    value: v,
    confidence: conf,
    status: fieldStatusFromConfidence(conf, "AI_DETECTED") === "AI_DETECTED" ? "detected" : "detected",
  };
}

function normalizeDate(d: string | null | undefined): string {
  if (!d?.trim()) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
  const m = d.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (!m) return d;
  const day = m[1].padStart(2, "0");
  const mo = m[2].padStart(2, "0");
  let y = m[3];
  if (y.length === 2) y = `20${y}`;
  return `${y}-${mo}-${day}`;
}

export function mapAiToStructured(ai: AiExtractionResult): StructuredInvoiceData {
  const fc = ai.confidence?.fields ?? {};
  const g = ai.confidence?.global ?? 0.5;

  const lineItems: InvoiceLineExtracted[] = ai.lineItems.map((l) => ({
    designation: l.designation ?? "",
    quantity: l.quantity,
    discount: l.discount,
    unitPriceHT: l.unitPriceHT,
    taxRate: l.taxRate,
    taxAmount: l.taxAmount,
    totalHT: l.totalHT,
    totalTTC: l.totalTTC,
    lineType: l.lineType,
    confidence: fc[`line.${l.designation}`] ?? g,
  }));

  if (!lineItems.length && (ai.invoice.amountHT > 0 || ai.vehicle.brand)) {
    lineItems.push({
      designation: [ai.vehicle.brand, ai.vehicle.model, ai.vehicle.version].filter(Boolean).join(" ") || "Véhicule",
      quantity: 1,
      discount: ai.invoice.discount,
      unitPriceHT: ai.invoice.amountHT,
      taxRate: ai.invoice.amountHT > 0 ? (ai.invoice.taxAmount / ai.invoice.amountHT) * 100 : 20,
      taxAmount: ai.invoice.taxAmount,
      totalHT: ai.invoice.amountHT,
      totalTTC: ai.invoice.amountTTC,
      lineType: "VEHICLE",
      confidence: g,
    });
  }

  const structured: StructuredInvoiceData = {
    supplier: {
      name: aiField(ai.supplier.name, g, "supplier.name", fc),
      ice: aiField(ai.supplier.ice, g, "supplier.ice", fc),
      rc: aiField(ai.supplier.rc, g, "supplier.rc", fc),
      taxId: aiField(ai.supplier.taxId, g, "supplier.taxId", fc),
      phone: aiField(ai.supplier.phone, g, "supplier.phone", fc),
      email: aiField("", 0, "supplier.email", fc),
      address: aiField(ai.supplier.address, g, "supplier.address", fc),
      city: aiField(ai.supplier.city, g, "supplier.city", fc),
    },
    client: {
      name: aiField("", 0, "client.name", fc),
      ice: aiField("", 0, "client.ice", fc),
      phone: aiField("", 0, "client.phone", fc),
      address: aiField("", 0, "client.address", fc),
    },
    invoice: {
      invoiceNumber: aiField(ai.invoice.invoiceNumber, g, "invoice.invoiceNumber", fc),
      purchaseDate: aiField(normalizeDate(ai.invoice.invoiceDate), g, "invoice.invoiceDate", fc),
      invoiceDate: aiField(normalizeDate(ai.invoice.invoiceDate), g, "invoice.invoiceDate", fc),
      deliveryDate: aiField(normalizeDate(ai.invoice.deliveryDate), g, "invoice.deliveryDate", fc),
      purchaseOrderNumber: aiField(ai.invoice.purchaseOrderNumber, g, "invoice.purchaseOrderNumber", fc),
      deliveryNoteNumber: aiField(ai.invoice.deliveryNoteNumber, g, "invoice.deliveryNoteNumber", fc),
      currency: aiField(ai.invoice.currency || "MAD", g, "invoice.currency", fc),
      amountHT: aiField(ai.invoice.amountHT, g, "invoice.amountHT", fc),
      taxAmount: aiField(ai.invoice.taxAmount, g, "invoice.taxAmount", fc),
      amountTTC: aiField(ai.invoice.amountTTC, g, "invoice.amountTTC", fc),
      discount: aiField(ai.invoice.discount, g, "invoice.discount", fc),
      taxRatePercent: aiField(
        ai.invoice.amountHT > 0 ? Math.round((ai.invoice.taxAmount / ai.invoice.amountHT) * 100) : 20,
        g,
        "invoice.taxRate",
        fc,
      ),
      amountPaid: aiField(ai.payment.paidAmount, g, "payment.paidAmount", fc),
      balanceDue: aiField(ai.payment.remainingAmount || ai.invoice.netToPay, g, "payment.remainingAmount", fc),
    },
    vehicle: {
      brandLabel: aiField(ai.vehicle.brand, g, "vehicle.brand", fc),
      modelLabel: aiField(ai.vehicle.model, g, "vehicle.model", fc),
      version: aiField(ai.vehicle.version, g, "vehicle.version", fc),
      year: aiField(ai.vehicle.year ?? 0, g, "vehicle.year", fc),
      color: aiField(ai.vehicle.color, g, "vehicle.color", fc),
      plate: aiField(ai.vehicle.registrationNumber, g, "vehicle.registrationNumber", fc),
      vin: aiField(ai.vehicle.vin?.toUpperCase(), g, "vehicle.vin", fc),
      fuel: aiField(ai.vehicle.fuelType, g, "vehicle.fuelType", fc),
      transmission: aiField(ai.vehicle.gearbox, g, "vehicle.gearbox", fc),
      mileage: aiField(ai.vehicle.mileage ?? 0, g, "vehicle.mileage", fc),
    },
    lineItems,
    globalConfidence: g,
    detectedCount: 0,
    lowConfidenceCount: 0,
    missingCount: 0,
  };

  return recountStats(structured);
}

function recountStats(data: StructuredInvoiceData): StructuredInvoiceData {
  const scalars: ExtractedScalar<unknown>[] = [];
  const push = (f: ExtractedScalar<unknown>) => scalars.push(f);
  Object.values(data.supplier).forEach(push);
  Object.values(data.invoice).forEach(push);
  Object.values(data.vehicle).forEach(push);

  let detected = 0;
  let low = 0;
  let missing = 0;
  for (const s of scalars) {
    if (s.value !== null && s.value !== undefined && s.value !== "" && s.value !== 0) {
      detected++;
      if (s.confidence < 0.6) low++;
    } else {
      missing++;
    }
  }

  return {
    ...data,
    detectedCount: detected,
    lowConfidenceCount: low,
    missingCount: missing,
    globalConfidence:
      scalars.length > 0
        ? scalars.reduce((sum, s) => sum + s.confidence, 0) / scalars.length
        : data.globalConfidence,
  };
}
