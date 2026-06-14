import type { WhatsAppSendResult } from "./types";

export interface WhatsAppProvider {
  readonly name: string;
  sendTextMessage(to: string, message: string): Promise<WhatsAppSendResult>;
  sendTemplateMessage(
    to: string,
    templateName: string,
    language: string,
    bodyParameters: string[],
  ): Promise<WhatsAppSendResult>;
  verifyConnection?(): Promise<{ ok: boolean; error?: string }>;
}

export function isWhatsAppEnabled(): boolean {
  return process.env.WHATSAPP_ENABLED === "true";
}

export function isWhatsAppTestMode(): boolean {
  return process.env.WHATSAPP_TEST_MODE === "true";
}

export function whatsAppMaxRetries(): number {
  return Number.parseInt(process.env.WHATSAPP_MAX_RETRIES ?? "3", 10) || 3;
}

export function whatsAppRetryDelaySeconds(): number {
  return Number.parseInt(process.env.WHATSAPP_RETRY_DELAY_SECONDS ?? "60", 10) || 60;
}

export function getWhatsAppProviderName(): string {
  return (process.env.WHATSAPP_PROVIDER ?? "meta").toLowerCase();
}
