import { z } from "zod";

export const deliveryChecklistSchema = z.object({
  vehicleDelivered: z.boolean().default(false),
  registrationCard: z.boolean().default(false),
  keysHanded: z.boolean().default(false),
  documentsHanded: z.boolean().default(false),
  accessoriesHanded: z.boolean().default(false),
  visualInspection: z.boolean().default(false),
  clientSignature: z.boolean().default(false),
});

export const generateDeliveryNoteSchema = z.object({
  saleId: z.string().min(1, "Vente requise"),
});

export const confirmDeliverySchema = z.object({
  deliveryDate: z.string().min(1, "Date de livraison requise"),
  deliveryTime: z.string().optional(),
  mileageAtDelivery: z.coerce.number().int().min(0).optional(),
  checklist: deliveryChecklistSchema,
  observations: z.string().max(5000).optional(),
  signedDocumentUrl: z.string().optional(),
});

export const uploadSignedDeliverySchema = z.object({
  title: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

export type DeliveryChecklist = z.infer<typeof deliveryChecklistSchema>;
export type ConfirmDeliveryInput = z.infer<typeof confirmDeliverySchema>;
