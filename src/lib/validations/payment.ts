import { z } from "zod";

export const paymentWizardSchema = z.object({
  category: z.enum(["CLIENT", "SUPPLIER", "PURCHASE", "SALE", "MISC"]),
  clientId: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  purchaseId: z.string().optional().nullable(),
  saleId: z.string().optional().nullable(),
  amount: z.coerce.number().positive(),
  currency: z.enum(["MAD", "EUR", "USD"]).default("MAD"),
  paidAt: z.string(),
  method: z.enum(["CASH", "TRANSFER", "CHECK", "CREDIT", "BILL_OF_EXCHANGE", "OTHER"]),
  direction: z.enum(["TO_SUPPLIER", "FROM_CLIENT"]),
  bank: z.string().optional(),
  checkNumber: z.string().optional(),
  transferReference: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional(),
  validationStatus: z.enum(["PENDING", "VALIDATED"]).default("VALIDATED"),
  cashboxId: z.string().optional().nullable(),
}).refine((d) => d.method !== "CASH" || !!d.cashboxId, {
  message: "Caisse obligatoire pour un paiement en espèces",
  path: ["cashboxId"],
});

export type PaymentWizardValues = z.infer<typeof paymentWizardSchema>;
