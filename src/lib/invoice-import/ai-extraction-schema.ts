import { z } from "zod";

const nullableStr = z.string().nullable().optional().default("");
const nullableNum = z.number().nullable().optional();

export const supplierAiSchema = z.object({
  name: nullableStr,
  ice: nullableStr,
  rc: nullableStr,
  taxId: nullableStr,
  phone: nullableStr,
  address: nullableStr,
  city: nullableStr,
  country: nullableStr,
});

export const invoiceAiSchema = z.object({
  invoiceNumber: nullableStr,
  invoiceDate: nullableStr,
  deliveryDate: nullableStr,
  purchaseOrderNumber: nullableStr,
  deliveryNoteNumber: nullableStr,
  currency: z.string().default("MAD"),
  amountHT: z.coerce.number().min(0).default(0),
  taxAmount: z.coerce.number().min(0).default(0),
  amountTTC: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  netToPay: z.coerce.number().min(0).default(0),
});

export const vehicleAiSchema = z.object({
  brand: nullableStr,
  model: nullableStr,
  version: nullableStr,
  year: nullableNum,
  color: nullableStr,
  vin: nullableStr,
  registrationNumber: nullableStr,
  mileage: nullableNum,
  fuelType: nullableStr,
  gearbox: nullableStr,
});

export const lineItemAiSchema = z.object({
  designation: nullableStr,
  quantity: z.coerce.number().positive().default(1),
  unitPriceHT: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  taxRate: z.coerce.number().min(0).max(100).default(20),
  taxAmount: z.coerce.number().min(0).default(0),
  totalHT: z.coerce.number().min(0).default(0),
  totalTTC: z.coerce.number().min(0).default(0),
  lineType: z.enum(["VEHICLE", "ACCESSORY", "FEE", "DISCOUNT", "OTHER"]).default("VEHICLE"),
});

export const paymentAiSchema = z.object({
  paymentMethod: nullableStr,
  paidAmount: z.coerce.number().min(0).default(0),
  remainingAmount: z.coerce.number().min(0).default(0),
});

export const confidenceAiSchema = z.object({
  global: z.coerce.number().min(0).max(1).default(0),
  fields: z.record(z.string(), z.coerce.number().min(0).max(1)).default({}),
});

export const aiExtractionSchema = z
  .object({
    supplier: supplierAiSchema.optional(),
    invoice: invoiceAiSchema.optional(),
    vehicle: vehicleAiSchema.optional(),
    lineItems: z.array(lineItemAiSchema).optional(),
    payment: paymentAiSchema.optional(),
    confidence: confidenceAiSchema.optional(),
    warnings: z.array(z.string()).optional(),
  })
  .transform((data) => ({
    supplier: supplierAiSchema.parse(data.supplier ?? {}),
    invoice: invoiceAiSchema.parse(data.invoice ?? {}),
    vehicle: vehicleAiSchema.parse(data.vehicle ?? {}),
    lineItems: data.lineItems ?? [],
    payment: paymentAiSchema.parse(data.payment ?? {}),
    confidence: confidenceAiSchema.parse(data.confidence ?? { global: 0, fields: {} }),
    warnings: data.warnings ?? [],
  }))
  .superRefine((data, ctx) => {
    const hasInvoiceNumber = Boolean(data.invoice.invoiceNumber?.trim());
    const hasAmount = data.invoice.amountTTC > 0 || data.invoice.amountHT > 0;
    if (!hasInvoiceNumber && !hasAmount) {
      ctx.addIssue({
        code: "custom",
        message: "Au moins un numéro de facture ou un montant TTC/HT est requis",
        path: ["invoice"],
      });
    }
    const ice = data.supplier.ice?.replace(/\D/g, "") ?? "";
    if (ice && ice.length !== 15) {
      ctx.addIssue({
        code: "custom",
        message: "ICE doit contenir 15 chiffres",
        path: ["supplier", "ice"],
      });
    }
    const vin = data.vehicle.vin?.trim() ?? "";
    if (vin && !/^[A-HJ-NPR-Z0-9]{11,17}$/i.test(vin)) {
      ctx.addIssue({
        code: "custom",
        message: "Format VIN invalide",
        path: ["vehicle", "vin"],
      });
    }
    const ht = data.invoice.amountHT;
    const tva = data.invoice.taxAmount;
    const ttc = data.invoice.amountTTC;
    const discount = data.invoice.discount;
    if (ht > 0 && ttc > 0) {
      const expected = ht + tva - discount;
      if (Math.abs(expected - ttc) > Math.max(5, ttc * 0.02)) {
        data.warnings.push(
          `Incohérence montants : HT(${ht}) + TVA(${tva}) - remise(${discount}) ≠ TTC(${ttc})`,
        );
      }
    }
  });

export type AiExtractionResult = z.infer<typeof aiExtractionSchema>;

export const SYSTEM_PROMPT = `Tu es un expert en extraction de factures automobiles marocaines.
Tu dois extraire les données d'une facture d'achat véhicule à partir d'un texte OCR potentiellement imparfait.
Tu dois corriger les erreurs OCR évidentes (O→0, l→1, S→5 dans les montants).
Tu dois reconnaître les champs fournisseur, facture, véhicule, montants, TVA et lignes facture.
Tu dois retourner uniquement un JSON valide conforme au schéma demandé, sans markdown ni commentaire.
Tu ne dois pas inventer de données absentes.
Si une donnée est incertaine, retourne null ou une chaîne vide et ajoute un warning.
Les montants doivent être numériques.
Les dates doivent être au format ISO YYYY-MM-DD si possible.
Le VIN doit être détecté comme numéro de châssis (11 à 17 caractères alphanumériques).
L'immatriculation peut être marocaine ou WW.
ICE (15 chiffres), RC, IF doivent être détectés si présents.
Vérifie la cohérence : total TTC ≈ total HT + TVA - remise.`;
