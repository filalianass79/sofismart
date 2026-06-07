import type { ExtractedScalar, InvoiceLineExtracted, StructuredInvoiceData } from "./types";

function field<T>(value: T, confidence: number, sourceText?: string): ExtractedScalar<T> {
  return { value, confidence, sourceText, status: "detected" };
}

function emptyField<T>(value: T): ExtractedScalar<T> {
  return { value, confidence: 0, status: "detected" };
}

function parseAmount(raw: string): number {
  const cleaned = raw.replace(/\s/g, "").replace(/,/g, ".").replace(/[^\d.]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function firstMatch(text: string, patterns: RegExp[]): { value: string; conf: number } | null {
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) return { value: m[1].trim(), conf: 0.75 };
  }
  return null;
}

function parseDate(raw: string): string {
  const m = raw.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (!m) return "";
  const d = m[1].padStart(2, "0");
  const mo = m[2].padStart(2, "0");
  let y = m[3];
  if (y.length === 2) y = `20${y}`;
  return `${y}-${mo}-${d}`;
}

function classifyLine(designation: string): InvoiceLineExtracted["lineType"] {
  const d = designation.toLowerCase();
  if (/véhicule|vehicle|auto|voiture|berline|suv|citadine/i.test(d)) return "VEHICLE";
  if (/frais|transport|douane|transit|homolog|enregistrement|mise en service|accessoire/i.test(d))
    return "FEE";
  if (/accessoire|option|pack|jante|gps/i.test(d)) return "ACCESSORY";
  if (/remise|réduction|discount/i.test(d)) return "DISCOUNT";
  return "OTHER";
}

