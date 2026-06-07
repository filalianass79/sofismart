import { z } from "zod";

const phoneSchema = z
  .string()
  .min(8, "Numéro trop court")
  .max(20)
  .regex(/^\+?[\d\s-]+$/, "Format invalide");

export const sendWhatsAppTestSchema = z.object({
  phone: phoneSchema,
  message: z.string().min(1, "Message requis").max(4096),
});

export const notificationTemplateSchema = z.object({
  key: z.string().min(2).max(80),
  name: z.string().min(2).max(120),
  channel: z.enum(["INTERNAL", "WHATSAPP"]),
  eventType: z.string().min(1),
  subject: z.string().max(200).optional().nullable(),
  body: z.string().min(1),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const notificationSettingSchema = z.object({
  eventType: z.string().min(1),
  internalEnabled: z.boolean(),
  whatsappEnabled: z.boolean(),
  recipientRoles: z.array(z.string()).default([]),
  recipientUserIds: z.array(z.string()).default([]),
  sendToClient: z.boolean(),
  sendToEmployee: z.boolean(),
  isActive: z.boolean(),
});

export const notificationPreferenceSchema = z.object({
  internalEnabled: z.boolean(),
  whatsappEnabled: z.boolean(),
  whatsappOptIn: z.boolean(),
  phoneOverride: z.string().optional().nullable(),
  quietHoursStart: z.string().optional().nullable(),
  quietHoursEnd: z.string().optional().nullable(),
});

export const whatsappWebhookSchema = z.object({
  object: z.string().optional(),
  entry: z.array(z.unknown()).optional(),
});
