import { z } from "zod";

export const supplierWizardSchema = z
  .object({
    type: z.enum(["DEALERSHIP", "COMPANY", "INDIVIDUAL", "IMPORTER", "GARAGE", "TRANSPORTER", "OTHER"]),
    name: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    companyName: z.string().optional(),
    tradeName: z.string().optional(),
    cin: z.string().optional(),
    ice: z.string().optional(),
    rc: z.string().optional(),
    taxId: z.string().optional(),
    patent: z.string().optional(),
    phone: z.string().optional(),
    secondaryPhone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    contactName: z.string().optional(),
    contactRole: z.string().optional(),
    contactPhone: z.string().optional(),
    preferredPaymentMethod: z
      .enum(["CASH", "TRANSFER", "CHECK", "CREDIT", "BILL_OF_EXCHANGE", "OTHER"])
      .optional()
      .nullable(),
    paymentDelay: z.coerce.number().optional().nullable(),
    bankName: z.string().optional(),
    iban: z.string().optional(),
    notes: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.type === "INDIVIDUAL") {
      if (!d.firstName?.trim() && !d.name?.trim())
        ctx.addIssue({ code: "custom", message: "Nom requis", path: ["firstName"] });
    } else if (!d.companyName?.trim() && !d.name?.trim()) {
      ctx.addIssue({ code: "custom", message: "Raison sociale requise", path: ["companyName"] });
    }
  });

export type SupplierWizardValues = z.infer<typeof supplierWizardSchema>;
