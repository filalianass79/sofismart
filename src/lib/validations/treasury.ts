import { z } from "zod";

const positiveAmount = z.coerce.number().positive("Le montant doit être supérieur à 0");

export const cashboxSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  type: z.enum(["EMPLOYEE", "DEPOT", "MAIN", "TEMPORARY"]),
  employeeId: z.string().optional().nullable(),
  depotId: z.string().optional().nullable(),
  currency: z.enum(["MAD", "EUR", "USD"]).default("MAD"),
  initialBalance: z.coerce.number().min(0).default(0),
  authorizedLimit: z.coerce.number().min(0).optional().nullable(),
  description: z.string().optional().nullable(),
  openedAt: z.coerce.date().optional(),
});

export const creditCashboxSchema = z.object({
  amount: positiveAmount,
  operationDate: z.coerce.date().optional(),
  reason: z.string().min(3, "Motif obligatoire"),
  category: z.string().optional().nullable(),
  paymentMethod: z.string().optional().nullable(),
  externalReference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  autoValidate: z.boolean().optional(),
});

export const debitCashboxSchema = creditCashboxSchema;

export const transferCashboxSchema = z.object({
  sourceCashboxId: z.string().min(1),
  destinationCashboxId: z.string().min(1),
  amount: positiveAmount,
  reason: z.string().min(3, "Motif obligatoire"),
  notes: z.string().optional().nullable(),
}).refine((d) => d.sourceCashboxId !== d.destinationCashboxId, {
  message: "La caisse source doit être différente de la destination",
  path: ["destinationCashboxId"],
});

export const acceptTransferSchema = z.object({
  comment: z.string().optional().nullable(),
});

export const rejectTransferSchema = z.object({
  rejectionReason: z.string().min(3, "Motif de refus obligatoire"),
});

export const cancelMovementSchema = z.object({
  cancellationReason: z.string().min(3, "Motif d'annulation obligatoire"),
});

export const cashDocumentSchema = z.object({
  type: z.enum(["RECEIPT", "INVOICE", "VOUCHER", "PHOTO", "OTHER"]).default("OTHER"),
  title: z.string().optional().nullable(),
});

export const journalFiltersSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  category: z.string().optional(),
  q: z.string().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
});

export type CashboxInput = z.infer<typeof cashboxSchema>;
export type CreditCashboxInput = z.infer<typeof creditCashboxSchema>;
export type DebitCashboxInput = z.infer<typeof debitCashboxSchema>;
export type TransferCashboxInput = z.infer<typeof transferCashboxSchema>;
