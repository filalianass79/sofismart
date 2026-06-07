import type { EmailProvider } from "./email.provider";
import { getEmailProviderName, isEmailEnabled, isEmailTestMode } from "./email.provider";
import { SmtpEmailProvider } from "./providers/smtp.provider";
import { ResendEmailProvider } from "./providers/resend.provider";
import type { EmailAttachmentInput, EmailSendResult, SendEmailParams } from "./types";

export function getEmailProvider(): EmailProvider {
  const p = getEmailProviderName();
  if (p === "resend") return new ResendEmailProvider();
  return new SmtpEmailProvider();
}

export async function verifyEmailConnection(): Promise<{
  ok: boolean;
  error?: string;
  hint?: string;
  provider: string;
}> {
  if (!isEmailEnabled()) {
    return {
      ok: false,
      provider: getEmailProviderName(),
      error: "EMAIL_ENABLED=false",
      hint: "Définissez EMAIL_ENABLED=true dans votre fichier .env puis redémarrez le serveur.",
    };
  }
  if (isEmailTestMode()) {
    return {
      ok: true,
      provider: getEmailProviderName(),
      hint: "Mode test : les envois sont simulés (aucun SMTP requis).",
    };
  }
  const provider = getEmailProvider();
  if (provider.verifyConnection) {
    const r = await provider.verifyConnection();
    return { ...r, provider: provider.name };
  }
  return { ok: true, provider: provider.name };
}

export async function sendEmailViaProvider(params: SendEmailParams): Promise<EmailSendResult> {
  if (!isEmailEnabled() && !isEmailTestMode()) {
    return {
      messageId: "",
      status: "FAILED",
      error: "EMAIL_ENABLED=false — ajoutez EMAIL_ENABLED=true dans .env",
    };
  }
  const provider = getEmailProvider();
  return provider.sendEmail(params);
}

export function emailProviderStatus() {
  return {
    enabled: isEmailEnabled(),
    testMode: isEmailTestMode(),
    provider: getEmailProviderName(),
    sendTempPassword: process.env.SEND_TEMP_PASSWORD_BY_EMAIL === "true",
  };
}

export type { EmailAttachmentInput, SendEmailParams };
