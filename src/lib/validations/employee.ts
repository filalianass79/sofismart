import { z } from "zod";

export const employeeSchema = z.object({
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  cin: z.string().optional().nullable(),
  personalEmail: z.string().email("Email invalide").optional().nullable().or(z.literal("")),
  professionalEmail: z.string().email("Email invalide").optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  whatsappPhone: z.string().optional().nullable(),
  whatsappEnabled: z.boolean().optional(),
  whatsappConsent: z.boolean().optional(),
  preferredNotificationChannel: z.enum(["INTERNAL", "WHATSAPP", "EMAIL", "ALL"]).optional(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  hireDate: z.string().optional().nullable(),
  jobFunction: z.enum([
    "ADMINISTRATEUR",
    "GERANT",
    "DIRECTEUR",
    "COMMERCIAL",
    "EMPLOYE",
    "CHAUFFEUR",
    "MAGASINIER",
    "COMPTABLE",
    "RESPONSABLE_DEPOT",
    "AUTRE",
  ]),
  department: z.string().optional().nullable(),
  depotId: z.string().optional().nullable(),
  contractType: z.string().optional().nullable(),
  salary: z.coerce.number().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
  notes: z.string().optional().nullable(),
});

export type EmployeeInput = z.infer<typeof employeeSchema>;
