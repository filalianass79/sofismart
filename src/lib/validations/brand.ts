import { z } from "zod";

export const brandSchema = z.object({
  label: z.string().min(1, "Libellé requis").max(120),
  logo: z.string().optional().nullable(),
});

export type BrandInput = z.infer<typeof brandSchema>;
