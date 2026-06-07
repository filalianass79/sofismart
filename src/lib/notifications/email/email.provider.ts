import type { EmailSendResult, SendEmailParams } from "./types";

export function isEmailEnabled(): boolean {
  return process.env.EMAIL_ENABLED === "true";
}

export function isEmailTestMode(): boolean {
  return process.env.EMAIL_TEST_MODE === "true";
}

export function isEmailLogOnly(): boolean {
  return process.env.EMAIL_LOG_ONLY === "true";
}

export function getEmailTestRecipient(): string | null {
  const v = process.env.EMAIL_TEST_RECIPIENT?.trim();
  return v || null;
}

export function getFromAddress(): { name: string; email: string } {
  return {
    name: process.env.SMTP_FROM_NAME ?? "SOFISMART",
    email: process.env.SMTP_FROM_EMAIL ?? process.env.SMTP_FROM ?? "noreply@sofismart.ma",
  };
}

export interface EmailProvider {
  readonly name: string;
  sendEmail(params: SendEmailParams): Promise<EmailSendResult>;
  verifyConnection?(): Promise<{ ok: boolean; error?: string }>;
}

export function getEmailProviderName(): string {
  return (process.env.EMAIL_PROVIDER ?? "smtp").toLowerCase();
}