export function extractStructuredFromText(rawText: string): StructuredInvoiceData {
  const text = rawText.replace(/\r/g, "\n");
  const upper = text.toUpperCase();

  const ice =
    firstMatch(text, [/I\.?\s*C\.?\s*E\.?\s*[:\s]*(\d{15})/i, /ICE\s*[:\s]*(\d{15})/i]) ??
    firstMatch(text, [/(\d{15})/]);
  const rc = firstMatch(text, [/R\.?\s*C\.?\s*[:\s]*([\d/]+)/i, /RC\s*[:\s]*([\d/]+)/i]);
  const ifNum = firstMatch(text, [/I\.?\s*F\.?\s*[:\s]*(\d+)/i, /IF\s*[:\s]*(\d+)/i]);
  const phone = firstMatch(text, [
    /(?:Tél|Téléphone|GSM|Mobile)\s*[:\s]*([+\d\s./-]{9,})/i,
    /(0[567]\d{8})/,
  ]);
  const email = firstMatch(text, [/([\w.-]+@[\w.-]+\.\w{2,})/i]);
  const invoiceNumber = firstMatch(text, [
    /Facture\s*N[°o]?\s*[:\s]*([A-Z0-9\-/]+)/i,
    /N[°o]?\s*Facture\s*[:\s]*([A-Z0-9\-/]+)/i,
    /Invoice\s*#?\s*([A-Z0-9\-/]+)/i,
  ]);
  const dateMatch = firstMatch(text, [
    /Date\s*(?:facture|invoice)?\s*[:\s]*(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4})/i,
    /(\d{1,2}[/.-]\d{1,2}[/.-]\d{4})/,
  ]);
  const vin = firstMatch(text, [
    /(?:VIN|Châssis|Chassis|N°\s*chassis)\s*[:\s]*([A-HJ-NPR-Z0-9]{11,17})/i,
  ]);
  const plate = firstMatch(text, [
    /(?:Immat|Matricule|Plaque)\s*[:\s]*([0-9]{1,5}[-\s]?[A-Z]{1,3}[-\s]?[0-9]{1,4})/i,
    /\b([0-9]{1,5}\s?[A-Z]{1,2}\s?[0-9]{1,4})\b/,
  ]);

  const amountHT = firstMatch(text, [
    /Total\s*H\.?T\.?\s*[:\s]*([\d\s.,]+)/i,
    /Montant\s*H\.?T\.?\s*[:\s]*([\d\s.,]+)/i,
  ]);
  const amountTTC = firstMatch(text, [
    /Total\s*T\.?T\.?C\.?\s*[:\s]*([\d\s.,]+)/i,
    /Net\s*à\s*payer\s*[:\s]*([\d\s.,]+)/i,
    /NET\s*A\s*PAYER\s*[:\s]*([\d\s.,]+)/i,
  ]);
  const taxAmount = firstMatch(text, [
    /(?:TVA|T\.V\.A\.?)\s*(?:20|10|7)?\s*%?\s*[:\s]*([\d\s.,]+)/i,
    /Montant\s*TVA\s*[:\s]*([\d\s.,]+)/i,
  ]);

  const supplierName = firstMatch(text, [
    /^([A-ZÀÂÄÉÈÊËÏÎÔÙÛÜ\s&.'-]{4,60})$/m,
    /Fournisseur\s*[:\s]*(.+)/i,
  ]);

  const brandModel = firstMatch(text, [
    /(?:Marque|Brand)\s*[:\s]*([^\n]+)/i,
  ]);
  const modelLine = firstMatch(text, [/(?:Modèle|Model)\s*[:\s]*([^\n]+)/i]);

  const lineItems: InvoiceLineExtracted[] = [];
  const lineRegex =
    /(.{5,80}?)\s+(\d+[,.]?\d*)\s+(\d+[,.]?\d*)\s+(\d+[,.]?\d*)/g;
  let lm: RegExpExecArray | null;
  while ((lm = lineRegex.exec(text)) !== null && lineItems.length < 20) {
    const designation = lm[1].trim();
    if (designation.length < 4 || /total|tva|ht|ttc/i.test(designation)) continue;
    const qty = parseAmount(lm[2]) || 1;
    const unit = parseAmount(lm[3]);
    const total = parseAmount(lm[4]);
    lineItems.push({
      designation,
      quantity: qty,
      discount: 0,
      unitPriceHT: unit,
      taxRate: 20,
      taxAmount: Math.max(0, total - unit * qty),
      totalHT: unit * qty,
      totalTTC: total,
      lineType: classifyLine(designation),
      confidence: 0.55,
    });
  }

  if (lineItems.length === 0 && amountTTC) {
    lineItems.push({
      designation: "Véhicule / prestation principale",
      quantity: 1,
      discount: 0,
      unitPriceHT: amountHT ? parseAmount(amountHT.value) : parseAmount(amountTTC.value) * 0.833,
      taxRate: 20,
      taxAmount: taxAmount ? parseAmount(taxAmount.value) : 0,
      totalHT: amountHT ? parseAmount(amountHT.value) : 0,
      totalTTC: parseAmount(amountTTC.value),
      lineType: "VEHICLE",
      confidence: 0.5,
    });
  }

  const ht = amountHT ? parseAmount(amountHT.value) : 0;
  const ttc = amountTTC ? parseAmount(amountTTC.value) : 0;
  const tva = taxAmount ? parseAmount(taxAmount.value) : Math.max(0, ttc - ht);

  const structured: StructuredInvoiceData = {
    supplier: {
      name: supplierName ? field(supplierName.value, 0.65, supplierName.value) : emptyField(""),
      ice: ice ? field(ice.value, ice.conf, ice.value) : emptyField(""),
      rc: rc ? field(rc.value, rc.conf, rc.value) : emptyField(""),
      taxId: ifNum ? field(ifNum.value, ifNum.conf, ifNum.value) : emptyField(""),
      phone: phone ? field(phone.value.replace(/\s/g, ""), 0.7, phone.value) : emptyField(""),
      email: email ? field(email.value, 0.8, email.value) : emptyField(""),
      address: emptyField(""),
      city: emptyField(""),
    },
    client: {
      name: emptyField(""),
      ice: emptyField(""),
      phone: emptyField(""),
      address: emptyField(""),
    },
    invoice: {
      invoiceNumber: invoiceNumber ? field(invoiceNumber.value, 0.8, invoiceNumber.value) : emptyField(""),
      purchaseDate: dateMatch
        ? field(parseDate(dateMatch.value), 0.75, dateMatch.value)
        : field(new Date().toISOString().slice(0, 10), 0.4),
      invoiceDate: dateMatch
        ? field(parseDate(dateMatch.value), 0.75, dateMatch.value)
        : emptyField(""),
      deliveryDate: emptyField(""),
      purchaseOrderNumber: emptyField(""),
      deliveryNoteNumber: emptyField(""),
      currency: field("MAD", upper.includes("EUR") ? 0.6 : 0.9),
      amountHT: field(ht, ht > 0 ? 0.8 : 0, amountHT?.value),
      taxAmount: field(tva, tva > 0 ? 0.75 : 0, taxAmount?.value),
      amountTTC: field(ttc, ttc > 0 ? 0.85 : 0, amountTTC?.value),
      discount: emptyField(0),
      taxRatePercent: field(20, 0.7),
      amountPaid: emptyField(0),
      balanceDue: field(ttc, ttc > 0 ? 0.6 : 0),
    },
    vehicle: {
      brandLabel: brandModel ? field(brandModel.value.split(/\s+/)[0] ?? "", 0.5) : emptyField(""),
      modelLabel: modelLine ? field(modelLine.value, 0.5) : emptyField(""),
      version: emptyField(""),
      year: emptyField(new Date().getFullYear()),
      color: emptyField(""),
      plate: plate ? field(plate.value.replace(/\s/g, ""), 0.7, plate.value) : emptyField(""),
      vin: vin ? field(vin.value, 0.85, vin.value) : emptyField(""),
      fuel: emptyField(""),
      transmission: emptyField(""),
      mileage: emptyField(0),
    },
    lineItems,
    globalConfidence: 0,
    detectedCount: 0,
    lowConfidenceCount: 0,
    missingCount: 0,
  };

  const scalars: ExtractedScalar<unknown>[] = [
    structured.supplier.name,
    structured.supplier.ice,
    structured.invoice.invoiceNumber,
    structured.invoice.amountHT,
    structured.invoice.amountTTC,
    structured.vehicle.vin,
    structured.vehicle.plate,
  ];
  let detected = 0;
  let low = 0;
  let missing = 0;
  for (const s of scalars) {
    const v = s.value;
    const empty =
      v === "" || v === null || v === undefined || (typeof v === "number" && v === 0 && s.confidence < 0.5);
    if (empty) missing++;
    else {
      detected++;
      if (s.confidence < 0.65) low++;
    }
  }
  structured.detectedCount = detected;
  structured.lowConfidenceCount = low;
  structured.missingCount = missing;
  structured.globalConfidence =
    scalars.reduce((a, s) => a + (s.confidence || 0), 0) / Math.max(1, scalars.length);

  return structured;
}
