import { z } from "zod";
import { newClientSchema, newIndividualClientSchema, newProfessionalClientSchema } from "@/lib/validations/sale";

export const proformaClientStepSchema = z
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
      ctx.addIssue({ code: "custom", message: "Renseignez le client provisoire", path: ["newClient"] });
    }
  });

export const proformaVehicleStepSchema = z.object({
  vehicleId: z.string().min(1, "Véhicule requis"),
});

export const proformaConditionsSchema = z
  .object({
    proformaDate: z.string().min(1),
    validityDate: z.string().min(1),
    commercialId: z.string().min(1, "Commercial requis"),
    priceHT: z.coerce.number().min(0.01, "Prix HT requis"),
    discount: z.coerce.number().min(0).default(0),
    accessoryFees: z.coerce.number().min(0).default(0),
    taxRate: z.coerce.number().min(0).max(100).default(20),
    paymentTerms: z.string().optional(),
    observations: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    const gross = d.priceHT + d.accessoryFees;
    if (d.discount > gross) {
      ctx.addIssue({ code: "custom", message: "Remise trop élevée", path: ["discount"] });
    }
    if (d.validityDate < d.proformaDate) {
      ctx.addIssue({
        code: "custom",
        message: "La date de validité doit être ≥ à la date proforma",
        path: ["validityDate"],
      });
    }
  });

export const proformaInvoiceSchema = z
  .object({
    clientMode: z.enum(["EXISTING", "NEW"]).default("EXISTING"),
    clientId: z.string().optional(),
    newClient: newClientSchema.optional(),
    vehicleId: z.string().min(1),
    commercialId: z.string().min(1),
    proformaDate: z.string(),
    validityDate: z.string(),
    priceHT: z.coerce.number().min(0.01),
    discount: z.coerce.number().min(0).default(0),
    accessoryFees: z.coerce.number().min(0).default(0),
    taxRate: z.coerce.number().min(0).max(100).default(20),
    paymentTerms: z.string().optional(),
    observations: z.string().optional(),
    saveAsDraft: z.boolean().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.clientMode === "EXISTING" && !d.clientId?.trim()) {
      ctx.addIssue({ code: "custom", message: "Client requis", path: ["clientId"] });
    }
    if (d.clientMode === "NEW" && !d.newClient) {
      ctx.addIssue({ code: "custom", message: "Client provisoire requis", path: ["newClient"] });
    }
    const gross = d.priceHT + d.accessoryFees;
    if (d.discount > gross) {
      ctx.addIssue({ code: "custom", message: "Remise trop élevée", path: ["discount"] });
    }
    if (d.validityDate < d.proformaDate) {
      ctx.addIssue({ code: "custom", message: "Date validité invalide", path: ["validityDate"] });
    }
  });

export type ProformaWizardValues = z.infer<typeof proformaInvoiceSchema>;
export { newIndividualClientSchema, newProfessionalClientSchema, newClientSchema };
