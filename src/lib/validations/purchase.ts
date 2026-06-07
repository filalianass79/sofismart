import { z } from "zod";

const positiveAmount = z
  .union([z.number(), z.string()])
  .transform((v) => (typeof v === "string" ? Number(v) : v))
  .pipe(z.number().min(0, "Montant positif requis"));
const optionalPositive = z
  .union([z.number(), z.string(), z.literal("")])
  .optional()
  .transform((v) => (v === "" || v == null ? undefined : Number(v)))
  .pipe(z.number().min(0).optional());

export const supplierStepSchema = z
  .object({
    supplierId: z.string().min(1, "Sélectionnez un fournisseur"),
  })
  .strict();

export const supplierCreateSchema = z
  .object({
    type: z.enum(["DEALERSHIP", "COMPANY", "IMPORTER", "INDIVIDUAL", "OTHER"]),
    name: z.string().min(2, "Nom requis"),
    cin: z.string().optional(),
    ice: z.string().optional(),
    rc: z.string().optional(),
    taxId: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email("Email invalide").optional().or(z.literal("")),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "INDIVIDUAL" && !data.cin?.trim()) {
      ctx.addIssue({ code: "custom", message: "CIN obligatoire pour un particulier", path: ["cin"] });
    }
  });

export const feeLineSchema = z.object({
  id: z.string().optional(),
  type: z.enum([
    "TRANSPORT",
    "CUSTOMS",
    "TRANSIT",
    "HOMOLOGATION",
    "REPAIR",
    "CLEANING",
    "REGISTRATION",
    "INSURANCE",
    "EXPERTISE",
    "COMMISSION",
    "OTHER",
  ]),
  label: z.string().optional(),
  amount: positiveAmount,
  notes: z.string().optional(),
});

export const invoiceStepSchema = z.object({
  invoiceNumber: z.string().optional(),
  purchaseDate: z.string().min(1, "Date d'achat requise"),
  invoiceDate: z.string().optional(),
  purchaseType: z.enum(["LOCAL", "IMPORT", "DEALERSHIP", "INDIVIDUAL", "GROUP"]),
  taxRatePercent: z
    .union([z.number(), z.string()])
    .transform((v) => Number(v) || 20)
    .pipe(z.number().min(0).max(100))
    .default(20),
  amountHT: positiveAmount,
  taxAmount: positiveAmount.default(0),
  notes: z.string().optional(),
  fees: z.array(feeLineSchema).default([]),
});

export const vehicleStepSchema = z.object({
  brandId: z.string().min(1, "Marque requise"),
  modelId: z.string().min(1, "Modèle requis"),
  version: z.string().optional(),
  year: z
    .union([z.number(), z.string()])
    .transform((v) => Number(v))
    .pipe(z.number().int().min(1980).max(2100)),
  firstRegistrationDate: z.string().optional(),
  mileage: z
    .union([z.number(), z.string()])
    .transform((v) => Number(v) || 0)
    .pipe(z.number().int().min(0))
    .default(0),
  fuel: z.enum(["DIESEL", "ESSENCE", "HYBRIDE", "ELECTRIQUE"]).optional().or(z.literal("")),
  transmission: z.enum(["MANUELLE", "AUTOMATIQUE"]).optional().or(z.literal("")),
  fiscalPower: optionalPositive,
  engineSize: z.string().optional(),
  color: z.string().optional(),
  interiorColor: z.string().optional(),
  vin: z.string().optional(),
  plate: z.string().optional(),
  matriculeW: z.string().optional(),
  origin: z.enum(["NEW", "USED", "IMPORTED"]),
  originCountry: z.string().optional(),
  vehicleCondition: z
    .enum(["EXCELLENT", "GOOD", "AVERAGE", "NEEDS_REPAIR"])
    .optional(),
  status: z.enum(["IN_STOCK", "IN_TRANSIT", "PREPARATION", "IN_REPAIR"]),
  depotId: z.string().min(1, "Dépôt requis"),
  targetSalePrice: optionalPositive,
  conditionNotes: z.string().optional(),
  internalRef: z.string().optional(),
});

export const paymentLineSchema = z.object({
  id: z.string().optional(),
  amount: positiveAmount,
  paidAt: z.string().min(1),
  method: z.enum(["CASH", "TRANSFER", "CHECK", "CREDIT", "BILL_OF_EXCHANGE", "OTHER"]),
  reference: z.string().optional(),
  bank: z.string().optional(),
  checkNumber: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

export const paymentsStepSchema = z.object({
  payments: z.array(paymentLineSchema).default([]),
});

export const documentMetaSchema = z.object({
  id: z.string(),
  category: z.string(),
  originalName: z.string(),
  path: z.string(),
});

export const purchaseWizardSchema = z.object({
  supplierId: z.string().min(1),
  invoice: invoiceStepSchema,
  vehicle: vehicleStepSchema,
  payments: z.array(paymentLineSchema).default([]),
  documents: z.array(documentMetaSchema).default([]),
});

export type PurchaseWizardValues = z.output<typeof purchaseWizardSchema>;
export type SupplierCreateValues = z.infer<typeof supplierCreateSchema>;
