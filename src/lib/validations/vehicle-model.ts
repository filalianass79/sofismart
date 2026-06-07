import { z } from "zod";

export const vehicleModelSchema = z.object({
  label: z.string().min(1, "Libellé requis").max(120),
  brandId: z.string().min(1, "Marque requise"),
  photo: z.string().optional().nullable(),
});

export type VehicleModelInput = z.infer<typeof vehicleModelSchema>;
