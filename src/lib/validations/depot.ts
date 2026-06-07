import { z } from "zod";

export const depotSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  managerId: z.string().optional().nullable(),
  maxCapacity: z.coerce.number().int().positive(),
  depotType: z.enum(["MAIN", "SECONDARY", "TRANSIT", "PREPARATION", "REPAIR"]).default("MAIN"),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).default("ACTIVE"),
  notes: z.string().optional(),
});

export type DepotInput = z.infer<typeof depotSchema>;
