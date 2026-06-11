import type { PurchaseWizardValues } from "@/lib/validations/purchase";

export type FieldStatus = "detected" | "verified" | "corrected" | "ignored";

export type ExtractedScalar<T = string | number | null> = {
  value: T;
  confidence: number;
  sourceText?: string;
  status: FieldStatus;
};

export type InvoiceLineExtracted = {
  id?: string;
  designation: string;
  quantity: number;
  discount: number;
  unitPriceHT: number;
  taxRate: number;
  taxAmount: number;
  totalHT: number;
  totalTTC: number;
  lineType: "VEHICLE" | "ACCESSORY" | "FEE" | "DISCOUNT" | "OTHER";
  confidence: number;
};

export type StructuredInvoiceData = {
  supplier: {
    name: ExtractedScalar<string>;
    ice: ExtractedScalar<string>;
    rc: ExtractedScalar<string>;
    taxId: ExtractedScalar<string>;
    phone: ExtractedScalar<string>;
    email: ExtractedScalar<string>;
    address: ExtractedScalar<string>;
    city: ExtractedScalar<string>;
  };
  client: {
    name: ExtractedScalar<string>;
    ice: ExtractedScalar<string>;
    phone: ExtractedScalar<string>;
    address: ExtractedScalar<string>;
  };
  invoice: {
    invoiceNumber: ExtractedScalar<string>;
    purchaseDate: ExtractedScalar<string>;
    invoiceDate: ExtractedScalar<string>;
    deliveryDate: ExtractedScalar<string>;
    purchaseOrderNumber: ExtractedScalar<string>;
    deliveryNoteNumber: ExtractedScalar<string>;
    currency: ExtractedScalar<string>;
    amountHT: ExtractedScalar<number>;
    taxAmount: ExtractedScalar<number>;
    amountTTC: ExtractedScalar<number>;
    discount: ExtractedScalar<number>;
    taxRatePercent: ExtractedScalar<number>;
    amountPaid: ExtractedScalar<number>;
    balanceDue: ExtractedScalar<number>;
  };
  vehicle: {
    brandLabel: ExtractedScalar<string>;
    modelLabel: ExtractedScalar<string>;
    version: ExtractedScalar<string>;
    year: ExtractedScalar<number>;
    color: ExtractedScalar<string>;
    plate: ExtractedScalar<string>;
    vin: ExtractedScalar<string>;
    fuel: ExtractedScalar<string>;
    transmission: ExtractedScalar<string>;
    mileage: ExtractedScalar<number>;
  };
  lineItems: InvoiceLineExtracted[];
  globalConfidence: number;
  detectedCount: number;
  lowConfidenceCount: number;
  missingCount: number;
};

export type SupplierMatchResult = {
  id: string;
  name: string;
  ice: string | null;
  phone: string | null;
  score: number;
};

export type VehicleMatchResult = {
  id: string;
  internalRef: string;
  vin: string | null;
  plate: string | null;
  brandLabel: string;
  modelLabel: string;
  score: number;
};

export type OcrWordBlock = {
  text: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type OcrResult = {
  rawText: string;
  cleanedText: string;
  pageCount: number;
  words: OcrWordBlock[];
  blocks: { text: string; confidence: number }[];
  ocrScore: number;
  ocrJson: Record<string, unknown>;
};

export type InvoiceImportPayload = {
  importId: string;
  fileUrl: string;
  fileMimeType: string;
  fileName: string;
  pageCount: number;
  status: string;
  extractionStatus: string;
  ocrStatus: string;
  aiStatus: string;
  confidenceScore: number;
  rawOcrText: string | null;
  cleanedOcrText: string | null;
  aiStructuredData: unknown | null;
  validationErrors: string[] | null;
  extractionRuns: {
    id: string;
    type: string;
    provider: string | null;
    model: string | null;
    status: string;
    estimatedCost: number | null;
    startedAt: string;
    finishedAt: string | null;
  }[];
  structured: StructuredInvoiceData;
  wizardDraft: Partial<PurchaseWizardValues>;
  supplierMatches: SupplierMatchResult[];
  vehicleMatches: VehicleMatchResult[];
  purchaseId: string | null;
  aiEnabled: boolean;
  aiProvider?: string;
  aiModel?: string;
};
