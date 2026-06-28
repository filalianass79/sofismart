import { z } from "zod";

const paymentLineSchema = z.object({
  amount: z.coerce.number().min(0.01, "Montant invalide"),
  method: z.enum(["CASH", "TRANSFER", "CHECK", "CREDIT", "BILL_OF_EXCHANGE", "OTHER"]),
  paidAt: z.string(),
  reference: z.string().optional(),
  bank: z.string().optional(),
  checkNumber: z.string().optional(),
  transferReference: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  validationStatus: z
    .enum(["PENDING", "VALIDATED", "REJECTED", "CANCELLED"])
    .default("VALIDATED"),
  notes: z.string().optional(),
});

export const newIndividualClientSchema = z.object({
  type: z.literal("INDIVIDUAL"),
  civility: z.enum(["MR", "MRS", "MISS"]).optional(),
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  cin: z.string().optional(),
  phone: z.string().min(1, "Téléphone requis"),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  profession: z.string().optional(),
  notes: z.string().optional(),
});

export const newProfessionalClientSchema = z.object({
  type: z.literal("COMPANY"),
  companyName: z.string().min(1, "Raison sociale requise"),
  tradeName: z.string().optional(),
  ice: z.string().optional(),
  rc: z.string().optional(),
  taxId: z.string().optional(),
  patent: z.string().optional(),
  phone: z.string().min(1, "Téléphone requis"),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  mainContactName: z.string().optional(),
  mainContactRole: z.string().optional(),
  mainContactPhone: z.string().optional(),
  mainContactEmail: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export const newClientSchema = z.discriminatedUnion("type", [
  newIndividualClientSchema,
  newProfessionalClientSchema,
]);

export const saleClientStepSchema = z
  .object({
    clientMode: z.enum(["EXISTING", "NEW"]),
    clientId: z.string().optional(),
    newClient: newClientSchema.optional(),
  })
  .superRefine((d, ctx) => {
    if (d.clientMode === "EXISTING" && !d.clientId?.trim()) {
      ctx.addIssue({ code: "custom", message: "Sélectionnez un client", path: ["clientId"] });
    }
    if (d.clientMode === "NEW" && !d.newClient) {
      ctx.addIssue({ code: "custom", message: "Renseignez le nouveau client", path: ["newClient"] });
    }
  });

export const saleVehicleStepSchema = z.object({
  vehicleId: z.string().min(1, "Véhicule requis"),
});

export const saleConditionsSchema = z
  .object({
    saleDate: z.string(),
    commercialId: z.string().min(1, "Commercial requis"),
    price: z.coerce.number().min(0.01, "Prix de vente requis"),
    discount: z.coerce.number().min(0).default(0),
    taxRatePercent: z.coerce.number().min(0).max(100).default(20),
    taxAmount: z.coerce.number().min(0).optional(),
    saleType: z.enum(["CASH", "CREDIT", "LEASING", "TRADE_IN", "OTHER"]).default("CASH"),
    paymentMethod: z.enum(["CASH", "TRANSFER", "CHECK", "CREDIT", "BILL_OF_EXCHANGE", "OTHER"]).optional(),
    warranty: z.boolean().default(false),
    warrantyDurationMonths: z.coerce.number().int().positive().optional().nullable(),
    specialConditions: z.string().optional(),
    notes: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.discount > d.price) {
      ctx.addIssue({ code: "custom", message: "Remise trop élevée", path: ["discount"] });
    }
    if (d.warranty && !d.warrantyDurationMonths) {
      ctx.addIssue({
        code: "custom",
        message: "Durée garantie requise",
        path: ["warrantyDurationMonths"],
      });
    }
  });

export const saleWizardSchema = z
  .object({
    clientMode: z.enum(["EXISTING", "NEW"]).default("EXISTING"),
    clientId: z.string().optional(),
    newClient: newClientSchema.optional(),
    vehicleId: z.string().min(1),
    financedByCreditOrg: z.boolean().default(false),
    creditOrganizationId: z.string().optional(),
    commercialId: z.string().min(1),
    saleDate: z.string(),
    price: z.coerce.number().min(0.01, "Prix de vente requis"),
    discount: z.coerce.number().min(0).default(0),
    taxRatePercent: z.coerce.number().min(0).max(100).default(20),
    taxAmount: z.coerce.number().min(0).optional(),
    saleType: z.enum(["CASH", "CREDIT", "LEASING", "TRADE_IN", "OTHER"]).default("CASH"),
    paymentMethod: z.enum(["CASH", "TRANSFER", "CHECK", "CREDIT", "BILL_OF_EXCHANGE", "OTHER"]).optional(),
    warranty: z.boolean().default(false),
    warrantyDurationMonths: z.coerce.number().int().positive().optional().nullable(),
    specialConditions: z.string().optional(),
    notes: z.string().optional(),
    payments: z.array(paymentLineSchema).default([]),
    status: z.enum(["DRAFT", "VALIDATED", "PENDING_VALIDATION"]).default("VALIDATED"),
    pendingDocuments: z
      .array(
        z.object({
          category: z.string(),
          originalName: z.string(),
          path: z.string(),
          mimeType: z.string().optional(),
          size: z.number().optional(),
        })
      )
      .default([]),
  })
  .superRefine((d, ctx) => {
    if (d.clientMode === "EXISTING" && !d.clientId?.trim()) {
      ctx.addIssue({ code: "custom", message: "Client requis", path: ["clientId"] });
    }
    if (d.clientMode === "NEW" && !d.newClient) {
      ctx.addIssue({ code: "custom", message: "Nouveau client requis", path: ["newClient"] });
    }
    if (d.discount > d.price) {
      ctx.addIssue({ code: "custom", message: "Remise invalide", path: ["discount"] });
    }
    if (d.warranty && !d.warrantyDurationMonths) {
      ctx.addIssue({
        code: "custom",
        message: "Durée garantie requise",
        path: ["warrantyDurationMonths"],
      });
    }
    if (d.financedByCreditOrg && !d.creditOrganizationId?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Organisme de crédit requis",
        path: ["creditOrganizationId"],
      });
    }
  });

export const confirmDeliverySchema = z.object({
  deliveryNotes: z.string().optional(),
  deliveryPhotoUrl: z.string().url().optional().or(z.literal("")),
});

export type SaleWizardValues = z.infer<typeof saleWizardSchema>;
export type NewClientValues = z.infer<typeof newClientSchema>;
