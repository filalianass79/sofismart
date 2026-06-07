import type { WhatsAppSendResult } from "./types";

export interface WhatsAppProvider {
  readonly name: string;
  sendTextMessage(to: string, message: string): Promise<WhatsAppSendResult>;
  sendTemplateMessage?(
    to: string,
    templateName: string,
    parameters: string[],
  ): Promise<WhatsAppSendResult>;
}

export function isWhatsAppEnabled(): boolean {
  return process.env.WHATSAPP_ENABLED === "true";
}

export function isWhatsAppTestMode(): boolean {
  return process.env.WHATSAPP_TEST_MODE === "true";
}
