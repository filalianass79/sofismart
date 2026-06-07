import { z } from "zod";
import { isStrongPassword } from "@/lib/password";

export const createUserSchema = z.object({
  employeeId: z.string().min(1),
  username: z.string().min(3).optional(),
  email: z.string().email(),
  roleId: z.string().min(1),
  password: z
    .string()
    .optional()
    .refine((p) => !p || isStrongPassword(p), {
      message: "Mot de passe trop faible",
    }),
  generateTemporary: z.boolean().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().refine(isStrongPassword, { message: "Mot de passe trop faible" }),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export const adminResetPasswordSchema = z.object({
  generateTemporary: z.boolean().default(true),
  forceChange: z.boolean().default(true),
});
