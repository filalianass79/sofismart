import { z } from "zod";
import { documentMetaSchema, vehicleStepSchema } from "@/lib/validations/purchase";

export const vehicleEditStepSchema = vehicleStepSchema.extend({
  status: z.enum([
    "IN_STOCK",
    "RESERVED",
    "EXIT_PENDING",
    "SOLD",
    "DELIVERED",
    "IN_REPAIR",
    "IN_TRANSIT",
    "PREPARATION",
  ]),
});

export const vehiclePricingStepSchema = z.object({
  purchasePrice: z
    .union([z.number(), z.string()])
    .transform((v) => Number(v) || 0)
    .pipe(z.number().min(0)),
  extraFeesTotal: z
    .union([z.number(), z.string()])
    .transform((v) => Number(v) || 0)
    .pipe(z.number().min(0)),
});

export const vehicleWizardSchema = z.object({
  vehicle: vehicleEditStepSchema,
  pricing: vehiclePricingStepSchema,
  documents: z.array(documentMetaSchema).default([]),
});

export type VehicleWizardValues = z.output<typeof vehicleWizardSchema>;
