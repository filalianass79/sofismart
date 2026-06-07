import { z } from "zod";

export const companyProfileSchema = z.object({
  legalName: z.string().min(1, "Raison sociale requise"),
  tradeName: z.string().optional().nullable(),
  legalForm: z.string().optional().nullable(),
  ice: z.string().optional().nullable(),
  rc: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  patent: z.string().optional().nullable(),
  cnss: z.string().optional().nullable(),
  capital: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  fax: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  website: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  bankAccount: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  headerImageUrl: z.string().optional().nullable(),
  footerImageUrl: z.string().optional().nullable(),
  headerText: z.string().optional().nullable(),
  footerText: z.string().optional().nullable(),
  documentNotes: z.string().optional().nullable(),
});

export type CompanyProfileInput = z.infer<typeof companyProfileSchema>;

export const companyAssetTypeSchema = z.enum(["logo", "header", "footer"]);
