import { z } from "zod";

const phoneRegex = /^(\+212|0)[5-7]\d{8}$/;

export const clientWizardSchema = z
  .object({
    type: z.enum(["INDIVIDUAL", "COMPANY", "RESELLER"]),
    civility: z.enum(["MR", "MRS", "MISS"]).optional().nullable(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    companyName: z.string().optional(),
    tradeName: z.string().optional(),
    cin: z.string().optional(),
    ice: z.string().optional(),
    rc: z.string().optional(),
    taxId: z.string().optional(),
    patent: z.string().optional(),
    activity: z.string().optional(),
    birthDate: z.string().optional().nullable(),
    phone: z.string().min(1, "Téléphone requis"),
    secondaryPhone: z.string().optional(),
    email: z.string().email("Email invalide").optional().or(z.literal("")),
    website: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    profession: z.string().optional(),
    mainContactName: z.string().optional(),
    mainContactRole: z.string().optional(),
    mainContactPhone: z.string().optional(),
    mainContactEmail: z.string().email().optional().or(z.literal("")),
    assignedCommercialId: z.string().optional().nullable(),
    acquisitionSource: z
      .enum(["SOCIAL_MEDIA", "WEBSITE", "REFERRAL", "ADVERTISING", "PHONE_CALL", "SHOWROOM", "OTHER"])
      .optional()
      .nullable(),
    preferredPaymentMethod: z
      .enum(["CASH", "TRANSFER", "CHECK", "CREDIT", "BILL_OF_EXCHANGE", "OTHER"])
      .optional()
      .nullable(),
    paymentTerms: z.string().optional(),
    paymentDelay: z.coerce.number().optional().nullable(),
    bankName: z.string().optional(),
    iban: z.string().optional(),
    creditLimit: z.coerce.number().min(0).optional().nullable(),
    vatExempt: z.boolean().optional(),
    financialStatus: z.enum(["GOOD_PAYER", "AVERAGE", "RISK", "BLOCKED"]).optional(),
    relationshipStatus: z.enum(["PROSPECT", "ACTIVE", "LOYAL", "INACTIVE", "VIP"]).optional(),
    notes: z.string().optional(),
    isDraft: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "INDIVIDUAL") {
      if (!data.firstName?.trim()) ctx.addIssue({ code: "custom", message: "Prénom requis", path: ["firstName"] });
      if (!data.lastName?.trim()) ctx.addIssue({ code: "custom", message: "Nom requis", path: ["lastName"] });
    } else {
      if (!data.companyName?.trim())
        ctx.addIssue({ code: "custom", message: "Raison sociale requise", path: ["companyName"] });
    }
    if (data.phone && !phoneRegex.test(data.phone.replace(/\s/g, ""))) {
      ctx.addIssue({ code: "custom", message: "Téléphone invalide (format Maroc)", path: ["phone"] });
    }
  });

export type ClientWizardValues = z.infer<typeof clientWizardSchema>;

export const interactionSchema = z.object({
  type: z.enum(["NOTE", "CALL", "TASK", "FOLLOW_UP", "MEETING"]),
  date: z.string(),
  summary: z.string().min(1),
  nextAction: z.string().optional(),
  nextFollowUpDate: z.string().optional().nullable(),
});
