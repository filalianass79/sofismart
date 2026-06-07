import { prisma } from "@/lib/prisma";
import type { PurchaseWizardValues } from "@/lib/validations/purchase";
import type { StructuredInvoiceData } from "./types";
import type { PurchaseFeeType } from "@/generated/prisma/enums";

function val<T>(f: { value: T; correctedValue?: T | null }, fallback: T): T {
  if (f.correctedValue !== undefined && f.correctedValue !== null && f.correctedValue !== "")
    return f.correctedValue as T;
  return f.value ?? fallback;
}

function feeTypeFromLine(lineType: string): PurchaseFeeType {
  if (lineType === "FEE") return "OTHER";
  if (lineType === "ACCESSORY") return "OTHER";
  return "OTHER";
}

export async function resolveBrandModelIds(
  brandLabel: string,
  modelLabel: string,
): Promise<{ brandId: string; modelId: string } | null> {
  const b = brandLabel.trim();
  const m = modelLabel.trim();
  if (!b) return null;

  const brand = await prisma.brand.findFirst({
    where: { label: { contains: b, mode: "insensitive" } },
    select: { id: true },
  });
  if (!brand) return null;

  let modelId = "";
  if (m) {
    const model = await prisma.vehicleModel.findFirst({
      where: { brandId: brand.id, label: { contains: m, mode: "insensitive" } },
      select: { id: true },
    });
    modelId = model?.id ?? "";
  }

  return { brandId: brand.id, modelId };
}

export async function mapToWizardDraft(
  structured: StructuredInvoiceData,
  options: {
    supplierId?: string;
    depotId?: string;
    brandId?: string;
    modelId?: string;
  },
): Promise<Partial<PurchaseWizardValues>> {
  const fees = structured.lineItems
    .filter((l) => l.lineType === "FEE" || l.lineType === "ACCESSORY")
    .map((l) => ({
      type: feeTypeFromLine(l.lineType),
      label: l.designation,
      amount: l.totalHT || l.unitPriceHT,
      notes: "",
    }));

  let brandId = options.brandId ?? "";
  let modelId = options.modelId ?? "";
  if (!brandId) {
    const resolved = await resolveBrandModelIds(
      String(val(structured.vehicle.brandLabel, "")),
      String(val(structured.vehicle.modelLabel, "")),
    );
    if (resolved) {
      brandId = resolved.brandId;
      modelId = resolved.modelId;
    }
  }

  const amountHT = Number(val(structured.invoice.amountHT, 0));
  const taxAmount = Number(val(structured.invoice.taxAmount, 0));

  return {
    supplierId: options.supplierId ?? "",
    invoice: {
      invoiceNumber: String(val(structured.invoice.invoiceNumber, "")),
      purchaseDate:
        String(val(structured.invoice.purchaseDate, "")) || new Date().toISOString().slice(0, 10),
      invoiceDate: String(val(structured.invoice.invoiceDate, "")),
      purchaseType: "LOCAL",
      taxRatePercent: Number(val(structured.invoice.taxRatePercent, 20)),
      amountHT,
      taxAmount,
      notes: "",
      fees,
    },
    vehicle: {
      brandId,
      modelId,
      version: String(val(structured.vehicle.version, "")),
      year: Number(val(structured.vehicle.year, new Date().getFullYear())),
      firstRegistrationDate: "",
      mileage: Number(val(structured.vehicle.mileage, 0)),
      fuel: "",
      transmission: "",
      color: String(val(structured.vehicle.color, "")),
      interiorColor: "",
      vin: String(val(structured.vehicle.vin, "")),
      plate: String(val(structured.vehicle.plate, "")),
      matriculeW: "",
      origin: "USED",
      originCountry: "Maroc",
      status: "IN_STOCK",
      depotId: options.depotId ?? "",
      conditionNotes: "",
      internalRef: "",
    },
    payments: [],
    documents: [],
  };
}

export function flattenFieldsForDb(structured: StructuredInvoiceData) {
  const entries: {
    fieldKey: string;
    fieldLabel: string;
    extractedValue: string;
    confidence: number;
    sourceText?: string;
  }[] = [];

  const push = (key: string, label: string, f: { value: unknown; confidence: number; sourceText?: string }) => {
    entries.push({
      fieldKey: key,
      fieldLabel: label,
      extractedValue: f.value == null ? "" : String(f.value),
      confidence: f.confidence,
      sourceText: f.sourceText,
    });
  };

  push("supplier.name", "Fournisseur", structured.supplier.name);
  push("supplier.ice", "ICE", structured.supplier.ice);
  push("supplier.rc", "RC", structured.supplier.rc);
  push("supplier.phone", "Téléphone", structured.supplier.phone);
  push("invoice.invoiceNumber", "N° facture", structured.invoice.invoiceNumber);
  push("invoice.purchaseDate", "Date achat", structured.invoice.purchaseDate);
  push("invoice.amountHT", "Montant HT", structured.invoice.amountHT);
  push("invoice.taxAmount", "TVA", structured.invoice.taxAmount);
  push("invoice.amountTTC", "Montant TTC", structured.invoice.amountTTC);
  push("vehicle.brand", "Marque", structured.vehicle.brandLabel);
  push("vehicle.model", "Modèle", structured.vehicle.modelLabel);
  push("vehicle.vin", "VIN", structured.vehicle.vin);
  push("vehicle.plate", "Immatriculation", structured.vehicle.plate);

  return entries;
}
