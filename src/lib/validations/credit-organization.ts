import { z } from "zod";

export const creditOrganizationSchema = z.object({
  name: z.string().min(1, "Nom requis").max(200),
  code: z.string().max(40).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  email: z.string().email("E-mail invalide").optional().nullable().or(z.literal("")),
  address: z.string().max(300).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  isActive: z.boolean().default(true),
  notes: z.string().max(2000).optional().nullable(),
});

export type CreditOrganizationInput = z.infer<typeof creditOrganizationSchema>;

export const creditFinancingStepSchema = z
  .object({
    financedByCreditOrg: z.boolean().default(false),
    creditOrganizationId: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.financedByCreditOrg && !d.creditOrganizationId?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Sélectionnez un organisme de crédit",
        path: ["creditOrganizationId"],
      });
    }
  });

export function resolveCreditOrganizationId(payload: {
  financedByCreditOrg: boolean;
  creditOrganizationId?: string | null;
}): string | null {
  if (!payload.financedByCreditOrg) return null;
  const id = payload.creditOrganizationId?.trim();
  if (!id) throw new Error("Organisme de crédit requis");
  return id;
}
