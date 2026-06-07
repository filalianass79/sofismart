import { z } from "zod";

export const sendTestEmailSchema = z.object({
  to: z.string().email("Email invalide"),
  subject: z.string().min(1).max(200).default("Test SOFISMART"),
  message: z.string().min(1).max(10000),
});

export const emailTemplateSchema = z.object({
  key: z.string().min(2).max(80),
  name: z.string().min(2).max(120),
  eventType: z.string().min(1),
  subjectTemplate: z.string().min(1).max(300),
  htmlTemplate: z.string().min(1),
  textTemplate: z.string().optional().nullable(),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const emailNotificationSettingSchema = z.object({
  eventType: z.string().min(1),
  emailEnabled: z.boolean(),
  recipientRoles: z.array(z.string()).default([]),
  recipientUserIds: z.array(z.string()).default([]),
  sendToClient: z.boolean(),
  sendToSupplier: z.boolean(),
  ccEmails: z.array(z.string().email()).default([]),
  bccEmails: z.array(z.string().email()).default([]),
  attachDocuments: z.boolean(),
  attachmentTypes: z.array(z.string()).default([]),
  isActive: z.boolean(),
});

export const userEmailPreferenceSchema = z.object({
  emailEnabled: z.boolean(),
  alternativeEmail: z.string().email().optional().nullable().or(z.literal("")),
  disabledEventTypes: z.array(z.string()).default([]),
  quietHoursStart: z.string().optional().nullable(),
  quietHoursEnd: z.string().optional().nullable(),
});
